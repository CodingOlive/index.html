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
// >>>>> CRITICAL: Ensure these use 'export let' <<<<<
export let currentUser = null;
export let isAdmin = false;
// >>>>> END CRITICAL SECTION <<<<<

export let totalDamageDealt = 0;
export let totalEnergySpent = 0;
export let attackCount = 0;
export let highestDamage = 0;
export let dynamicModifierCount = 0;
export let characterForms = [];
export let calculatorState = {
    activeFormIds: [],
    appliedAcBonus: 0,
    appliedTrueResistanceBonus: 0,
    activeView: 'calculator'
};
export let activeAttacks = {};
export let mergedEnergyTypes = [];


// --- Core State Functions ---

export function initializeCoreState() {
    console.log("Initializing core state variables...");
    currentUser = null; // Modifying the exported 'let'
    isAdmin = false;    // Modifying the exported 'let'
    totalDamageDealt = 0;
    totalEnergySpent = 0;
    attackCount = 0;
    highestDamage = 0;
    dynamicModifierCount = 0;
    characterForms = [];
    calculatorState = {
        activeFormIds: [],
        appliedAcBonus: 0,
        appliedTrueResistanceBonus: 0,
        activeView: 'calculator'
    };
    activeAttacks = {};
    mergedEnergyTypes = [];
}

/**
 * Gathers the current state of the application from DOM elements and state variables.
 */
export function gatherState() {
    // ... (Function content should be correct from previous versions) ...
     if (!baseDamageInput || !energyTypeSelect) { return null; }
     const state = { /* ... gather all properties ... */ };
     // ... (gather pools, speed, modifiers) ...
     console.log("State gathered:", state);
     return state;
}


/**
 * Applies a loaded state object to the application's state variables and UI.
 */
export function applyState(state) {
     // ... (Function content should be correct from previous versions) ...
     // It modifies state variables like characterForms, calculatorState, etc.
     // It updates DOM elements based on loaded state.
     // It calls handleRyokoCheckboxChange after setting checkbox state.
     // It calls UI updaters like renderFormList, applyActiveFormEffects, etc.
     if (!state) { return; }
     console.log("Applying loaded state...");
     // Restore Core State Variables
     characterForms = state.characterForms || [];
     calculatorState.activeFormIds = Array.isArray(state.activeFormIds) ? state.activeFormIds : [];
     // ... restore other state vars ...
     // Restore DOM Element Values
     // ... restore inputs/checkboxes/etc ...
     handleRyokoCheckboxChange();
     // Restore Dynamic Modifiers
     // ... clear container, loop, call addDynamicModifier ...
     // Restore Energy Pool Inputs
     // ... loop, set DPP/Regen ...
     // Update UI based on restored state
     renderFormList();
     renderActiveFormsSection();
     applyActiveFormEffects();
     // Restore CURRENT Energy
     // ... loop, set currentEnergyEl.textContent ...
     // Restore slider percentages & update displays
     // ... loop, set slider values, call updaters ...
     updateSpeedSliderVisibility();
     // ... restore speed slider ...
     // Update Kaioken UI
     // ... check checkbox/focus, call style/health updaters ...
     // Update final displays
     updateStatsDisplay();
     updateEquationDisplay();
     // Restore active view
     // ... call showCharacterStatsView or showCalculatorView ...
     console.log("State application complete.");
}


/**
 * Loads custom energy types from the database, merges them with standard types,
 * and stores the result in the `mergedEnergyTypes` state variable.
 */
export async function initializeAndMergeEnergyTypes() {
    // ... (Function content should be correct from previous versions) ...
     console.log("Initializing and merging energy types...");
     let standardTypes = []; let customTypes = [];
     try { standardTypes = ALL_ENERGY_TYPES.map(typeId => { /* ... format standard type object ... */ }); } catch (error) { /* ... */ }
     try { const loadedCustom = await loadCustomEnergyTypes(); customTypes = loadedCustom.map(ct => ({ ...ct, isStandard: false, details: null })); } catch (error) { /* ... */ }
     mergedEnergyTypes = [...standardTypes, ...customTypes]; // Modifies exported variable
     console.log(`Merged energy types initialized. Total: ${mergedEnergyTypes.length} (Standard: ${standardTypes.length}, Custom: ${customTypes.length})`);
     return true;
}
