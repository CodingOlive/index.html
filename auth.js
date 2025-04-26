// auth.js - Handles Firebase Authentication logic and admin status check.

// --- Import Dependencies ---
// Firebase SDK Functions
import {
    GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

// Firebase App Instance
import { auth } from './firebase-init.js';

// DOM Elements for Auth UI & potentially Admin UI toggle
import { googleSignInBtn, signOutBtn, userInfoSpan, adminPanelToggleBtn, energyTypeSelect } from './dom-elements.js'; // Added energyTypeSelect

// State variables and functions
import {
    // Import state variables directly using 'export let' names
    currentUser,
    isAdmin,
    // Import functions
    initializeCoreState,
    initializeAndMergeEnergyTypes,
    mergedEnergyTypes // Needed for populating dropdown on logout
} from './state.js';

// Database function for loading state and checking admin status
import { loadStateAndApply, checkAdminStatus } from './database.js';

// UI feedback and initialization functions
import { showMessage } from './ui-feedback.js';
import { initializeDefaultUI, updateStatsDisplay, displayEnergyPool, updateAttackButtonStates, updateSliderLimitAndStyle, updateSpeedSliderVisibility } from './ui-updater.js'; // Added more UI updaters

// Import generator/updater functions needed *after* merge
import { generateEnergySections, populateEnergyTypeDropdown, renderFormList, renderActiveFormsSection } from './dom-generators.js';
import { updateEquationDisplay } from './equation.js';
import { ALL_ENERGY_TYPES, ENERGY_TYPE_DETAILS } from './config.js'; // Needed for logout dropdown reset
import { updateAdminUI } from './admin.js'; // Import admin UI updater


// --- Authentication Functions ---

export async function handleGoogleSignIn() {
    if (!auth) { showMessage('Firebase Auth not initialized.', 'error'); return; }
    const provider = new GoogleAuthProvider();
    try { await signInWithPopup(auth, provider); }
    catch (error) { /* ... error handling ... */ }
}

export async function handleSignOut() {
     if (!auth) { showMessage('Firebase Auth not initialized.', 'error'); return; }
     try { await signOut(auth); }
     catch (error) { /* ... error handling ... */ }
}

/**
 * Sets up the listener that reacts to user sign-in/sign-out events.
 */
export function setupAuthListener() {
    if (!auth) { /* ... error handling ... */ return; }

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // --- User is signed in ---
            // Modify the imported 'let' variables directly
            currentUser = user;
            console.log("Auth Listener: User signed in:", user.displayName, user.uid);
            // Update Auth UI
            if (userInfoSpan) userInfoSpan.textContent = `Signed in as: ${user.displayName || user.email || 'User'}`;
            if (googleSignInBtn) googleSignInBtn.classList.add('hidden');
            if (signOutBtn) signOutBtn.classList.remove('hidden');

            // Check Admin Status & Update State
            isAdmin = await checkAdminStatus(user.uid); // Modify imported 'let'
            console.log("Admin status checked:", isAdmin);
            updateAdminUI(); // Update button visibility based on new status

            // Attempt to load state
            console.log("Auth Listener: Attempting to load state...");
            let stateLoaded = false;
            try { stateLoaded = await loadStateAndApply(user.uid); }
            catch (loadError) { console.error("Auth Listener: Error loading state:", loadError); }

            // Initialize core state if nothing was loaded
            if (!stateLoaded) {
                console.log("Auth Listener: No state loaded, initializing core state.");
                initializeCoreState(); // Resets state vars (incl. isAdmin to false)
                isAdmin = await checkAdminStatus(user.uid); // Re-check admin status AFTER core state reset
                updateAdminUI(); // Ensure button visibility is correct after reset
            }

            // Load and Merge Energy Types
            await initializeAndMergeEnergyTypes();

            // Initialize/Update UI AFTER merge
            generateEnergySections(); // Regenerate pools/sliders using merged list
            populateEnergyTypeDropdown(); // Populate dropdown using merged list
            updateSpeedSliderVisibility();
            renderFormList();
            renderActiveFormsSection();

            // Final UI updates based on loaded/default state + merged types
             const finalSelectedType = energyTypeSelect?.value;
             if (finalSelectedType) {
                 displayEnergyPool(finalSelectedType);
                 updateAttackButtonStates(finalSelectedType);
                 updateSliderLimitAndStyle(finalSelectedType);
             }
            updateStatsDisplay();
            updateEquationDisplay();

            // Show appropriate welcome message
            if (!stateLoaded) { showMessage('Welcome! No saved state found, starting fresh.', 'info'); }
            else { showMessage(`Welcome back, ${user.displayName || 'User'}! State loaded.`, 'success'); }

        } else {
            // --- User is signed out ---
            currentUser = null; // Modify imported 'let'
            isAdmin = false;    // Modify imported 'let'
            console.log("Auth Listener: User signed out.");
            // Update Auth UI
             if (userInfoSpan) userInfoSpan.textContent = 'Not signed in.';
             if (googleSignInBtn) googleSignInBtn.classList.remove('hidden');
             if (signOutBtn) signOutBtn.classList.add('hidden');
             updateAdminUI(); // Hide admin button

            // Reset state and UI fully to defaults
            initializeCoreState();
            initializeDefaultUI();

            // Regenerate standard pools/sliders after reset
            generateEnergySections();
            updateSpeedSliderVisibility();
            // Populate dropdown with standard types only
            populateEnergyTypeDropdown();

             // Ensure default energy type is displayed correctly after reset
             const defaultSelectedType = energyTypeSelect?.value;
             if (defaultSelectedType) {
                 displayEnergyPool(defaultSelectedType);
                 updateAttackButtonStates(defaultSelectedType);
                 updateSliderLimitAndStyle(defaultSelectedType);
             }
             updateStatsDisplay();
             updateEquationDisplay();
        }
        console.log("Auth state change processed, including admin check and UI update.");
    });
}

