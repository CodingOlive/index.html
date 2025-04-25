// admin.js - Logic for the Admin Panel (Energy Type Creator)

// --- Import Dependencies ---
import {
    adminPanelToggleBtn, adminPanelSection, adminEditEnergyTypeId, adminEnergyName,
    adminEnergyColor, adminEnergyFormula, adminSaveEnergyTypeBtn, adminClearEnergyFormBtn,
    adminFormMessage, adminCustomEnergyList, adminColorPreview
} from './dom-elements.js';

import { isAdmin, mergedEnergyTypes, initializeAndMergeEnergyTypes } from './state.js'; // Import merge function
import { showMessage } from './ui-feedback.js';
// Import database functions for save/delete
import { saveCustomEnergyType, deleteCustomEnergyType } from './database.js';
// Import function to re-populate dropdown/pools after changes
import { populateEnergyTypeDropdown, generateEnergySections } from './dom-generators.js';


// --- Admin Panel UI Logic ---

/**
 * Shows or hides Admin Panel elements based on the user's admin status.
 * Called after login/logout in auth.js.
 */
export function updateAdminUI() {
    if (!adminPanelToggleBtn) { return; } // Only need button here
    console.log("Updating Admin UI based on isAdmin status:", isAdmin);
    adminPanelToggleBtn.classList.toggle('hidden', !isAdmin);
    // Ensure panel is hidden initially regardless of admin status
    if(adminPanelSection) adminPanelSection.classList.add('hidden');
}

/**
 * Toggles the visibility of the main Admin Panel section.
 * Called when the adminPanelToggleBtn is clicked.
 */
