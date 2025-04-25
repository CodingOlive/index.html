// speed-slider.js - Logic for updating the speed slider's value display.

// --- Import Dependencies ---
// Import DOM elements needed by this module
import {
    charSpeedInput,      // Need the base speed value input
    speedSlider,         // Need the slider element itself
    speedSliderValueDisplay // Need the display area (span container)
} from './dom-elements.js';

// Import Utilities & Formatters
import { safeParseFloat } from './utils.js';
import { formatStatNumber } from './formatters.js';

// --- Speed Slider Functions ---

/**
 * Updates the text display below the speed slider (e.g., "(S: 10, D: 10.00)").
 * Reads the current slider percentage and base speed to calculate values.
 */
export function updateSpeedSliderDisplay() {
    // Use the imported elements directly
    if (!speedSlider || !speedSliderValueDisplay || !charSpeedInput) {
        // console.warn("Speed slider elements not found for display update."); // Can be noisy during init
        return;
    }

    const percentSpan = speedSliderValueDisplay.querySelector('.slider-percent-value');
    const detailsSpan = speedSliderValueDisplay.querySelector('.slider-details-value');

    if (!percentSpan || !detailsSpan) {
        console.error("Speed slider display spans (.slider-percent-value, .slider-details-value) not found.");
        return;
    }

    const baseSpeed = safeParseFloat(charSpeedInput.value, 0); // Use imported input & util
    const sliderPercent = parseInt(speedSlider.value);      // Use imported slider

    // Calculate Speed Used and resulting Damage (assuming 1:1 conversion for damage)
    const speedUsed = baseSpeed * (sliderPercent / 100);
    const extraDamage = speedUsed * 1; // 1 damage per point of speed used

    // Update the text content
    percentSpan.textContent = `${sliderPercent}%`;
    detailsSpan.textContent = `(S: ${formatStatNumber(speedUsed)}, D: ${formatStatNumber(extraDamage)})`; // Use formatter
}

// NOTE: Ensure there are no other declarations like 'const charSpeedInput = ...' in this file.

