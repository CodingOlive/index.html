// ui-updater.js - Functions for updating existing UI elements.

// --- Import Dependencies ---
// Import DOM Elements
import {
    // Stats Panel Elements
    statsPanel, statsPanelHeader, statCurrentEnergyEl, statTotalDamageEl,
    statTotalEnergySpentEl, statAttackCountEl, statHighestDamageEl,
    statFormAcBonusEl, statFormTrBonusEl, statTotalAcEl, statTotalTrEl, statSpeedEl,
    kaiokenSection, kaiokenDetails, kaiokenCheckbox, maxHealthInput, currentHealthEl,
    // Attack Elements
    superAttackBtn, ultimateAttackBtn, attackStatusMessage,
    // Result Elements
    resultScientificEl, resultWordsEl, resultDiv, resultValueEl, resultTotalEnergyUsedEl, resultTotalExtraDamageEl,
    // View Containers
    mainCalculatorContent, characterStatsScreen, mainTitle, showCharacterStatsBtn,
    // Other needed elements
    energyTypeSelect, charBaseAcInput, charBaseTrInput, charSpeedInput, energyPoolsContainer,
    // Elements for initializeDefaultUI
    baseDamageInput, attackCompressionPointsInput, baseMultiplierInput, formMultiplierInput,
    characterNameInput, charBaseHealthInput, charBaseMultiplierInput,
    charVitalityInput, charSoulPowerInput, charSoulHpInput,
    ryokoCheckbox, ryokoEquationInput, ryokoEquationContainer,
    kaiokenStrainInput, dynamicModifiersContainer, slidersGrid, allSlidersContainer,
    activeFormsListContainer,
    formNameInput, formEnergyTypeSelect, formFormMultiplierInput,
    formPoolMaxMultiplierInput, formAffectsResistancesCheckbox, formResistanceBonusInputsDiv,
    formAcBonusInput, formTrueResistanceBonusInput, formEnableFormBuffCheckbox,
    formFormBuffValueInput, formFormBuffTypeSelect, formEnablePoolBuffCheckbox,
    formPoolBuffValueInput, formPoolBuffTypeSelect
} from './dom-elements.js';

// Import State
import {
    // Read-only state needed for display
    totalDamageDealt, totalEnergySpent, attackCount, highestDamage, calculatorState, activeAttacks,
    mergedEnergyTypes, // Import the merged list
    characterForms, // Needed for initializeDefaultUI reset checks
    // Import state setters needed within this module
    setCalculatorStateValue // Needed for view switching
} from './state.js';

// Import Config
import { ENERGY_TYPE_DETAILS, ALL_ENERGY_TYPES, ATTACK_RESERVE_COLOR, SLIDER_TRACK_COLOR, SPEED_DETAILS } from './config.js';

// Import Formatters & Utilities
import { formatStatNumber, formatSimpleNumber, parseFormattedNumber, convertNumberToWords } from './formatters.js';
import { safeParseFloat, triggerAnimation } from './utils.js';

// Import energy pool functions needed
import { getEnergyElements, calculateAndResetEnergy } from './energy-pools.js';
// Import equation update function if needed by default UI reset
import { updateEquationDisplay } from './equation.js';
// Import form generator functions if needed by default UI reset
import { renderActiveFormsSection, renderFormList } from './dom-generators.js';
// Import character stats handler if needed by default UI reset
import { handleRyokoCheckboxChange } from './character-stats.js';
// Import admin panel logic if needed by default UI reset
import { updateAdminUI } from './admin.js';
// Import form effects application needed when switching views
import { applyActiveFormEffects } from './forms.js';

// --- UI Update Functions ---
// NOTE: All functions below use inline 'export'

/**
 * Updates all display fields in the stats panel based on current state.
 */
