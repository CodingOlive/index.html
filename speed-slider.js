
// speed-slider.js - Logic for updating the speed slider's value display.

// --- Import Dependencies ---
import {
    charSpeedInput,      // Need the base speed value
    speedSlider,         // Need the slider element itself
    speedSliderValueDisplay // Need the display area (span container)
} from './dom-elements.js';

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
        // console.warn("Speed slider elements not found for display update."); // Might be normal if slider isn't generated yet
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

// ... (keep notes at the end if desired) ...// speed-slider.js - Logic for updating the speed slider's value display.

// --- Import Dependencies ---
// TODO: Add imports later when modules are finalized
import {
    charSpeedInput // Need the base speed value
    // speedSlider, // Need the slider element itself by ID
    // speedSliderValueDisplay // Need the display area by ID
} from './dom-elements.js';

import { safeParseFloat } from './utils.js';
import { formatStatNumber } from './formatters.js';

// --- Speed Slider Functions ---

/**
 * Updates the text display below the speed slider (e.g., "(S: 10, D: 10.00)").
 * Reads the current slider percentage and base speed to calculate values.
 */
export function updateSpeedSliderDisplay() {
    // TODO: Replace direct lookups with imported elements from dom-elements.js later
    const slider = document.getElementById('speed-slider');
    const valueDisplay = document.getElementById('speed-slider-value-display');
    const baseSpeedInput = document.getElementById('char-speed'); // Assuming charSpeedInput is imported

    // Exit if essential elements aren't found (slider might not be generated yet)
    if (!slider || !valueDisplay || !baseSpeedInput) {
        // console.warn("Speed slider elements not found for display update."); // Can be noisy during init
        return;
    }

    const percentSpan = valueDisplay.querySelector('.slider-percent-value');
    const detailsSpan = valueDisplay.querySelector('.slider-details-value');

    if (!percentSpan || !detailsSpan) {
        console.error("Speed slider display spans (.slider-percent-value, .slider-details-value) not found.");
        return;
    }

    const baseSpeed = safeParseFloat(baseSpeedInput.value, 0);
    const sliderPercent = parseInt(slider.value); // Read current slider value (0-100)

    // Calculate Speed Used and resulting Damage (assuming 1:1 conversion for damage)
    const speedUsed = baseSpeed * (sliderPercent / 100);
    const extraDamage = speedUsed * 1; // 1 damage per point of speed used

    // Update the text content
    percentSpan.textContent = `${sliderPercent}%`;
    detailsSpan.textContent = `(S: ${formatStatNumber(speedUsed)}, D: ${formatStatNumber(extraDamage)})`; // Use S: for Speed
}

// Note:
// - Visibility logic is in ui-updater.js (updateSpeedSliderVisibility)
// - Generation logic is in dom-generators.js (generateSpeedSlider)
// - Event listener for the slider 'input' event will likely be in
//   event-listeners.js or main.js and will call this updateSpeedSliderDisplay function.