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

// Import State (needs state object/vars for reading, and setters for writing)
import {
    // Import state variables/objects needed for reading
    characterForms, // Keep for reading (e.g., finding form by ID, checking for duplicates)
    calculatorState, // Keep for reading current active IDs before update

    // Import the NEW state setter functions
    addCharacterForm,    // <-- New
    removeCharacterForm, // <-- New
    setActiveFormIds     // <-- New
} from './state.js';

// Import Config
import { ALL_ENERGY_TYPES, ENERGY_TYPE_DETAILS } from './config.js'; // For applyActiveFormEffects loop & energy pool matching

// Import Utilities & Formatters
import { formatSimpleNumber } from './formatters.js';
import { safeParseFloat, triggerAnimation } from './utils.js';

// Import UI / Calculation / Generator Functions
import { showMessage } from './ui-feedback.js';
import { renderFormList, renderActiveFormsSection } from './dom-generators.js';
import { updateStatsDisplay } from './ui-updater.js';
import { calculateAndResetEnergy, getEnergyElements } from './energy-pools.js'; // Import getEnergyElements
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

    // ********************************************
    // *** CHANGE IS HERE ***
    // Use the setter instead of push directly
    const added = addCharacterForm(newForm);
    // characterForms.push(newForm); // <-- OLD WAY
    // ********************************************

    if (added) { // Only proceed if adding to state was successful
        console.log("Form Added:", newForm);
        showMessage(`Form "${newForm.name}" added!`, 'success');

        renderFormList(); // Update the list in the stats panel
        renderActiveFormsSection(); // Update the checkboxes in the main area

        // Reset Form Creator fields
        if(formNameInput) formNameInput.value = '';
        if(formEnergyTypeSelect) formEnergyTypeSelect.value = 'None'; // Reset dropdown
        if(formFormMultiplierInput) formFormMultiplierInput.value = '1'; // Use string '1' for consistency? Or number 1. Needs testing.
        if(formPoolMaxMultiplierInput) formPoolMaxMultiplierInput.value = '1';
        if(formAffectsResistancesCheckbox) {
            formAffectsResistancesCheckbox.checked = false;
            // Trigger the change handler manually to hide the dependent fields
            handleAffectsResistanceToggle();
        }
        // formResistanceBonusInputsDiv is hidden by the handler above
        if(formAcBonusInput) formAcBonusInput.value = '0';
        if(formTrueResistanceBonusInput) formTrueResistanceBonusInput.value = '0';
        if(formEnableFormBuffCheckbox) formEnableFormBuffCheckbox.checked = false;
        if(formFormBuffValueInput) formFormBuffValueInput.value = '0';
        if(formFormBuffTypeSelect) formFormBuffTypeSelect.value = 'add';
        if(formEnablePoolBuffCheckbox) formEnablePoolBuffCheckbox.checked = false;
        if(formPoolBuffValueInput) formPoolBuffValueInput.value = '0';
        if(formPoolBuffTypeSelect) formPoolBuffTypeSelect.value = 'add';
    } else {
         // Show error message if addCharacterForm failed (e.g., duplicate ID)
         showMessage(`Failed to add form "${newForm.name}". Check console for details.`, 'error');
    }
}

/**
 * Handles clicking the delete button (X) next to a form in the Stats Panel list.
 */
