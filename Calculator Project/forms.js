// forms.js - Logic for managing character forms (creation, deletion, activation, effects).

// --- Import Dependencies ---
// Import DOM Elements
import {
    // Form Creator Elements
    formNameInput, formEnergyTypeSelect, formFormMultiplierInput, formPoolMaxMultiplierInput,
    formAffectsResistancesCheckbox, formResistanceBonusInputsDiv, formAcBonusInput,
    formTrueResistanceBonusInput, formEnableFormBuffCheckbox, formFormBuffValueInput,
    formFormBuffTypeSelect, formEnablePoolBuffCheckbox, formPoolBuffValueInput, formPoolBuffTypeSelect,
    // Other UI Elements needed
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
import { safeParseFloat, formatSimpleNumber } from './formatters.js'; // Or split utils/formatters
import { triggerAnimation } from './utils.js';

// Import UI / Calculation / Generator Functions
import { showMessage } from './ui-feedback.js';
import { renderFormList, renderActiveFormsSection } from './dom-generators.js'; // To update lists after add/delete
import { updateStatsDisplay } from './ui-updater.js'; // To update stats panel after effects applied
import { calculateAndResetEnergy } from './energy-pools.js'; // To recalculate energy when effects change pool multipliers
import { updateEquationDisplay } from './equation.js'; // To update equation after form changes


// --- Form System Functions ---

/**
 * Handles the click event for the "Add This Form" button.
 * Reads creator inputs, validates, creates form object, updates state, and resets inputs.
 */
export function handleAddForm() {
    // Uses imported DOM elements
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
    // ... (rest of reset logic remains same) ...
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
    const deleteButton = event.target.closest('.delete-form-btn');
    if (!deleteButton || !deleteButton.dataset.formId) {
        return;
    }

    const formIdToDelete = deleteButton.dataset.formId;
    // Uses imported characterForms state array
    const formToDelete = characterForms.find(form => form.id === formIdToDelete);
    if (!formToDelete) { /* ... error handling ... */ return; }

    if (confirm(`Are you sure you want to delete the form "${formToDelete.name}"? This cannot be undone.`)) {
        const formIndex = characterForms.findIndex(form => form.id === formIdToDelete);
        if (formIndex > -1) {
            // Modifies imported state arrays
            characterForms.splice(formIndex, 1);
            if (Array.isArray(calculatorState.activeFormIds)) {
                calculatorState.activeFormIds = calculatorState.activeFormIds.filter(id => id !== formIdToDelete);
            }

            // Uses imported UI/Logic functions
            renderFormList();
            renderActiveFormsSection();
            applyActiveFormEffects(); // Uses function defined below
            updateEquationDisplay();
            showMessage(`Form "${formToDelete.name}" deleted successfully.`, 'success');
        } else { /* ... error handling ... */ }
    }
}

/**
 * Handles changes to the checkboxes in the "Active Forms" section.
 * Updates the activeFormIds in the calculatorState.
 * @param {Event} event - The change event object from the checkbox.
 */
export function handleActiveFormChange(event) {
    const checkbox = event.target;
    const formId = checkbox.value;
    const isChecked = checkbox.checked;

    // Modifies imported calculatorState
    if (!Array.isArray(calculatorState.activeFormIds)) {
        calculatorState.activeFormIds = [];
    }
    if (isChecked) {
        if (!calculatorState.activeFormIds.includes(formId)) {
            calculatorState.activeFormIds.push(formId);
        }
    } else {
        calculatorState.activeFormIds = calculatorState.activeFormIds.filter(id => id !== formId);
    }
    console.log("Active Form IDs changed:", calculatorState.activeFormIds);

    // Uses function defined below and imported equation function
    applyActiveFormEffects();
    updateEquationDisplay();
}

/**
 * Calculates and applies the combined effects of currently active forms.
 * Updates the main form multiplier input, individual pool max multipliers,
 * AC/TR bonuses in the state, and triggers dependent UI/calculation updates.
 */
export function applyActiveFormEffects() {
    console.log("Applying active form effects...");
    let combinedFormMultiplier = 1;
    let combinedPoolMultipliers = {};
    let combinedAcBonus = 0;
    let combinedTrBonus = 0;

    // Uses imported config and state
    ALL_ENERGY_TYPES.forEach(type => { combinedPoolMultipliers[type] = 1; });
    const activeIds = calculatorState.activeFormIds || [];
    console.log("Processing active form IDs for effects:", activeIds);

    activeIds.forEach(formId => {
        const form = characterForms.find(f => f.id === formId); // Uses imported state
        if (form) {
             // ... (calculation logic remains the same) ...
             combinedFormMultiplier += form.formMultiplier;
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
        } else { /* ... warning ... */ }
    });

    // Apply Form Multiplier to UI (uses imported element, utils, formatter, triggerAnimation)
    if (formMultiplierInput) {
        const currentVal = safeParseFloat(formMultiplierInput.value);
        const newVal = safeParseFloat(combinedFormMultiplier);
        if (currentVal !== newVal) {
            formMultiplierInput.value = formatSimpleNumber(newVal);
            triggerAnimation(formMultiplierInput, 'pulse-source');
            console.log("Applied combined Form Multiplier:", newVal);
        }
    }

    // Store bonuses in state (modifies imported state)
    calculatorState.appliedAcBonus = combinedAcBonus;
    calculatorState.appliedTrueResistanceBonus = combinedTrBonus;

    // Apply Pool Max Multipliers & Recalculate Energy
    // Uses imported config, utils, formatters, triggerAnimation, calculateAndResetEnergy
    ALL_ENERGY_TYPES.forEach(type => {
        const maxMultiplierEl = document.getElementById(`${type}-max-multiplier`); // Direct lookup ok here
        if (maxMultiplierEl) {
            const applicableMultiplier = combinedPoolMultipliers[type] || 1;
            const currentPoolMultVal = safeParseFloat(maxMultiplierEl.value);
            const newPoolMultVal = safeParseFloat(applicableMultiplier);

            if (currentPoolMultVal !== newPoolMultVal) {
                maxMultiplierEl.value = formatSimpleNumber(newPoolMultVal);
                console.log(`Applied Pool Max Multiplier ${newPoolMultVal} to ${type}`);
                calculateAndResetEnergy(type); // Uses imported function
                triggerAnimation(maxMultiplierEl, 'pulse-source'); // Uses imported function
            } else {
                 calculateAndResetEnergy(type); // Still recalculate // Uses imported function
            }
        }
    });

    // Update stats display (uses imported function)
    updateStatsDisplay();
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
import {
    // Form Creator Elements
    formNameInput, formEnergyTypeSelect, formFormMultiplierInput, formPoolMaxMultiplierInput,
    formAffectsResistancesCheckbox, formResistanceBonusInputsDiv, formAcBonusInput,
    formTrueResistanceBonusInput, formEnableFormBuffCheckbox, formFormBuffValueInput,
    formFormBuffTypeSelect, formEnablePoolBuffCheckbox, formPoolBuffValueInput, formPoolBuffTypeSelect,
    // Other UI Elements
    formMultiplierInput // Main display input
    // Potentially energy pool elements if applyActiveFormEffects modifies them directly (using getEnergyElements might be better)
} from './dom-elements.js';

import {
    characterForms, // The array of form objects (needs to be mutable)
    calculatorState // Holds activeFormIds, applied bonuses (needs to be mutable)
    // Let's assume we can modify characterForms and calculatorState directly if they are exported with 'export let'
} from './state.js';

import { ALL_ENERGY_TYPES } from './config.js'; // For applyActiveFormEffects loop
import { safeParseFloat, formatSimpleNumber } from './formatters.js'; // Or utils.js / formatters.js

// UI / Calculation Functions (Import Later)
import { showMessage } from './ui-feedback.js';
import { renderFormList, renderActiveFormsSection } from './dom-generators.js';
import { updateStatsDisplay } from './ui-updater.js';
import { calculateAndResetEnergy } from './energy-pools.js';
import { triggerAnimation } from './utils.js';
import { updateEquationDisplay } from './equation.js'; // Needed after form changes


// --- Form System Functions ---

/**
 * Handles the click event for the "Add This Form" button.
 * Reads creator inputs, validates, creates form object, updates state, and resets inputs.
 */
export function handleAddForm() {
    // Read values from Form Creator inputs (ensure elements are imported)
    const formName = formNameInput?.value.trim();
    const energyType = formEnergyTypeSelect?.value;
    const affectsResistances = formAffectsResistancesCheckbox?.checked;

    // Basic Validation
    if (!formName) {
        showMessage("Please enter a Form Name.", 'error'); // TODO: Import showMessage
        return;
    }
    // Check for duplicate form names (case-insensitive)
    if (characterForms.some(form => form.name.toLowerCase() === formName.toLowerCase())) {
        showMessage(`A form named "${formName}" already exists. Please use a unique name.`, 'error'); // TODO: Import showMessage
        return;
    }

    // Read buff values
    const enableFormBuff = formEnableFormBuffCheckbox?.checked || false;
    const formBuffValue = safeParseFloat(formFormBuffValueInput?.value, 0);
    const formBuffType = formFormBuffTypeSelect?.value || 'add';
    const enablePoolBuff = formEnablePoolBuffCheckbox?.checked || false;
    const poolBuffValue = safeParseFloat(formPoolBuffValueInput?.value, 0);
    const poolBuffType = formPoolBuffTypeSelect?.value || 'add';

    // Create the new form object
    const newForm = {
        id: `form_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`, // Unique ID
        name: formName,
        formMultiplier: safeParseFloat(formFormMultiplierInput?.value, 1),
        poolMaxMultiplier: safeParseFloat(formPoolMaxMultiplierInput?.value, 1),
        energyType: energyType, // Can be 'None'
        affectsResistances: affectsResistances,
        acBonus: affectsResistances ? safeParseFloat(formAcBonusInput?.value, 0) : 0,
        trueResistanceBonus: affectsResistances ? safeParseFloat(formTrueResistanceBonusInput?.value, 0) : 0,
        // Add buff properties
        enableFormBuff: enableFormBuff,
        formBuffValue: formBuffValue,
        formBuffType: formBuffType,
        enablePoolBuff: enablePoolBuff,
        poolBuffValue: poolBuffValue,
        poolBuffType: poolBuffType
    };

    // Add to state array (assuming characterForms is exported as 'export let')
    characterForms.push(newForm);
    console.log("Form Added:", newForm);
    showMessage(`Form "${newForm.name}" added!`, 'success'); // TODO: Import showMessage

    // Update UI lists
    renderFormList(); // TODO: Import renderFormList
    renderActiveFormsSection(); // TODO: Import renderActiveFormsSection

    // Reset Form Creator fields
    if(formNameInput) formNameInput.value = '';
    if(formEnergyTypeSelect) formEnergyTypeSelect.value = 'None';
    if(formFormMultiplierInput) formFormMultiplierInput.value = 1;
    if(formPoolMaxMultiplierInput) formPoolMaxMultiplierInput.value = 1;
    if(formAffectsResistancesCheckbox) formAffectsResistancesCheckbox.checked = false;
    if(formResistanceBonusInputsDiv) formResistanceBonusInputsDiv.classList.add('hidden'); // Hide resistance inputs
    if(formAcBonusInput) formAcBonusInput.value = 0;
    if(formTrueResistanceBonusInput) formTrueResistanceBonusInput.value = 0;
    if(formEnableFormBuffCheckbox) formEnableFormBuffCheckbox.checked = false;
    if(formFormBuffValueInput) formFormBuffValueInput.value = 0;
    if(formFormBuffTypeSelect) formFormBuffTypeSelect.value = 'add';
    if(formEnablePoolBuffCheckbox) formEnablePoolBuffCheckbox.checked = false;
    if(formPoolBuffValueInput) formPoolBuffValueInput.value = 0;
    if(formPoolBuffTypeSelect) formPoolBuffTypeSelect.value = 'add';

    // Note: State is not auto-saved. User uses Save button.
}

/**
 * Handles clicking the delete button (X) next to a form in the Stats Panel list.
 * @param {Event} event - The click event object.
 */
export function handleDeleteFormClick(event) {
    // Use event delegation - check if the clicked element is a delete button
    const deleteButton = event.target.closest('.delete-form-btn');
    if (!deleteButton || !deleteButton.dataset.formId) {
        return; // Click wasn't on a delete button or button is missing ID
    }

    const formIdToDelete = deleteButton.dataset.formId;
    const formToDelete = characterForms.find(form => form.id === formIdToDelete);
    if (!formToDelete) {
        console.error("Could not find form to delete with ID:", formIdToDelete);
        return;
    }

    // Confirmation dialog
    if (confirm(`Are you sure you want to delete the form "${formToDelete.name}"? This cannot be undone.`)) {
        const formIndex = characterForms.findIndex(form => form.id === formIdToDelete);
        if (formIndex > -1) {
            // Remove from state array
            characterForms.splice(formIndex, 1);
            console.log(`Form "${formToDelete.name}" removed from characterForms state.`);

            // Remove from activeFormIds in calculatorState if it was active
            if (Array.isArray(calculatorState.activeFormIds)) {
                calculatorState.activeFormIds = calculatorState.activeFormIds.filter(id => id !== formIdToDelete);
            }

            // Update UI
            renderFormList();           // TODO: Import renderFormList
            renderActiveFormsSection(); // TODO: Import renderActiveFormsSection
            applyActiveFormEffects();   // Re-apply effects from remaining active forms
            updateEquationDisplay();    // TODO: Import updateEquationDisplay

            showMessage(`Form "${formToDelete.name}" deleted successfully.`, 'success'); // TODO: Import showMessage
        } else {
            console.error("Form index not found after finding the form object.");
        }
    }
}

/**
 * Handles changes to the checkboxes in the "Active Forms" section.
 * Updates the activeFormIds in the calculatorState.
 * @param {Event} event - The change event object from the checkbox.
 */
export function handleActiveFormChange(event) {
    const checkbox = event.target;
    const formId = checkbox.value;
    const isChecked = checkbox.checked;

    // Ensure activeFormIds exists and is an array
    if (!Array.isArray(calculatorState.activeFormIds)) {
        calculatorState.activeFormIds = [];
    }

    if (isChecked) {
        // Add formId if it's not already there
        if (!calculatorState.activeFormIds.includes(formId)) {
            calculatorState.activeFormIds.push(formId);
        }
    } else {
        // Remove formId
        calculatorState.activeFormIds = calculatorState.activeFormIds.filter(id => id !== formId);
    }
    console.log("Active Form IDs changed:", calculatorState.activeFormIds); // Debug log

    // Re-apply combined effects whenever selection changes
    applyActiveFormEffects();
    updateEquationDisplay(); // TODO: Import updateEquationDisplay
}

/**
 * Calculates and applies the combined effects of currently active forms.
 * Updates the main form multiplier input, individual pool max multipliers,
 * AC/TR bonuses in the state, and triggers dependent UI/calculation updates.
 */
export function applyActiveFormEffects() {
    console.log("Applying active form effects...");
    let combinedFormMultiplier = 1;
    let combinedPoolMultipliers = {}; // Tracks highest multiplier PER energy type { ki: 1, nen: 1, ... }
    let combinedAcBonus = 0;
    let combinedTrBonus = 0;

    // Initialize pool multipliers to 1 for all types
    ALL_ENERGY_TYPES.forEach(type => { combinedPoolMultipliers[type] = 1; });

    const activeIds = calculatorState.activeFormIds || [];
    console.log("Processing active form IDs for effects:", activeIds);

    // Calculate combined effects from active forms in the state
    activeIds.forEach(formId => {
        const form = characterForms.find(f => f.id === formId);
        if (form) {
            combinedFormMultiplier += form.formMultiplier;
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
        } else {
            console.warn(`Could not find form object for active ID during effect calculation: ${formId}`);
        }
    });

    // --- Apply Combined Effects ---

    // Apply combined Form Multiplier to the main read-only display input
    if (formMultiplierInput) {
        const currentVal = safeParseFloat(formMultiplierInput.value); // Use util
        const newVal = safeParseFloat(combinedFormMultiplier);      // Use util
        if (currentVal !== newVal) {
            formMultiplierInput.value = formatSimpleNumber(newVal);   // Use formatter
            triggerAnimation(formMultiplierInput, 'pulse-source'); // TODO: Import triggerAnimation
            console.log("Applied combined Form Multiplier:", newVal);
        }
    }

    // Store applied resistance bonuses in state
    calculatorState.appliedAcBonus = combinedAcBonus;
    calculatorState.appliedTrueResistanceBonus = combinedTrBonus;

    // Apply combined Pool Max Multipliers to respective energy pool inputs & Recalculate Energy
    // Requires getEnergyElements helper and calculateAndResetEnergy function
    // TODO: Import getEnergyElements and calculateAndResetEnergy
    const getEnergyElements = (type) => document.getElementById(`${type}-max-multiplier`); // Placeholder
    // const calculateAndResetEnergy = (type) => { console.log(`Recalculating ${type}...`); }; // Placeholder

    ALL_ENERGY_TYPES.forEach(type => {
        // const els = getEnergyElements(type); // Use imported function later
        const maxMultiplierEl = document.getElementById(`${type}-max-multiplier`); // Temporary direct access
        if (maxMultiplierEl) {
            const applicableMultiplier = combinedPoolMultipliers[type] || 1;
            const currentPoolMultVal = safeParseFloat(maxMultiplierEl.value); // Use util
            const newPoolMultVal = safeParseFloat(applicableMultiplier);     // Use util

            if (currentPoolMultVal !== newPoolMultVal) {
                maxMultiplierEl.value = formatSimpleNumber(newPoolMultVal); // Use formatter
                console.log(`Applied Pool Max Multiplier ${newPoolMultVal} to ${type}`);
                calculateAndResetEnergy(type); // Recalculate energy for this pool // TODO: Import
                triggerAnimation(maxMultiplierEl, 'pulse-source'); // TODO: Import triggerAnimation
            } else {
                 // Still recalculate energy in case base stats changed even if multiplier didn't
                 calculateAndResetEnergy(type); // TODO: Import
            }
        }
    });

    // Update stats display panel AFTER applying all effects and recalculating pools
    updateStatsDisplay(); // TODO: Import updateStatsDisplay
    console.log("Finished applying active form effects.");
    // Equation display is updated separately by the functions that trigger these effects
}


/**
 * Handles toggling the checkbox for "Affects Resistances" in the form creator.
 */
export function handleAffectsResistanceToggle() {
    if (!formAffectsResistancesCheckbox || !formResistanceBonusInputsDiv) return;

    const showResistanceInputs = formAffectsResistancesCheckbox.checked;
    formResistanceBonusInputsDiv.classList.toggle('hidden', !showResistanceInputs);

    // Reset values if checkbox is unchecked
    if (!showResistanceInputs) {
        if(formAcBonusInput) formAcBonusInput.value = 0;
        if(formTrueResistanceBonusInput) formTrueResistanceBonusInput.value = 0;
    }
}