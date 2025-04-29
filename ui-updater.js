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
    resultScientificEl, resultWordsEl, resultDiv, resultValueEl, resultTotalEnergyUsedEl, resultTotalExtraDamageEl, // Added missing result els
    // View Containers
    mainCalculatorContent, characterStatsScreen, mainTitle, showCharacterStatsBtn,
    // Other needed elements
    energyTypeSelect, charBaseAcInput, charBaseTrInput, charSpeedInput, energyPoolsContainer,
    // Elements for initializeDefaultUI
    baseDamageInput, attackCompressionPointsInput, baseMultiplierInput, formMultiplierInput, // Added base mult, form mult
    characterNameInput, charBaseHealthInput, charBaseMultiplierInput, // Added char base mult
    charVitalityInput, charSoulPowerInput, charSoulHpInput,
    ryokoCheckbox, ryokoEquationInput, ryokoEquationContainer, // Added ryoko container
    kaiokenStrainInput, dynamicModifiersContainer, slidersGrid, allSlidersContainer, // Added slidersGrid/allSlidersContainer
    activeFormsListContainer, // Added active forms list container
    formNameInput, formEnergyTypeSelect, formFormMultiplierInput, // Added form creator elements for reset
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
    characterForms // Needed for initializeDefaultUI reset checks
} from './state.js';

// Import Config
import { ENERGY_TYPE_DETAILS, ALL_ENERGY_TYPES, ATTACK_RESERVE_COLOR, SLIDER_TRACK_COLOR, SPEED_DETAILS } from './config.js'; // Added SPEED_DETAILS

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
import { updateAdminUI } from './admin.js'; // Added admin UI update

// --- UI Update Functions ---

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
    // Read directly from calculatorState (or use getters if implemented)
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

    // Update Kaioken section visibility (only shown if focus is 'ki')
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
        // Reset slider value if hiding it
        if (!shouldShow && energySlider) {
            energySlider.value = 0;
            // Also update its display text
            const valueDisplay = document.getElementById(`${type}-slider-value-display`);
            if (valueDisplay) {
                 const percentSpan = valueDisplay.querySelector('.slider-percent-value');
                 const detailsSpan = valueDisplay.querySelector('.slider-details-value');
                 if(percentSpan) percentSpan.textContent = '0%';
                 if(detailsSpan) detailsSpan.textContent = '(E: 0, D: 0.00)';
            }
        }
    } else if (sliderSection) {
         // If total energy element doesn't exist, hide the slider section
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
                 // Also update its display text
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
    statsPanel.classList.add('border-kaioken-border', 'kaioken-active', 'animate-kaioken-glow'); // Add active class and glow
    statsPanelHeader.classList.remove('text-stats-header');
    statsPanelHeader.classList.add('text-kaioken-header');
    console.log("Kaioken style applied.");
}

/**
 * Removes Kaioken-specific styling from the stats panel.
 */
export function removeKaiokenStyle() {
    if (!statsPanel || !statsPanelHeader) return;
    statsPanel.classList.remove('border-kaioken-border', 'kaioken-active', 'animate-kaioken-glow'); // Remove active class and glow
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
     // Read current displayed value BEFORE potentially changing it
     const currentHealth = parseFormattedNumber(currentHealthEl.textContent);
     // Update display, capping at max health and ensuring it's not negative
     currentHealthEl.textContent = formatStatNumber(Math.max(0, Math.min(currentHealth, maxHealth)));
}


/**
 * Updates the appearance of attack buttons and the status message based on active attacks for the *currently focused* energy type.
 * @param {string} type - The currently focused energy type ID.
 */
