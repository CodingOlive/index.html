// ui-updater.js - Functions for updating existing UI elements.

// --- Import Dependencies ---
// Import DOM Elements
import {
    statsPanel, statsPanelHeader, statCurrentEnergyEl, statTotalDamageEl,
    statTotalEnergySpentEl, statAttackCountEl, statHighestDamageEl,
    statFormAcBonusEl, statFormTrBonusEl, statTotalAcEl, statTotalTrEl, statSpeedEl,
    kaiokenSection, kaiokenDetails, kaiokenCheckbox, maxHealthInput, currentHealthEl,
    superAttackBtn, ultimateAttackBtn, attackStatusMessage,
    resultScientificEl, resultWordsEl, resultDiv,
    mainCalculatorContent, characterStatsScreen, mainTitle, showCharacterStatsBtn,
    energyTypeSelect, charBaseAcInput, charBaseTrInput, charSpeedInput, energyPoolsContainer,
    // Elements for initializeDefaultUI
    baseDamageInput, attackCompressionPointsInput, characterNameInput, charBaseHealthInput,
    charBaseMultiplierInput, charVitalityInput, charSoulPowerInput, charSoulHpInput,
    ryokoCheckbox, ryokoEquationInput, kaiokenStrainInput, dynamicModifiersContainer
} from './dom-elements.js';

// Import State
import {
    totalDamageDealt, totalEnergySpent, attackCount, highestDamage, calculatorState, activeAttacks
} from './state.js';

// Import Config
import { ENERGY_TYPE_DETAILS, ALL_ENERGY_TYPES, ATTACK_RESERVE_COLOR, SLIDER_TRACK_COLOR } from './config.js';

// Import Formatters & Utilities
import { formatStatNumber, formatSimpleNumber, parseFormattedNumber, convertNumberToWords, safeParseFloat } from './formatters.js'; // Assuming safeParseFloat moved here or utils imports it
import { triggerAnimation } from './utils.js';

// Import other functions if needed (e.g., if updating slider display directly)
// import { updateSingleSliderDisplay } from './calculation.js';
// import { updateSpeedSliderDisplay } from './speed-slider.js'; // Needed by initializeDefaultUI? No, covered by updateSpeedSliderVisibility

// --- UI Update Functions ---

/**
 * Updates all display fields in the stats panel based on current state.
 */
export function updateStatsDisplay() {
    // Uses imported state, elements, utils, formatters
    if (statTotalDamageEl) statTotalDamageEl.textContent = formatStatNumber(totalDamageDealt);
    if (statTotalEnergySpentEl) statTotalEnergySpentEl.textContent = formatStatNumber(totalEnergySpent);
    if (statHighestDamageEl) statHighestDamageEl.textContent = formatStatNumber(highestDamage);
    if (statAttackCountEl) statAttackCountEl.textContent = attackCount.toLocaleString();

    const selectedType = energyTypeSelect?.value;
    const currentEnergyDisplayEl = selectedType ? document.getElementById(`${selectedType}-current-energy`) : null; // Direct lookup OK here
    if (statCurrentEnergyEl) {
        statCurrentEnergyEl.textContent = currentEnergyDisplayEl?.textContent || '0';
    }

    // Uses imported elements, utils, state, formatters
    const baseAC = safeParseFloat(charBaseAcInput?.value, 0);
    const baseTR = safeParseFloat(charBaseTrInput?.value, 0);
    const formAcBonus = calculatorState.appliedAcBonus || 0;
    const formTrBonus = calculatorState.appliedTrueResistanceBonus || 0;

    if (statFormAcBonusEl) statFormAcBonusEl.textContent = formatSimpleNumber(formAcBonus);
    if (statFormTrBonusEl) statFormTrBonusEl.textContent = formatSimpleNumber(formTrBonus);
    if (statTotalAcEl) statTotalAcEl.textContent = formatSimpleNumber(baseAC + formAcBonus);
    if (statTotalTrEl) statTotalTrEl.textContent = formatSimpleNumber(baseTR + formTrBonus);
    if (statSpeedEl && charSpeedInput) {
        statSpeedEl.textContent = formatStatNumber(safeParseFloat(charSpeedInput.value, 0));
    }
}

