// ui-updater.js - Functions for updating existing UI elements.

// --- Import Dependencies ---
import {
    statsPanel, statsPanelHeader, statCurrentEnergyEl, statTotalDamageEl,
    statTotalEnergySpentEl, statAttackCountEl, statHighestDamageEl,
    statFormAcBonusEl, statFormTrBonusEl, statTotalAcEl, statTotalTrEl, statSpeedEl,
    kaiokenSection, kaiokenDetails, kaiokenCheckbox, maxHealthInput, currentHealthEl,
    superAttackBtn, ultimateAttackBtn, attackStatusMessage,
    resultScientificEl, resultWordsEl, resultDiv,
    mainCalculatorContent, characterStatsScreen, mainTitle, showCharacterStatsBtn, // <-- Need these for view switching
    energyTypeSelect, charBaseAcInput, charBaseTrInput, charSpeedInput, energyPoolsContainer,
    baseDamageInput, attackCompressionPointsInput, characterNameInput, charBaseHealthInput,
    charBaseMultiplierInput, charVitalityInput, charSoulPowerInput, charSoulHpInput,
    ryokoCheckbox, ryokoEquationInput, kaiokenStrainInput, dynamicModifiersContainer
} from './dom-elements.js';
import {
    totalDamageDealt, totalEnergySpent, attackCount, highestDamage, calculatorState, activeAttacks
} from './state.js';
import { ENERGY_TYPE_DETAILS, ALL_ENERGY_TYPES, ATTACK_RESERVE_COLOR, SLIDER_TRACK_COLOR } from './config.js';
import { formatStatNumber, formatSimpleNumber, parseFormattedNumber, convertNumberToWords, safeParseFloat } from './formatters.js';
import { triggerAnimation } from './utils.js'; // <-- Need this for view switching animation
// import { updateSingleSliderDisplay } from './calculation.js';


// --- UI Update Functions ---

export function updateStatsDisplay() { /* ... Function remains the same ... */ }
export function updateSliderVisibility(type) { /* ... Function remains the same ... */ }
export function updateSpeedSliderVisibility() { /* ... Function remains the same ... */ }
export function applyKaiokenStyle() { /* ... Function remains the same ... */ }
export function removeKaiokenStyle() { /* ... Function remains the same ... */ }
export function updateCurrentHealthDisplay() { /* ... Function remains the same ... */ }
export function updateAttackButtonStates(type) { /* ... Function remains the same ... */ }
export function updateSliderLimitAndStyle(type) { /* ... Function remains the same ... */ }
export function displayEnergyPool(typeToShow) { /* ... Function remains the same ... */ }
export function displayAllFormats(damage) { /* ... Function remains the same ... */ }

/**
 * Switches the view to the Character Stats screen.
 */
export function showCharacterStatsView() {
    // Uses imported elements, utils, state
    console.log("UI_UPDATER: Attempting to show Character Stats View"); // DEBUG LOG
    if (mainCalculatorContent) mainCalculatorContent.classList.add('hidden'); // Hide calculator
    if (characterStatsScreen) characterStatsScreen.classList.remove('hidden'); // Show stats screen
    if (mainTitle) mainTitle.textContent = 'Character Stats';
    if (showCharacterStatsBtn) showCharacterStatsBtn.textContent = 'Energy Calculator'; // Toggle button text
    if (characterStatsScreen) triggerAnimation(characterStatsScreen, 'fadeIn'); // Use imported util
    calculatorState.activeView = 'stats'; // Update imported state
}

/**
 * Switches the view to the main Energy Calculator screen.
 */
export function showCalculatorView() {
    // Uses imported elements, utils, state
    console.log("UI_UPDATER: Attempting to show Calculator View"); // DEBUG LOG
    if (characterStatsScreen) characterStatsScreen.classList.add('hidden'); // Hide stats screen
    if (mainCalculatorContent) mainCalculatorContent.classList.remove('hidden'); // Show calculator
    if (mainTitle) mainTitle.textContent = 'Energy Calculator';
    if (showCharacterStatsBtn) showCharacterStatsBtn.textContent = 'Character Stats'; // Toggle button text
    if (mainCalculatorContent) triggerAnimation(mainCalculatorContent, 'fadeIn'); // Use imported util
    calculatorState.activeView = 'calculator'; // Update imported state
}

export function initializeDefaultUI() { /* ... Function remains the same ... */ }

