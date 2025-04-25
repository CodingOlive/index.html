// kaioken.js - Logic related to the Kaioken feature, primarily health regeneration.

// --- Import Dependencies ---
import {
    maxHealthInput,     // Input field for max health value
    currentHealthEl     // Span displaying the current health
    // regenHealthBtn // Button element import not needed here, listener set elsewhere
} from './dom-elements.js';

// Import utilities and formatters
import { safeParseFloat } from './utils.js';
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

// ... (keep notes at the end if desired) ...
import {
    maxHealthInput, currentHealthEl // Need these elements for regen logic
    // regenHealthBtn // Button itself might be handled by event listener module
} from './dom-elements.js';

import { safeParseFloat, parseFormattedNumber, formatStatNumber } from './formatters.js'; // Or utils.js / formatters.js
import { showMessage } from './ui-feedback.js';
import { triggerAnimation } from './utils.js'; // Or ui-updater.js

// --- Kaioken Functions ---

/**
 * Regenerates the character's health to the maximum value specified in the input.
 * Triggered by the Regen Health button within the Kaioken section.
 */
export function regenerateHealth() {
    if (!maxHealthInput || !currentHealthEl) {
        console.error("Health elements (maxHealthInput or currentHealthEl) missing for regeneration.");
        // Might show a user message if appropriate, depends on context
        // showMessage("Cannot regenerate health: Required elements not found.", "error");
        return;
    }

    const maxHealth = safeParseFloat(maxHealthInput.value, 0); // Use utility

    // Set current health display to the max health value
    currentHealthEl.textContent = formatStatNumber(maxHealth); // Use formatter

    // Provide user feedback
    // TODO: Ensure showMessage and triggerAnimation are imported correctly
    showMessage('Health fully regenerated!', 'success');
    triggerAnimation(currentHealthEl, 'flash-green'); // Animate the updated display
}

// Note:
// - Event listener for the regenHealthBtn click will likely be set up
//   in event-listeners.js or main.js and will call this regenerateHealth function.
// - Event listener for the kaiokenCheckbox change (handling style/visibility)
//   might call functions from ui-updater.js.
// - The logic for applying health *strain* during calculation happens within
//   the performCalculation function (likely in calculation.js).