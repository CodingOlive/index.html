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
// Use try-catch or ensure load order if circular dependencies become an issue
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
export function setCurrentUser(user) { /* ... */ }
export function setIsAdmin(status) { /* ... */ }
export function incrementAndGetModifierCount() { /* ... */ }

// --- Core State Functions ---
export function initializeCoreState() { /* ... */ }
export function gatherState() { /* ... */ }
export function applyState(state) { /* ... */ }


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
        if (!ALL_ENERGY_TYPES || !Array.isArray(ALL_ENERGY_TYPES)) {
            throw new Error("ALL_ENERGY_TYPES is missing or not an array.");
        }
        if (!ENERGY_TYPE_DETAILS || typeof ENERGY_TYPE_DETAILS !== 'object') {
             throw new Error("ENERGY_TYPE_DETAILS is missing or not an object.");
        }
        console.log(`DEBUG: Found ${ALL_ENERGY_TYPES.length} standard type IDs.`);

        standardTypes = ALL_ENERGY_TYPES.map(typeId => {
            if (!typeId || typeof typeId !== 'string') {
                console.error("DEBUG: Skipping invalid standard typeId:", typeId);
                return undefined; // Skip invalid entries
            }
            const details = ENERGY_TYPE_DETAILS[typeId]; // Get details object
             if (!details || typeof details !== 'object') {
                 console.warn(`DEBUG: Details missing for standard type ID: ${typeId}. Using defaults.`);
             }
            const name = details?.name || typeId.charAt(0).toUpperCase() + typeId.slice(1); // Default name
            // console.log(`DEBUG: Processing standard type: ${typeId} -> ${name}`); // Verbose log
            return {
                id: typeId, name: name,
                colorName: details?.color || null, hexColor: null, // Store Tailwind class name
                formula: null, isStandard: true, details: details || {} // Include details object
            };
        }).filter(Boolean); // Remove any undefined entries from map

        console.log(`DEBUG: Successfully processed ${standardTypes.length} standard types.`);
        if (standardTypes.length !== ALL_ENERGY_TYPES.length) {
             console.warn("DEBUG: Mismatch between ALL_ENERGY_TYPES count and processed standardTypes count.");
        }

    } catch (error) {
        console.error("DEBUG: CRITICAL Error processing standard energy types:", error);
        standardTypes = []; // Ensure it's empty on error
    }

    // 2. Load custom types from database
    try {
        console.log("DEBUG: Loading custom types...");
        const loadedCustom = await loadCustomEnergyTypes();
        console.log("DEBUG: Raw loaded custom types from DB:", JSON.stringify(loadedCustom));

        if (Array.isArray(loadedCustom)) {
             customTypes = loadedCustom.map(ct => {
                 if (!ct || typeof ct !== 'object' || !ct.id || !ct.name || !ct.color || !ct.formula) { // Stricter check
                     console.error("DEBUG: Skipping invalid custom type object from DB:", ct);
                     return undefined;
                 }
                 // console.log(`DEBUG: Processing custom type: ${ct.name}`); // Verbose log
                 return { ...ct, isStandard: false, details: null }; // Add standard flag
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
        // Ensure both inputs are definitely arrays before merging
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
         mergedEnergyTypes = []; // Reset on error
    }

    console.log(`DEBUG: state.js finished merging. Final mergedEnergyTypes length: ${mergedEnergyTypes.length}`);
    return true;
}
