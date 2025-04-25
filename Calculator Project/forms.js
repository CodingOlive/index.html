// forms.js - Logic for managing character forms (creation, deletion, activation, effects).

// --- Import Dependencies ---
// Import DOM Elements
import {
    formNameInput, formEnergyTypeSelect, formFormMultiplierInput, formPoolMaxMultiplierInput,
    formAffectsResistancesCheckbox, formResistanceBonusInputsDiv, formAcBonusInput,
    formTrueResistanceBonusInput, formEnableFormBuffCheckbox, formFormBuffValueInput,
    formFormBuffTypeSelect, formEnablePoolBuffCheckbox, formPoolBuffValueInput, formPoolBuffTypeSelect,
    formMultiplierInput // Main display input for combined form multiplier
    // Energy pool maxMultiplier inputs are accessed via getElementById within applyActiveFormEffects for now
} from './dom-elements.js';

// Import State (needs mutable access)
import {
    characterForms, // Array of form objects
    calculatorState // Holds activeFormIds, appliedAcBonus, appliedTrueResistanceBonus
} from './state.js';

// Import Config
import { ALL_ENERGY_TYPES } from './config.js'; // For applyActiveFormEffects loop

// Import Utilities & Formatters
import { safeParseFloat, formatSimpleNumber } from './formatters.js'; // Assuming safeParseFloat is also here
import { triggerAnimation } from './utils.js';

// Import UI / Calculation / Generator Functions
import { showMessage } from './ui-feedback.js';
import { renderFormList, renderActiveFormsSection } from './dom-generators.js';
import { updateStatsDisplay } from './ui-updater.js';
import { calculateAndResetEnergy } from './energy-pools.js';
import { updateEquationDisplay } from './equation.js';


// --- Form System Functions ---

/**
 * Handles the click event for the "Add This Form" button.
 * Reads creator inputs, validates, creates form object, updates state, and resets inputs.
 */