export function updateAttackButtonStates(type) {
    if (!superAttackBtn || !ultimateAttackBtn || !attackStatusMessage) return;

    const currentAttack = activeAttacks[type] || null; // Read from state

    // Reset styles/text first
    superAttackBtn.classList.remove('active-attack', 'opacity-50');
    ultimateAttackBtn.classList.remove('active-attack', 'opacity-50');
    superAttackBtn.textContent = 'Super Attack (Reserves 5%)'; // Reset text
    ultimateAttackBtn.textContent = 'Ultimate Attack (Reserves 10%)'; // Reset text
    attackStatusMessage.textContent = ''; // Clear message

    if (currentAttack === 'super') {
        superAttackBtn.classList.add('active-attack');
        ultimateAttackBtn.classList.add('opacity-50'); // Dim the other button
        superAttackBtn.textContent = 'Super Attack (ACTIVE)';
        attackStatusMessage.textContent = `Super Attack active for ${type}. Energy use capped at 95%.`;
    } else if (currentAttack === 'ultimate') {
        ultimateAttackBtn.classList.add('active-attack');
        superAttackBtn.classList.add('opacity-50'); // Dim the other button
        ultimateAttackBtn.textContent = 'Ultimate Attack (ACTIVE)';
        attackStatusMessage.textContent = `Ultimate Attack active for ${type}. Energy use capped at 90%.`;
    }
    // If currentAttack is null, no styles are added, message remains empty.
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
    let thumbColor = null; // Default thumb color (from CSS)
    let trackGradient = `linear-gradient(to right, var(--slider-thumb-color, #9ca3af) 0%, var(--slider-thumb-color, #9ca3af) 100%)`; // Default full track gradient

    const energyType = mergedEnergyTypes.find(et => et.id === type);
     let baseColor = '#9ca3af'; // Default gray

     if (energyType) {
         if (energyType.isStandard && energyType.details?.color) {
             // Attempt to get Tailwind color value (this might need adjustment based on your setup)
             // This is tricky without direct access to Tailwind's resolved config.
             // Using a CSS variable set elsewhere might be more reliable.
             // Example fallback: use predefined hex if necessary.
             const colorMap = { ki: '#FF9800', nen: '#2196F3', chakra: '#9C27B0', magic: '#26a69a', cursed: '#dc2626', reiatsu: '#475569', haki: '#1f2937', alchemy: '#f59e0b', nature: '#84cc16', force: '#d946ef', origin: '#4f46e5', fundamental: '#9ca3af', other: '#78350f' };
             baseColor = colorMap[energyType.id] || baseColor;
         } else if (!energyType.isStandard && energyType.hexColor) {
             baseColor = energyType.hexColor;
         }
     } else if (type === 'speed') {
         // Handle speed slider color (assuming SPEED_DETAILS is imported)
          const speedColorMap = { 'sky-500': '#0ea5e9' }; // Example mapping
          baseColor = speedColorMap[SPEED_DETAILS?.color] || '#0ea5e9'; // Default sky blue
     }


    // Set thumb color CSS variable
    slider.style.setProperty('--slider-thumb-color', baseColor);

    if (attackState === 'super') {
        limitPercent = 95;
        trackGradient = `linear-gradient(to right, ${baseColor} 0%, ${baseColor} ${limitPercent}%, ${ATTACK_RESERVE_COLOR} ${limitPercent}%, ${ATTACK_RESERVE_COLOR} 100%)`;
    } else if (attackState === 'ultimate') {
        limitPercent = 90;
        trackGradient = `linear-gradient(to right, ${baseColor} 0%, ${baseColor} ${limitPercent}%, ${ATTACK_RESERVE_COLOR} ${limitPercent}%, ${ATTACK_RESERVE_COLOR} 100%)`;
    } else {
         // No attack active or type is 'speed'
         if (type === 'speed') {
             trackGradient = `linear-gradient(to right, ${baseColor} 0%, ${baseColor} 100%)`;
         } else {
             // Default gradient using the base color
             trackGradient = `linear-gradient(to right, ${baseColor} 0%, ${baseColor} 100%)`;
         }
    }

    // Apply the background gradient to the slider track (requires specific CSS setup)
    slider.style.setProperty('--slider-track-gradient', trackGradient);
     // Add a class to potentially style the track via CSS ::-webkit-slider-runnable-track or ::-moz-range-track
     slider.classList.add('slider-track-styled');
}


// ********************************************
// *** CORRECTED displayEnergyPool FUNCTION ***
/**
 * Handles the UI updates for displaying a specific energy pool (showing/hiding/animating).
 * @param {string} typeIdToShow - The ID (e.g., 'ki', 'custom_abc') of the energy pool to display.
 */
