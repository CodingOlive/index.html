// auth.js - Handles Firebase Authentication logic and admin status check.

// --- Import Dependencies ---
// Firebase SDK Functions
import {
    GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

// Firebase App Instance
import { auth } from './firebase-init.js';

// DOM Elements for Auth UI & potentially Admin UI toggle
import { googleSignInBtn, signOutBtn, userInfoSpan /*, adminPanelButton */ } from './dom-elements.js';

// State variables and functions
import {
    currentUser as _currentUserFromState, // Import and rename currentUser
    isAdmin as _isAdminFromState,       // Import and rename isAdmin
    initializeCoreState,
    initializeAndMergeEnergyTypes,
    mergedEnergyTypes // Needed for populating dropdown on logout
} from './state.js';
// Use local variables linked to the exported 'let' state variables
// We need direct access to modify the imported 'let' variables
// let currentUser = _currentUserFromState; // No need for separate local variable
// let isAdmin = _isAdminFromState;       // <<<< REMOVED THIS REDUNDANT DECLARATION

// Database function for loading state and checking admin status
import { loadStateAndApply, checkAdminStatus } from './database.js';

// UI feedback and initialization functions
import { showMessage } from './ui-feedback.js';
import { initializeDefaultUI } from './ui-updater.js';

// Import generator/updater functions needed *after* merge
import { generateEnergySections, populateEnergyTypeDropdown, renderFormList, renderActiveFormsSection } from './dom-generators.js';
import { updateSpeedSliderVisibility, updateStatsDisplay, displayEnergyPool, updateAttackButtonStates, updateSliderLimitAndStyle } from './ui-updater.js';
import { updateEquationDisplay } from './equation.js';
import { energyTypeSelect } from './dom-elements.js';
import { ALL_ENERGY_TYPES, ENERGY_TYPE_DETAILS } from './config.js';


// --- Authentication Functions ---

// ... (Rest of the functions: handleGoogleSignIn, handleSignOut, setupAuthListener) ...
// IMPORTANT: Inside setupAuthListener, make sure you are using _isAdminFromState
//            when reading/writing the admin status, OR remove the 'as _isAdminFromState'
//            from the import and just use 'isAdmin' everywhere. Let's stick with
//            using '_isAdminFromState' for now as per the import.

export async function handleGoogleSignIn() { /* ... */ }
export async function handleSignOut() { /* ... */ }

export function setupAuthListener() {
    if (!auth) { /* ... */ return; }

    onAuthStateChanged(auth, async (user) => {
        let currentUser = _currentUserFromState; // Use the imported variable reference locally if needed
        let isAdmin = _isAdminFromState;       // Use the imported variable reference locally

        if (user) {
            // --- User is signed in ---
            // Update the actual state variable via its reference
            _currentUserFromState = user; // Modify the original exported variable
            console.log("Auth Listener: User signed in:", user.displayName, user.uid);
            if (userInfoSpan) userInfoSpan.textContent = `Signed in as: ${user.displayName || user.email || 'User'}`;
            if (googleSignInBtn) googleSignInBtn.classList.add('hidden');
            if (signOutBtn) signOutBtn.classList.remove('hidden');

            // Check Admin Status & Update the actual state variable
            _isAdminFromState = await checkAdminStatus(user.uid);
            console.log("Admin status checked:", _isAdminFromState); // Use the renamed variable
            updateAdminUI(); // This function should read the state directly or be passed the status

            // ... (rest of login logic using _isAdminFromState where needed) ...

        } else {
            // --- User is signed out ---
             _currentUserFromState = null; // Update the original exported variable
             _isAdminFromState = false;    // Update the original exported variable
            console.log("Auth Listener: User signed out.");
            // ... (rest of logout logic) ...
            updateAdminUI(); // Update UI based on reset admin status
        }
        console.log("Auth state change processed, including admin check.");
    });
}