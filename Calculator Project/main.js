// main.js - Main application entry point and initialization orchestrator.

// --- Import Modules ---
// Import Firebase initialization first to ensure it runs and instances are available.
import { app, database, auth } from './firebase-init.js';

// Import UI update functions needed at startup
import { updateSpeedSliderVisibility } from './ui-updater.js'; // Check speed slider visibility initially

// Import event listener setup function
import { setupAllEventListeners } from './event-listeners.js';

// Import authentication listener setup function
import { setupAuthListener } from './auth.js';

// Import admin panel listener setup function
import { setupAdminPanelListeners } from './admin.js';


// --- Application Initialization Sequence ---

console.log("Initializing Energy Calculator Application...");

// 1. Check if Firebase initialized correctly (optional but recommended)
if (!app || !database || !auth) {
    console.error("Firebase failed to initialize. Calculator may not function correctly.");
    // Display a user-friendly error message in the UI
    const body = document.querySelector('body');
    if (body) {
        const errorDiv = document.createElement('div');
        errorDiv.textContent = "Error: Could not connect to required services. Please check your connection and refresh.";
        // Basic styling for visibility
        errorDiv.style.color = 'red';
        errorDiv.style.padding = '10px';
        errorDiv.style.backgroundColor = '#ffeeee';
        errorDiv.style.border = '1px solid red';
        errorDiv.style.textAlign = 'center';
        errorDiv.style.marginTop = '10px';
        errorDiv.style.fontWeight = 'bold';
        body.prepend(errorDiv); // Add message at the very top
    }
    // Depending on severity, you might stop here or allow partial functionality
} else {
    // 2. Update speed slider visibility initially (doesn't depend on merged types)
    // Uses imported function
    updateSpeedSliderVisibility();

    // 3. Set up all main event listeners
    // Uses imported function
    setupAllEventListeners();

    // 4. Set up admin panel listeners (only attaches if elements exist)
    // Uses imported function
    setupAdminPanelListeners();

    // 5. Set up the Firebase Authentication listener
    // This handles login, state loading, energy merging, and THEN final UI generation/updates
    // Uses imported function
    setupAuthListener();

    console.log("Energy Calculator Initialization sequence complete.");
}

// --- End of main.js ---
