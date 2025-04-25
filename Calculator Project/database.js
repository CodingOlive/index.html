// database.js - Handles interactions with Firebase Realtime Database.

// --- Import Dependencies ---
// Import Firebase SDK functions
import {
    ref,    // Function to create a database reference
    set,    // Function to write data
    get,    // Function to read data once
    remove  // Function to delete data
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

// Import the initialized Firebase Database instance
import { database } from './firebase-init.js';

// Import state management functions
import { gatherState, applyState } from './state.js';

// Import constants
import { FIREBASE_SAVE_PATH_BASE } from './config.js';

// Import UI feedback functions
import { showMessage } from './ui-feedback.js';


// --- Database Functions ---

/**
 * Saves the current application state to Firebase for a specific user.
 * @param {string} userId - The UID of the user whose state is being saved.
 * @returns {Promise<boolean>} True if save was potentially successful, false otherwise.
 */
export async function saveStateToDb(userId) {
    // Uses imported database instance and showMessage
    if (!database) {
        showMessage('Firebase Database not initialized.', 'error');
        return false;
    }
    if (!userId) {
        showMessage('Cannot save state: User ID is missing.', 'error');
        return false;
    }

    try {
        const state = gatherState(); // Uses imported state function
        if (!state) {
            throw new Error("Failed to gather state."); // Handle null state from gatherState
        }
        // Uses imported constant
        const userSavePath = `${FIREBASE_SAVE_PATH_BASE}/${userId}`;
        // Uses imported SDK functions and database instance
        const dbRef = ref(database, userSavePath);
        await set(dbRef, state);
        showMessage('State saved successfully to Firebase!', 'success'); // Uses imported UI function
        return true;
    } catch (error) {
        console.error("Firebase save error:", error);
        showMessage(`Failed to save state to Firebase. ${error.message || 'Unknown error'}`, 'error'); // Uses imported UI function
        return false;
    }
}

/**
 * Loads state from Firebase for a specific user and applies it to the application.
 * @param {string} userId - The UID of the user whose state should be loaded.
 * @returns {Promise<boolean>} True if state was found and applied, false otherwise.
 */
export async function loadStateAndApply(userId) {
    // Uses imported database instance and showMessage
    if (!database) {
        // showMessage('Firebase Database not initialized.', 'error'); // Maybe too noisy if called automatically
        console.warn('Load attempt failed: Firebase Database not initialized.');
        return false; // Cannot load
    }
    if (!userId) {
        console.warn("Attempted to load state before user ID was available.");
        return false;
    }

    // Uses imported constant
    const userSavePath = `${FIREBASE_SAVE_PATH_BASE}/${userId}`;
    console.log(`Attempting to load state from: ${userSavePath}`);

    try {
         // Uses imported SDK functions and database instance
        const dbRef = ref(database, userSavePath);
        const snapshot = await get(dbRef);

        if (snapshot.exists()) {
            const state = snapshot.val();
            if (state) {
                console.log("State found in Firebase, attempting to apply...");
                applyState(state); // Use imported state function
                return true;
            } else { /* ... warning ... */ return false; }
        } else { /* ... log no state found ... */ return false; }
    } catch (error) {
        console.error("Error loading state from Firebase:", error);
        showMessage(`Failed to load state from Firebase. ${error.message || 'Unknown error'}`, 'error'); // Use imported UI function
        return false;
    }
}

/**
 * Clears the saved state from Firebase for a specific user.
 * @param {string} userId - The UID of the user whose state should be cleared.
 * @returns {Promise<boolean>} True if removal was potentially successful, false otherwise.
 */
export async function clearStateFromDb(userId) {
     // Uses imported database instance and showMessage
    if (!database) {
        showMessage('Firebase Database not initialized.', 'error');
        return false;
    }
    if (!userId) {
        showMessage('Cannot clear state: User ID is missing.', 'error');
        return false;
    }

    // Uses imported constant
    const userSavePath = `${FIREBASE_SAVE_PATH_BASE}/${userId}`;
    try {
        // Uses imported SDK functions and database instance
        const dbRef = ref(database, userSavePath);
        await remove(dbRef);
        showMessage('Saved state cleared from Firebase.', 'success'); // Use imported UI function
        return true;
    } catch (error) {
        console.error("Firebase clear error:", error);
        showMessage(`Failed to clear state from Firebase. ${error.message || 'Unknown error'}`, 'error'); // Use imported UI function
        return false;
    }
}
/**
 * Saves the current application state to Firebase for a specific user.
 * @param {string} userId - The UID of the user whose state is being saved.
 * @returns {Promise<boolean>} True if save was potentially successful, false otherwise.
 */
export async function saveStateToDb(userId) {
    if (!database) {
        showMessage('Firebase Database not initialized.', 'error');
        return false;
    }
    if (!userId) {
        showMessage('Cannot save state: User ID is missing.', 'error');
        return false;
    }

    try {
        const state = gatherState(); // Gather the current state
        if (!state) {
            throw new Error("Failed to gather state.");
        }
        const userSavePath = `${FIREBASE_SAVE_PATH_BASE}/${userId}`;
        const dbRef = ref(database, userSavePath);
        await set(dbRef, state);
        showMessage('State saved successfully to Firebase!', 'success');
        return true;
    } catch (error) {
        console.error("Firebase save error:", error);
        showMessage(`Failed to save state to Firebase. ${error.message || 'Unknown error'}`, 'error');
        return false;
    }
}

/**
 * Loads state from Firebase for a specific user and applies it to the application.
 * @param {string} userId - The UID of the user whose state should be loaded.
 * @returns {Promise<boolean>} True if state was found and applied, false otherwise.
 */
export async function loadStateAndApply(userId) {
    if (!database) {
        showMessage('Firebase Database not initialized.', 'error');
        return false; // Cannot load
    }
    if (!userId) {
        // This case might happen during initial auth check before user ID is confirmed
        console.warn("Attempted to load state before user ID was available.");
        return false; // Can't load without a user ID
    }

    const userSavePath = `${FIREBASE_SAVE_PATH_BASE}/${userId}`;
    console.log(`Attempting to load state from: ${userSavePath}`); // Debug Log

    try {
        const dbRef = ref(database, userSavePath);
        const snapshot = await get(dbRef);

        if (snapshot.exists()) {
            const state = snapshot.val();
            if (state) {
                console.log("State found in Firebase, attempting to apply...");
                applyState(state); // Apply the loaded state
                // Success message is usually handled by the caller (e.g., auth listener)
                return true; // Indicate success
            } else {
                console.warn("Firebase data node exists but is null or empty.");
                return false; // Indicate no valid state found
            }
        } else {
            console.log("No saved state found at Firebase path:", userSavePath);
            return false; // Indicate no state found
        }
    } catch (error) {
        console.error("Error loading state from Firebase:", error);
        showMessage(`Failed to load state from Firebase. ${error.message || 'Unknown error'}`, 'error');
        return false; // Indicate failure
    }
}

/**
 * Clears the saved state from Firebase for a specific user.
 * @param {string} userId - The UID of the user whose state should be cleared.
 * @returns {Promise<boolean>} True if removal was potentially successful, false otherwise.
 */
export async function clearStateFromDb(userId) {
    if (!database) {
        showMessage('Firebase Database not initialized.', 'error');
        return false;
    }
    if (!userId) {
        showMessage('Cannot clear state: User ID is missing.', 'error');
        return false;
    }

    // Confirmation dialog should happen in the UI layer before calling this
    const userSavePath = `${FIREBASE_SAVE_PATH_BASE}/${userId}`;
    try {
        const dbRef = ref(database, userSavePath);
        await remove(dbRef);
        showMessage('Saved state cleared from Firebase.', 'success');
        // Reloading or resetting UI state should be handled by the caller
        return true;
    } catch (error) {
        console.error("Firebase clear error:", error);
        showMessage(`Failed to clear state from Firebase. ${error.message || 'Unknown error'}`, 'error');
        return false;
    }
}