export function handleDeleteFormClick(event) {
    const deleteButton = event.target.closest('.delete-form-btn');
    if (!deleteButton || !deleteButton.dataset.formId) {
        // Click was not on a delete button or button is missing ID
        return;
    }

    const formIdToDelete = deleteButton.dataset.formId;
    // Read current state to get form name for confirmation dialog
    const formToDelete = characterForms.find(form => form.id === formIdToDelete);

    if (!formToDelete) {
        console.error("DeleteForm: Could not find form object for ID:", formIdToDelete);
        showMessage("Error: Could not find form to delete.", 'error');
        return;
    }

    if (confirm(`Are you sure you want to delete the form "${formToDelete.name}"? This cannot be undone.`)) {

        // ********************************************
        // *** CHANGE IS HERE ***
        // Use the setter/remover function from state.js
        const removed = removeCharacterForm(formIdToDelete);
        // const formIndex = characterForms.findIndex(form => form.id === formIdToDelete); // <-- OLD WAY
        // if (formIndex > -1) { characterForms.splice(formIndex, 1); } // <-- OLD WAY
        // ********************************************


        if (removed) { // Check if removal from state was successful
            // ********************************************
            // *** CHANGE IS HERE ***
            // Update active forms list using its setter
            const currentActiveIds = Array.isArray(calculatorState.activeFormIds) ? calculatorState.activeFormIds : [];
            // Filter out the deleted ID
            const newActiveIds = currentActiveIds.filter(id => id !== formIdToDelete);
            setActiveFormIds(newActiveIds); // Use setter from state.js
            // calculatorState.activeFormIds = calculatorState.activeFormIds.filter(id => id !== formIdToDelete); // <-- OLD WAY (direct mutation)
            // ********************************************


            // Update UI
            renderFormList();           // Update list in stats panel
            renderActiveFormsSection(); // Update checkboxes in main area
            applyActiveFormEffects();   // Recalculate effects based on new active list
            updateEquationDisplay();    // Update equation display as form multiplier might change
            showMessage(`Form "${formToDelete.name}" deleted successfully.`, 'success');
        } else {
            // removeCharacterForm returned null (ID not found)
            showMessage(`Failed to delete form "${formToDelete.name}". It might have already been removed.`, 'error');
        }
    }
}

/**
 * Handles changes to the checkboxes in the "Active Forms" section.
 */
export function handleActiveFormChange(event) {
    const checkbox = event.target;
    if (checkbox.type !== 'checkbox') return; // Ensure it's a checkbox change

    const formId = checkbox.value;
    const isChecked = checkbox.checked;

    // Get a mutable copy of the current active IDs from the state object
    const currentActiveIds = Array.isArray(calculatorState.activeFormIds) ? [...calculatorState.activeFormIds] : [];

    // Modify the copy
    if (isChecked) {
        // Add ID if it's not already present
        if (!currentActiveIds.includes(formId)) {
            currentActiveIds.push(formId);
        }
    } else {
        // Remove ID if it is present
        const index = currentActiveIds.indexOf(formId);
        if (index > -1) {
            currentActiveIds.splice(index, 1);
        }
    }

    // ********************************************
    // *** CHANGE IS HERE ***
    // Use the setter to update the state with the modified list
    setActiveFormIds(currentActiveIds);
    // ********************************************


    console.log("Active Form IDs changed (via setter):", calculatorState.activeFormIds); // Log the updated state

    // Recalculate effects and update UI
    applyActiveFormEffects();
    updateEquationDisplay();
}

/**
 * Calculates and applies the combined effects of currently active forms.
 * Uses SUM for main form multiplier stacking and PRODUCT for pool multipliers.
 * Updates the main form multiplier input display and individual pool multiplier inputs.
 * Also updates AC/TR bonuses in state and triggers energy pool recalculations.
 */
