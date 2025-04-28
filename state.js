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
export let mergedEnergyTypes = []; // This should be populated by initializeAndMergeEnergyTypes


// --- State Setter Functions ---
export function setCurrentUser(user) { currentUser = user; }
export function setIsAdmin(status) { isAdmin = status; }

// --- Core State Functions ---
export function initializeCoreState() {
    console.log("STATE: Initializing core state variables...");
    setCurrentUser(null);
    setIsAdmin(false);
    totalDamageDealt = 0; totalEnergySpent = 0; attackCount = 0; highestDamage = 0;
    dynamicModifierCount = 0; characterForms = [];
    calculatorState = { activeFormIds: [], appliedAcBonus: 0, appliedTrueResistanceBonus: 0, activeView: 'calculator' };
    activeAttacks = {};
    mergedEnergyTypes = []; // Reset merged types
}

export function gatherState() { /* ... Function remains the same ... */ }
export function applyState(state) { /* ... Function remains the same ... */ }


/**
 * Loads custom energy types from the database, merges them with standard types,
 * and stores the result in the `mergedEnergyTypes` state variable.
 */
export async function initializeAndMergeEnergyTypes() {
    console.log("STATE: Starting initializeAndMergeEnergyTypes...");
    let standardTypes = [];
    let customTypes = [];

    // 1. Format standard types from config
    try {
        if (!Array.isArray(ALL_ENERGY_TYPES) || !ENERGY_TYPE_DETAILS) {
            console.error("STATE: Standard energy config data is missing or invalid!");
            standardTypes = [];
        } else {
            standardTypes = ALL_ENERGY_TYPES.map(typeId => {
                if (!typeId || typeof typeId !== 'string') {
                    console.error("STATE: Invalid typeId found in ALL_ENERGY_TYPES:", typeId);
                    return null; // Return null for invalid entries
                }
                const details = ENERGY_TYPE_DETAILS[typeId] || {};
                return {
                    id: typeId,
                    name: details.name || typeId.charAt(0).toUpperCase() + typeId.slice(1),
                    colorName: details.color || null,
                    hexColor: null, // Placeholder - resolving Tailwind names to hex is complex here
                    formula: null,
                    isStandard: true,
                    details: details
                };
            }).filter(type => type !== null); // Filter out any nulls created from invalid IDs
        }
        console.log(`STATE: Processed ${standardTypes.length} standard types.`);
        // console.log("STATE_DEBUG: Standard Types:", JSON.stringify(standardTypes)); // Verbose log
    } catch (error) {
        console.error("STATE: Error processing standard energy types:", error);
        standardTypes = []; // Ensure it's empty on error
    }

    // 2. Load custom types from database
    try {
        const loadedCustom = await loadCustomEnergyTypes(); // Use imported function
        console.log("STATE: Loaded custom types from DB:", loadedCustom);

        if (Array.isArray(loadedCustom)) {
             customTypes = loadedCustom.map(ct => {
                 // Validate essential custom type properties
                 if (!ct || typeof ct !== 'object' || !ct.id || !ct.name || !ct.color || !ct.formula) {
                     console.error("STATE: Invalid custom type object loaded from DB:", ct);
                     return null; // Return null for invalid entries
                 }
                 return {
                    id: ct.id, // Firebase key
                    name: ct.name,
                    colorName: null, // Custom types use hexColor
                    hexColor: ct.color, // Store the hex color directly
                    formula: ct.formula,
                    isStandard: false,
                    details: null
                 };
             }).filter(type => type !== null); // Filter out any nulls from invalid data
        } else {
            console.error("STATE: loadCustomEnergyTypes did not return an array:", loadedCustom);
            customTypes = [];
        }
        console.log(`STATE: Processed ${customTypes.length} valid custom types.`);
        // console.log("STATE_DEBUG: Custom Types:", JSON.stringify(customTypes)); // Verbose log

    } catch (error) {
        console.error("STATE: Failed to load or process custom energy types:", error);
        customTypes = []; // Ensure it's empty on error
    }

    // 3. Merge and store in state
    try {
        // Modify the exported 'let' variable
        mergedEnergyTypes = [...standardTypes, ...customTypes];
        console.log(`STATE: Final mergedEnergyTypes count: ${mergedEnergyTypes.length}`);
        // Final check for any undefined/null entries
        if (mergedEnergyTypes.some(et => et === null || typeof et === 'undefined')) {
            console.error("STATE: !!! Final mergedEnergyTypes array contains null or undefined elements !!!");
            mergedEnergyTypes = mergedEnergyTypes.filter(et => et !== null && typeof et !== 'undefined'); // Attempt cleanup
            console.log(`STATE: Cleaned mergedEnergyTypes count: ${mergedEnergyTypes.length}`);
        }
        // console.log("STATE_DEBUG: Final Merged Data:", JSON.stringify(mergedEnergyTypes)); // Verbose log
    } catch (error) {
         console.error("STATE: Error during array merge:", error);
         mergedEnergyTypes = []; // Reset on error
    }
    console.log("STATE: Finished initializeAndMergeEnergyTypes.");
    return true;
}
