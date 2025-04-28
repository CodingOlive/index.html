// admin.js - Logic for the Admin Panel (Energy Type Creator)

// --- Import Dependencies ---
import {
    adminPanelToggleBtn, adminPanelSection, adminEditEnergyTypeId, adminEnergyName,
    adminEnergyColor, adminEnergyFormula, adminSaveEnergyTypeBtn, adminClearEnergyFormBtn,
    adminFormMessage, adminCustomEnergyList, adminColorPreview
} from './dom-elements.js';

// Import state variables needed for LISTING types, and the merge function
import { mergedEnergyTypes, initializeAndMergeEnergyTypes } from './state.js';
// NOTE: Removed direct import of 'isAdmin' as it will be passed as a parameter

import { showMessage } from './ui-feedback.js';
import { saveCustomEnergyType, deleteCustomEnergyType } from './database.js';
import { populateEnergyTypeDropdown, generateEnergySections } from './dom-generators.js';


// --- Admin Panel UI Logic ---

/**
 * Shows or hides Admin Panel elements based on the provided status.
 * Called after login/logout in auth.js.
 * @param {boolean} showAdminFeatures - True if the user is an admin, false otherwise.
 */
export function updateAdminUI(showAdminFeatures) { // <-- Accepts parameter now
    if (!adminPanelToggleBtn) { return; }
    console.log("Updating Admin UI based on passed status:", showAdminFeatures); // Log the passed value
    adminPanelToggleBtn.classList.toggle('hidden', !showAdminFeatures); // Use the parameter
    // Ensure panel is hidden initially regardless of admin status when UI is first updated
    if(adminPanelSection) adminPanelSection.classList.add('hidden');
}

/**
 * Toggles the visibility of the main Admin Panel section.
 * Called when the adminPanelToggleBtn is clicked.
 */
export function toggleAdminPanel() { // <-- Keep export here for event listener
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
    // ... (function content remains the same) ...
}

/**
 * Updates the color preview swatch when the color input changes.
 */
function handleColorChange() {
    // ... (function content remains the same) ...
}

// --- Admin Data Logic ---

/**
 * Populates the list (#adminCustomEnergyList) with existing custom types.
 */
function populateCustomTypeList() {
    // ... (function content remains the same) ...
}

/**
 * Handles clicking the "Edit" button for a custom type.
 */
function handleEditCustomTypeClick(event) {
    // ... (function content remains the same) ...
}

/**
 * Handles clicking the "Delete" button for a custom type.
 */
async function handleDeleteCustomTypeClick(event) {
    // ... (function content remains the same - calls deleteCustomEnergyType, refreshDataAndUI) ...
}

/**
 * Handles saving a new or edited custom energy type.
 */
async function handleSaveEnergyType() {
    // ... (function content remains the same - calls saveCustomEnergyType, refreshDataAndUI) ...
}


/**
 * Helper function to refresh the merged energy types and update relevant UI parts.
 */
async function refreshDataAndUI() {
    // ... (function content remains the same - calls initializeAndMergeEnergyTypes, etc.) ...
}


// --- Setup Admin Panel Event Listeners ---
/**
 * Attaches event listeners specific to the Admin Panel controls.
 */
export function setupAdminPanelListeners() {
    // ... (function content remains the same - adds listeners to buttons) ...
}

