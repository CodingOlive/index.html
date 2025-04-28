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
import { showMessage } from './ui-feedback.js';

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
// --- The Function Definition ---
export async function initializeAndMergeEnergyTypes() { // Or initialize... ensure case matches call site
    console.log("STATE: Starting InitializeAndMergeEnergyTypes...");
    let standardTypes = [];
    let customTypes = [];

    // 1. Format standard types from config
    try {
        if (!Array.isArray(ALL_ENERGY_TYPES) || !ENERGY_TYPE_DETAILS) {
            console.error("STATE: Standard energy config data is missing or invalid!");
            standardTypes = [];
        } else {
            standardTypes = ALL_ENERGY_TYPES.map(typeId => {
                // Create a standard type object structure
                return {
                    id: typeId,
                    name: ENERGY_TYPE_DETAILS[typeId]?.name || typeId, // Get name from details or use ID
                    color: null, // Standard types use CSS classes, not specific colors here
                    formula: null, // Standard types use hardcoded formulas elsewhere
                    isStandard: true,
                    details: ENERGY_TYPE_DETAILS[typeId] || {} // Include details for styling etc.
                };
            });
        }
        console.log("STATE: Standard types processed:", standardTypes); // <--- DEBUG LOG
    } catch (e) {
        console.error("STATE: Error processing standard types", e);
        showMessage("Error loading standard energy types.", "error");
        standardTypes = []; // Ensure it's empty on error
    }

    // 2. Load custom types from database
    try {
        customTypes = await loadCustomEnergyTypes(); // Call the async function from database.js
        // Add isStandard flag to custom types
        customTypes = customTypes.map(type => ({ ...type, isStandard: false, details: null }));
        console.log("STATE: Custom types loaded from DB:", customTypes); // <--- DEBUG LOG
    } catch (e) {
        console.error("STATE: Error loading custom energy types from database", e);
        showMessage("Failed to load custom energy types from database.", "error");
        customTypes = []; // Ensure it's empty on error
    }

    // 3. Merge standard and custom types
    try {
        // Combine arrays
        const finalMergedList = [...standardTypes, ...customTypes];

        // Assign the final list to the exported state variable
        // IMPORTANT: This assumes 'mergedEnergyTypes' is exported as 'let' from this file
        mergedEnergyTypes = finalMergedList;

        console.log("STATE: Final mergedEnergyTypes:", mergedEnergyTypes); // <--- DEBUG LOG

    } catch (e) {
        console.error("STATE: Error merging energy types", e);
        showMessage("Error processing energy type data.", "error");
        mergedEnergyTypes = [...standardTypes]; // Fallback to standard types maybe? Or empty?
    }

    console.log("STATE: Finished InitializeAndMergeEnergyTypes."); // <--- DEBUG LOG
}
