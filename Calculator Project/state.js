// state.js - Manages the application's state variables and save/load logic.

// --- Import Dependencies ---
// Import DOM Elements (Many needed for gather/apply)
import {
    // Inputs/Selects read by gatherState & written by applyState
    baseDamageInput, baseMultiplierInput, attackCompressionPointsInput,
    energyTypeSelect, characterNameInput, charBaseHealthInput,
    charBaseMultiplierInput, charVitalityInput, charSoulPowerInput,
    charSoulHpInput, charBaseAcInput, charBaseTrInput, charSpeedInput,
    ryokoCheckbox, ryokoEquationInput, kaiokenCheckbox, maxHealthInput,
    kaiokenStrainInput,
    // Spans written/read by applyState/gatherState
    currentHealthEl,
    // Containers read by gatherState / cleared by applyState
    dynamicModifiersContainer,
    // Elements potentially accessed indirectly via helpers
    formMultiplierInput // Read-only, set by applyActiveFormEffects
    // Specific energy pool/slider elements accessed via getEnergyElements
} from './dom-elements.js';

// Import Config
import { ALL_ENERGY_TYPES } from './config.js';

// Import Utilities & Formatters
import { safeParseFloat, parseFormattedNumber, formatStatNumber, formatSimpleNumber } from './formatters.js'; // Or split utils/formatters

// Import Functions from other modules called by applyState
import { addDynamicModifier, renderFormList, renderActiveFormsSection } from './dom-generators.js';
import { applyActiveFormEffects, handleRyokoCheckboxChange } from './forms.js'; // handleRyoko is called by applyState indirectly via character-stats? No, directly.
import { getEnergyElements } from './energy-pools.js'; // Helper to get pool/slider elements
import { updateSingleSliderDisplay } from './calculation.js';
import { updateSpeedSliderDisplay } from './speed-slider.js';
import {
    updateSliderVisibility, updateSpeedSliderVisibility,
    applyKaiokenStyle, removeKaiokenStyle, // For Kaioken state restore
    showCharacterStatsView, showCalculatorView, // For view restore
    updateStatsDisplay, // Called at end of applyState
    updateCurrentHealthDisplay // Called within applyState for Kaioken
} from './ui-updater.js';
import { updateEquationDisplay } from './equation.js'; // Called at end of applyState


// --- State Variables ---
export let currentUser = null;
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


// --- Core State Functions ---

export function initializeCoreState() {
    // ... (content remains the same) ...
    console.log("Initializing core state variables...");
    currentUser = null;
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
}


/**
 * Gathers the current state of the application from DOM elements and state variables.
 * @returns {object|null} A serializable object representing the application state, or null if required elements are missing.
 */
export function gatherState() {
    // Check if essential elements are loaded before proceeding
    if (!baseDamageInput || !energyTypeSelect /* add checks for other critical elements */) {
        console.error("Cannot gather state: Critical DOM elements not found.");
        return null;
    }

    const state = {
        // Read state from imported elements and variables
        baseDamage: baseDamageInput.value,
        baseMultiplier: baseMultiplierInput?.value || '1',
        attackCompressionPoints: attackCompressionPointsInput?.value || '0',
        selectedEnergyType: energyTypeSelect.value,
        characterName: characterNameInput?.value || '',
        charBaseHealth: charBaseHealthInput?.value || '',
        charBaseMultiplier: charBaseMultiplierInput?.value || '1',
        charVitality: charVitalityInput?.value || '',
        charSoulPower: charSoulPowerInput?.value || '',
        charSoulHp: charSoulHpInput?.value || '',
        charBaseAc: charBaseAcInput?.value || '10',
        charBaseTr: charBaseTrInput?.value || '5',
        charSpeed: charSpeedInput?.value || '',
        ryokoCheckboxState: ryokoCheckbox?.checked || false,
        ryokoEquationValue: ryokoEquationInput?.value || '',
        activeView: calculatorState.activeView, // Read from state object
        kaiokenActive: kaiokenCheckbox?.checked || false,
        maxHealth: maxHealthInput?.value || '1000',
        kaiokenStrain: kaiokenStrainInput?.value || '10',
        currentHealth: currentHealthEl?.textContent || '0', // Read display
        sliderPercentages: {},
        energyPools: {},
        characterForms: characterForms, // Read from state variable
        activeFormIds: calculatorState.activeFormIds, // Read from state object
        dynamicModifiers: [],
        activeAttacks: activeAttacks, // Read from state variable
        totalDamageDealt: totalDamageDealt, // Read from state variable
        totalEnergySpent: totalEnergySpent, // Read from state variable
        attackCount: attackCount, // Read from state variable
        highestDamage: highestDamage, // Read from state variable
    };

    // Gather Energy Pool Data using imported helper
    ALL_ENERGY_TYPES.forEach(type => {
       const els = getEnergyElements(type); // Use imported helper
       if (els) {
           state.energyPools[type] = {
               // Read directly from elements obtained via getEnergyElements
               maxMultiplier: els.maxMultiplierEl?.value || '1',
               currentEnergy: els.currentEnergyEl?.textContent || '0',
               damagePerPower: els.damagePerPowerEl?.value || '1',
               regenPercent: els.regenPercentEl?.value || ''
           };
           state.sliderPercentages[type] = els.energySlider?.value || '0';
       }
    });

    // Gather Speed Slider Percentage
    const speedSlider = document.getElementById('speed-slider'); // Still need direct lookup if not exported
    state.speedSliderPercentage = speedSlider?.value || '0';

    // Gather Dynamic Modifiers using imported container element
    dynamicModifiersContainer?.querySelectorAll('.dynamic-box').forEach(box => {
        const nameInput = box.querySelector('.modifier-name-input');
        const valueInput = box.querySelector('.modifier-value-input');
        const typeOption = box.querySelector('.modifier-type-option.active');
        if (nameInput && valueInput && typeOption) {
            state.dynamicModifiers.push({
                name: nameInput.value,
                value: valueInput.value,
                type: typeOption.dataset.value
            });
        }
    });

    console.log("State gathered:", state);
    return state;
}


