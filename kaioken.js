// kaioken.js - Logic related to the Kaioken feature, primarily health regeneration.

// --- Import Dependencies ---
// Import the specific DOM elements needed by this module
import {
    maxHealthInput,     // Input field for max health value
    currentHealthEl     // Span displaying the current health
} from './dom-elements.js';

// Import Utilities & Formatters
import { safeParseFloat } from './utils.js'; // Assuming safeParseFloat is in utils.js
import { formatStatNumber } from './formatters.js';

// Import UI functions
import { showMessage } from './ui-feedback.js';
import { triggerAnimation } from './utils.js'; // Assuming triggerAnimation is in utils.js

// --- Kaioken Functions ---

/**
 * Regenerates the character's health to the maximum value specified in the input.
 * Triggered by the Regen Health button within the Kaioken section.
 */
export function regenerateHealth() {
    // Use imported elements directly
    if (!maxHealthInput || !currentHealthEl) {
        console.error("Health elements (maxHealthInput or currentHealthEl) missing for regeneration.");
        return;
    }

    const maxHealth = safeParseFloat(maxHealthInput.value, 0); // Use imported util

    // Set current health display to the max health value
    currentHealthEl.textContent = formatStatNumber(maxHealth); // Use imported formatter

    // Provide user feedback using imported functions
    showMessage('Health fully regenerated!', 'success');
    triggerAnimation(currentHealthEl, 'flash-green'); // Animate the updated display
}

// NOTE: Ensure there are no other declarations like 'const maxHealthInput = ...' in this file.

