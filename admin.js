// admin.js - Logic for the Admin Panel (Energy Type Creator)

// --- Import Dependencies ---
import {
    adminPanelToggleBtn, adminPanelSection, adminEditEnergyTypeId, adminEnergyName,
    adminEnergyColor, adminEnergyFormula, adminSaveEnergyTypeBtn, adminClearEnergyFormBtn,
    adminFormMessage, adminCustomEnergyList, adminColorPreview
} from './dom-elements.js';

import { isAdmin, mergedEnergyTypes, initializeAndMergeEnergyTypes } from './state.js';
import { showMessage } from './ui-feedback.js';
import { saveCustomEnergyType, deleteCustomEnergyType } from './database.js';
import { populateEnergyTypeDropdown, generateEnergySections } from './dom-generators.js';


// --- Admin Panel UI Logic ---

/**
 * Shows or hides Admin Panel elements based on the user's admin status.
 * Called after login/logout in auth.js.
 */
export function updateAdminUI() {
    if (!adminPanelToggleBtn) { return; }
    console.log("Updating Admin UI based on isAdmin status:", isAdmin);
    adminPanelToggleBtn.classList.toggle('hidden', !isAdmin);
    if(adminPanelSection) adminPanelSection.classList.add('hidden'); // Ensure panel starts hidden
}

/**
 * Toggles the visibility of the main Admin Panel section.
 * Called when the adminPanelToggleBtn is clicked.
 * Needs to be exported so event-listeners.js can import it.
 */
export function toggleAdminPanel() { // <-- Added export keyword
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
 * (Internal helper function, doesn't need export)
 */
function clearAdminEnergyForm() {
    if (adminEditEnergyTypeId) adminEditEnergyTypeId.value = '';
    if (adminEnergyName) adminEnergyName.value = '';
    if (adminEnergyColor) adminEnergyColor.value = '#64748B';
    if (adminEnergyFormula) adminEnergyFormula.value = '';
    if (adminFormMessage) adminFormMessage.textContent = '';
    if (adminColorPreview) adminColorPreview.style.backgroundColor = '#64748B';
    if (adminSaveEnergyTypeBtn) adminSaveEnergyTypeBtn.textContent = 'Save Energy Type';
    console.log("Admin energy form cleared.");
}

/**
 * Updates the color preview swatch when the color input changes.
 * (Internal helper function, doesn't need export)
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
 * (Internal helper function)
 */
function populateCustomTypeList() {
    if (!adminCustomEnergyList) return;
    const customTypes = mergedEnergyTypes.filter(et => !et.isStandard);
    adminCustomEnergyList.innerHTML = '';
    if (customTypes.length === 0) { /* ... */ return; }
    customTypes.forEach(type => { /* ... create li, info, buttons ... */
        const editBtn = document.createElement('button'); /* ... setup ... */
        editBtn.addEventListener('click', handleEditCustomTypeClick); // Use function below
        const deleteBtn = document.createElement('button'); /* ... setup ... */
        deleteBtn.addEventListener('click', handleDeleteCustomTypeClick); // Use function below
        /* ... append elements ... */
    });
}

/**
 * Handles clicking the "Edit" button for a custom type.
 * Populates the admin form with the data of the selected type.
 * (Internal helper function)
 */
function handleEditCustomTypeClick(event) {
    const typeId = event.target.dataset.id;
    const typeToEdit = mergedEnergyTypes.find(et => et.id === typeId && !et.isStandard);
    if (typeToEdit && adminEditEnergyTypeId /* ... other form elements */) {
        // ... populate form fields ...
        adminSaveEnergyTypeBtn.textContent = 'Update Energy Type';
        adminEnergyName.focus();
    } else { /* ... error handling ... */ }
}

/**
 * Handles clicking the "Delete" button for a custom type.
 * (Internal helper function)
 */
async function handleDeleteCustomTypeClick(event) {
    const typeId = event.target.dataset.id;
    const typeToDelete = mergedEnergyTypes.find(et => et.id === typeId && !et.isStandard);
    if (!typeToDelete) { return; }
    if (confirm(`Are you sure you want to delete "${typeToDelete.name}"?`)) {
        const success = await deleteCustomEnergyType(typeId); // Use imported DB function
        if (success) {
            showMessage(`"${typeToDelete.name}" deleted. Refreshing...`, 'success');
            await refreshDataAndUI(); // Use helper below
        } else { /* ... error message ... */ }
    }
}

/**
 * Handles saving a new or edited custom energy type.
 * (Internal helper function)
 */
async function handleSaveEnergyType() {
    const typeId = adminEditEnergyTypeId?.value || null;
    const name = adminEnergyName?.value.trim();
    const color = adminEnergyColor?.value || '#000000';
    const formula = adminEnergyFormula?.value.trim();
    // --- Validation ---
    if (!name || !formula) { if(adminFormMessage) adminFormMessage.textContent = 'Name and Formula are required.'; return; }
    const validFormulaChars = /^[a-zA-Z0-9\s\+\-\*\/\(\)\.]+$/;
     if (!validFormulaChars.test(formula)) { if(adminFormMessage) adminFormMessage.textContent = 'Formula contains invalid characters.'; return; }
    if(adminFormMessage) adminFormMessage.textContent = '';
    // --- End Validation ---
    const energyData = { name, color, formula };
    const success = await saveCustomEnergyType(typeId, energyData); // Use imported DB function
    if (success) {
        showMessage(`"${name}" ${typeId ? 'updated' : 'saved'}. Refreshing...`, 'success');
        clearAdminEnergyForm();
        await refreshDataAndUI(); // Use helper below
    } else { /* ... error message ... */ }
}


/**
 * Helper function to refresh the merged energy types and update relevant UI parts.
 * (Internal helper function)
 */
async function refreshDataAndUI() {
    console.log("Refreshing data and UI after admin action...");
    await initializeAndMergeEnergyTypes(); // Re-fetch and merge state
    populateCustomTypeList(); // Update admin list display
    populateEnergyTypeDropdown(); // Update main dropdown display
    generateEnergySections(); // Regenerate pools/sliders based on new merged list
    console.log("UI refreshed.");
}


// --- Setup Admin Panel Event Listeners ---
/**
 * Attaches event listeners specific to the Admin Panel controls.
 * Exported function to be called once during initialization.
 */
export function setupAdminPanelListeners() {
    console.log("Setting up Admin Panel listeners...");
    adminPanelToggleBtn?.addEventListener('click', toggleAdminPanel); // Uses exported toggle function
    adminClearEnergyFormBtn?.addEventListener('click', clearAdminEnergyForm);
    adminEnergyColor?.addEventListener('input', handleColorChange);
    adminSaveEnergyTypeBtn?.addEventListener('click', handleSaveEnergyType);
    // Listeners for edit/delete buttons are added dynamically in populateCustomTypeList
}
