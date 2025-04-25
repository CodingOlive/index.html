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
import { safeParseFloat, parseFormattedNumber, formatStatNumber, formatSimpleNumber } from './formatters.js';
import { addDynamicModifier, renderFormList, renderActiveFormsSection } from './dom-generators.js';
import { applyActiveFormEffects, handleRyokoCheckboxChange } from './forms.js';
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
export let isAdmin = false; // <-- NEW: Flag for admin status


// --- Core State Functions ---

export function initializeCoreState() {
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
    mergedEnergyTypes = [];
    isAdmin = false; // <-- Reset admin flag on logout/init
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
        // ... (all other state properties remain the same) ...
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
        activeView: calculatorState.activeView,
        kaiokenActive: kaiokenCheckbox?.checked || false,
        maxHealth: maxHealthInput?.value || '1000',
        kaiokenStrain: kaiokenStrainInput?.value || '10',
        currentHealth: currentHealthEl?.textContent || '0',
        sliderPercentages: {},
        energyPools: {},
        characterForms: characterForms,
        activeFormIds: calculatorState.activeFormIds,
        dynamicModifiers: [],
        activeAttacks: activeAttacks,
        totalDamageDealt: totalDamageDealt,
        totalEnergySpent: totalEnergySpent,
        attackCount: attackCount,
        highestDamage: highestDamage,
        // NOTE: We don't typically need to SAVE the isAdmin status,
        // it's determined on login based on the database.
    };

    // Gather Energy Pool Data
    ALL_ENERGY_TYPES.forEach(type => {
       const els = getEnergyElements(type);
       if (els) {
           state.energyPools[type] = {
               maxMultiplier: els.maxMultiplierEl?.value || '1',
               currentEnergy: els.currentEnergyEl?.textContent || '0',
               damagePerPower: els.damagePerPowerEl?.value || '1',
               regenPercent: els.regenPercentEl?.value || ''
           };
           state.sliderPercentages[type] = els.energySlider?.value || '0';
       }
    });

    // Gather Speed Slider Percentage
    const speedSlider = document.getElementById('speed-slider');
    state.speedSliderPercentage = speedSlider?.value || '0';

    // Gather Dynamic Modifiers
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
    // ... (Function content remains the same as before) ...
    // It restores state variables and DOM elements based on the loaded 'state' object.
    // It does NOT need to handle the 'isAdmin' flag, as that's set during login check.
    if (!state) { /* ... warning ... */ return; }
    console.log("Applying loaded state...");

    // --- 1. Restore Core State Variables ---
    characterForms = state.characterForms || [];
    calculatorState.activeFormIds = Array.isArray(state.activeFormIds) ? state.activeFormIds : [];
    calculatorState.activeView = state.activeView || 'calculator';
    activeAttacks = state.activeAttacks || {};
    totalDamageDealt = state.totalDamageDealt || 0;
    totalEnergySpent = state.totalEnergySpent || 0;
    attackCount = state.attackCount || 0;
    highestDamage = state.highestDamage || 0;

    // --- 2. Restore DOM Element Values ---
    if (baseDamageInput) baseDamageInput.value = state.baseDamage || '';
    if (attackCompressionPointsInput) attackCompressionPointsInput.value = state.attackCompressionPoints || '0';
    if (energyTypeSelect) energyTypeSelect.value = state.selectedEnergyType || 'ki';
    if (characterNameInput) characterNameInput.value = state.characterName || '';
    if (charBaseHealthInput) charBaseHealthInput.value = state.charBaseHealth || '';
    if (charBaseMultiplierInput) charBaseMultiplierInput.value = state.charBaseMultiplier || '1';
    if (charVitalityInput) charVitalityInput.value = state.charVitality || '';
    if (charSoulPowerInput) charSoulPowerInput.value = state.charSoulPower || '';
    if (charSoulHpInput) charSoulHpInput.value = state.charSoulHp || '';
    if (charBaseAcInput) charBaseAcInput.value = state.charBaseAc || '10';
    if (charBaseTrInput) charBaseTrInput.value = state.charBaseTr || '5';
    if (charSpeedInput) charSpeedInput.value = state.charSpeed || '';
    if (kaiokenCheckbox) kaiokenCheckbox.checked = state.kaiokenActive || false;
    if (maxHealthInput) maxHealthInput.value = state.maxHealth || '1000';
    if (kaiokenStrainInput) kaiokenStrainInput.value = state.kaiokenStrain || '10';
    if (currentHealthEl) {
        const savedHealthNum = parseFormattedNumber(state.currentHealth || '0');
        currentHealthEl.textContent = formatStatNumber(savedHealthNum);
    }
    if (ryokoCheckbox) ryokoCheckbox.checked = state.ryokoCheckboxState || false;
    if (ryokoEquationInput) ryokoEquationInput.value = state.ryokoEquationValue || '';
    handleRyokoCheckboxChange();

    // --- 3. Restore Dynamic Modifiers ---
    if (dynamicModifiersContainer) {
        dynamicModifiersContainer.innerHTML = '<h4 class="text-md font-semibold mb-2 text-gray-700">Additional Factors:</h4>';
        dynamicModifierCount = 0;
        if (state.dynamicModifiers && Array.isArray(state.dynamicModifiers)) {
            state.dynamicModifiers.forEach(modData => addDynamicModifier(modData));
        }
    }

    // --- 4. Restore Energy Pool Inputs (DPP, Regen %) ---
    if (state.energyPools) {
        ALL_ENERGY_TYPES.forEach(type => {
            const els = getEnergyElements(type);
            const poolData = state.energyPools[type];
            if (els && poolData) {
                if(els.damagePerPowerEl) els.damagePerPowerEl.value = poolData.damagePerPower || '1';
                if(els.regenPercentEl) els.regenPercentEl.value = poolData.regenPercent || '';
            }
        });
    }

    // --- 5. Update UI based on restored state ---
    renderFormList();
    renderActiveFormsSection();
    applyActiveFormEffects();

    // 5c. Restore CURRENT Energy *after* totals calculated
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
    if (state.sliderPercentages) {
        ALL_ENERGY_TYPES.forEach(type => {
            const els = getEnergyElements(type);
            if (els?.energySlider) {
                els.energySlider.value = state.sliderPercentages[type] || '0';
                 updateSingleSliderDisplay(type);
            }
            updateSliderVisibility(type);
        });
    }
    updateSpeedSliderVisibility();
    const speedSlider = document.getElementById('speed-slider');
    if (speedSlider && state.speedSliderPercentage) {
        speedSlider.value = state.speedSliderPercentage || '0';
    }
    updateSpeedSliderDisplay();

    // 5f. Update Kaioken UI
    if (kaiokenCheckbox?.checked && energyTypeSelect?.value === 'ki') {
        applyKaiokenStyle();
        updateCurrentHealthDisplay();
    } else {
        removeKaiokenStyle();
    }

    // 5g. Update final displays
    updateStatsDisplay();
    updateEquationDisplay();

    // 5h. Restore active view
    if (calculatorState.activeView === 'stats') {
        showCharacterStatsView();
    } else {
        showCalculatorView();
    }
    console.log("State application complete.");
}


