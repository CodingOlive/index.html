// state.js - Manages the application's state variables and save/load logic.

// --- Import Dependencies ---
// Import DOM Elements
import {
    baseDamageInput, baseMultiplierInput, attackCompressionPointsInput,
    energyTypeSelect, characterNameInput, charBaseHealthInput,
    charBaseMultiplierInput, charVitalityInput, charSoulPowerInput,
    charSoulHpInput, charBaseAcInput, charBaseTrInput, charSpeedInput,
    ryokoCheckbox, ryokoEquationInput, kaiokenCheckbox, maxHealthInput,
    kaiokenStrainInput, currentHealthEl, dynamicModifiersContainer,
    formMultiplierInput
} from './dom-elements.js';

// Import Config
import { ALL_ENERGY_TYPES, ENERGY_TYPE_DETAILS } from './config.js';

// Import Utilities & Formatters
import { parseFormattedNumber, formatStatNumber, formatSimpleNumber } from './formatters.js';
import { safeParseFloat } from './utils.js';

// Import Functions from other modules
import { addDynamicModifier, renderFormList, renderActiveFormsSection } from './dom-generators.js';
import { applyActiveFormEffects } from './forms.js';
import { handleRyokoCheckboxChange } from './character-stats.js';
import { getEnergyElements } from './energy-pools.js';
import { updateSingleSliderDisplay } from './calculation.js';
import { updateSpeedSliderDisplay } from './speed-slider.js';
import {
    updateSliderVisibility, updateSpeedSliderVisibility,
    applyKaiokenStyle, removeKaiokenStyle,
    showCharacterStatsView, showCalculatorView,
    updateStatsDisplay, updateCurrentHealthDisplay
} from './ui-updater.js';
import { updateEquationDisplay } from './equation.js';
import { loadCustomEnergyTypes } from './database.js';


// --- State Variables ---
export let currentUser = null;
export let isAdmin = false;
export let totalDamageDealt = 0;
export let totalEnergySpent = 0;
export let attackCount = 0;
export let highestDamage = 0;
export let dynamicModifierCount = 0; // Counter managed internally now
export let characterForms = [];
export let calculatorState = {
    activeFormIds: [],
    appliedAcBonus: 0,
    appliedTrueResistanceBonus: 0,
    activeView: 'calculator'
};
export let activeAttacks = {};
export let mergedEnergyTypes = [];


// --- State Setter Functions ---

/**
 * Updates the currentUser state variable.
 * @param {object | null} user - The Firebase user object or null.
 */
export function setCurrentUser(user) {
    console.log("Setting currentUser state:", user ? user.uid : null);
    currentUser = user;
}

/**
 * Updates the isAdmin state variable.
 * @param {boolean} status - The new admin status.
 */
export function setIsAdmin(status) {
     console.log("Setting isAdmin state:", status);
    isAdmin = status;
}

// --- NEW Setter/Getter for Counter ---
/**
 * Increments the global dynamic modifier count and returns the NEW count.
 * Ensures the count is managed centrally.
 * @returns {number} The new, incremented count.
 */
export function incrementAndGetModifierCount() { // <-- Added export
    dynamicModifierCount++;
    console.log("DEBUG: Incremented dynamicModifierCount to:", dynamicModifierCount);
    return dynamicModifierCount;
}
// --- END NEW Setter/Getter ---


// --- Core State Functions ---
export function initializeCoreState() {
    console.log("Initializing core state variables...");
    setCurrentUser(null);
    setIsAdmin(false);
    totalDamageDealt = 0;
    totalEnergySpent = 0;
    attackCount = 0;
    highestDamage = 0;
    dynamicModifierCount = 0; // Reset counter here
    characterForms = [];
    calculatorState = { /* reset object */ };
    activeAttacks = {};
    mergedEnergyTypes = [];
}

export function gatherState() { /* ... Function remains the same ... */ }
export function applyState(state) { /* ... Function remains the same ... */ }
export async function initializeAndMergeEnergyTypes() { /* ... Function remains the same ... */ }