export function updateStatsDisplay() {
    // Update cumulative stats display
    if (statTotalDamageEl) statTotalDamageEl.textContent = formatStatNumber(totalDamageDealt);
    if (statTotalEnergySpentEl) statTotalEnergySpentEl.textContent = formatStatNumber(totalEnergySpent);
    if (statHighestDamageEl) statHighestDamageEl.textContent = formatStatNumber(highestDamage);
    if (statAttackCountEl) statAttackCountEl.textContent = attackCount.toLocaleString();

    // Update current energy display based on selected focus
    const selectedType = energyTypeSelect?.value;
    const currentEnergyDisplayEl = selectedType ? document.getElementById(`${selectedType}-current-energy`) : null;
    if (statCurrentEnergyEl) {
        statCurrentEnergyEl.textContent = currentEnergyDisplayEl?.textContent || '0'; // Show selected pool's current energy
    }

    // Update AC/TR display
    const baseAC = safeParseFloat(charBaseAcInput?.value, 0);
    const baseTR = safeParseFloat(charBaseTrInput?.value, 0);
    const formAcBonus = calculatorState.appliedAcBonus || 0;
    const formTrBonus = calculatorState.appliedTrueResistanceBonus || 0;

    if (statFormAcBonusEl) statFormAcBonusEl.textContent = formatSimpleNumber(formAcBonus);
    if (statFormTrBonusEl) statFormTrBonusEl.textContent = formatSimpleNumber(formTrBonus);
    if (statTotalAcEl) statTotalAcEl.textContent = formatSimpleNumber(baseAC + formAcBonus);
    if (statTotalTrEl) statTotalTrEl.textContent = formatSimpleNumber(baseTR + formTrBonus);

    // Update Speed display
    if (statSpeedEl && charSpeedInput) {
        statSpeedEl.textContent = formatStatNumber(safeParseFloat(charSpeedInput.value, 0));
    }

    // Update Kaioken section visibility
    if (kaiokenSection) {
        kaiokenSection.classList.toggle('hidden', selectedType !== 'ki');
    }
}

/**
 * Shows or hides a specific energy slider section based on its total energy.
 */
export function updateSliderVisibility(type) {
    const sliderSection = document.getElementById(`${type}-slider-section`);
    const totalEnergyEl = document.getElementById(`${type}-total-energy`);
    const energySlider = document.getElementById(`${type}-energy-slider`);

    if (totalEnergyEl && sliderSection) {
        const totalEnergy = parseFormattedNumber(totalEnergyEl.textContent);
        const shouldShow = totalEnergy > 0;
        sliderSection.classList.toggle('hidden', !shouldShow);
        if (!shouldShow && energySlider) {
            energySlider.value = 0;
            const valueDisplay = document.getElementById(`${type}-slider-value-display`);
            if (valueDisplay) {
                 const percentSpan = valueDisplay.querySelector('.slider-percent-value');
                 const detailsSpan = valueDisplay.querySelector('.slider-details-value');
                 if(percentSpan) percentSpan.textContent = '0%';
                 if(detailsSpan) detailsSpan.textContent = '(E: 0, D: 0.00)';
            }
        }
    } else if (sliderSection) {
         sliderSection.classList.add('hidden');
         if (energySlider) energySlider.value = 0;
    }
}

/**
 * Shows or hides the speed slider based on the character's speed stat.
 */
export function updateSpeedSliderVisibility() {
    const baseSpeed = safeParseFloat(charSpeedInput?.value, 0);
    const speedSliderSection = document.getElementById('speed-slider-section');

    if (speedSliderSection) {
        const shouldShow = baseSpeed > 0;
        speedSliderSection.classList.toggle('hidden', !shouldShow);
        if(!shouldShow) {
            const speedSlider = document.getElementById('speed-slider');
            if(speedSlider) {
                 speedSlider.value = 0;
                 const valueDisplay = document.getElementById('speed-slider-value-display');
                 if (valueDisplay) {
                     const percentSpan = valueDisplay.querySelector('.slider-percent-value');
                     const detailsSpan = valueDisplay.querySelector('.slider-details-value');
                     if(percentSpan) percentSpan.textContent = '0%';
                     if(detailsSpan) detailsSpan.textContent = '(S: 0, D: 0.00)';
                 }
            }
        }
    }
}

/**
 * Applies Kaioken-specific styling to the stats panel.
 */
export function applyKaiokenStyle() {
    if (!statsPanel || !statsPanelHeader) return;
    statsPanel.classList.remove('border-stats-border');
    statsPanel.classList.add('border-kaioken-border', 'kaioken-active', 'animate-kaioken-glow');
    statsPanelHeader.classList.remove('text-stats-header');
    statsPanelHeader.classList.add('text-kaioken-header');
    console.log("Kaioken style applied.");
}

/**
 * Removes Kaioken-specific styling from the stats panel.
 */
export function removeKaiokenStyle() {
    if (!statsPanel || !statsPanelHeader) return;
    statsPanel.classList.remove('border-kaioken-border', 'kaioken-active', 'animate-kaioken-glow');
    statsPanel.classList.add('border-stats-border');
    statsPanelHeader.classList.remove('text-kaioken-header');
    statsPanelHeader.classList.add('text-stats-header');
    console.log("Kaioken style removed.");
}

/**
 * Updates the current health display, ensuring it doesn't exceed max health.
 */