/**
 * Shows or hides a specific energy slider section based on its total energy.
 */
export function updateSliderVisibility(type) {
    // Uses imported formatter, direct element lookups ok here
    const sliderSection = document.getElementById(`${type}-slider-section`);
    const totalEnergyEl = document.getElementById(`${type}-total-energy`);
    const energySlider = document.getElementById(`${type}-energy-slider`);

    if (totalEnergyEl && sliderSection) {
        const totalEnergy = parseFormattedNumber(totalEnergyEl.textContent);
        const shouldShow = totalEnergy > 0;
        sliderSection.classList.toggle('hidden', !shouldShow);
        if (!shouldShow && energySlider) {
            energySlider.value = 0;
            // If slider text needs reset, call updateSingleSliderDisplay(type) here
        }
    }
}

/**
 * Shows or hides the speed slider based on the character's speed stat.
 */
export function updateSpeedSliderVisibility() {
    // Uses imported element, util, direct lookup
    const baseSpeed = safeParseFloat(charSpeedInput?.value, 0);
    const speedSliderSection = document.getElementById('speed-slider-section');

    if (speedSliderSection) {
        const shouldShow = baseSpeed > 0;
        speedSliderSection.classList.toggle('hidden', !shouldShow);
        if(!shouldShow) {
            const speedSlider = document.getElementById('speed-slider');
            if(speedSlider) speedSlider.value = 0;
             // If slider text needs reset, call updateSpeedSliderDisplay() here
        }
    }
}

/**
 * Applies Kaioken-specific styling to the stats panel.
 */
export function applyKaiokenStyle() {
    // Uses imported elements
    if (!statsPanel || !statsPanelHeader) return;
    statsPanel.classList.remove('border-stats-border');
    statsPanel.classList.add('border-kaioken-border', 'animate-kaioken-glow');
    statsPanelHeader.classList.remove('text-stats-header');
    statsPanelHeader.classList.add('text-kaioken-header');
}

/**
 * Removes Kaioken-specific styling from the stats panel.
 */
export function removeKaiokenStyle() {
    // Uses imported elements
    if (!statsPanel || !statsPanelHeader) return;
    statsPanel.classList.add('border-stats-border');
    statsPanel.classList.remove('border-kaioken-border', 'animate-kaioken-glow');
    statsPanelHeader.classList.add('text-stats-header');
    statsPanelHeader.classList.remove('text-kaioken-header');
}

/**
 * Updates the current health display, ensuring it doesn't exceed max health.
 */
export function updateCurrentHealthDisplay() {
    // Uses imported elements, utils, formatters
    if (!currentHealthEl || !maxHealthInput || !energyTypeSelect || !kaiokenCheckbox) return;
    const maxHealth = safeParseFloat(maxHealthInput.value, 0);
    let currentHealth = parseFormattedNumber(currentHealthEl.textContent);
    const isKiFocused = energyTypeSelect.value === 'ki';
    const isKaiokenChecked = kaiokenCheckbox.checked;

    if ((isKiFocused && isKaiokenChecked) || currentHealth > maxHealth || currentHealthEl.textContent.trim() === '' || currentHealth <= 0) {
        currentHealthEl.textContent = formatStatNumber(maxHealth);
    }
}

/**
 * Updates the appearance of attack buttons and the status message based on active attacks.
 */
export function updateAttackButtonStates(type) {
    // Uses imported elements, state, config
    if(!superAttackBtn || !ultimateAttackBtn || !attackStatusMessage) return;
    const currentAttack = activeAttacks[type] || null;
    const details = ENERGY_TYPE_DETAILS[type];
    superAttackBtn.classList.toggle('active', currentAttack === 'super');
    ultimateAttackBtn.classList.toggle('active', currentAttack === 'ultimate');
    let statusClasses = 'text-xs mt-2 min-h-[1.25rem]';
    let messageText = '';
    if (currentAttack === 'super') { messageText = `Super Attack active for ${details?.name || type}. Slider limited to 95%.`; statusClasses += ' text-blue-600';}
    else if (currentAttack === 'ultimate') { messageText = `Ultimate Attack active for ${details?.name || type}. Slider limited to 90%.`; statusClasses += ' text-purple-600';}
    else { messageText = ''; statusClasses += ' text-gray-500';}
    attackStatusMessage.textContent = messageText;
    attackStatusMessage.className = statusClasses;
}

