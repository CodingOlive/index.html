// state.js - Manages the application's state variables and save/load logic.

// --- Import Dependencies ---
// ... (Keep all existing imports: dom-elements, config, formatters, utils, other modules) ...
import { baseDamageInput, energyTypeSelect /* ... other elements ... */ } from './dom-elements.js';
import { ALL_ENERGY_TYPES, ENERGY_TYPE_DETAILS } from './config.js';
import { parseFormattedNumber, formatStatNumber, formatSimpleNumber } from './formatters.js';
import { safeParseFloat } from './utils.js';
import { addDynamicModifier, renderFormList, renderActiveFormsSection } from './dom-generators.js';
import { applyActiveFormEffects } from './forms.js';
import { handleRyokoCheckboxChange } from './character-stats.js';
import { getEnergyElements } from './energy-pools.js';
import { updateSingleSliderDisplay } from './calculation.js';
import { updateSpeedSliderDisplay } from './speed-slider.js';
import { updateSliderVisibility, updateSpeedSliderVisibility, applyKaiokenStyle, removeKaiokenStyle, showCharacterStatsView, showCalculatorView, updateStatsDisplay, updateCurrentHealthDisplay } from './ui-updater.js';
import { updateEquationDisplay } from './equation.js';
import { loadCustomEnergyTypes } from './database.js';


// --- State Variables ---
// Still export with 'let' for reading directly if needed by some modules,
// but modification should primarily happen via setters now.
export let currentUser = null;
export let isAdmin = false;
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

// --- Core State Functions ---

export function initializeCoreState() {
    console.log("Initializing core state variables...");
    setCurrentUser(null); // Use setter
    setIsAdmin(false);    // Use setter
    totalDamageDealt = 0;
    totalEnergySpent = 0;
    attackCount = 0;
    highestDamage = 0;
    dynamicModifierCount = 0;
    characterForms = [];
    calculatorState = { /* reset object */ };
    activeAttacks = {};
    mergedEnergyTypes = [];
}

/**
 * Gathers the current state of the application from DOM elements and state variables.
 */
export function gatherState() {
    // ... (Function content remains the same - reads state/DOM) ...
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
     // ... (Function content remains the same - modifies state/DOM) ...
     // It modifies state variables like characterForms, calculatorState, etc.
     // It updates DOM elements based on loaded state.
     // It calls handleRyokoCheckboxChange after setting checkbox state.
     // It calls UI updaters like renderFormList, applyActiveFormEffects, etc.
     if (!state) { return; }
     console.log("Applying loaded state...");
     // Restore Core State Variables (except currentUser and isAdmin, handled by auth listener)
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
    // ... (Function content remains the same) ...
     console.log("Initializing and merging energy types...");
     let standardTypes = []; let customTypes = [];
     try { standardTypes = ALL_ENERGY_TYPES.map(typeId => { /* ... */ }); } catch (error) { /* ... */ }
     try { const loadedCustom = await loadCustomEnergyTypes(); customTypes = loadedCustom.map(ct => ({ ...ct, isStandard: false, details: null })); } catch (error) { /* ... */ }
     mergedEnergyTypes = [...standardTypes, ...customTypes]; // Modifies exported variable
     console.log(`Merged energy types initialized. Total: ${mergedEnergyTypes.length} (Standard: ${standardTypes.length}, Custom: ${customTypes.length})`);
     return true;
}
