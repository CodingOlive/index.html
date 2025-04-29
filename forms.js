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

// Import State (needs state object/vars for reading, setters for writing, and merged types list)
import {
    // Import state variables/objects needed for reading
    characterForms,        // Keep for reading
    calculatorState,       // Keep for reading
    mergedEnergyTypes,   // <<< *** ADDED MISSING IMPORT ***

    // Import the NEW state setter functions
    addCharacterForm,
    removeCharacterForm,
    setActiveFormIds
} from './state.js';

// Import Config
import { ALL_ENERGY_TYPES, ENERGY_TYPE_DETAILS } from './config.js'; // For applyActiveFormEffects fallback if needed

// Import Utilities & Formatters
import { formatSimpleNumber } from './formatters.js';
import { safeParseFloat, triggerAnimation } from './utils.js';

// Import UI / Calculation / Generator Functions
import { showMessage } from './ui-feedback.js';
import { renderFormList, renderActiveFormsSection } from './dom-generators.js';
import { updateStatsDisplay, updateSliderVisibility, updateSingleSliderDisplay, updateSliderLimitAndStyle } from './ui-updater.js'; // Added more UI updaters
import { calculateAndResetEnergy, getEnergyElements } from './energy-pools.js';
import { updateEquationDisplay } from './equation.js';


// --- Form System Functions ---

/**
 * Handles the click event for the "Add This Form" button.
 */
export function handleAddForm() {
    const formName = formNameInput?.value.trim();
    const energyType = formEnergyTypeSelect?.value;
    const affectsResistances = formAffectsResistancesCheckbox?.checked;

    if (!formName) {
        showMessage("Please enter a Form Name.", 'error');
        formNameInput?.focus();
        return;
    }
    // Check for duplicate name using the current state array
    if (characterForms.some(form => form.name.toLowerCase() === formName.toLowerCase())) {
        showMessage(`A form named "${formName}" already exists. Please use a unique name.`, 'error');
        formNameInput?.focus();
        return;
    }

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
        energyType: energyType, // Can be 'None' or a specific type ID
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

    // Use the setter from state.js
    const added = addCharacterForm(newForm);

    if (added) { // Only proceed if adding to state was successful
        console.log("Form Added:", newForm);
        showMessage(`Form "${newForm.name}" added!`, 'success');

        renderFormList(); // Update the list in the stats panel
        renderActiveFormsSection(); // Update the checkboxes in the main area

        // Reset Form Creator fields
        if(formNameInput) formNameInput.value = '';
        if(formEnergyTypeSelect) formEnergyTypeSelect.value = 'None';
        if(formFormMultiplierInput) formFormMultiplierInput.value = '1';
        if(formPoolMaxMultiplierInput) formPoolMaxMultiplierInput.value = '1';
        if(formAffectsResistancesCheckbox) {
            formAffectsResistancesCheckbox.checked = false;
            handleAffectsResistanceToggle(); // Ensure dependent fields hide
        }
        if(formAcBonusInput) formAcBonusInput.value = '0';
        if(formTrueResistanceBonusInput) formTrueResistanceBonusInput.value = '0';
        if(formEnableFormBuffCheckbox) formEnableFormBuffCheckbox.checked = false;
        if(formFormBuffValueInput) formFormBuffValueInput.value = '0';
        if(formFormBuffTypeSelect) formFormBuffTypeSelect.value = 'add';
        if(formEnablePoolBuffCheckbox) formEnablePoolBuffCheckbox.checked = false;
        if(formPoolBuffValueInput) formPoolBuffValueInput.value = '0';
        if(formPoolBuffTypeSelect) formPoolBuffTypeSelect.value = 'add';
    } else {
         showMessage(`Failed to add form "${newForm.name}". Check console for details (e.g., duplicate ID).`, 'error');
    }
}

/**
 * Handles clicking the delete button (X) next to a form in the Stats Panel list.
 */
