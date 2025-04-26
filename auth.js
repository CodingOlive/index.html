// auth.js - Handles Firebase Authentication logic and admin status check.

// --- Import Dependencies ---
// Firebase SDK Functions
import {
    GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

// Firebase App Instance
import { auth } from './firebase-init.js';

// DOM Elements for Auth UI & potentially Admin UI toggle
import { googleSignInBtn, signOutBtn, userInfoSpan, adminPanelToggleBtn, energyTypeSelect } from './dom-elements.js';

// State variables and functions
import {
    // Import state variables directly using 'export let' names
    currentUser, // Import directly
    isAdmin,     // Import directly
    // Import functions
    initializeCoreState,
    initializeAndMergeEnergyTypes,
    mergedEnergyTypes
} from './state.js';

// Database function for loading state and checking admin status
import { loadStateAndApply, checkAdminStatus } from './database.js';

// UI feedback and initialization functions
import { showMessage } from './ui-feedback.js';
import { initializeDefaultUI, updateStatsDisplay, displayEnergyPool, updateAttackButtonStates, updateSliderLimitAndStyle, updateSpeedSliderVisibility } from './ui-updater.js';

// Import generator/updater functions needed *after* merge
import { generateEnergySections, populateEnergyTypeDropdown, renderFormList, renderActiveFormsSection } from './dom-generators.js';
import { updateEquationDisplay } from './equation.js';
import { ALL_ENERGY_TYPES, ENERGY_TYPE_DETAILS } from './config.js';
import { updateAdminUI } from './admin.js';


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
        console.log("Auth state changed. User object:", user); // Log user object immediately

        if (user) {
            // --- User is signed in ---
            console.log("Auth Listener: User signed in. Current `currentUser` (before assignment):", currentUser); // Log BEFORE assignment
            console.log("Auth Listener: User object received:", user);
            try {
                // Modify the imported 'let' variables directly using their original names
                currentUser = user; // Assign directly to imported 'currentUser' - ERROR LIKELY HERE (line ~64)
                console.log("Auth Listener: Assignment to `currentUser` successful.");
            } catch (e) {
                console.error("!!! Error assigning to currentUser !!!", e); // Catch specific error
            }
            console.log("Auth Listener: `currentUser` (after assignment attempt):", currentUser);

            // Update Auth UI
            if (userInfoSpan) userInfoSpan.textContent = `Signed in as: ${user.displayName || user.email || 'User'}`;
            if (googleSignInBtn) googleSignInBtn.classList.add('hidden');
            if (signOutBtn) signOutBtn.classList.remove('hidden');

            // Check Admin Status & Update State
            console.log("Auth Listener: Current `isAdmin` (before check):", isAdmin); // Log BEFORE assignment
            let adminStatusResult = false; // Default
            try {
                adminStatusResult = await checkAdminStatus(user.uid);
                isAdmin = adminStatusResult; // Assign directly to imported 'isAdmin' - ERROR MIGHT BE HERE TOO
                console.log("Auth Listener: Assignment to `isAdmin` successful.");
            } catch (e) {
                 console.error("!!! Error assigning to isAdmin !!!", e); // Catch specific error
            }
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
                // Re-check admin status AFTER core state reset
                console.log("Auth Listener: Re-checking admin status after core state reset...");
                try {
                     isAdmin = await checkAdminStatus(user.uid); // Re-assign
                     console.log("Auth Listener: Re-assignment to `isAdmin` successful.");
                } catch(e) {
                     console.error("!!! Error re-assigning to isAdmin !!!", e);
                }
                console.log("Admin status after reset/re-check:", isAdmin);
                updateAdminUI(); // Ensure button visibility is correct after reset
            }

            // Load and Merge Energy Types
            await initializeAndMergeEnergyTypes();

            // Initialize/Update UI AFTER merge
            generateEnergySections();
            populateEnergyTypeDropdown();
            updateSpeedSliderVisibility();
            renderFormList();
            renderActiveFormsSection();

            // Final UI updates
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
            console.log("Auth Listener: User signed out. Current `currentUser` (before null assignment):", currentUser);
             try {
                 currentUser = null; // Modify imported 'let'
                 console.log("Auth Listener: Assigned null to `currentUser`.");
             } catch(e) { console.error("!!! Error assigning null to currentUser !!!", e); }

             console.log("Auth Listener: Current `isAdmin` (before false assignment):", isAdmin);
             try {
                 isAdmin = false;    // Modify imported 'let'
                 console.log("Auth Listener: Assigned false to `isAdmin`.");
             } catch(e) { console.error("!!! Error assigning false to isAdmin !!!", e); }

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