export function applyActiveFormEffects() {
    console.log("Applying active form effects (Sum Stacking for Form, Product for Pools)...");
    let combinedFormMultiplierSum = 0; // Start at 0 for SUM stacking
    let combinedPoolMultipliers = {}; // Stores PRODUCT stacking for each pool type
    let combinedAcBonus = 0;
    let combinedTrBonus = 0;

    // Initialize pool multipliers for all types to 1 (identity for product)
    // Use mergedEnergyTypes if available, otherwise fallback to ALL_ENERGY_TYPES
    const typesToConsider = mergedEnergyTypes.length > 0 ? mergedEnergyTypes.map(et => et.id) : ALL_ENERGY_TYPES;
    typesToConsider.forEach(typeId => {
        combinedPoolMultipliers[typeId] = 1;
    });

    const activeIds = calculatorState.activeFormIds || [];
    const activeForms = activeIds
        .map(id => characterForms.find(f => f.id === id))
        .filter(Boolean); // Get full form objects for active IDs, filter out any not found

    // Calculate combined effects
    activeForms.forEach(form => {
        combinedFormMultiplierSum += form.formMultiplier; // SUM stacking for main multiplier

        if (form.affectsResistances) {
            combinedAcBonus += form.acBonus; // SUM stacking for AC/TR
            combinedTrBonus += form.trueResistanceBonus;
        }

        // Apply pool multiplier (PRODUCT stacking)
        const targetType = form.energyType;
        const poolMult = form.poolMaxMultiplier;

        if (targetType === 'None') {
            // Apply to ALL energy types
            typesToConsider.forEach(typeId => {
                combinedPoolMultipliers[typeId] *= poolMult;
            });
        } else if (typesToConsider.includes(targetType)) {
            // Apply only to the specific energy type
            combinedPoolMultipliers[targetType] *= poolMult;
        }
    });

    // Ensure the final combined FORM multiplier is at least 1 (or 0 if no forms active?)
    // Let's default to 1 if sum is 0, otherwise use the sum.
    const finalCombinedFormMultiplier = combinedFormMultiplierSum === 0 ? 1 : combinedFormMultiplierSum;

    // --- Update UI and State ---

    // 1. Update the main combined Form Multiplier display input
    if (formMultiplierInput) {
        const currentDisplayVal = safeParseFloat(formMultiplierInput.value);
        const newDisplayVal = safeParseFloat(finalCombinedFormMultiplier); // Use safe parse for comparison
        if (currentDisplayVal !== newDisplayVal) {
            formMultiplierInput.value = formatSimpleNumber(newDisplayVal); // Format for display
            triggerAnimation(formMultiplierInput, 'pulse-source');
            console.log("Applied SUM combined Form Multiplier:", newDisplayVal);
        }
    }

    // 2. Update AC/TR bonus in calculatorState (direct mutation or use setters if defined)
    // Using direct mutation here as setters weren't explicitly defined for these sub-properties yet
    calculatorState.appliedAcBonus = combinedAcBonus;
    calculatorState.appliedTrueResistanceBonus = combinedTrBonus;

    // 3. Update individual Energy Pool Max Multiplier inputs and recalculate pools
    typesToConsider.forEach(typeId => {
        const maxMultiplierEl = document.getElementById(`${typeId}-max-multiplier`);
        const els = getEnergyElements(typeId); // Get elements for this pool
        if (maxMultiplierEl && els) { // Check if the input element exists
            const applicablePoolMultiplier = combinedPoolMultipliers[typeId] || 1;
            const currentPoolMultVal = safeParseFloat(maxMultiplierEl.value);
            const newPoolMultVal = safeParseFloat(applicablePoolMultiplier); // Use safe parse

            let needsRecalculation = false;
            if (currentPoolMultVal !== newPoolMultVal) {
                maxMultiplierEl.value = formatSimpleNumber(newPoolMultVal); // Format for display
                triggerAnimation(maxMultiplierEl, 'pulse-source');
                console.log(`Updated Pool Multiplier for ${typeId}:`, newPoolMultVal);
                needsRecalculation = true;
            }

            // Always recalculate energy even if multiplier didn't change,
            // because base stats might have changed, affecting base max energy.
            // calculateAndResetEnergy handles updating total/current energy display.
            calculateAndResetEnergy(typeId);

            // Update slider visibility and display after recalculation
            updateSliderVisibility(typeId);
            updateSingleSliderDisplay(typeId); // Update the (E:xxx, D:xxx) part
             updateSliderLimitAndStyle(typeId); // Re-apply attack limits


        } else if (!maxMultiplierEl && els) {
             console.warn(`applyActiveFormEffects: Input element ${typeId}-max-multiplier not found, but pool exists.`);
             // Still recalculate energy in case base stats changed
              calculateAndResetEnergy(typeId);
              updateSliderVisibility(typeId);
              updateSingleSliderDisplay(typeId);
              updateSliderLimitAndStyle(typeId);
        }
    });

    // 4. Update the main stats panel display (AC, TR, etc.)
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
    // Clear bonus inputs if hiding the section
    if (!showResistanceInputs) {
        if(formAcBonusInput) formAcBonusInput.value = '0';
        if(formTrueResistanceBonusInput) formTrueResistanceBonusInput.value = '0';
    }
}