function toggleAdminPanel() {
    if (!adminPanelSection) return;
    const isHidden = adminPanelSection.classList.toggle('hidden');
    console.log("Admin panel toggled:", isHidden ? "Hidden" : "Visible");
    if (!isHidden) {
        populateCustomTypeList(); // Refresh list when shown
        adminPanelSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

/**
 * Clears the input fields in the admin energy type creator form.
 */
function clearAdminEnergyForm() {
    if (adminEditEnergyTypeId) adminEditEnergyTypeId.value = ''; // Clear hidden ID field
    if (adminEnergyName) adminEnergyName.value = '';
    if (adminEnergyColor) adminEnergyColor.value = '#64748B'; // Reset to default color
    if (adminEnergyFormula) adminEnergyFormula.value = '';
    if (adminFormMessage) adminFormMessage.textContent = ''; // Clear any previous messages
    if (adminColorPreview) adminColorPreview.style.backgroundColor = '#64748B'; // Reset preview
    if (adminSaveEnergyTypeBtn) adminSaveEnergyTypeBtn.textContent = 'Save Energy Type'; // Reset button text
    console.log("Admin energy form cleared.");
}

/**
 * Updates the color preview swatch when the color input changes.
 */
function handleColorChange() {
    if(adminEnergyColor && adminColorPreview) {
        adminColorPreview.style.backgroundColor = adminEnergyColor.value;
    }
}

// --- Admin Data Logic ---

/**
 * Populates the list (#adminCustomEnergyList) with existing custom types.
 * Filters the mergedEnergyTypes list.
 */
function populateCustomTypeList() {
    if (!adminCustomEnergyList) return;

    // Filter merged types to get only custom ones
    const customTypes = mergedEnergyTypes.filter(et => !et.isStandard);

    adminCustomEnergyList.innerHTML = ''; // Clear existing list items

    if (customTypes.length === 0) {
        adminCustomEnergyList.innerHTML = '<li>No custom types defined yet.</li>';
        return;
    }

    customTypes.forEach(type => {
        const li = document.createElement('li');
        li.className = 'flex justify-between items-center py-1 border-b border-gray-200 last:border-b-0';

        const typeInfo = document.createElement('span');
        typeInfo.innerHTML = `
            <strong style="color: ${type.color || '#000'}; border-bottom: 2px solid ${type.color || '#CCC'}; padding-bottom: 1px;">${type.name}</strong>
            <code class="ml-2 text-xs bg-gray-200 px-1 rounded">${type.formula || 'No Formula'}</code>
        `;

        const buttons = document.createElement('div');
        buttons.className = 'flex gap-2';

        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.className = 'text-xs text-blue-600 hover:text-blue-800 focus:outline-none';
        editBtn.dataset.id = type.id;
        editBtn.addEventListener('click', handleEditCustomTypeClick);

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.className = 'text-xs text-red-600 hover:text-red-800 focus:outline-none';
        deleteBtn.dataset.id = type.id;
        deleteBtn.addEventListener('click', handleDeleteCustomTypeClick);

        buttons.appendChild(editBtn);
        buttons.appendChild(deleteBtn);
        li.appendChild(typeInfo);
        li.appendChild(buttons);
        adminCustomEnergyList.appendChild(li);
    });
}

/**
 * Handles clicking the "Edit" button for a custom type.
 * Populates the admin form with the data of the selected type.
 */
function handleEditCustomTypeClick(event) {
    const typeId = event.target.dataset.id;
    const typeToEdit = mergedEnergyTypes.find(et => et.id === typeId && !et.isStandard);

    if (typeToEdit && adminEditEnergyTypeId && adminEnergyName && adminEnergyColor && adminEnergyFormula && adminColorPreview && adminSaveEnergyTypeBtn) {
        console.log("Editing custom type:", typeToEdit);
        adminEditEnergyTypeId.value = typeToEdit.id; // Store ID for saving update
        adminEnergyName.value = typeToEdit.name;
        adminEnergyColor.value = typeToEdit.color || '#64748B'; // Use saved color or default
        adminEnergyFormula.value = typeToEdit.formula || '';
        adminColorPreview.style.backgroundColor = adminEnergyColor.value;
        adminSaveEnergyTypeBtn.textContent = 'Update Energy Type'; // Change button text
        adminEnergyName.focus(); // Focus name field for editing
    } else {
        console.error("Could not find custom type to edit or form elements missing.", typeId);
    }
}

/**
 * Handles clicking the "Delete" button for a custom type.
 */
async function handleDeleteCustomTypeClick(event) {
    const typeId = event.target.dataset.id;
    const typeToDelete = mergedEnergyTypes.find(et => et.id === typeId && !et.isStandard);

    if (!typeToDelete) {
        console.error("Could not find custom type to delete:", typeId);
        return;
    }

    if (confirm(`Are you sure you want to delete the custom energy type "${typeToDelete.name}"? This cannot be undone.`)) {
        console.log("Attempting to delete custom type:", typeId);
        // --- Call database function to delete ---
        const success = await deleteCustomEnergyType(typeId); // Use imported function
        if (success) {
            showMessage(`Custom type "${typeToDelete.name}" deleted. Refreshing...`, 'success');
            // --- Refresh merged types and UI ---
            await refreshDataAndUI(); // Use helper function below
        } else {
            showMessage(`Failed to delete custom type "${typeToDelete.name}".`, 'error');
        }
    }
}

/**
 * Handles saving a new or edited custom energy type.
 */
async function handleSaveEnergyType() {
    // Read values from form
    const typeId = adminEditEnergyTypeId?.value || null; // null if creating new
    const name = adminEnergyName?.value.trim();
    const color = adminEnergyColor?.value || '#000000';
    const formula = adminEnergyFormula?.value.trim();

    // Basic Validation
    if (!name) { if(adminFormMessage) adminFormMessage.textContent = 'Energy Name is required.'; return; }
    if (!formula) { if(adminFormMessage) adminFormMessage.textContent = 'Formula is required.'; return; }
    const validFormulaChars = /^[a-zA-Z0-9\s\+\-\*\/\(\)\.]+$/; // Allows letters, numbers, spaces, operators, dots
     if (!validFormulaChars.test(formula)) { if(adminFormMessage) adminFormMessage.textContent = 'Formula contains invalid characters.'; return; }
     // TODO: Add more robust formula validation using MathJS compile if needed
    if(adminFormMessage) adminFormMessage.textContent = ''; // Clear previous errors

    const energyData = { name, color, formula };
    console.log("Attempting to save custom energy type:", typeId ? "Update" : "New", energyData);

    // --- Call database function to save/update ---
    const success = await saveCustomEnergyType(typeId, energyData); // Use imported function
    if (success) {
        showMessage(`Custom type "${name}" ${typeId ? 'updated' : 'saved'} successfully. Refreshing...`, 'success');
        clearAdminEnergyForm(); // Clear form on success
         // --- Refresh merged types and UI ---
         await refreshDataAndUI(); // Use helper function below
    } else {
         showMessage(`Failed to save custom type "${name}".`, 'error');
    }
}


/**
 * Helper function to refresh the merged energy types and update relevant UI parts.
 */
async function refreshDataAndUI() {
    console.log("Refreshing data and UI after admin action...");
    await initializeAndMergeEnergyTypes(); // Re-fetch and merge state
    populateCustomTypeList(); // Update admin list display
    populateEnergyTypeDropdown(); // Update main dropdown display
    generateEnergySections(); // Regenerate pools/sliders based on new merged list
    // TODO: Consider if other UI updates are needed, e.g., re-applying form effects if
    // the currently selected energy type was modified/deleted.
    console.log("UI refreshed.");
}


// --- Setup Admin Panel Event Listeners ---
// This function should be called once, e.g., from main.js or after login check in auth.js
export function setupAdminPanelListeners() {
    console.log("Setting up Admin Panel listeners...");
    adminPanelToggleBtn?.addEventListener('click', toggleAdminPanel);
    adminClearEnergyFormBtn?.addEventListener('click', clearAdminEnergyForm);
    adminEnergyColor?.addEventListener('input', handleColorChange);
    adminSaveEnergyTypeBtn?.addEventListener('click', handleSaveEnergyType);
    // Note: Listeners for edit/delete buttons within the list are added dynamically in populateCustomTypeList
}