/**
 * Applies a loaded state object to the application's state variables and UI.
 * @param {object} state - The state object to apply.
 */
export function applyState(state) {
    if (!state) { /* ... warning ... */ return; }
    console.log("Applying loaded state...");

    // --- 1. Restore Core State Variables ---
    // Modify imported 'let' variables
    characterForms = state.characterForms || [];
    calculatorState.activeFormIds = Array.isArray(state.activeFormIds) ? state.activeFormIds : [];
    calculatorState.activeView = state.activeView || 'calculator';
    activeAttacks = state.activeAttacks || {};
    totalDamageDealt = state.totalDamageDealt || 0;
    totalEnergySpent = state.totalEnergySpent || 0;
    attackCount = state.attackCount || 0;
    highestDamage = state.highestDamage || 0;
    // dynamicModifierCount is reset when adding modifiers

    // --- 2. Restore DOM Element Values ---
    // Uses imported elements
    if (baseDamageInput) baseDamageInput.value = state.baseDamage || '';
    if (attackCompressionPointsInput) attackCompressionPointsInput.value = state.attackCompressionPoints || '0';
    if (energyTypeSelect) energyTypeSelect.value = state.selectedEnergyType || 'ki';
    // Character Stats
    if (characterNameInput) characterNameInput.value = state.characterName || '';
    if (charBaseHealthInput) charBaseHealthInput.value = state.charBaseHealth || '';
    // NOTE: charBaseMultiplierInput is set by Ryoko handler or applyActiveFormEffects indirectly
    if (charVitalityInput) charVitalityInput.value = state.charVitality || '';
    if (charSoulPowerInput) charSoulPowerInput.value = state.charSoulPower || '';
    if (charSoulHpInput) charSoulHpInput.value = state.charSoulHp || '';
    if (charBaseAcInput) charBaseAcInput.value = state.charBaseAc || '10';
    if (charBaseTrInput) charBaseTrInput.value = state.charBaseTr || '5';
    if (charSpeedInput) charSpeedInput.value = state.charSpeed || '';
    // Kaioken
    if (kaiokenCheckbox) kaiokenCheckbox.checked = state.kaiokenActive || false;
    if (maxHealthInput) maxHealthInput.value = state.maxHealth || '1000';
    if (kaiokenStrainInput) kaiokenStrainInput.value = state.kaiokenStrain || '10';
    if (currentHealthEl) { // Restore current health value
        const savedHealthNum = parseFormattedNumber(state.currentHealth || '0'); // Use formatter
        currentHealthEl.textContent = formatStatNumber(savedHealthNum); // Use formatter
    }
    // Ryoko
    if (ryokoCheckbox) ryokoCheckbox.checked = state.ryokoCheckboxState || false;
    if (ryokoEquationInput) ryokoEquationInput.value = state.ryokoEquationValue || '';
    // Call Ryoko handler to apply readonly/visibility and potentially evaluate
    // handleRyokoCheckboxChange(); // TODO: Import from character-stats.js (if not already done)


    // --- 3. Restore Dynamic Modifiers ---
    // Uses imported container and generator function
    if (dynamicModifiersContainer) {
        dynamicModifiersContainer.innerHTML = '<h4 class="text-md font-semibold mb-2 text-gray-700">Additional Factors:</h4>'; // Clear existing
        dynamicModifierCount = 0; // Reset counter before adding loaded ones
        if (state.dynamicModifiers && Array.isArray(state.dynamicModifiers)) {
            state.dynamicModifiers.forEach(modData => addDynamicModifier(modData)); // Uses imported function
        }
    }

    // --- 4. Restore Energy Pool Inputs (DPP, Regen %) ---
    // Uses imported config and helper
    if (state.energyPools) {
        ALL_ENERGY_TYPES.forEach(type => {
            const els = getEnergyElements(type); // Use imported helper
            const poolData = state.energyPools[type];
            if (els && poolData) {
                if(els.damagePerPowerEl) els.damagePerPowerEl.value = poolData.damagePerPower || '1';
                if(els.regenPercentEl) els.regenPercentEl.value = poolData.regenPercent || '';
                // Current energy is restored later after totals are calculated
            }
        });
    }

    // --- 5. Update UI based on restored state (Order Matters!) ---

    // 5a. Render form lists based on restored characterForms
    renderFormList(); // Uses imported generator
    renderActiveFormsSection(); // Uses imported generator

    // 5b. Apply combined form effects (reads restored activeFormIds, sets multipliers, recalculates pools)
    applyActiveFormEffects(); // Uses imported function

    // 5c. Restore CURRENT Energy *after* totals have been recalculated by applyActiveFormEffects
    // Uses imported config, helper, formatters
    if (state.energyPools) {
        ALL_ENERGY_TYPES.forEach(type => {
            const els = getEnergyElements(type);
            const poolData = state.energyPools[type];
            if (els?.currentEnergyEl && poolData) {
                const savedCurrentNum = parseFormattedNumber(poolData.currentEnergy || '0');
                const currentTotal = parseFormattedNumber(els.totalEnergyEl?.textContent || '0');
                els.currentEnergyEl.textContent = formatStatNumber(Math.max(0, Math.min(savedCurrentNum, currentTotal)));
            }
        });
    }

    // 5d. Restore slider percentages & update displays
    // Uses imported config, helpers, UI/Calc functions
    if (state.sliderPercentages) {
        ALL_ENERGY_TYPES.forEach(type => {
            const els = getEnergyElements(type);
            if (els?.energySlider) {
                els.energySlider.value = state.sliderPercentages[type] || '0';
                 updateSingleSliderDisplay(type); // Use imported function
            }
            updateSliderVisibility(type); // Use imported function
        });
    }
    // Restore Speed Slider percentage & Update display
    updateSpeedSliderVisibility(); // Ensure slider exists/visible if needed // Uses imported function
    const speedSlider = document.getElementById('speed-slider'); // Direct lookup ok
    if (speedSlider && state.speedSliderPercentage) {
        speedSlider.value = state.speedSliderPercentage || '0';
    }
    updateSpeedSliderDisplay(); // Use imported function

    // 5e. Update attack button states & slider gradients for focused type
    // Uses imported UI functions and element
    // updateAttackButtonStates(energyTypeSelect.value); // This should be imported and called
    // ALL_ENERGY_TYPES.forEach(type => { updateSliderLimitAndStyle(type); }); // This should be imported and called


    // 5f. Update Kaioken UI (styles, health display - redundant if applyActive handles it?)
    // Uses imported UI functions and elements
    if (kaiokenCheckbox?.checked && energyTypeSelect?.value === 'ki') {
        applyKaiokenStyle();
        updateCurrentHealthDisplay(); // Ensure health display reflects loaded state correctly
    } else {
        removeKaiokenStyle();
    }

    // 5g. Update final displays: stats panel and equation
    updateStatsDisplay(); // Use imported function
    updateEquationDisplay(); // Use imported function

    // 5h. Restore active view
    // Uses imported UI functions
    if (calculatorState.activeView === 'stats') {
        showCharacterStatsView();
    } else {
        showCalculatorView();
    }

    console.log("State application complete.");
}