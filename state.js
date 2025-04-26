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
export let mergedEnergyTypes = [];


// --- State Setter Functions ---
export function setCurrentUser(user) { /* ... */ }
export function setIsAdmin(status) { /* ... */ }

// --- Core State Functions ---
export function initializeCoreState() { /* ... */ }
export function gatherState() { /* ... */ }
export function applyState(state) { /* ... */ }


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
        // Ensure config data is loaded correctly
        console.log("DEBUG: ALL_ENERGY_TYPES:", ALL_ENERGY_TYPES); // DEBUG
        console.log("DEBUG: ENERGY_TYPE_DETAILS:", ENERGY_TYPE_DETAILS); // DEBUG

        standardTypes = ALL_ENERGY_TYPES.map(typeId => {
            if (!typeId) { // DEBUG Check for undefined/null typeId
                console.error("DEBUG: Found undefined/null typeId in ALL_ENERGY_TYPES!");
                return undefined; // Explicitly return undefined if ID is bad
            }
            const details = ENERGY_TYPE_DETAILS[typeId] || {};
            // Create the object for standard type
            const standardTypeObject = {
                id: typeId,
                name: details.name || typeId.charAt(0).toUpperCase() + typeId.slice(1),
                colorName: details.color || null,
                hexColor: null, // Placeholder
                formula: null,
                isStandard: true,
                details: details
            };
            // console.log("DEBUG: Processed standard type:", standardTypeObject); // DEBUG (can be verbose)
            return standardTypeObject;
        }).filter(Boolean); // Filter out any potential undefined results from the map

        console.log("DEBUG: Processed standardTypes array:", standardTypes); // DEBUG

    } catch (error) {
        console.error("DEBUG: Error processing standard energy types:", error);
    }

    // 2. Load custom types from database
    try {
        const loadedCustom = await loadCustomEnergyTypes(); // Use imported function
        console.log("DEBUG: Loaded custom types from DB:", loadedCustom); // DEBUG

        // Ensure loadedCustom is an array before mapping
        if (Array.isArray(loadedCustom)) {
             customTypes = loadedCustom.map(ct => {
                 if (!ct || typeof ct !== 'object' || !ct.id) { // DEBUG Check for invalid custom type objects
                     console.error("DEBUG: Found invalid custom type object:", ct);
                     return undefined;
                 }
                 return { ...ct, isStandard: false, details: null };
             }).filter(Boolean); // Filter out potential undefined results
        } else {
            console.error("DEBUG: loadCustomEnergyTypes did not return an array:", loadedCustom);
            customTypes = [];
        }
        console.log("DEBUG: Processed customTypes array:", customTypes); // DEBUG

    } catch (error) {
        console.error("DEBUG: Failed to load or process custom energy types:", error);
        customTypes = []; // Ensure it's an empty array on error
    }

    // 3. Merge and store in state
    try {
        mergedEnergyTypes = [...standardTypes, ...customTypes]; // Modifies exported variable
        console.log("DEBUG: Final mergedEnergyTypes array:", mergedEnergyTypes); // DEBUG
        // Check for undefined elements in the final array
        if (mergedEnergyTypes.some(et => typeof et === 'undefined')) {
            console.error("DEBUG: !!! Final mergedEnergyTypes array contains undefined elements !!!");
        }
    } catch (error) {
         console.error("DEBUG: Error during array merge:", error);
         mergedEnergyTypes = []; // Reset on error
    }


    console.log(`Merged energy types initialized. Total: ${mergedEnergyTypes.length} (Standard: ${standardTypes.length}, Custom: ${customTypes.length})`);
    return true;
}
