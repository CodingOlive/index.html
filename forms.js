// forms.js - Logic for managing character forms (creation, deletion, activation, effects).

// --- Import Dependencies ---
// Import DOM Elements
import {
    formNameInput, formEnergyTypeSelect, formFormMultiplierInput, formPoolMaxMultiplierInput,
    formAffectsResistancesCheckbox, formResistanceBonusInputsDiv, formAcBonusInput,
    formTrueResistanceBonusInput, formEnableFormBuffCheckbox, formFormBuffValueInput,
    formFormBuffTypeSelect, formEnablePoolBuffCheckbox, formPoolBuffValueInput, formPoolBuffTypeSelect,
    formMultiplierInput // Main display input for combined form multiplier
} from './dom-elements.js';

// Import State (needs mutable access)
import {
    characterForms, // Array of form objects
    calculatorState // Holds activeFormIds, appliedAcBonus, appliedTrueResistanceBonus
} from './state.js';

// Import Config
import { ALL_ENERGY_TYPES } from './config.js'; // For applyActiveFormEffects loop

// Import Utilities & Formatters
import { formatSimpleNumber } from './formatters.js'; // Import formatters
import { safeParseFloat, triggerAnimation } from './utils.js'; // Import utils (including safeParseFloat)

// Import UI / Calculation / Generator Functions
import { showMessage } from './ui-feedback.js';
import { renderFormList, renderActiveFormsSection } from './dom-generators.js';
import { updateStatsDisplay } from './ui-updater.js';
import { calculateAndResetEnergy } from './energy-pools.js';
import { updateEquationDisplay } from './equation.js';


// --- Form System Functions ---

/**
 * Handles the click event for the "Add This Form" button.
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
    if (characterForms.some(form => form.name.toLowerCase() === formName.toLowerCase())) {
        showMessage(`A form named "${formName}" already exists. Please use a unique name.`, 'error'); // Uses imported function
        return;
    }

    // Uses imported DOM elements and utils
    const enableFormBuff = formEnableFormBuffCheckbox?.checked || false;
    const formBuffValue = safeParseFloat(formFormBuffValueInput?.value, 0); // Use imported safeParseFloat from utils.js
    const formBuffType = formFormBuffTypeSelect?.value || 'add';
    const enablePoolBuff = formEnablePoolBuffCheckbox?.checked || false;
    const poolBuffValue = safeParseFloat(formPoolBuffValueInput?.value, 0); // Use imported safeParseFloat from utils.js
    const poolBuffType = formPoolBuffTypeSelect?.value || 'add';

    const newForm = {
        id: `form_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        name: formName,
        formMultiplier: safeParseFloat(formFormMultiplierInput?.value, 1), // Use imported safeParseFloat from utils.js
        poolMaxMultiplier: safeParseFloat(formPoolMaxMultiplierInput?.value, 1), // Use imported safeParseFloat from utils.js
        energyType: energyType,
        affectsResistances: affectsResistances,
        acBonus: affectsResistances ? safeParseFloat(formAcBonusInput?.value, 0) : 0, // Use imported safeParseFloat from utils.js
        trueResistanceBonus: affectsResistances ? safeParseFloat(formTrueResistanceBonusInput?.value, 0) : 0, // Use imported safeParseFloat from utils.js
        enableFormBuff: enableFormBuff,
        formBuffValue: formBuffValue,
        formBuffType: formBuffType,
        enablePoolBuff: enablePoolBuff,
        poolBuffValue: poolBuffValue,
        poolBuffType: poolBuffType
    };

    characterForms.push(newForm); // Modifies imported state array
    console.log("Form Added:", newForm);
    showMessage(`Form "${newForm.name}" added!`, 'success'); // Uses imported function

    renderFormList(); // Calls imported function
    renderActiveFormsSection(); // Calls imported function

    // Reset Form Creator fields...
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
 */
export function handleDeleteFormClick(event) {
    // Uses imported state and functions
    const deleteButton = event.target.closest('.delete-form-btn');
    if (!deleteButton || !deleteButton.dataset.formId) { return; }

    const formIdToDelete = deleteButton.dataset.formId;
    const formToDelete = characterForms.find(form => form.id === formIdToDelete);
    if (!formToDelete) { /* ... error ... */ return; }

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
        } else { /* ... error ... */ }
    }
}

/**
 * Handles changes to the checkboxes in the "Active Forms" section.
 */
export function handleActiveFormChange(event) {
    // Uses imported state and functions
    const checkbox = event.target;
    const formId = checkbox.value;
    const isChecked = checkbox.checked;

    if (!Array.isArray(calculatorState.activeFormIds)) { calculatorState.activeFormIds = []; }
    if (isChecked) {
        if (!calculatorState.activeFormIds.includes(formId)) { calculatorState.activeFormIds.push(formId); } // Modifies imported state
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
 */
export function applyActiveFormEffects() {
    // Uses imported state, config, elements, utils, formatters, functions
    console.log("Applying active form effects (Sum Stacking)...");
    let combinedFormMultiplierSum = 0;
    let combinedPoolMultipliers = {};
    let combinedAcBonus = 0;
    let combinedTrBonus = 0;

    ALL_ENERGY_TYPES.forEach(type => { combinedPoolMultipliers[type] = 1; });
    const activeIds = calculatorState.activeFormIds || [];

    activeIds.forEach(formId => {
        const form = characterForms.find(f => f.id === formId);
        if (form) {
            combinedFormMultiplierSum += form.formMultiplier; // SUM logic
            if (form.affectsResistances) { /* ... AC/TR logic ... */ }
            const targetType = form.energyType;
            if (targetType === 'None') { /* ... apply pool mult to all ... */ }
            else if (ALL_ENERGY_TYPES.includes(targetType)) { /* ... apply pool mult to specific ... */ }
        }
    });

    const finalCombinedMultiplier = Math.max(1, combinedFormMultiplierSum);

    if (formMultiplierInput) {
        const currentVal = safeParseFloat(formMultiplierInput.value);
        const newVal = safeParseFloat(finalCombinedMultiplier);
        if (currentVal !== newVal) {
            formMultiplierInput.value = formatSimpleNumber(newVal);
            triggerAnimation(formMultiplierInput, 'pulse-source');
            console.log("Applied SUM combined Form Multiplier:", newVal);
        }
    }

    calculatorState.appliedAcBonus = combinedAcBonus; // Modify imported state
    calculatorState.appliedTrueResistanceBonus = combinedTrBonus; // Modify imported state

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