export function handleDeleteFormClick(event) {
    const deleteButton = event.target.closest('.delete-form-btn');
    if (!deleteButton || !deleteButton.dataset.formId) {
        return;
    }

    const formIdToDelete = deleteButton.dataset.formId;
    const formToDelete = characterForms.find(form => form.id === formIdToDelete);

    if (!formToDelete) {
        console.error("DeleteForm: Could not find form object for ID:", formIdToDelete);
        showMessage("Error: Could not find form to delete.", 'error');
        return;
    }

    if (confirm(`Are you sure you want to delete the form "${formToDelete.name}"? This cannot be undone.`)) {
        // Use the remover function from state.js
        const removed = removeCharacterForm(formIdToDelete);

        if (removed) { // Check if removal from state was successful
            // Update active forms list using its setter
            const currentActiveIds = Array.isArray(calculatorState.activeFormIds) ? calculatorState.activeFormIds : [];
            const newActiveIds = currentActiveIds.filter(id => id !== formIdToDelete);
            setActiveFormIds(newActiveIds); // Use setter from state.js

            // Update UI
            renderFormList();
            renderActiveFormsSection();
            applyActiveFormEffects(); // Recalculate effects
            updateEquationDisplay();
            showMessage(`Form "${formToDelete.name}" deleted successfully.`, 'success');
        } else {
            showMessage(`Failed to delete form "${formToDelete.name}". It might have already been removed.`, 'error');
        }
    }
}

/**
 * Handles changes to the checkboxes in the "Active Forms" section.
 */
export function handleActiveFormChange(event) {
    const checkbox = event.target;
    if (checkbox.type !== 'checkbox') return;

    const formId = checkbox.value;
    const isChecked = checkbox.checked;

    const currentActiveIds = Array.isArray(calculatorState.activeFormIds) ? [...calculatorState.activeFormIds] : [];

    if (isChecked) {
        if (!currentActiveIds.includes(formId)) {
            currentActiveIds.push(formId);
        }
    } else {
        const index = currentActiveIds.indexOf(formId);
        if (index > -1) {
            currentActiveIds.splice(index, 1);
        }
    }

    // Use the setter to update the state
    setActiveFormIds(currentActiveIds);

    console.log("Active Form IDs changed (via setter):", calculatorState.activeFormIds);

    // Recalculate effects and update UI
    applyActiveFormEffects();
    updateEquationDisplay();
}

/**
 * Calculates and applies the combined effects of currently active forms.
 */