/**
 * Updates an energy slider's background gradient to show the reserved portion for attacks.
 */
export function updateSliderLimitAndStyle(type) {
    // Uses imported state, config, direct lookup
    const slider = document.getElementById(`${type}-energy-slider`);
    if (!slider) return;
    const activeAttack = activeAttacks[type] || null;
    let limitPercent = 100;
    let gradientStyle = `linear-gradient(to right, ${SLIDER_TRACK_COLOR} 100%, ${ATTACK_RESERVE_COLOR} 100%)`;
    if (activeAttack === 'super') { limitPercent = 95; gradientStyle = `linear-gradient(to right, ${SLIDER_TRACK_COLOR} ${limitPercent}%, ${ATTACK_RESERVE_COLOR} ${limitPercent}%)`;}
    else if (activeAttack === 'ultimate') { limitPercent = 90; gradientStyle = `linear-gradient(to right, ${SLIDER_TRACK_COLOR} ${limitPercent}%, ${ATTACK_RESERVE_COLOR} ${limitPercent}%)`;}
    slider.style.background = gradientStyle;
}

/**
 * Handles the UI updates for displaying a specific energy pool (showing/hiding/animating).
 */
export function displayEnergyPool(typeToShow) {
     // Uses imported elements, config, functions from this file
     if (!energyPoolsContainer || !energyTypeSelect || !kaiokenSection || !kaiokenCheckbox || !kaiokenDetails) return;
     const details = ENERGY_TYPE_DETAILS[typeToShow];
     if (!details) { return; }

     // Hide all pools first...
     energyPoolsContainer.querySelectorAll('.energy-pool').forEach(poolDiv => {
        poolDiv.style.display = 'none';
        const poolType = poolDiv.id.replace('-pool', '');
        const poolDetails = ENERGY_TYPE_DETAILS[poolType];
        if(poolDetails) { poolDiv.classList.remove(poolDetails.pulseGlow, poolDetails.staticGlow, 'animate__animated', 'animate__fadeIn'); }
     });

     // Show selected pool...
     const poolToShowDiv = document.getElementById(`${typeToShow}-pool`);
     if (poolToShowDiv) {
         poolToShowDiv.style.display = 'block';
         poolToShowDiv.classList.add('animate__animated', 'animate__fadeIn', details.pulseGlow);
         poolToShowDiv.addEventListener('animationend', (e) => { /* ... cleanup animation class ... */ }, { once: true });
         // Timeout for glow transition...
         if (poolToShowDiv._glowTimeoutId) { clearTimeout(poolToShowDiv._glowTimeoutId); }
         poolToShowDiv._glowTimeoutId = setTimeout(() => { /* ... switch to static glow ... */ }, 5000);
     }

     // Handle Kaioken section visibility...
     if (typeToShow === 'ki') {
         kaiokenSection.classList.remove('hidden');
         if (kaiokenCheckbox.checked) {
             kaiokenDetails.classList.remove('hidden');
             updateCurrentHealthDisplay(); // Call function in this file
         }
     } else {
         kaiokenSection.classList.add('hidden');
         if (kaiokenCheckbox.checked) {
             if(kaiokenDetails) kaiokenDetails.classList.add('hidden');
             removeKaiokenStyle(); // Call function in this file
         }
     }
}

/**
 * Updates the result area with Scientific Notation and Word versions of the damage.
 */
export function displayAllFormats(damage) {
    // Uses imported elements, utils, formatters
    if (!resultScientificEl || !resultWordsEl) { return; }
    damage = safeParseFloat(damage, 0);
    try { resultScientificEl.textContent = damage.toExponential(2).replace(/e\+?(-?)/, ' x 10^$1'); } catch (e) { /* ... */ }
    try { resultWordsEl.textContent = convertNumberToWords(damage); } catch (e) { /* ... */ }
}

