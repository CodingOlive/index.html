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

import { FIREBASE_SAVE_PATH_BASE, CUSTOM_TYPES_PATH, ADMIN_PATH } from './config.js';

// Add this near your other imports at the top
import { FIREBASE_SAVE_PATH_BASE, CUSTOM_TYPES_PATH } from './config.js';
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
 * Checks if a given user ID exists in the admin list in Firebase.
 * @param {string} userId - The UID of the user to check.
 * @returns {Promise<boolean>} True if the user is an admin, false otherwise.
 */
export async function checkAdminStatus(userId) {
    if (!database || !userId) {
        console.warn('Cannot check admin status: Database not init or userId missing.');
        return false;
    }
    // Use the imported path constant
    const adminRef = ref(database, `${ADMIN_PATH}/${userId}`);
    console.log(`Checking admin status for UID: ${userId} at path: ${ADMIN_PATH}/${userId}`);

    try {
        const snapshot = await get(adminRef);
        // Check if the node exists and its value is true (or just exists)
        const isAdmin = snapshot.exists() && snapshot.val() === true;
        console.log(`User ${userId} admin status: ${isAdmin}`);
        return isAdmin;
    } catch (error) {
        console.error(`Error checking admin status for ${userId}:`, error);
        showMessage(`Error checking admin status: ${error.message || 'Unknown error'}`, 'error'); // Use imported showMessage
        return false; // Assume not admin on error
    }
}
/**
 * 
 * 
 * 
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
 * Loads all custom energy type definitions from Firebase.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of custom energy type objects [{id, name, color, formula}, ...], or an empty array if none found or error occurs.
 */
export async function loadCustomEnergyTypes() {
    // Uses imported database instance
    if (!database) {
        console.warn('Cannot load custom types: Firebase Database not initialized.');
        return []; // Return empty array if DB not ready
    }

    // Use the imported path constant
    const dbRef = ref(database, CUSTOM_TYPES_PATH);
    console.log(`Attempting to load custom energy types from: ${CUSTOM_TYPES_PATH}`);

    try {
        // Uses imported 'ref' and 'get'
        const snapshot = await get(dbRef);
        if (snapshot.exists()) {
            const data = snapshot.val();
            // Convert the Firebase object (keys are IDs) into an array of objects, including the ID
            const customTypesArray = Object.entries(data).map(([id, values]) => ({
                id: id, // Add the Firebase key as an 'id' property
                ...values // Spread the rest of the properties (name, color, formula)
            }));
            console.log(`Loaded ${customTypesArray.length} custom energy types.`);
            return customTypesArray;
        } else {
            console.log("No custom energy types found in database.");
            return []; // Return empty array if the path doesn't exist
        }
    } catch (error) {
        console.error("Error loading custom energy types from Firebase:", error);
        // Uses imported 'showMessage'
        showMessage(`Failed to load custom energy types: ${error.message || 'Unknown error'}`, 'error');
        return []; // Return empty array on error
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
export async function checkAdminStatus(userId) { /* ... */ }


// --- NEW ADMIN FUNCTIONS ---

/**
 * Saves a new custom energy type or updates an existing one in Firebase.
 * @param {string|null} typeId - The ID of the type to update, or null to create a new one.
 * @param {object} energyData - The data object { name, color, formula }.
 * @returns {Promise<boolean>} True if save/update was successful, false otherwise.
 */
export async function saveCustomEnergyType(typeId, energyData) {
    if (!database) {
        showMessage('Firebase Database not initialized.', 'error');
        return false;
    }
    if (!energyData || !energyData.name || !energyData.color || !energyData.formula) {
        showMessage('Invalid energy data provided for saving.', 'error');
        return false;
    }

    try {
        let dbRef;
        if (typeId) {
            // Update existing type
            console.log(`Updating custom energy type: ${typeId}`);
            dbRef = ref(database, `${CUSTOM_TYPES_PATH}/${typeId}`);
            await update(dbRef, energyData); // Use update to modify existing
        } else {
            // Create new type - use push to generate a unique ID
            console.log(`Creating new custom energy type: ${energyData.name}`);
            const listRef = ref(database, CUSTOM_TYPES_PATH);
            const newRef = push(listRef); // Generate unique ID
            await set(newRef, energyData); // Set data at the new ID
        }
        console.log("Custom energy type saved successfully.");
        return true;
    } catch (error) {
        console.error("Firebase save/update custom energy type error:", error);
        showMessage(`Failed to save custom energy type: ${error.message || 'Unknown error'}`, 'error');
        return false;
    }
}

/**
 * Deletes a custom energy type from Firebase.
 * @param {string} typeId - The ID of the custom energy type to delete.
 * @returns {Promise<boolean>} True if deletion was successful, false otherwise.
 */
export async function deleteCustomEnergyType(typeId) {
     if (!database) {
        showMessage('Firebase Database not initialized.', 'error');
        return false;
    }
     if (!typeId) {
        showMessage('Cannot delete custom type: ID is missing.', 'error');
        return false;
    }

    try {
        console.log(`Deleting custom energy type: ${typeId}`);
        const dbRef = ref(database, `${CUSTOM_TYPES_PATH}/${typeId}`);
        await remove(dbRef);
        console.log("Custom energy type deleted successfully.");
        return true;
    } catch (error) {
        console.error("Firebase delete custom energy type error:", error);
        showMessage(`Failed to delete custom energy type: ${error.message || 'Unknown error'}`, 'error');
        return false;
    }
}