export function applyActiveFormEffects() {
    console.log("Applying active form effects (Sum Stacking for Form, Product for Pools)...");
    let combinedFormMultiplierSum = 0;
    let combinedPoolMultipliers = {};
    let combinedAcBonus = 0;
    let combinedTrBonus = 0;

    // Use mergedEnergyTypes (now correctly imported) to get all relevant type IDs
    // Fallback to ALL_ENERGY_TYPES only if mergedEnergyTypes is somehow empty/unavailable
    // *** This line caused the error previously because mergedEnergyTypes wasn't imported ***
    const typesToConsider = (mergedEnergyTypes && mergedEnergyTypes.length > 0)
                           ? mergedEnergyTypes.map(et => et.id)
                           : ALL_ENERGY_TYPES;
    // ***-----------------------------------------------------------------------------***


    if (typesToConsider.length === 0) {
         console.warn("applyActiveFormEffects: No energy types found (merged or default) to apply pool multipliers to.");
    }

    // Initialize pool multipliers for all types to 1
    typesToConsider.forEach(typeId => {
        combinedPoolMultipliers[typeId] = 1;
    });

    const activeIds = calculatorState.activeFormIds || [];
    const activeForms = activeIds
        .map(id => characterForms.find(f => f.id === id))
        .filter(Boolean);

    // Calculate combined effects
    activeForms.forEach(form => {
        combinedFormMultiplierSum += form.formMultiplier;

        if (form.affectsResistances) {
            combinedAcBonus += form.acBonus;
            combinedTrBonus += form.trueResistanceBonus;
        }

        // Apply pool multiplier (PRODUCT stacking)
        const targetType = form.energyType;
        const poolMult = form.poolMaxMultiplier;

        if (targetType === 'None') {
            typesToConsider.forEach(typeId => {
                combinedPoolMultipliers[typeId] *= poolMult;
            });
        } else if (typesToConsider.includes(targetType)) {
            combinedPoolMultipliers[targetType] *= poolMult;
        }
    });

    const finalCombinedFormMultiplier = combinedFormMultiplierSum === 0 ? 1 : combinedFormMultiplierSum;

    // --- Update UI and State ---

    // 1. Update main Form Multiplier display
    if (formMultiplierInput) {
        const currentDisplayVal = safeParseFloat(formMultiplierInput.value);
        const newDisplayVal = safeParseFloat(finalCombinedFormMultiplier);
        // Only update DOM if value actually changed to avoid unnecessary triggers
        if (Math.abs(currentDisplayVal - newDisplayVal) > 1e-9) { // Allow for floating point comparison issues
            formMultiplierInput.value = formatSimpleNumber(newDisplayVal);
            triggerAnimation(formMultiplierInput, 'pulse-source');
            console.log("Applied SUM combined Form Multiplier:", newDisplayVal);
        }
    }

    // 2. Update AC/TR bonus in calculatorState
    calculatorState.appliedAcBonus = combinedAcBonus; // Direct mutation or use setter if available
    calculatorState.appliedTrueResistanceBonus = combinedTrBonus;

    // 3. Update individual Energy Pool Max Multiplier inputs and recalculate pools
    typesToConsider.forEach(typeId => {
        const maxMultiplierEl = document.getElementById(`${typeId}-max-multiplier`);
        const els = getEnergyElements(typeId);
        if (maxMultiplierEl && els) {
            const applicablePoolMultiplier = combinedPoolMultipliers[typeId] || 1;
            const currentPoolMultVal = safeParseFloat(maxMultiplierEl.value);
            const newPoolMultVal = safeParseFloat(applicablePoolMultiplier);

            // Only update DOM if value changed
            if (Math.abs(currentPoolMultVal - newPoolMultVal) > 1e-9) {
                maxMultiplierEl.value = formatSimpleNumber(newPoolMultVal);
                triggerAnimation(maxMultiplierEl, 'pulse-source');
                console.log(`Updated Pool Multiplier for ${typeId}:`, newPoolMultVal);
            }
            // Always recalculate energy pools as base stats might have changed even if pool mult didn't
            calculateAndResetEnergy(typeId);
            // Update slider UI after recalc
            updateSliderVisibility(typeId);
            updateSingleSliderDisplay(typeId);
            updateSliderLimitAndStyle(typeId);

        } else if (els) { // Pool exists but input missing? Still recalc energy.
            console.warn(`applyActiveFormEffects: Input element ${typeId}-max-multiplier not found, but pool exists. Recalculating energy.`);
             calculateAndResetEnergy(typeId);
             updateSliderVisibility(typeId);
             updateSingleSliderDisplay(typeId);
             updateSliderLimitAndStyle(typeId);
        }
    });

    // 4. Update the main stats panel display
    updateStatsDisplay();
    console.log("Finished applying active form effects.");
}


/**
 * Handles toggling the checkbox for "Affects Resistances" in the form creator.
 */
export function handleAffectsResistanceToggle() {
    if (!formAffectsResistancesCheckbox || !formResistanceBonusInputsDiv) {
        console.warn("Resistance toggle elements missing.");
        return;
    }
    const showResistanceInputs = formAffectsResistancesCheckbox.checked;
    formResistanceBonusInputsDiv.classList.toggle('hidden', !showResistanceInputs);
    if (!showResistanceInputs) {
        if(formAcBonusInput) formAcBonusInput.value = '0';
        if(formTrueResistanceBonusInput) formTrueResistanceBonusInput.value = '0';
    }
}
