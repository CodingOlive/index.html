// auth.js - Handles Firebase Authentication logic and admin status check.

// --- Import Dependencies ---
// Firebase SDK Functions
import {
    GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

// Firebase App Instance
import { auth } from './firebase-init.js'; // <-- IMPORTED HERE

// DOM Elements for Auth UI & potentially Admin UI toggle
import { googleSignInBtn, signOutBtn, userInfoSpan, adminPanelToggleBtn, energyTypeSelect } from './dom-elements.js';

// State variables and functions
import {
    currentUser, isAdmin, // Import state variables directly
    initializeCoreState, initializeAndMergeEnergyTypes, mergedEnergyTypes,
    setCurrentUser, setIsAdmin // Import setters
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
    if (!auth) { showMessage('Firebase Auth not initialized.', 'error'); return; } // Uses imported auth
    const provider = new GoogleAuthProvider();
    try { await signInWithPopup(auth, provider); } // Uses imported auth
    catch (error) { /* ... error handling ... */ }
}

export async function handleSignOut() {
     if (!auth) { showMessage('Firebase Auth not initialized.', 'error'); return; } // Uses imported auth
     try { await signOut(auth); } // Uses imported auth
     catch (error) { /* ... error handling ... */ }
}

/**
 * Sets up the listener that reacts to user sign-in/sign-out events.
 */
export function setupAuthListener() {
    // Uses imported auth
    if (!auth) { // <-- CHECK HAPPENS HERE (Line ~48 in this version)
        console.error("Cannot setup auth listener: Firebase Auth not initialized.");
        initializeCoreState();
        initializeDefaultUI();
        return;
    }

    onAuthStateChanged(auth, async (user) => { // Uses imported auth and onAuthStateChanged
        console.log("Auth state changed. User object:", user);

        if (user) {
            // --- User is signed in ---
            setCurrentUser(user);
            console.log("Auth Listener: User signed in:", user.displayName, user.uid);
            // ... (Update Auth UI) ...

            // Check Admin Status & Update State via SETTER
            let currentAdminStatus = false;
            try {
                currentAdminStatus = await checkAdminStatus(user.uid);
                setIsAdmin(currentAdminStatus);
                console.log("Auth Listener: Set isAdmin via setter:", currentAdminStatus);
            } catch (e) { /* ... error handling ... */ setIsAdmin(false); currentAdminStatus = false; }
            updateAdminUI(currentAdminStatus);

            // ... (rest of login logic: load state, merge types, update UI) ...

        } else {
            // --- User is signed out ---
            setCurrentUser(null);
            setIsAdmin(false);
            console.log("Auth Listener: User signed out.");
            // ... (rest of logout logic: update UI, reset state, generate/populate standard UI) ...
        }
        console.log("Auth state change processed, using setters and passing status to UI update.");
    });
}