/**
 * Loads custom energy types from the database, merges them with standard types,
 * and stores the result in the `mergedEnergyTypes` state variable.
 */
export async function initializeAndMergeEnergyTypes() {
    // ... (Function content remains the same) ...
    console.log("Initializing and merging energy types...");
    let standardTypes = [];
    let customTypes = [];
    try {
        standardTypes = ALL_ENERGY_TYPES.map(typeId => {
            const details = ENERGY_TYPE_DETAILS[typeId] || {};
            const color = details.color || 'gray-500';
            return { id: typeId, name: details.name || typeId.charAt(0).toUpperCase() + typeId.slice(1), colorName: details.color || null, hexColor: null, formula: null, isStandard: true, details: details };
        });
    } catch (error) { console.error("Error processing standard energy types:", error); }
    try {
        const loadedCustom = await loadCustomEnergyTypes();
        customTypes = loadedCustom.map(ct => ({ ...ct, isStandard: false, details: null }));
    } catch (error) { console.error("Failed to load or process custom energy types:", error); }
    mergedEnergyTypes = [...standardTypes, ...customTypes]; // Modifies exported variable
    console.log(`Merged energy types initialized. Total: ${mergedEnergyTypes.length} (Standard: ${standardTypes.length}, Custom: ${customTypes.length})`);
    return true;
}
