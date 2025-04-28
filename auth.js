// auth.js - Handles Firebase Authentication logic, admin status check, and initial UI setup coordination.

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
    currentUser, // Read-only access is fine now
    isAdmin,     // Read-only access is fine now
    // Import state functions
    initializeCoreState,
    initializeAndMergeEnergyTypes,
    mergedEnergyTypes, // Needed for populating dropdown on logout
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
import { ALL_ENERGY_TYPES, ENERGY_TYPE_DETAILS } from './config.js'; // Needed for logout dropdown reset
import { updateAdminUI } from './admin.js'; // Import admin UI updater


// --- Authentication Functions ---

export async function handleGoogleSignIn() {
    if (!auth) { showMessage('Firebase Auth not initialized.', 'error'); return; }
    const provider = new GoogleAuthProvider();
    try {
        console.log("Attempting Google Sign-in...");
        await signInWithPopup(auth, provider);
        // onAuthStateChanged handles success message and state loading
    } catch (error) {
        console.error("Google Sign-in error:", error);
        if (error.code === 'auth/popup-closed-by-user') { showMessage('Sign-in cancelled.', 'info'); }
        else if (error.code === 'auth/network-request-failed') { showMessage('Network error. Check connection.', 'error'); }
        else { showMessage(`Google Sign-in failed: ${error.message}`, 'error'); }
    }
}

export async function handleSignOut() {
     if (!auth) { showMessage('Firebase Auth not initialized.', 'error'); return; }
     try {
         await signOut(auth);
         // onAuthStateChanged handles success message and state reset
     } catch (error) {
         console.error("Sign-out error:", error);
         showMessage(`Sign-out failed: ${error.message}`, 'error');
     }
}

/**
 * Sets up the listener that reacts to user sign-in/sign-out events.
 */
export function setupAuthListener() {
    if (!auth) {
        console.error("Cannot setup auth listener: Firebase Auth not initialized.");
        initializeCoreState();
        initializeDefaultUI();
        return;
    }

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
            updateAdminUI(currentAdminStatus); // Pass status to UI update function

            // Attempt to load state
            console.log("Auth Listener: Attempting to load state...");
            let stateLoaded = false;
            try { stateLoaded = await loadStateAndApply(user.uid); } // Calls applyState if successful
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
                updateAdminUI(currentAdminStatus); // Pass status again
            }

            // Load and Merge Energy Types
            console.log("Auth Listener: Calling initializeAndMergeEnergyTypes...");
            await initializeAndMergeEnergyTypes(); // Populates state.mergedEnergyTypes
            console.log("Auth Listener: initializeAndMergeEnergyTypes finished. Merged count:", mergedEnergyTypes.length);

            // Initialize/Update UI AFTER merge
            console.log("Auth Listener: Calling generateEnergySections...");
            generateEnergySections(); // Regenerate pools/sliders using merged list
            console.log("Auth Listener: Calling populateEnergyTypeDropdown...");
            populateEnergyTypeDropdown(); // Populate dropdown using merged list
            console.log("Auth Listener: Calling updateSpeedSliderVisibility...");
            updateSpeedSliderVisibility();
            console.log("Auth Listener: Calling renderFormList...");
            renderFormList(); // Re-render based on potentially loaded characterForms state
            console.log("Auth Listener: Calling renderActiveFormsSection...");
            renderActiveFormsSection(); // Re-render based on potentially loaded state

            // Final UI updates based on loaded/default state + merged types
             const finalSelectedType = energyTypeSelect?.value; // Read value *after* population
             console.log("Auth Listener: Final selected type for UI update:", finalSelectedType);
             if (finalSelectedType) {
                 console.log("Auth Listener: Calling displayEnergyPool...");
                 displayEnergyPool(finalSelectedType);
                 console.log("Auth Listener: Calling updateAttackButtonStates...");
                 updateAttackButtonStates(finalSelectedType);
                 console.log("Auth Listener: Calling updateSliderLimitAndStyle...");
                 updateSliderLimitAndStyle(finalSelectedType);
             }
            console.log("Auth Listener: Calling updateStatsDisplay...");
            updateStatsDisplay();
            console.log("Auth Listener: Calling updateEquationDisplay...");
            updateEquationDisplay();

            // Show appropriate welcome message
            if (!stateLoaded) {
                 // If starting fresh, call initializeDefaultUI AFTER generating sections/dropdowns
                 console.log("Auth Listener: Initializing default UI values...");
                 initializeDefaultUI();
                 showMessage('Welcome! No saved state found, starting fresh.', 'info');
            } else {
                showMessage(`Welcome back, ${user.displayName || 'User'}! State loaded.`, 'success');
            }

        } else {
            // --- User is signed out ---
            setCurrentUser(null); // Use setter
            setIsAdmin(false);    // Use setter
            console.log("Auth Listener: User signed out.");
            // Update Auth UI
             if (userInfoSpan) userInfoSpan.textContent = 'Not signed in.';
             if (googleSignInBtn) googleSignInBtn.classList.remove('hidden');
             if (signOutBtn) signOutBtn.classList.add('hidden');
             updateAdminUI(false); // Hide admin button

            // Reset state and UI fully to defaults
            initializeCoreState(); // Resets state vars (incl. mergedEnergyTypes, isAdmin)
            initializeDefaultUI(); // Resets DOM element values/visibility

            // Regenerate standard pools/sliders after reset
            generateEnergySections(); // Will use empty/standard merged list
            updateSpeedSliderVisibility();
            // Populate dropdown with standard types only
            populateEnergyTypeDropdown(); // Will use empty/standard merged list

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
