// auth.js - Handles Firebase Authentication logic and admin status check.

// --- Import Dependencies ---
// ... (Keep existing imports) ...
import { currentUser, isAdmin, initializeCoreState, initializeAndMergeEnergyTypes, mergedEnergyTypes, setCurrentUser, setIsAdmin } from './state.js';
import { loadStateAndApply, checkAdminStatus } from './database.js';
import { showMessage } from './ui-feedback.js';
import { initializeDefaultUI, updateStatsDisplay, displayEnergyPool, updateAttackButtonStates, updateSliderLimitAndStyle, updateSpeedSliderVisibility } from './ui-updater.js';
import { generateEnergySections, populateEnergyTypeDropdown, renderFormList, renderActiveFormsSection } from './dom-generators.js';
import { updateEquationDisplay } from './equation.js';
import { energyTypeSelect } from './dom-elements.js';
import { updateAdminUI } from './admin.js';


// --- Authentication Functions ---
export async function handleGoogleSignIn() { /* ... */ }
export async function handleSignOut() { /* ... */ }

export function setupAuthListener() {
    if (!auth) { /* ... error handling ... */ return; }

    onAuthStateChanged(auth, async (user) => {
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
            updateAdminUI(currentAdminStatus); // Pass status

            // Attempt to load state
            console.log("Auth Listener: Attempting to load state...");
            let stateLoaded = false;
            try { stateLoaded = await loadStateAndApply(user.uid); }
            catch (loadError) { console.error("Auth Listener: Error loading state:", loadError); }

            // Initialize core state if nothing was loaded
            if (!stateLoaded) {
                console.log("Auth Listener: No state loaded, initializing core state.");
                initializeCoreState();
                // Re-check admin status AFTER core state reset
                console.log("Auth Listener: Re-checking admin status after core state reset...");
                try {
                     currentAdminStatus = await checkAdminStatus(user.uid);
                     setIsAdmin(currentAdminStatus);
                     console.log("Auth Listener: Re-set isAdmin via setter:", currentAdminStatus);
                } catch(e) { /* ... error handling ... */ setIsAdmin(false); currentAdminStatus = false; }
                updateAdminUI(currentAdminStatus); // Pass status again
            }

            // Load and Merge Energy Types
            console.log("Auth Listener: Calling initializeAndMergeEnergyTypes..."); // LOG
            await initializeAndMergeEnergyTypes();
            console.log("Auth Listener: initializeAndMergeEnergyTypes finished. Merged count:", mergedEnergyTypes.length); // LOG

            // --- Initialize/Update UI AFTER merge ---
            console.log("Auth Listener: Calling generateEnergySections..."); // LOG
            generateEnergySections();
            console.log("Auth Listener: Calling populateEnergyTypeDropdown..."); // LOG
            populateEnergyTypeDropdown();
            console.log("Auth Listener: Calling updateSpeedSliderVisibility..."); // LOG
            updateSpeedSliderVisibility();
            console.log("Auth Listener: Calling renderFormList..."); // LOG
            renderFormList();
            console.log("Auth Listener: Calling renderActiveFormsSection..."); // LOG
            renderActiveFormsSection();

            // Final UI updates
             const finalSelectedType = energyTypeSelect?.value;
             console.log("Auth Listener: Final selected type for UI update:", finalSelectedType); // LOG
             if (finalSelectedType) {
                 console.log("Auth Listener: Calling displayEnergyPool..."); // LOG
                 displayEnergyPool(finalSelectedType);
                 console.log("Auth Listener: Calling updateAttackButtonStates..."); // LOG
                 updateAttackButtonStates(finalSelectedType);
                 console.log("Auth Listener: Calling updateSliderLimitAndStyle..."); // LOG
                 updateSliderLimitAndStyle(finalSelectedType);
             }
            console.log("Auth Listener: Calling updateStatsDisplay..."); // LOG
            updateStatsDisplay();
            console.log("Auth Listener: Calling updateEquationDisplay..."); // LOG
            updateEquationDisplay();

            // Show appropriate welcome message
            if (!stateLoaded) {
                 console.log("Auth Listener: Initializing default UI..."); // LOG
                 initializeDefaultUI(); // Call this AFTER generation if it resets inputs
                 showMessage('Welcome! No saved state found, starting fresh.', 'info');
            } else {
                showMessage(`Welcome back, ${user.displayName || 'User'}! State loaded.`, 'success');
            }

        } else {
            // --- User is signed out ---
            // ... (logout logic remains the same, calls initializeCoreState, initializeDefaultUI, generateEnergySections, populateEnergyTypeDropdown etc.) ...
        }
        console.log("Auth state change processed, including admin check and UI update.");
    });
}