export function displayEnergyPool(typeIdToShow) {
    console.log(`--- displayEnergyPool START --- Called for: ${typeIdToShow}`); // Log entry

    if (!energyPoolsContainer) {
        console.error("displayEnergyPool ERROR: energyPoolsContainer element not found!");
        return;
    }
    if (!typeIdToShow) {
         console.warn("displayEnergyPool WARN: No typeIdToShow provided. Hiding all pools.");
         // Hide all pools if no specific type is requested
          energyPoolsContainer.querySelectorAll('.energy-pool').forEach(pool => {
              pool.classList.add('hidden'); // Use classList for consistency
              pool.style.display = 'none'; // Ensure it's visually hidden immediately
          });
         return;
    }

    let foundPoolToShow = false;
    const expectedId = `${typeIdToShow}-pool`;
    console.log(`displayEnergyPool INFO: Expecting element with ID: ${expectedId}`);

    // Use querySelectorAll to find all potential pool divs within the container
    const allPools = energyPoolsContainer.querySelectorAll('.energy-pool');
    console.log(`displayEnergyPool INFO: Found ${allPools.length} elements with class '.energy-pool'.`);

    allPools.forEach(pool => {
        if (!pool.id) {
             console.warn("displayEnergyPool WARN: Found a pool element missing an ID:", pool);
             // Hide it just in case
             pool.classList.add('hidden');
             pool.style.display = 'none';
             return; // Skip to next pool
        }

        if (pool.id === expectedId) {
            // This is the pool to show
            console.log(`displayEnergyPool ACTION: Showing pool: #${pool.id}`);
            pool.style.display = ''; // Clear potential inline style needed if previously hidden this way
            pool.classList.remove('hidden'); // <<< CRITICAL: Remove the hidden class
            triggerAnimation(pool, 'fadeIn'); // Optional animation
            foundPoolToShow = true;
        } else {
            // Hide this pool
            // console.log(`displayEnergyPool ACTION: Hiding pool: #${pool.id}`); // Can be noisy
            pool.classList.add('hidden'); // Ensure hidden class is present
            pool.style.display = 'none'; // Also set display none for robustness
        }
    });

    if (!foundPoolToShow) {
        console.error(`displayEnergyPool ERROR: Did not find pool element with expected ID: #${expectedId}`);
         // As a fallback, ensure all are hidden if the target wasn't found
         allPools.forEach(pool => {
              pool.classList.add('hidden');
              pool.style.display = 'none';
          });
    }
     console.log(`--- displayEnergyPool END ---`);
}
// ********************************************


/**
 * Updates the result area with Scientific Notation and Word versions of the damage.
 */
export function displayAllFormats(damage) {
    if (resultScientificEl) {
        resultScientificEl.textContent = isFinite(damage) ? damage.toExponential(2) : 'N/A';
    }
    if (resultWordsEl) {
        resultWordsEl.textContent = convertNumberToWords(damage); // Use formatter function
    }
}

/**
 * Switches the view to the Character Stats screen.
 */
export function showCharacterStatsView() {
    if (mainCalculatorContent) mainCalculatorContent.classList.add('hidden');
    if (characterStatsScreen) characterStatsScreen.classList.remove('hidden');
    if (mainTitle) mainTitle.textContent = "Character Stats & Forms"; // Update title
    if (showCharacterStatsBtn) showCharacterStatsBtn.textContent = "Back to Calculator"; // Update button text
     setCalculatorStateValue('activeView', 'characterStats'); // Update state if using setCalculatorStateValue
     console.log("Switched to Character Stats View");
 }

/**
 * Switches the view to the main Energy Calculator screen.
 */
export function showCalculatorView() {
    if (mainCalculatorContent) mainCalculatorContent.classList.remove('hidden');
    if (characterStatsScreen) characterStatsScreen.classList.add('hidden');
    if (mainTitle) mainTitle.textContent = "Energy Calculator"; // Restore title
    if (showCharacterStatsBtn) showCharacterStatsBtn.textContent = "Character Stats"; // Restore button text
     setCalculatorStateValue('activeView', 'calculator'); // Update state if using setCalculatorStateValue
     console.log("Switched to Calculator View");

     // It might be necessary to refresh certain parts of the calculator UI when returning
     applyActiveFormEffects(); // Recalculate form effects as stats might have changed
     updateEquationDisplay();
     updateStatsDisplay();
}


/**
 * Resets various UI elements to their default visual state, typically used on logout or clear.
 */
