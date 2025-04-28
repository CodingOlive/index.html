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
    // Import state variables for reading if needed elsewhere
    currentUser,
    isAdmin,
    // Import state functions
    initializeCoreState,
    initializeAndMergeEnergyTypes,
    mergedEnergyTypes,
    // Import SETTER functions
    setCurrentUser,
    setIsAdmin
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
        console.log("Auth state changed. User object:", user);

        if (user) {
            // --- User is signed in ---
            setCurrentUser(user); // Use setter
            console.log("Auth Listener: User signed in:", user.displayName, user.uid);
            // Update Auth UI
            if (userInfoSpan) userInfoSpan.textContent = `Signed in as: ${user.displayName || user.email || 'User'}`;
            if (googleSignInBtn) googleSignInBtn.classList.add('hidden');
            if (signOutBtn) signOutBtn.classList.remove('hidden');

            // Check Admin Status & Update State via SETTER
            let currentAdminStatus = false; // Local variable to hold result
            try {
                currentAdminStatus = await checkAdminStatus(user.uid);
                setIsAdmin(currentAdminStatus); // Use setter
                console.log("Auth Listener: Set isAdmin via setter:", currentAdminStatus);
            } catch (e) {
                 console.error("!!! Error checking admin status or setting isAdmin !!!", e);
                 setIsAdmin(false); // Default to false on error
                 currentAdminStatus = false; // Ensure local var is also false
            }
            // >>>>> VERIFY THIS CALL: Pass the local variable 'currentAdminStatus' <<<<<
            updateAdminUI(currentAdminStatus);

            // Attempt to load state
            console.log("Auth Listener: Attempting to load state...");
            let stateLoaded = false;
            try { stateLoaded = await loadStateAndApply(user.uid); }
            catch (loadError) { console.error("Auth Listener: Error loading state:", loadError); }

            // Initialize core state if nothing was loaded
            if (!stateLoaded) {
                console.log("Auth Listener: No state loaded, initializing core state.");
                initializeCoreState(); // Resets state vars (incl. isAdmin to false via its own setter call)
                // Re-check admin status AFTER core state reset
                console.log("Auth Listener: Re-checking admin status after core state reset...");
                try {
                     currentAdminStatus = await checkAdminStatus(user.uid); // Check again, update local var
                     setIsAdmin(currentAdminStatus); // Use setter again
                     console.log("Auth Listener: Re-set isAdmin via setter:", currentAdminStatus);
                } catch(e) {
                     console.error("!!! Error re-setting isAdmin !!!", e);
                     setIsAdmin(false); currentAdminStatus = false; // Ensure state and local var are false
                }
                 // >>>>> VERIFY THIS CALL: Pass the local variable 'currentAdminStatus' <<<<<
                updateAdminUI(currentAdminStatus);
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
            setCurrentUser(null); // Use setter
            setIsAdmin(false);    // Use setter
            console.log("Auth Listener: User signed out.");
            // Update Auth UI
             if (userInfoSpan) userInfoSpan.textContent = 'Not signed in.';
             if (googleSignInBtn) googleSignInBtn.classList.remove('hidden');
             if (signOutBtn) signOutBtn.classList.add('hidden');
             // >>>>> VERIFY THIS CALL: Pass 'false' directly <<<<<
             updateAdminUI(false);

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
        console.log("Auth state change processed, using setters and passing status to UI update.");
    });
}