export function updateCurrentHealthDisplay() {
     if (!maxHealthInput || !currentHealthEl) return;
     const maxHealth = safeParseFloat(maxHealthInput.value, 0);
     const currentHealth = parseFormattedNumber(currentHealthEl.textContent);
     currentHealthEl.textContent = formatStatNumber(Math.max(0, Math.min(currentHealth, maxHealth)));
}


/**
 * Updates the appearance of attack buttons and the status message based on active attacks for the *currently focused* energy type.
 * @param {string} type - The currently focused energy type ID.
 */
export function updateAttackButtonStates(type) {
    if (!superAttackBtn || !ultimateAttackBtn || !attackStatusMessage) return;
     if (!type) {
         superAttackBtn.classList.remove('active-attack');
         ultimateAttackBtn.classList.remove('active-attack');
         superAttackBtn.classList.add('opacity-50');
         ultimateAttackBtn.classList.add('opacity-50');
         attackStatusMessage.textContent = 'Select an energy type focus.';
         return;
     }

    const currentAttack = activeAttacks[type] || null;
    const typeName = mergedEnergyTypes.find(et => et.id === type)?.name || type;

    superAttackBtn.classList.remove('active-attack', 'opacity-50');
    ultimateAttackBtn.classList.remove('active-attack', 'opacity-50');
    superAttackBtn.textContent = 'Super Attack (Reserves 5%)';
    ultimateAttackBtn.textContent = 'Ultimate Attack (Reserves 10%)';
    attackStatusMessage.textContent = '';

    if (currentAttack === 'super') {
        superAttackBtn.classList.add('active-attack');
        ultimateAttackBtn.classList.add('opacity-50');
        superAttackBtn.textContent = 'Super Attack (ACTIVE)';
        attackStatusMessage.textContent = `Super Attack active for ${typeName}. Energy use capped at 95%.`;
    } else if (currentAttack === 'ultimate') {
        ultimateAttackBtn.classList.add('active-attack');
        superAttackBtn.classList.add('opacity-50');
        ultimateAttackBtn.textContent = 'Ultimate Attack (ACTIVE)';
        attackStatusMessage.textContent = `Ultimate Attack active for ${typeName}. Energy use capped at 90%.`;
    }
}

/**
 * Updates an energy slider's background gradient and thumb color to show the reserved portion for attacks.
 * @param {string} type - The energy type ID (standard or custom).
 */
export function updateSliderLimitAndStyle(type) {
    const slider = document.getElementById(`${type}-energy-slider`);
    if (!slider) return;

    const attackState = activeAttacks[type] || null;
    let limitPercent = 100;
    let trackGradient = `linear-gradient(to right, var(--slider-thumb-color, #9ca3af) 0%, var(--slider-thumb-color, #9ca3af) 100%)`;

    const energyType = mergedEnergyTypes.find(et => et.id === type);
    let baseColor = '#9ca3af'; // Default gray
    if (energyType) {
        if (energyType.isStandard && energyType.details?.color) {
             const colorMap = { ki: '#FF9800', nen: '#2196F3', chakra: '#9C27B0', magic: '#26a69a', cursed: '#dc2626', reiatsu: '#475569', haki: '#1f2937', alchemy: '#f59e0b', nature: '#84cc16', force: '#d946ef', origin: '#4f46e5', fundamental: '#9ca3af', other: '#78350f' };
            baseColor = colorMap[energyType.id] || baseColor;
        } else if (!energyType.isStandard && energyType.hexColor) {
            baseColor = energyType.hexColor;
        }
    } else if (type === 'speed') {
        const speedColorMap = { 'sky-500': '#0ea5e9' };
        baseColor = speedColorMap[SPEED_DETAILS?.color] || '#0ea5e9';
    }

    slider.style.setProperty('--slider-thumb-color', baseColor);

    if (type !== 'speed') {
        if (attackState === 'super') {
            limitPercent = 95;
            trackGradient = `linear-gradient(to right, ${baseColor} 0%, ${baseColor} ${limitPercent}%, ${ATTACK_RESERVE_COLOR} ${limitPercent}%, ${ATTACK_RESERVE_COLOR} 100%)`;
        } else if (attackState === 'ultimate') {
            limitPercent = 90;
            trackGradient = `linear-gradient(to right, ${baseColor} 0%, ${baseColor} ${limitPercent}%, ${ATTACK_RESERVE_COLOR} ${limitPercent}%, ${ATTACK_RESERVE_COLOR} 100%)`;
        }
         // Else: Default gradient (full baseColor) is already set
    }

    slider.style.setProperty('--slider-track-gradient', trackGradient);
    slider.classList.add('slider-track-styled');
}


