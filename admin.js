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
 * Shows or hides Admin Panel elements based on the provided status.
 * Called after login/logout in auth.js.
 * @param {boolean} isAdminStatus - The current admin status of the user.
 */
export function updateAdminUI(isAdminStatus) {
    if (!adminPanelToggleBtn) { return; }
    console.log("Updating Admin UI based on isAdmin status:", isAdminStatus);
    adminPanelToggleBtn.classList.toggle('hidden', !isAdminStatus);
    if(adminPanelSection) adminPanelSection.classList.add('hidden'); // Ensure panel starts hidden
}

/**
 * Toggles the visibility of the main Admin Panel section.
 * Called when the adminPanelToggleBtn is clicked.
 * Needs to be exported so event-listeners.js can import it.
 */
export function toggleAdminPanel() {
    if (!adminPanelSection) return;
    const isHidden = adminPanelSection.classList.toggle('hidden');
    console.log("Admin panel toggled:", isHidden ? "Hidden" : "Visible");
    if (!isHidden) {
        populateCustomTypeList(); // Refresh list when shown
        adminPanelSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// --- Internal Helper Functions ---

/**
 * Clears the input fields in the admin energy type creator form.
 * (Internal helper function, doesn't need export)
 */
function clearAdminEnergyForm() { // <-- DEFINED ONCE HERE
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

/**
 * Populates the list (#adminCustomEnergyList) with existing custom types.
 * Filters the mergedEnergyTypes list.
 * (Internal helper function)
 */
function populateCustomTypeList() {
    if (!adminCustomEnergyList) return;
    const customTypes = mergedEnergyTypes.filter(et => !et.isStandard);
    adminCustomEnergyList.innerHTML = '';
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
        editBtn.addEventListener('click', handleEditCustomTypeClick); // Use function below
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.className = 'text-xs text-red-600 hover:text-red-800 focus:outline-none';
        deleteBtn.dataset.id = type.id;
        deleteBtn.addEventListener('click', handleDeleteCustomTypeClick); // Use function below
        buttons.appendChild(editBtn); buttons.appendChild(deleteBtn);
        li.appendChild(typeInfo); li.appendChild(buttons);
        adminCustomEnergyList.appendChild(li);
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
    if (typeToEdit && adminEditEnergyTypeId && adminEnergyName && adminEnergyColor && adminEnergyFormula && adminColorPreview && adminSaveEnergyTypeBtn) {
        adminEditEnergyTypeId.value = typeToEdit.id;
        adminEnergyName.value = typeToEdit.name;
        adminEnergyColor.value = typeToEdit.color || '#64748B';
        adminEnergyFormula.value = typeToEdit.formula || '';
        adminColorPreview.style.backgroundColor = adminEnergyColor.value;
        adminSaveEnergyTypeBtn.textContent = 'Update Energy Type';
        adminEnergyName.focus();
    } else { console.error("Could not find custom type to edit or form elements missing.", typeId); }
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
        } else { showMessage(`Failed to delete "${typeToDelete.name}".`, 'error'); }
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
        clearAdminEnergyForm(); // Use internal helper
        await refreshDataAndUI(); // Use helper below
    } else { showMessage(`Failed to save "${name}".`, 'error'); }
}


/**
 * Helper function to refresh the merged energy types and update relevant UI parts.
 * (Internal helper function)
 */
async function refreshDataAndUI() {
    console.log("Refreshing data and UI after admin action...");
    await initializeAndMergeEnergyTypes(); // Re-fetch and merge state
    populateCustomTypeList(); // Update admin list display (uses function in this file)
    populateEnergyTypeDropdown(); // Update main dropdown display (uses imported function)
    generateEnergySections(); // Regenerate pools/sliders based on new merged list (uses imported function)
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
    adminClearEnergyFormBtn?.addEventListener('click', clearAdminEnergyForm); // Uses internal helper
    adminEnergyColor?.addEventListener('input', handleColorChange); // Uses internal helper
    adminSaveEnergyTypeBtn?.addEventListener('click', handleSaveEnergyType); // Uses internal helper
    // Listeners for edit/delete buttons are added dynamically in populateCustomTypeList
}

// NOTE: Ensure clearAdminEnergyForm is defined ONLY ONCE (above) in this file.

