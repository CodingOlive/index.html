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

export function updateAdminUI(showAdminFeatures) {
    if (!adminPanelToggleBtn) {
        console.error("ADMIN_DEBUG: Admin Panel Toggle Button (#admin-panel-toggle-btn) not found in DOM!");
        return;
    }
    console.log("ADMIN_DEBUG: Updating Admin UI based on passed status:", showAdminFeatures);
    adminPanelToggleBtn.classList.toggle('hidden', !showAdminFeatures);
    console.log("ADMIN_DEBUG: Admin button classList after toggle:", adminPanelToggleBtn.classList.toString());
    console.log("ADMIN_DEBUG: Admin button hidden property:", adminPanelToggleBtn.hidden);
    if(adminPanelSection && !showAdminFeatures) {
        adminPanelSection.classList.add('hidden');
    }
}

export function toggleAdminPanel() {
    if (!adminPanelSection) return;
    const isHidden = adminPanelSection.classList.toggle('hidden');
    console.log("Admin panel toggled:", isHidden ? "Hidden" : "Visible");
    if (!isHidden) {
        populateCustomTypeList();
        adminPanelSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

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

function handleColorChange() {
    if(adminEnergyColor && adminColorPreview) {
        adminColorPreview.style.backgroundColor = adminEnergyColor.value;
    }
}

// --- Admin Data Logic ---

function populateCustomTypeList() {
    if (!adminCustomEnergyList) return;
    const customTypes = mergedEnergyTypes.filter(et => !et.isStandard);
    adminCustomEnergyList.innerHTML = '';
    if (customTypes.length === 0) { adminCustomEnergyList.innerHTML = '<li>No custom types defined yet.</li>'; return; }
    customTypes.forEach(type => { /* ... create li, info, buttons ... */
        const li = document.createElement('li'); li.className = 'flex justify-between items-center py-1 border-b border-gray-200 last:border-b-0';
        const typeInfo = document.createElement('span'); typeInfo.innerHTML = `<strong style="color: ${type.color || '#000'}; border-bottom: 2px solid ${type.color || '#CCC'}; padding-bottom: 1px;">${type.name}</strong> <code class="ml-2 text-xs bg-gray-200 px-1 rounded">${type.formula || 'No Formula'}</code>`;
        const buttons = document.createElement('div'); buttons.className = 'flex gap-2';
        const editBtn = document.createElement('button'); editBtn.textContent = 'Edit'; editBtn.className = 'text-xs text-blue-600 hover:text-blue-800 focus:outline-none'; editBtn.dataset.id = type.id; editBtn.addEventListener('click', handleEditCustomTypeClick);
        const deleteBtn = document.createElement('button'); deleteBtn.textContent = 'Delete'; deleteBtn.className = 'text-xs text-red-600 hover:text-red-800 focus:outline-none'; deleteBtn.dataset.id = type.id; deleteBtn.addEventListener('click', handleDeleteCustomTypeClick);
        buttons.appendChild(editBtn); buttons.appendChild(deleteBtn); li.appendChild(typeInfo); li.appendChild(buttons); adminCustomEnergyList.appendChild(li);
     });
}

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

async function handleDeleteCustomTypeClick(event) {
    const typeId = event.target.dataset.id;
    const typeToDelete = mergedEnergyTypes.find(et => et.id === typeId && !et.isStandard);
    if (!typeToDelete) { return; }
    if (confirm(`Are you sure you want to delete the custom energy type "${typeToDelete.name}"? This cannot be undone.`)) {
        console.log("Attempting to delete custom type:", typeId);
        const success = await deleteCustomEnergyType(typeId);
        if (success) {
            showMessage(`Custom type "${typeToDelete.name}" deleted. Refreshing...`, 'success');
            await refreshDataAndUI();
        } else { showMessage(`Failed to delete custom type "${typeToDelete.name}".`, 'error'); }
    }
}

/**
 * Handles saving a new or edited custom energy type.
 */
async function handleSaveEnergyType() {
    console.log("ADMIN_DEBUG: handleSaveEnergyType triggered!"); // <-- ADDED DEBUG LOG

    // Read values from form
    const typeId = adminEditEnergyTypeId?.value || null;
    const name = adminEnergyName?.value.trim();
    const color = adminEnergyColor?.value || '#000000';
    const formula = adminEnergyFormula?.value.trim();

    // Validation
    if (!name) { if(adminFormMessage) adminFormMessage.textContent = 'Energy Name is required.'; return; }
    if (!formula) { if(adminFormMessage) adminFormMessage.textContent = 'Formula is required.'; return; }
    const validFormulaChars = /^[a-zA-Z0-9\s\+\-\*\/\(\)\.]+$/;
     if (!validFormulaChars.test(formula)) { if(adminFormMessage) adminFormMessage.textContent = 'Formula contains invalid characters.'; return; }
    if(adminFormMessage) adminFormMessage.textContent = '';

    const energyData = { name, color, formula };
    console.log("Attempting to save custom energy type:", typeId ? "Update" : "New", energyData);

    // Call database function
    const success = await saveCustomEnergyType(typeId, energyData);
    if (success) {
        showMessage(`Custom type "${name}" ${typeId ? 'updated' : 'saved'} successfully. Refreshing...`, 'success');
        clearAdminEnergyForm();
        await refreshDataAndUI(); // Refresh UI after successful save
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
    console.log("UI refreshed.");
}


/**
 * Attaches event listeners specific to the Admin Panel controls.
 */
export function setupAdminPanelListeners() {
    console.log("Setting up Admin Panel listeners...");
    adminPanelToggleBtn?.addEventListener('click', toggleAdminPanel);
    adminClearEnergyFormBtn?.addEventListener('click', clearAdminEnergyForm);
    adminEnergyColor?.addEventListener('input', handleColorChange);
    adminSaveEnergyTypeBtn?.addEventListener('click', handleSaveEnergyType); // Ensure this listener is attached
}