export function initializeDefaultUI() {
    console.log("Resetting UI to defaults...");

    // Reset Core Inputs
    if (baseDamageInput) baseDamageInput.value = '0';
    if (attackCompressionPointsInput) attackCompressionPointsInput.value = '0';
    if (baseMultiplierInput) baseMultiplierInput.value = '1';
    if (formMultiplierInput) formMultiplierInput.value = '1'; // Reset calculated display too

    // Reset Character Stats Inputs/Display
    if (characterNameInput) characterNameInput.value = '';
    if (charBaseHealthInput) charBaseHealthInput.value = '';
    if (charBaseMultiplierInput) charBaseMultiplierInput.value = '1'; // Separate from baseMultiplierInput
    if (charVitalityInput) charVitalityInput.value = '';
    if (charSoulPowerInput) charSoulPowerInput.value = '';
    if (charSoulHpInput) charSoulHpInput.value = '';
    if (charBaseAcInput) charBaseAcInput.value = '10';
    if (charBaseTrInput) charBaseTrInput.value = '5';
    if (charSpeedInput) charSpeedInput.value = '';

    // Reset Ryoko Mode
    if (ryokoCheckbox) ryokoCheckbox.checked = false;
    if (ryokoEquationInput) ryokoEquationInput.value = '';
    // Trigger handler to reset UI correctly (hide input, make base mult editable)
    handleRyokoCheckboxChange();

    // Reset Kaioken
    if (kaiokenCheckbox) kaiokenCheckbox.checked = false;
    if (maxHealthInput) maxHealthInput.value = '1000';
    if (kaiokenStrainInput) kaiokenStrainInput.value = '10';
    if (currentHealthEl) currentHealthEl.textContent = formatStatNumber(1000); // Reset display
    if (kaiokenDetails) kaiokenDetails.classList.add('hidden');
    removeKaiokenStyle(); // Ensure default stats panel style

    // Reset Dynamic Modifiers
    if (dynamicModifiersContainer) dynamicModifiersContainer.innerHTML = '<h4 class="text-md font-semibold mb-2 text-gray-700">Additional Factors:</h4>';

    // Reset Energy Pools (Recalculate based on defaults, reset inputs/sliders)
     mergedEnergyTypes.forEach(type => {
         if (!type || !type.id) return;
         const typeId = type.id;
         const els = getEnergyElements(typeId);
         if (els) {
             // Reset inputs to defaults
             if(els.maxMultiplierEl) els.maxMultiplierEl.value = '1';
             if(els.damagePerPowerEl) els.damagePerPowerEl.value = '1';
             if(els.regenPercentEl) els.regenPercentEl.value = '0';
             // Recalculate energy based on potentially zeroed stats
             calculateAndResetEnergy(typeId); // Resets current to new total
             // Reset slider
             if(els.energySlider) els.energySlider.value = 0;
             updateSingleSliderDisplay(typeId);
             updateSliderLimitAndStyle(typeId);
             updateSliderVisibility(typeId); // Hide if total is 0
         }
     });
     // Reset speed slider
     const speedSliderEl = document.getElementById('speed-slider');
     if (speedSliderEl) speedSliderEl.value = 0;
     updateSpeedSliderDisplay();
     updateSpeedSliderVisibility(); // Hide if speed is 0


    // Reset Attack Buttons/State Message
    if(energyTypeSelect?.value) updateAttackButtonStates(energyTypeSelect.value); // Reset based on current focus
    else if (mergedEnergyTypes.length > 0) updateAttackButtonStates(mergedEnergyTypes[0].id); // Reset based on first type
     if (attackStatusMessage) attackStatusMessage.textContent = '';


    // Reset Forms UI
    if (activeFormsListContainer) renderActiveFormsSection(); // Will show "No forms defined" if state is cleared
    if (formListContainer) renderFormList(); // Will show "No forms created"

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
    updateStatsDisplay(); // Reflect cleared state

     // Reset Admin Panel display (only if needed, e.g., clear form)
     // updateAdminUI(false); // Assuming logged out state hides it

     // Ensure correct view is shown (usually calculator after reset)
     showCalculatorView();

    console.log("UI reset complete.");
}

// Ensure all functions intended for export are listed here
export {
    updateStatsDisplay,
    updateSliderVisibility,
    updateSpeedSliderVisibility,
    applyKaiokenStyle,
    removeKaiokenStyle,
    updateCurrentHealthDisplay,
    updateAttackButtonStates,
    updateSliderLimitAndStyle,
    displayEnergyPool, // Make sure the corrected version is exported
    displayAllFormats
};
