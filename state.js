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

export function gatherState() { /* ... Function content remains the same ... */ }
export function applyState(state) { /* ... Function content remains the same ... */ }


/**
 * Loads custom energy types from the database, merges them with standard types,
 * and stores the result in the `mergedEnergyTypes` state variable.
 */
export async function initializeAndMergeEnergyTypes() {
    console.log("DEBUG: Starting initializeAndMergeEnergyTypes...");
    let standardTypes = [];
    let customTypes = [];

    // 1. Format standard types from config
    try {
        console.log("DEBUG: Processing standard types...");
        if (!ALL_ENERGY_TYPES || !Array.isArray(ALL_ENERGY_TYPES)) { throw new Error("ALL_ENERGY_TYPES missing/invalid."); }
        if (!ENERGY_TYPE_DETAILS || typeof ENERGY_TYPE_DETAILS !== 'object') { throw new Error("ENERGY_TYPE_DETAILS missing/invalid."); }
        console.log(`DEBUG: Found ${ALL_ENERGY_TYPES.length} standard type IDs.`);

        standardTypes = ALL_ENERGY_TYPES.map(typeId => {
            if (!typeId || typeof typeId !== 'string') {
                console.error("DEBUG: Skipping invalid standard typeId:", typeId);
                return undefined;
            }
            const details = ENERGY_TYPE_DETAILS[typeId] || {}; // Get details or empty object
            const name = details.name || typeId.charAt(0).toUpperCase() + typeId.slice(1);
            // Create the object for standard type, ensuring 'id' is present
            return {
                id: typeId, // <<< Ensure 'id' property is set correctly
                name: name,
                colorName: details.color || null,
                hexColor: null, // Standard types use Tailwind classes via 'details'
                formula: null, // Standard types use hardcoded logic
                isStandard: true,
                details: details // Include the original details object
            };
        }).filter(Boolean); // Remove any undefined entries

        console.log(`DEBUG: Successfully processed ${standardTypes.length} standard types.`);

    } catch (error) {
        console.error("DEBUG: CRITICAL Error processing standard energy types:", error);
        standardTypes = [];
    }

    // 2. Load custom types from database
    try {
        console.log("DEBUG: Loading custom types...");
        const loadedCustom = await loadCustomEnergyTypes();
        console.log("DEBUG: Raw loaded custom types from DB:", JSON.stringify(loadedCustom));

        if (Array.isArray(loadedCustom)) {
             customTypes = loadedCustom.map(ct => {
                 // Ensure custom types have the required fields (id comes from Firebase key)
                 if (!ct || typeof ct !== 'object' || !ct.id || !ct.name || !ct.color || !ct.formula) {
                     console.error("DEBUG: Skipping invalid custom type object from DB:", ct);
                     return undefined;
                 }
                 return {
                     id: ct.id, // Firebase key
                     name: ct.name,
                     colorName: null, // Custom types use hex color
                     hexColor: ct.color, // Store the hex color
                     formula: ct.formula,
                     isStandard: false,
                     details: null // No pre-defined details object
                 };
             }).filter(Boolean);
             console.log(`DEBUG: Successfully processed ${customTypes.length} custom types.`);
        } else {
            console.warn("DEBUG: loadCustomEnergyTypes did not return an array. Assuming no custom types.");
            customTypes = [];
        }

    } catch (error) {
        console.error("DEBUG: CRITICAL Error loading or processing custom energy types:", error);
        customTypes = [];
    }

    // 3. Merge and store in state
    try {
        const finalStandard = Array.isArray(standardTypes) ? standardTypes : [];
        const finalCustom = Array.isArray(customTypes) ? customTypes : [];
        mergedEnergyTypes = [...finalStandard, ...finalCustom]; // Modify exported variable

        console.log(`DEBUG: Final mergedEnergyTypes array (Count: ${mergedEnergyTypes.length}):`, JSON.stringify(mergedEnergyTypes));
        if (mergedEnergyTypes.length === 0 && (finalStandard.length > 0 || finalCustom.length > 0)) {
             console.error("DEBUG: !!! Merge resulted in empty array despite having standard or custom types !!!");
        }
        if (mergedEnergyTypes.some(et => typeof et === 'undefined' || !et || !et.id)) {
            console.error("DEBUG: !!! Final mergedEnergyTypes array contains invalid elements !!!", mergedEnergyTypes.filter(et => typeof et === 'undefined' || !et || !et.id));
        }
    } catch (error) {
         console.error("DEBUG: CRITICAL Error during array merge:", error);
         mergedEnergyTypes = [];
    }

    console.log(`DEBUG: state.js finished merging. Final mergedEnergyTypes length: ${mergedEnergyTypes.length}`);
    return true;
}