/**
 * Handles the UI updates for displaying a specific energy pool (showing/hiding/animating).
 * @param {string | null} typeIdToShow - The ID (e.g., 'ki', 'custom_abc') of the energy pool to display, or null to hide all.
 */
export function displayEnergyPool(typeIdToShow) {
    console.log(`--- displayEnergyPool START --- Called for: ${typeIdToShow}`);

    if (!energyPoolsContainer) {
        console.error("displayEnergyPool ERROR: energyPoolsContainer element not found!");
        return;
    }

    let foundPoolToShow = false;
    let expectedId = null;

    if (typeIdToShow) {
        expectedId = `${typeIdToShow}-pool`;
        console.log(`displayEnergyPool INFO: Expecting element with ID: #${expectedId}`);
    } else {
        console.warn("displayEnergyPool WARN: No typeIdToShow provided. Hiding all pools.");
    }

    const allPools = energyPoolsContainer.querySelectorAll('.energy-pool');
    console.log(`displayEnergyPool INFO: Found ${allPools.length} elements with class '.energy-pool'.`);

    allPools.forEach(pool => {
        if (!pool.id) {
            console.warn("displayEnergyPool WARN: Found a pool element missing an ID:", pool);
            pool.classList.add('hidden');
            pool.style.display = 'none';
            return;
        }

        if (expectedId && pool.id === expectedId) {
            console.log(`displayEnergyPool ACTION: Showing pool: #${pool.id}`);
            pool.style.display = '';
            pool.classList.remove('hidden'); // <<< Remove the hidden class
            triggerAnimation(pool, 'fadeIn');
            foundPoolToShow = true;
        } else {
            pool.classList.add('hidden'); // Ensure hidden class is present
            pool.style.display = 'none'; // Also set display none
        }
    });

    if (typeIdToShow && !foundPoolToShow) {
        console.error(`displayEnergyPool ERROR: Did not find pool element with expected ID: #${expectedId}`);
    }
    console.log(`--- displayEnergyPool END ---`);
}


/**
 * Updates the result area with Scientific Notation and Word versions of the damage.
 * @param {number} damage - The calculated damage value.
 */
export function displayAllFormats(damage) {
    const numDamage = typeof damage === 'number' && isFinite(damage) ? damage : 0;

    if (resultScientificEl) {
        resultScientificEl.textContent = numDamage.toExponential(2);
    }
    if (resultWordsEl) {
        resultWordsEl.textContent = convertNumberToWords(numDamage);
    }
}

/**
 * Switches the view to the Character Stats screen.
 */
export function showCharacterStatsView() {
    if (mainCalculatorContent) mainCalculatorContent.classList.add('hidden');
    if (characterStatsScreen) characterStatsScreen.classList.remove('hidden');
    if (mainTitle) mainTitle.textContent = "Character Stats & Forms";
    if (showCharacterStatsBtn) showCharacterStatsBtn.textContent = "Back to Calculator";
     setCalculatorStateValue('activeView', 'characterStats');
     console.log("Switched to Character Stats View");
     window.scrollTo(0, 0);
 }

/**
 * Switches the view to the main Energy Calculator screen.
 */
export function showCalculatorView() {
    if (mainCalculatorContent) mainCalculatorContent.classList.remove('hidden');
    if (characterStatsScreen) characterStatsScreen.classList.add('hidden');
    if (mainTitle) mainTitle.textContent = "Energy Calculator";
    if (showCharacterStatsBtn) showCharacterStatsBtn.textContent = "Character Stats";
     setCalculatorStateValue('activeView', 'calculator');
     console.log("Switched to Calculator View");
     window.scrollTo(0, 0);

     applyActiveFormEffects();
     updateEquationDisplay();
     updateStatsDisplay();
}


/**
 * Resets various UI elements to their default visual state.
 */
