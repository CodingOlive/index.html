// main.js - Main application entry point and initialization orchestrator.

// --- Import Modules ---
// Import Firebase initialization first to ensure it runs and instances are available.
// We might not use the exported values directly here, but importing ensures initialization.
import { app, database, auth } from './firebase-init.js';

// Import DOM generation / UI update functions needed at startup
import { generateEnergySections } from './dom-generators.js';
// Import function to check/show/hide speed slider (assumes it also handles initial generation if needed)
import { updateSpeedSliderVisibility } from './ui-updater.js';

// Import event listener setup function
import { setupAllEventListeners } from './event-listeners.js';

// Import authentication listener setup function
import { setupAuthListener } from './auth.js';


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
    // For now, we'll let it continue but the error is logged / shown.
}

// 2. Generate initial dynamic UI elements
// Uses imported functions
generateEnergySections(); // Create energy pools and energy sliders
updateSpeedSliderVisibility(); // Check if speed slider needs to be generated/shown initially

// 3. Set up all static and dynamic event listeners
// Uses imported function
setupAllEventListeners();

// 4. Set up the Firebase Authentication listener
// This listener handles the rest of the flow (loading state or initializing defaults)
// Uses imported function
setupAuthListener();

console.log("Energy Calculator Initialization sequence complete.");

// --- End of main.js ---