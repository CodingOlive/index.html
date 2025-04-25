// database.js - Handles interactions with Firebase Realtime Database.

// --- Import Dependencies ---
// Import Firebase SDK functions
import {
    ref, set, get, remove, push, update
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

// Import the initialized Firebase Database instance
import { database } from './firebase-init.js';

// Import state management functions
import { gatherState, applyState } from './state.js';

// Import constants from config.js
import { FIREBASE_SAVE_PATH_BASE, CUSTOM_TYPES_PATH, ADMIN_PATH } from './config.js';

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
            throw new Error("Failed to gather state.");
        }
        // Use imported constant FIREBASE_SAVE_PATH_BASE
        const userSavePath = `${FIREBASE_SAVE_PATH_BASE}/${userId}`;
        const dbRef = ref(database, userSavePath); // Uses imported ref and database
        await set(dbRef, state); // Uses imported set
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
        console.warn('Load attempt failed: Firebase Database not initialized.');
        return false;
    }
    if (!userId) {
        console.warn("Attempted to load state before user ID was available.");
        return false;
    }

    // Use imported constant FIREBASE_SAVE_PATH_BASE
    const userSavePath = `${FIREBASE_SAVE_PATH_BASE}/${userId}`;
    console.log(`Attempting to load state from: ${userSavePath}`);

    try {
         // Uses imported ref, get, database
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

    // Use imported constant FIREBASE_SAVE_PATH_BASE
    const userSavePath = `${FIREBASE_SAVE_PATH_BASE}/${userId}`;
    try {
        // Uses imported ref, remove, database
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
 * Loads all custom energy type definitions from Firebase.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of custom energy type objects [{id, name, color, formula}, ...], or an empty array if none found or error occurs.
 */
export async function loadCustomEnergyTypes() {
    // Uses imported database instance
    if (!database) {
        console.warn('Cannot load custom types: Firebase Database not initialized.');
        return [];
    }

    // Use the imported path constant CUSTOM_TYPES_PATH
    const dbRef = ref(database, CUSTOM_TYPES_PATH);
    console.log(`Attempting to load custom energy types from: ${CUSTOM_TYPES_PATH}`);

    try {
        // Uses imported ref, get
        const snapshot = await get(dbRef);
        if (snapshot.exists()) {
            const data = snapshot.val();
            const customTypesArray = Object.entries(data).map(([id, values]) => ({ id: id, ...values }));
            console.log(`Loaded ${customTypesArray.length} custom energy types.`);
            return customTypesArray;
        } else {
            console.log("No custom energy types found in database.");
            return [];
        }
    } catch (error) {
        console.error("Error loading custom energy types from Firebase:", error);
        showMessage(`Failed to load custom energy types: ${error.message || 'Unknown error'}`, 'error'); // Use imported UI function
        return [];
    }
}

/**
 * Checks if a given user ID exists in the admin list in Firebase.
 * @param {string} userId - The UID of the user to check.
 * @returns {Promise<boolean>} True if the user is an admin, false otherwise.
 */
export async function checkAdminStatus(userId) {
    // Uses imported database instance
    if (!database || !userId) {
        console.warn('Cannot check admin status: Database not init or userId missing.');
        return false;
    }
    // Use the imported path constant ADMIN_PATH
    const adminRef = ref(database, `${ADMIN_PATH}/${userId}`);
    console.log(`Checking admin status for UID: ${userId} at path: ${ADMIN_PATH}/${userId}`);

    try {
        // Uses imported ref, get
        const snapshot = await get(adminRef);
        const isAdmin = snapshot.exists() && snapshot.val() === true;
        console.log(`User ${userId} admin status: ${isAdmin}`);
        return isAdmin;
    } catch (error) {
        console.error(`Error checking admin status for ${userId}:`, error);
        showMessage(`Error checking admin status: ${error.message || 'Unknown error'}`, 'error'); // Use imported UI function
        return false;
    }
}

/**
 * Saves a new custom energy type or updates an existing one in Firebase.
 * @param {string|null} typeId - The ID of the type to update, or null to create a new one.
 * @param {object} energyData - The data object { name, color, formula }.
 * @returns {Promise<boolean>} True if save/update was successful, false otherwise.
 */
export async function saveCustomEnergyType(typeId, energyData) {
    // Uses imported database instance, showMessage
    if (!database) { /* ... error ... */ return false; }
    if (!energyData || !energyData.name || !energyData.color || !energyData.formula) { /* ... error ... */ return false; }

    try {
        // Uses imported CUSTOM_TYPES_PATH, ref, update, push, set
        let dbRef;
        if (typeId) {
            console.log(`Updating custom energy type: ${typeId}`);
            dbRef = ref(database, `${CUSTOM_TYPES_PATH}/${typeId}`);
            await update(dbRef, energyData);
        } else {
            console.log(`Creating new custom energy type: ${energyData.name}`);
            const listRef = ref(database, CUSTOM_TYPES_PATH);
            const newRef = push(listRef);
            await set(newRef, energyData);
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
     // Uses imported database instance, showMessage
     if (!database) { /* ... error ... */ return false; }
     if (!typeId) { /* ... error ... */ return false; }

    try {
        // Uses imported CUSTOM_TYPES_PATH, ref, remove
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

// NOTE: Ensure there are no other declarations like 'const FIREBASE_SAVE_PATH_BASE = ...' in this file.