export function initializeDefaultUI() {
    console.log("Resetting UI to defaults...");

    // Reset Core Inputs
    if (baseDamageInput) baseDamageInput.value = '0';
    if (attackCompressionPointsInput) attackCompressionPointsInput.value = '0';
    if (baseMultiplierInput) baseMultiplierInput.value = '1';
    if (formMultiplierInput) formMultiplierInput.value = '1';

    // Reset Character Stats Inputs/Display
    if (characterNameInput) characterNameInput.value = '';
    if (charBaseHealthInput) charBaseHealthInput.value = '';
    if (charBaseMultiplierInput) charBaseMultiplierInput.value = '1';
    if (charVitalityInput) charVitalityInput.value = '';
    if (charSoulPowerInput) charSoulPowerInput.value = '';
    if (charSoulHpInput) charSoulHpInput.value = '';
    if (charBaseAcInput) charBaseAcInput.value = '10';
    if (charBaseTrInput) charBaseTrInput.value = '5';
    if (charSpeedInput) charSpeedInput.value = '';

    // Reset Ryoko Mode
    if (ryokoCheckbox) ryokoCheckbox.checked = false;
    if (ryokoEquationInput) ryokoEquationInput.value = '';
    handleRyokoCheckboxChange();

    // Reset Kaioken
    if (kaiokenCheckbox) kaiokenCheckbox.checked = false;
    if (maxHealthInput) maxHealthInput.value = '1000';
    if (kaiokenStrainInput) kaiokenStrainInput.value = '10';
    if (currentHealthEl) currentHealthEl.textContent = formatStatNumber(1000);
    if (kaiokenDetails) kaiokenDetails.classList.add('hidden');
    removeKaiokenStyle();

    // Reset Dynamic Modifiers
    if (dynamicModifiersContainer) dynamicModifiersContainer.innerHTML = '<h4 class="text-md font-semibold mb-2 text-gray-700">Additional Factors:</h4>';

    // Reset Energy Pools & Sliders
     ALL_ENERGY_TYPES.forEach(typeId => {
         const els = getEnergyElements(typeId);
         if (els) {
             if(els.maxMultiplierEl) els.maxMultiplierEl.value = '1';
             if(els.damagePerPowerEl) els.damagePerPowerEl.value = '1';
             if(els.regenPercentEl) els.regenPercentEl.value = '0';
             // calculateAndResetEnergy should handle resetting current/total/base based on stats
             calculateAndResetEnergy(typeId);
             if(els.energySlider) els.energySlider.value = 0;
             updateSingleSliderDisplay(typeId);
             updateSliderLimitAndStyle(typeId);
             updateSliderVisibility(typeId);
         }
     });
     // Reset speed slider
     const speedSliderEl = document.getElementById('speed-slider');
     if (speedSliderEl) speedSliderEl.value = 0;
     updateSpeedSliderDisplay();
     updateSpeedSliderVisibility();


    // Reset Attack Buttons/State Message
    const firstType = ALL_ENERGY_TYPES[0] || null;
    if(firstType) updateAttackButtonStates(firstType);
    if (attackStatusMessage) attackStatusMessage.textContent = '';

    // Reset Forms UI
    renderActiveFormsSection();
    renderFormList();

    // Reset Form Creator fields
     if(formNameInput) formNameInput.value = '';
     if(formEnergyTypeSelect) formEnergyTypeSelect.value = 'None';
     if(formFormMultiplierInput) formFormMultiplierInput.value = '1';
     if(formPoolMaxMultiplierInput) formPoolMaxMultiplierInput.value = '1';
     if(formAffectsResistancesCheckbox) { formAffectsResistancesCheckbox.checked = false; handleAffectsResistanceToggle(); }
     if(formAcBonusInput) formAcBonusInput.value = '0';
     if(formTrueResistanceBonusInput) formTrueResistanceBonusInput.value = '0';
     if(formEnableFormBuffCheckbox) formEnableFormBuffCheckbox.checked = false;
     if(formFormBuffValueInput) formFormBuffValueInput.value = '0';
     if(formFormBuffTypeSelect) formFormBuffTypeSelect.value = 'add';
     if(formEnablePoolBuffCheckbox) formEnablePoolBuffCheckbox.checked = false;
     if(formPoolBuffValueInput) formPoolBuffValueInput.value = '0';
     if(formPoolBuffTypeSelect) formPoolBuffTypeSelect.value = 'add';

    // Reset Result Area
    if(resultDiv) resultDiv.classList.add('hidden');
    if(resultValueEl) resultValueEl.textContent = '0';
    if(resultTotalEnergyUsedEl) resultTotalEnergyUsedEl.textContent = '0';
    if(resultTotalExtraDamageEl) resultTotalExtraDamageEl.textContent = '0.00';
    if(resultScientificEl) resultScientificEl.textContent = '0';
    if(resultWordsEl) resultWordsEl.textContent = 'Zero';
    if(equationDisplayEl) equationDisplayEl.innerHTML = 'Equation not yet calculated.';

    // Reset Stats Panel Display
    updateStatsDisplay();

    // Ensure correct view is shown
    showCalculatorView();

    console.log("UI reset complete.");
}


// --- NO EXPORT BLOCK AT THE END ---
// All functions intended for export use the 'export function ...' syntax above.