/**
 * Switches the view to the Character Stats screen.
 */
export function showCharacterStatsView() {
    // Uses imported elements, utils, state
    if (mainCalculatorContent) mainCalculatorContent.classList.add('hidden');
    if (characterStatsScreen) characterStatsScreen.classList.remove('hidden');
    if (mainTitle) mainTitle.textContent = 'Character Stats';
    if (showCharacterStatsBtn) showCharacterStatsBtn.textContent = 'Energy Calculator';
    if (characterStatsScreen) triggerAnimation(characterStatsScreen, 'fadeIn');
    calculatorState.activeView = 'stats';
}

/**
 * Switches the view to the main Energy Calculator screen.
 */
export function showCalculatorView() {
    // Uses imported elements, utils, state
    if (characterStatsScreen) characterStatsScreen.classList.add('hidden');
    if (mainCalculatorContent) mainCalculatorContent.classList.remove('hidden');
    if (mainTitle) mainTitle.textContent = 'Energy Calculator';
    if (showCharacterStatsBtn) showCharacterStatsBtn.textContent = 'Character Stats';
    if (mainCalculatorContent) triggerAnimation(mainCalculatorContent, 'fadeIn');
    calculatorState.activeView = 'calculator';
}

/**
 * Resets various UI elements to their default visual state.
 */
export function initializeDefaultUI() {
    console.log("Resetting UI to defaults...");
    // Uses imported elements and functions from this file
     if(baseDamageInput) baseDamageInput.value = '';
     if(attackCompressionPointsInput) attackCompressionPointsInput.value = '0';
     if(energyTypeSelect) energyTypeSelect.value = 'ki';
     if(resultDiv) resultDiv.classList.add('hidden');
     // Reset character stats inputs... (using imported elements)
     if(characterNameInput) characterNameInput.value = '';
     if(charBaseHealthInput) charBaseHealthInput.value = '';
     // ... reset all other char stat inputs ...
     if(charBaseMultiplierInput) charBaseMultiplierInput.value = '1';
     if(charSpeedInput) charSpeedInput.value = '';
     // Reset Ryoko
     if(ryokoCheckbox) ryokoCheckbox.checked = false;
     if(ryokoEquationInput) ryokoEquationInput.value = '';
     // handleRyokoCheckboxChange(); // Might call this to ensure UI consistency
     // Reset Kaioken
     if(kaiokenCheckbox) kaiokenCheckbox.checked = false;
     if(maxHealthInput) maxHealthInput.value = '1000';
     if(kaiokenStrainInput) kaiokenStrainInput.value = '10';
     if(currentHealthEl) currentHealthEl.textContent = formatStatNumber(safeParseFloat(maxHealthInput?.value, 1000));
     removeKaiokenStyle();
     if(kaiokenDetails) kaiokenDetails.classList.add('hidden');
     // Reset dynamic modifiers container
     if(dynamicModifiersContainer) dynamicModifiersContainer.innerHTML = '<h4 class="text-md font-semibold mb-2 text-gray-700">Additional Factors:</h4>';
     // Reset form lists (calls render functions which show 'No forms' message when state is empty)
     // renderFormList(); // Should be called after state reset
     // renderActiveFormsSection(); // Should be called after state reset
     // Reset sliders/visibility
     updateSpeedSliderVisibility();
     const speedSlider = document.getElementById('speed-slider');
     if(speedSlider) speedSlider.value = 0;
     // updateSpeedSliderDisplay(); // If needed
     ALL_ENERGY_TYPES.forEach(type => { // Use imported config
         updateSliderVisibility(type); // Use function in this file
         const slider = document.getElementById(`${type}-energy-slider`);
         if (slider) slider.value = 0;
         // updateSingleSliderDisplay(type); // If needed
     });
     // Show default view and pool
     showCalculatorView();
     displayEnergyPool('ki');
     // Update displays based on defaults
     updateStatsDisplay();
     // updateEquationDisplay(); // TODO: Import and call if needed for default view
     console.log("Default UI initialized.");
}