// auth.js - Handles Firebase Authentication logic.

// --- Import Dependencies ---
// Firebase SDK Functions
import {
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

// Firebase App Instance
import { auth } from './firebase-init.js';

// DOM Elements for Auth UI
import { googleSignInBtn, signOutBtn, userInfoSpan } from './dom-elements.js';

// State variables and functions
// Import 'currentUser' to modify it, and core state reset function
import { currentUser as _currentUserFromState, initializeCoreState } from './state.js';
// Since we are modifying an imported 'let', it's slightly safer to rename it
// locally to avoid potential confusion, though direct modification works.
// We'll use a setter function approach for clarity if state.js provides one later.
// For now, we modify directly. Let's rename for local clarity:
let currentUser = _currentUserFromState; // Local variable linked to the exported one


// Database function for loading state
import { loadStateAndApply } from './database.js';

// UI feedback and initialization functions
import { showMessage } from './ui-feedback.js';
// Assuming a function exists to reset the UI to its default visual state
import { initializeDefaultUI /*, initializeLoadedStateUI */ } from './ui-manager.js'; // Using a hypothetical ui-manager.js for UI init


// --- Authentication Functions ---

/**
 * Handles the Google Sign-in button click.
 */
export async function handleGoogleSignIn() {
    // Uses imported auth, showMessage, GoogleAuthProvider, signInWithPopup
    if (!auth) {
        showMessage('Firebase Auth not initialized.', 'error');
        return;
    }
    const provider = new GoogleAuthProvider();
    try {
        console.log("Attempting Google Sign-in...");
        await signInWithPopup(auth, provider);
        // onAuthStateChanged handles success message and state loading
    } catch (error) {
        console.error("Google Sign-in error:", error);
        // Uses imported showMessage
        if (error.code === 'auth/popup-closed-by-user') { showMessage('Sign-in cancelled.', 'info'); }
        else if (error.code === 'auth/network-request-failed') { showMessage('Network error. Check connection.', 'error'); }
        else { showMessage(`Google Sign-in failed: ${error.message}`, 'error'); }
    }
}

/**
 * Handles the Sign Out button click.
 */
export async function handleSignOut() {
    // Uses imported auth, showMessage, signOut
    if (!auth) {
        showMessage('Firebase Auth not initialized.', 'error');
        return;
    }
    try {
        await signOut(auth);
        // onAuthStateChanged handles success message and state reset
    } catch (error) {
        console.error("Sign-out error:", error);
        showMessage(`Sign-out failed: ${error.message}`, 'error'); // Use imported function
    }
}

/**
 * Sets up the listener that reacts to user sign-in/sign-out events.
 */
export function setupAuthListener() {
    // Uses imported auth, initializeCoreState, initializeDefaultUI
    if (!auth) {
        console.error("Cannot setup auth listener: Firebase Auth not initialized.");
        initializeCoreState(); // Reset state variables
        initializeDefaultUI(); // Reset UI elements (assumes imported)
        return;
    }

    onAuthStateChanged(auth, async (user) => {
        // Uses imported DOM elements, state functions, db functions, UI functions
        if (user) {
            // --- User is signed in ---
            currentUser = user; // Update the (effectively) global state variable

            console.log("Auth Listener: User signed in:", user.displayName, user.uid);

            if (userInfoSpan) userInfoSpan.textContent = `Signed in as: ${user.displayName || user.email || 'User'}`;
            if (googleSignInBtn) googleSignInBtn.classList.add('hidden');
            if (signOutBtn) signOutBtn.classList.remove('hidden');

            console.log("Auth Listener: Attempting to load state...");
            let stateLoaded = false;
            try {
                // Use imported database function
                stateLoaded = await loadStateAndApply(user.uid);
            } catch (loadError) { /* ... error handling ... */ }

            if (stateLoaded) {
                console.log("Auth Listener: State loaded successfully.");
                showMessage(`Welcome back, ${user.displayName || 'User'}! State loaded.`, 'success'); // Use imported function
                // Optional: Call a function to specifically update UI based on loaded state if needed
                // initializeLoadedStateUI(); // Assumes imported (often applyState handles enough)
            } else {
                console.log("Auth Listener: No state loaded, initializing defaults.");
                initializeCoreState(); // Use imported function
                initializeDefaultUI(); // Use imported function
                showMessage('Welcome! No saved state found, starting fresh.', 'info'); // Use imported function
            }

        } else {
            // --- User is signed out ---
            currentUser = null; // Update the (effectively) global state variable
            console.log("Auth Listener: User signed out.");

            if (userInfoSpan) userInfoSpan.textContent = 'Not signed in.';
            if (googleSignInBtn) googleSignInBtn.classList.remove('hidden');
            if (signOutBtn) signOutBtn.classList.add('hidden');

            console.log("Auth Listener: Initializing default state/UI.");
            initializeCoreState(); // Use imported function
            initializeDefaultUI(); // Use imported function
        }
        console.log("Auth state change processed.");
    });
}

/**
 * Handles the Google Sign-in button click.
 */
export async function handleGoogleSignIn() {
    if (!auth) {
        showMessage('Firebase Auth not initialized.', 'error');
        return;
    }
    const provider = new GoogleAuthProvider();
    try {
        console.log("Attempting Google Sign-in...");
        // Result contains user info, but onAuthStateChanged will handle the main logic
        await signInWithPopup(auth, provider);
        // Don't show message here, onAuthStateChanged will confirm
    } catch (error) {
        console.error("Google Sign-in error:", error);
        if (error.code === 'auth/popup-closed-by-user') {
            showMessage('Sign-in cancelled.', 'info');
        } else if (error.code === 'auth/network-request-failed') {
            showMessage('Network error during sign-in. Please check connection.', 'error');
        } else {
            showMessage(`Google Sign-in failed: ${error.message}`, 'error');
        }
    }
}

/**
 * Handles the Sign Out button click.
 */
export async function handleSignOut() {
    if (!auth) {
        showMessage('Firebase Auth not initialized.', 'error');
        return;
    }
    try {
        await signOut(auth);
        // Don't show message here, onAuthStateChanged will handle UI reset
    } catch (error) {
        console.error("Sign-out error:", error);
        showMessage(`Sign-out failed: ${error.message}`, 'error');
    }
}

/**
 * Sets up the listener that reacts to user sign-in/sign-out events.
 * This is the central point for loading user data or resetting to defaults.
 */
export function setupAuthListener() {
    if (!auth) {
        console.error("Cannot setup auth listener: Firebase Auth not initialized.");
        // Optionally, initialize with default state if auth fails entirely
        initializeCoreState(); // Reset state variables
        // initializeDefaultUI(); // Reset UI elements // TODO: Import this later
        return;
    }

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // --- User is signed in ---
            // setCurrentUser(user); // TODO: Use setter from state.js
            // Need direct modification if state exports `let currentUser`
             currentUser = user; // Directly modify exported state variable (alternative to setter)

            console.log("Auth Listener: User signed in:", user.displayName, user.uid);

            // Update Auth UI
            if (userInfoSpan) userInfoSpan.textContent = `Signed in as: ${user.displayName || user.email || 'User'}`;
            if (googleSignInBtn) googleSignInBtn.classList.add('hidden');
            if (signOutBtn) signOutBtn.classList.remove('hidden');

            // Attempt to load state for this user
            console.log("Auth Listener: Attempting to load state...");
            let stateLoaded = false;
            try {
                // loadStateAndApply will handle reading from DB and calling applyState
                stateLoaded = await loadStateAndApply(user.uid); // TODO: Import this later from database.js
            } catch (loadError) {
                console.error("Auth Listener: Error loading state:", loadError);
                showMessage(`Failed to load saved state: ${loadError.message}`, 'error');
                // Proceed with default initialization if loading failed
            }

            // Initialize UI based on loaded state or defaults
            if (stateLoaded) {
                console.log("Auth Listener: State loaded successfully.");
                 showMessage(`Welcome back, ${user.displayName || 'User'}! State loaded.`, 'success');
                // initializeLoadedStateUI(); // Handles UI updates AFTER applyState // TODO: Import this later
            } else {
                console.log("Auth Listener: No state loaded, initializing defaults.");
                initializeCoreState(); // Reset state variables
                // initializeDefaultUI(); // Reset UI elements // TODO: Import this later
                showMessage('Welcome! No saved state found, starting fresh.', 'info');
            }

        } else {
            // --- User is signed out ---
             currentUser = null; // Directly modify exported state variable
            // setCurrentUser(null); // TODO: Use setter from state.js
            console.log("Auth Listener: User signed out.");

            // Update Auth UI
            if (userInfoSpan) userInfoSpan.textContent = 'Not signed in.';
            if (googleSignInBtn) googleSignInBtn.classList.remove('hidden');
            if (signOutBtn) signOutBtn.classList.add('hidden');

            // Initialize with defaults when user signs out
            console.log("Auth Listener: Initializing default state/UI.");
            initializeCoreState(); // Reset state variables
            // initializeDefaultUI(); // Reset UI elements // TODO: Import this later
        }
        // Any final UI updates common to both signed-in/out states can go here
        console.log("Auth state change processed.");
    });
}