// state.js - Manages the application's state variables and save/load logic.

// --- Import Dependencies ---
import {
    baseDamageInput, baseMultiplierInput, attackCompressionPointsInput,
    energyTypeSelect, characterNameInput, charBaseHealthInput,
    charBaseMultiplierInput, charVitalityInput, charSoulPowerInput,
    charSoulHpInput, charBaseAcInput, charBaseTrInput, charSpeedInput,
    ryokoCheckbox, ryokoEquationInput, kaiokenCheckbox, maxHealthInput,
    kaiokenStrainInput, currentHealthEl, dynamicModifiersContainer,
    formMultiplierInput
} from './dom-elements.js';
import { ALL_ENERGY_TYPES, ENERGY_TYPE_DETAILS } from './config.js';
import { parseFormattedNumber, formatStatNumber, formatSimpleNumber } from './formatters.js';
import { safeParseFloat } from './utils.js';
// Import functions needed by applyState (defer if circular dependency occurs)
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
export let dynamicModifierCount = 0;
export let characterForms = [];
export let calculatorState = {
    activeFormIds: [],
    appliedAcBonus: 0,
    appliedTrueResistanceBonus: 0,
    activeView: 'calculator'
};
export let activeAttacks = {};
export let mergedEnergyTypes = []; // This should be populated by initializeAndMergeEnergyTypes


// --- State Setter Functions ---
export function setCurrentUser(user) {
    console.log("Setting currentUser state:", user ? user.uid : null);
    currentUser = user;
}
export function setIsAdmin(status) {
     console.log("Setting isAdmin state:", status);
    isAdmin = status;
}
export function incrementAndGetModifierCount() {
    dynamicModifierCount++;
    console.log("DEBUG: Incremented dynamicModifierCount to:", dynamicModifierCount);
    return dynamicModifierCount;
}

// --- Core State Functions ---
export function initializeCoreState() {
    console.log("Initializing core state variables...");
    setCurrentUser(null);
    setIsAdmin(false);
    totalDamageDealt = 0;
    totalEnergySpent = 0;
    attackCount = 0;
    highestDamage = 0;
    dynamicModifierCount = 0;
    characterForms = [];
    calculatorState = { /* reset object */ };
    activeAttacks = {};
    mergedEnergyTypes = []; // Reset merged types on core state reset
}

export function gatherState() { /* ... Function remains the same ... */ }
export function applyState(state) { /* ... Function remains the same ... */ }


/**
 * Loads custom energy types from the database, merges them with standard types,
 * and stores the result in the `mergedEnergyTypes` state variable.
 */
export async function initializeAndMergeEnergyTypes() {
    console.log("DEBUG: Starting initializeAndMergeEnergyTypes..."); // DEBUG
    let standardTypes = [];
    let customTypes = [];

    // 1. Format standard types from config
    try {
        console.log("DEBUG: Standard ALL_ENERGY_TYPES:", JSON.stringify(ALL_ENERGY_TYPES)); // DEBUG
        console.log("DEBUG: Standard ENERGY_TYPE_DETAILS:", ENERGY_TYPE_DETAILS ? 'Exists' : 'MISSING!'); // DEBUG

        if (!ALL_ENERGY_TYPES || !Array.isArray(ALL_ENERGY_TYPES) || !ENERGY_TYPE_DETAILS) {
            throw new Error("Standard energy type configuration is missing or invalid.");
        }

        standardTypes = ALL_ENERGY_TYPES.map(typeId => {
            if (!typeId || typeof typeId !== 'string') {
                console.error("DEBUG: Found invalid typeId in ALL_ENERGY_TYPES:", typeId);
                return undefined;
            }
            const details = ENERGY_TYPE_DETAILS[typeId] || {};
            const standardTypeObject = {
                id: typeId,
                name: details.name || typeId.charAt(0).toUpperCase() + typeId.slice(1),
                colorName: details.color || null,
                hexColor: null,
                formula: null,
                isStandard: true,
                details: details
            };
            return standardTypeObject;
        }).filter(Boolean); // Remove any undefined entries

        console.log(`DEBUG: Processed standardTypes array (Count: ${standardTypes.length}):`, JSON.stringify(standardTypes)); // DEBUG

    } catch (error) {
        console.error("DEBUG: Error processing standard energy types:", error);
        standardTypes = []; // Ensure it's empty on error
    }

    // 2. Load custom types from database
    try {
        const loadedCustom = await loadCustomEnergyTypes(); // Use imported function
        console.log("DEBUG: Loaded custom types from DB:", JSON.stringify(loadedCustom)); // DEBUG

        if (Array.isArray(loadedCustom)) {
             customTypes = loadedCustom.map(ct => {
                 if (!ct || typeof ct !== 'object' || !ct.id) {
                     console.error("DEBUG: Found invalid custom type object from DB:", ct);
                     return undefined;
                 }
                 return { ...ct, isStandard: false, details: null };
             }).filter(Boolean);
        } else {
            console.error("DEBUG: loadCustomEnergyTypes did not return an array:", loadedCustom);
            customTypes = [];
        }
        console.log(`DEBUG: Processed customTypes array (Count: ${customTypes.length}):`, JSON.stringify(customTypes)); // DEBUG

    } catch (error) {
        console.error("DEBUG: Failed to load or process custom energy types:", error);
        customTypes = [];
    }

    // 3. Merge and store in state
    try {
        mergedEnergyTypes = [...standardTypes, ...customTypes]; // Modify exported variable
        console.log(`DEBUG: Final mergedEnergyTypes array (Count: ${mergedEnergyTypes.length}):`, JSON.stringify(mergedEnergyTypes)); // DEBUG
        if (mergedEnergyTypes.some(et => typeof et === 'undefined')) {
            console.error("DEBUG: !!! Final mergedEnergyTypes array contains undefined elements !!!");
        }
    } catch (error) {
         console.error("DEBUG: Error during array merge:", error);
         mergedEnergyTypes = [];
    }

    console.log(`DEBUG: state.js finished merging. Final mergedEnergyTypes length: ${mergedEnergyTypes.length}`);
    return true;
}