export function handleAddForm() {
    // Uses imported elements, state, functions directly
    const formName = formNameInput?.value.trim();
    const energyType = formEnergyTypeSelect?.value;
    const affectsResistances = formAffectsResistancesCheckbox?.checked;

    if (!formName) {
        showMessage("Please enter a Form Name.", 'error'); // Uses imported function
        return;
    }
    // Uses imported characterForms state array
    if (characterForms.some(form => form.name.toLowerCase() === formName.toLowerCase())) {
        showMessage(`A form named "${formName}" already exists. Please use a unique name.`, 'error'); // Uses imported function
        return;
    }

    // Uses imported DOM elements and utils
    const enableFormBuff = formEnableFormBuffCheckbox?.checked || false;
    const formBuffValue = safeParseFloat(formFormBuffValueInput?.value, 0);
    const formBuffType = formFormBuffTypeSelect?.value || 'add';
    const enablePoolBuff = formEnablePoolBuffCheckbox?.checked || false;
    const poolBuffValue = safeParseFloat(formPoolBuffValueInput?.value, 0);
    const poolBuffType = formPoolBuffTypeSelect?.value || 'add';

    const newForm = {
        id: `form_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        name: formName,
        formMultiplier: safeParseFloat(formFormMultiplierInput?.value, 1),
        poolMaxMultiplier: safeParseFloat(formPoolMaxMultiplierInput?.value, 1),
        energyType: energyType,
        affectsResistances: affectsResistances,
        acBonus: affectsResistances ? safeParseFloat(formAcBonusInput?.value, 0) : 0,
        trueResistanceBonus: affectsResistances ? safeParseFloat(formTrueResistanceBonusInput?.value, 0) : 0,
        enableFormBuff: enableFormBuff,
        formBuffValue: formBuffValue,
        formBuffType: formBuffType,
        enablePoolBuff: enablePoolBuff,
        poolBuffValue: poolBuffValue,
        poolBuffType: poolBuffType
    };

    // Modifies imported state array
    characterForms.push(newForm);
    console.log("Form Added:", newForm);
    showMessage(`Form "${newForm.name}" added!`, 'success'); // Uses imported function

    // Uses imported generator functions
    renderFormList();
    renderActiveFormsSection();

    // Reset Form Creator fields (uses imported DOM elements)
    if(formNameInput) formNameInput.value = '';
    if(formEnergyTypeSelect) formEnergyTypeSelect.value = 'None';
    if(formFormMultiplierInput) formFormMultiplierInput.value = 1;
    if(formPoolMaxMultiplierInput) formPoolMaxMultiplierInput.value = 1;
    if(formAffectsResistancesCheckbox) formAffectsResistancesCheckbox.checked = false;
    if(formResistanceBonusInputsDiv) formResistanceBonusInputsDiv.classList.add('hidden');
    if(formAcBonusInput) formAcBonusInput.value = 0;
    if(formTrueResistanceBonusInput) formTrueResistanceBonusInput.value = 0;
    if(formEnableFormBuffCheckbox) formEnableFormBuffCheckbox.checked = false;
    if(formFormBuffValueInput) formFormBuffValueInput.value = 0;
    if(formFormBuffTypeSelect) formFormBuffTypeSelect.value = 'add';
    if(formEnablePoolBuffCheckbox) formEnablePoolBuffCheckbox.checked = false;
    if(formPoolBuffValueInput) formPoolBuffValueInput.value = 0;
    if(formPoolBuffTypeSelect) formPoolBuffTypeSelect.value = 'add';
}

/**
 * Handles clicking the delete button (X) next to a form in the Stats Panel list.
 * @param {Event} event - The click event object.
 */
export function handleDeleteFormClick(event) {
    // Uses imported state and functions
    const deleteButton = event.target.closest('.delete-form-btn');
    if (!deleteButton || !deleteButton.dataset.formId) { return; }

    const formIdToDelete = deleteButton.dataset.formId;
    const formToDelete = characterForms.find(form => form.id === formIdToDelete);
    if (!formToDelete) { /* ... error handling ... */ return; }

    if (confirm(`Are you sure you want to delete the form "${formToDelete.name}"? This cannot be undone.`)) {
        const formIndex = characterForms.findIndex(form => form.id === formIdToDelete);
        if (formIndex > -1) {
            characterForms.splice(formIndex, 1); // Modifies imported state
            if (Array.isArray(calculatorState.activeFormIds)) {
                calculatorState.activeFormIds = calculatorState.activeFormIds.filter(id => id !== formIdToDelete); // Modifies imported state
            }
            renderFormList(); // Calls imported function
            renderActiveFormsSection(); // Calls imported function
            applyActiveFormEffects(); // Calls function below
            updateEquationDisplay(); // Calls imported function
            showMessage(`Form "${formToDelete.name}" deleted successfully.`, 'success'); // Calls imported function
        } else { /* ... error handling ... */ }
    }
}

/**
 * Handles changes to the checkboxes in the "Active Forms" section.
 * Updates the activeFormIds in the calculatorState.
 * @param {Event} event - The change event object from the checkbox.
 */
export function handleActiveFormChange(event) {
    // Uses imported state and functions
    const checkbox = event.target;
    const formId = checkbox.value;
    const isChecked = checkbox.checked;

    if (!Array.isArray(calculatorState.activeFormIds)) {
        calculatorState.activeFormIds = [];
    }
    if (isChecked) {
        if (!calculatorState.activeFormIds.includes(formId)) {
            calculatorState.activeFormIds.push(formId); // Modifies imported state
        }
    } else {
        calculatorState.activeFormIds = calculatorState.activeFormIds.filter(id => id !== formId); // Modifies imported state
    }
    console.log("Active Form IDs changed:", calculatorState.activeFormIds);

    applyActiveFormEffects(); // Calls function below
    updateEquationDisplay(); // Calls imported function
}

/**
 * Calculates and applies the combined effects of currently active forms.
 * Uses **SUM** for main form multiplier stacking.
 * Updates the main form multiplier input, individual pool max multipliers,
 * AC/TR bonuses in the state, and triggers dependent UI/calculation updates.
 */
export function applyActiveFormEffects() {
    // Uses imported state, config, elements, utils, formatters, functions
    console.log("Applying active form effects (Sum Stacking)...");

    let combinedFormMultiplierSum = 0; // Initialize SUM at 0
    let combinedPoolMultipliers = {};
    let combinedAcBonus = 0;
    let combinedTrBonus = 0;

    ALL_ENERGY_TYPES.forEach(type => { combinedPoolMultipliers[type] = 1; });
    const activeIds = calculatorState.activeFormIds || [];

    activeIds.forEach(formId => {
        const form = characterForms.find(f => f.id === formId);
        if (form) {
            // --- SUM Stacking Logic ---
            combinedFormMultiplierSum += form.formMultiplier;
            // --- End SUM Stacking Logic ---

            // AC/TR/Pool logic remains the same
            if (form.affectsResistances) {
                combinedAcBonus += form.acBonus;
                combinedTrBonus += form.trueResistanceBonus;
            }
            const targetType = form.energyType;
            if (targetType === 'None') {
                ALL_ENERGY_TYPES.forEach(energyType => {
                    combinedPoolMultipliers[energyType] = Math.max(combinedPoolMultipliers[energyType] || 1, form.poolMaxMultiplier);
                });
            } else if (ALL_ENERGY_TYPES.includes(targetType)) {
                combinedPoolMultipliers[targetType] = Math.max(combinedPoolMultipliers[targetType] || 1, form.poolMaxMultiplier);
            }
        } else { console.warn(`Form object not found for ID: ${formId}`); }
    });

    // Calculate the final multiplier: Use the Sum, default to 1
    const finalCombinedMultiplier = Math.max(1, combinedFormMultiplierSum);

    // Apply the FINAL combined Form Multiplier to the main input
    if (formMultiplierInput) {
        const currentVal = safeParseFloat(formMultiplierInput.value);
        const newVal = safeParseFloat(finalCombinedMultiplier);
        if (currentVal !== newVal) {
            formMultiplierInput.value = formatSimpleNumber(newVal);
            triggerAnimation(formMultiplierInput, 'pulse-source');
            console.log("Applied SUM combined Form Multiplier:", newVal);
        }
    }

    // Store applied resistance bonuses in state
    calculatorState.appliedAcBonus = combinedAcBonus;
    calculatorState.appliedTrueResistanceBonus = combinedTrBonus;

    // Apply Pool Max Multipliers & Recalculate Energy
    ALL_ENERGY_TYPES.forEach(type => {
        const maxMultiplierEl = document.getElementById(`${type}-max-multiplier`);
        if (maxMultiplierEl) {
            const applicableMultiplier = combinedPoolMultipliers[type] || 1;
            const currentPoolMultVal = safeParseFloat(maxMultiplierEl.value);
            const newPoolMultVal = safeParseFloat(applicableMultiplier);
            if (currentPoolMultVal !== newPoolMultVal) {
                maxMultiplierEl.value = formatSimpleNumber(newPoolMultVal);
                calculateAndResetEnergy(type); // Use imported function
                triggerAnimation(maxMultiplierEl, 'pulse-source'); // Use imported function
            } else {
                calculateAndResetEnergy(type); // Still recalculate, use imported function
            }
        }
    });

    // Update stats display
    updateStatsDisplay(); // Use imported function
    console.log("Finished applying active form effects.");
}


/**
 * Handles toggling the checkbox for "Affects Resistances" in the form creator.
 */
export function handleAffectsResistanceToggle() {
    // Uses imported DOM elements
    if (!formAffectsResistancesCheckbox || !formResistanceBonusInputsDiv) return;
    const showResistanceInputs = formAffectsResistancesCheckbox.checked;
    formResistanceBonusInputsDiv.classList.toggle('hidden', !showResistanceInputs);
    if (!showResistanceInputs) {
        if(formAcBonusInput) formAcBonusInput.value = 0;
        if(formTrueResistanceBonusInput) formTrueResistanceBonusInput.value = 0;
    }
}