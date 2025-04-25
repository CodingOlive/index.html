// character-stats.js - Handles logic related to character stat inputs and Ryoko mode.

// --- Import Dependencies ---
// Import DOM Elements
import {
    charBaseHealthInput, charVitalityInput, charSoulPowerInput, charSoulHpInput,
    charBaseAcInput, charBaseTrInput, charSpeedInput, charBaseMultiplierInput,
    ryokoCheckbox, ryokoEquationContainer, ryokoEquationInput
} from './dom-elements.js';

// Import Config
import { DEFAULT_RYOKO_EQUATION } from './config.js';

// Import Utilities & Formatters
import { safeParseFloat, formatSimpleNumber } from './formatters.js'; // Or split between utils/formatters

// Import UI Feedback
import { showMessage } from './ui-feedback.js';

// Import functions from other modules that need to be called when stats change
import { applyActiveFormEffects } from './forms.js';
import { updateStatsDisplay, updateSpeedSliderVisibility } from './ui-updater.js';
import { updateEquationDisplay } from './equation.js';
import { updateSpeedSliderDisplay } from './speed-slider.js';


// --- Character Stat Functions ---

/**
 * Handles changes to core character stat inputs (Health, Vit, SP, SoulHP, AC, TR, Speed).
 * Triggers necessary recalculations and UI updates across the application.
 */
export function handleStatChange() {
    console.log("Character stat change detected, triggering updates...");
    // Uses imported functions
    applyActiveFormEffects();   // Recalculates form effects & energy pools
    updateStatsDisplay();       // Update stats panel UI
    updateSpeedSliderVisibility(); // Show/hide speed slider
    updateSpeedSliderDisplay();    // Update speed slider text
    updateEquationDisplay();    // Update calculation breakdown display
}


/**
 * Handles toggling the "Are you Ryoko?" checkbox.
 * Shows/hides the equation input, makes base multiplier read-only,
 * and triggers equation evaluation or reverts to manual base multiplier.
 */
export function handleRyokoCheckboxChange() {
    // Uses imported DOM elements
    if (!ryokoCheckbox || !ryokoEquationContainer || !charBaseMultiplierInput || !ryokoEquationInput) {
        console.warn("Ryoko mode elements not found.");
        return;
    }
    const isChecked = ryokoCheckbox.checked;
    ryokoEquationContainer.classList.toggle('hidden', !isChecked);
    charBaseMultiplierInput.readOnly = isChecked;
    charBaseMultiplierInput.classList.toggle('bg-gray-100', isChecked);
    charBaseMultiplierInput.classList.toggle('cursor-not-allowed', isChecked);
    charBaseMultiplierInput.classList.toggle('opacity-70', isChecked);

    if (isChecked) {
        if (ryokoEquationInput.value.trim() === '') {
            ryokoEquationInput.value = DEFAULT_RYOKO_EQUATION; // Use imported constant
        }
        evaluateRyokoEquation(); // Calls function below (which calls handleStatChange)
    } else {
        ryokoEquationInput.classList.remove('border-red-500', 'focus:ring-red-500');
        ryokoEquationInput.classList.add('border-gray-300', 'focus:ring-teal-focus');
        handleStatChange(); // Trigger recalc using potentially manual multiplier
    }
}

/**
 * Evaluates the expression in the Ryoko equation input field using MathJS.
 * Updates the Character Base Multiplier input with the result.
 * Triggers a handleStatChange to update the rest of the application.
 */
export function evaluateRyokoEquation() {
    if (!ryokoCheckbox?.checked || !ryokoEquationInput || !charBaseMultiplierInput) {
        return;
    }
    const expression = ryokoEquationInput.value.trim();
    let result = 1;

    ryokoEquationInput.classList.remove('border-red-500', 'focus:ring-red-500');
    ryokoEquationInput.classList.add('border-gray-300', 'focus:ring-teal-focus');

    if (expression) {
        try {
            // Access MathJS library assumed to be loaded globally via CDN
            if (typeof math === 'undefined' || !math?.evaluate) { // Check if math object and evaluate exist
                 throw new Error("MathJS library (math.evaluate) not found. Please ensure it's loaded.");
            }
            const evaluatedResult = math.evaluate(expression);
            if (typeof evaluatedResult === 'number' && isFinite(evaluatedResult)) {
                result = evaluatedResult;
            } else {
                throw new Error("Invalid result (NaN or Infinity)");
            }
        } catch (error) {
            console.error("Error evaluating Ryoko equation:", error);
            ryokoEquationInput.classList.remove('focus:ring-teal-focus');
            ryokoEquationInput.classList.add('border-red-500', 'focus:ring-red-500');
            showMessage(`Invalid Ryoko equation: ${error.message}`, 'error'); // Use imported function
            result = 1;
        }
    }

    // Update the input field using imported element and formatter
    charBaseMultiplierInput.value = formatSimpleNumber(result);

    // Trigger a full recalculation
    handleStatChange(); // Uses function defined above
}
import {
    // Character Stat Inputs
    charBaseHealthInput, charVitalityInput, charSoulPowerInput, charSoulHpInput,
    charBaseAcInput, charBaseTrInput, charSpeedInput, charBaseMultiplierInput,
    // Ryoko Mode Elements
    ryokoCheckbox, ryokoEquationContainer, ryokoEquationInput
} from './dom-elements.js';

import { DEFAULT_RYOKO_EQUATION } from './config.js'; // Default equation string
import { safeParseFloat, formatSimpleNumber } from './formatters.js'; // Or utils/formatters

// Import functions from other modules that need to be called when stats change
import { applyActiveFormEffects } from './forms.js'; // Recalculates form effects & energy pools
import { updateStatsDisplay, updateSpeedSliderVisibility } from './ui-updater.js'; // Update displays
import { updateEquationDisplay } from './equation.js'; // Update calculation breakdown
import { updateSpeedSliderDisplay } from './speed-slider.js'; // Update speed slider text
import { showMessage } from './ui-feedback.js'; // For Ryoko equation errors


// --- Character Stat Functions ---

/**
 * Handles changes to core character stat inputs (Health, Vit, SP, SoulHP, AC, TR, Speed).
 * Triggers necessary recalculations and UI updates across the application.
 */
export function handleStatChange() {
    console.log("Character stat change detected, triggering updates...");

    // Order can matter here. Applying form effects often recalculates energy pools
    // which might be needed before updating other displays.

    // 1. Re-apply form effects (this also recalculates energy pools based on new stats)
    // TODO: Import applyActiveFormEffects later
    applyActiveFormEffects(); // Assumes this function exists and is imported

    // 2. Update the general stats display panel
    // TODO: Import updateStatsDisplay later
    updateStatsDisplay(); // Assumes this function exists and is imported

    // 3. Update the Speed Slider's visibility and display text
    // TODO: Import updateSpeedSliderVisibility and updateSpeedSliderDisplay later
    updateSpeedSliderVisibility(); // Show/hide slider based on new speed value
    updateSpeedSliderDisplay();    // Update slider text (S: ..., D: ...)

    // 4. Update the main calculation equation display
    // TODO: Import updateEquationDisplay later
    updateEquationDisplay(); // Assumes this function exists and is imported
}


/**
 * Handles toggling the "Are you Ryoko?" checkbox.
 * Shows/hides the equation input, makes base multiplier read-only,
 * and triggers equation evaluation or reverts to manual base multiplier.
 */
export function handleRyokoCheckboxChange() {
    if (!ryokoCheckbox || !ryokoEquationContainer || !charBaseMultiplierInput || !ryokoEquationInput) {
        console.warn("Ryoko mode elements not found.");
        return;
    }

    const isChecked = ryokoCheckbox.checked;
    ryokoEquationContainer.classList.toggle('hidden', !isChecked); // Show/hide input field container
    charBaseMultiplierInput.readOnly = isChecked; // Make base multiplier read-only if checked

    // Apply styling to indicate read-only state (using Tailwind utility classes)
    charBaseMultiplierInput.classList.toggle('bg-gray-100', isChecked);
    charBaseMultiplierInput.classList.toggle('cursor-not-allowed', isChecked);
    charBaseMultiplierInput.classList.toggle('opacity-70', isChecked);

    if (isChecked) {
        // If checked, ensure default equation is present if input is empty
        if (ryokoEquationInput.value.trim() === '') {
            ryokoEquationInput.value = DEFAULT_RYOKO_EQUATION; // Use imported constant
        }
        // Evaluate the equation and update the base multiplier input
        evaluateRyokoEquation(); // This will also trigger handleStatChange
        // Optionally focus the input
        // ryokoEquationInput.focus();
    } else {
        // If unchecked, revert styling and trigger a standard stat change
        // Remove potential error styling from the equation input
        ryokoEquationInput.classList.remove('border-red-500', 'focus:ring-red-500'); // Assumes Tailwind classes
        ryokoEquationInput.classList.add('border-gray-300', 'focus:ring-teal-focus'); // Revert to default/teal focus
        // Trigger a stat change recalculation now that the base multiplier might be manually editable again
        handleStatChange();
    }
    // No need to call handleStatChange if Ryoko mode is turned ON,
    // as evaluateRyokoEquation calls it internally.
}

/**
 * Evaluates the expression in the Ryoko equation input field using MathJS.
 * Updates the Character Base Multiplier input with the result.
 * Triggers a handleStatChange to update the rest of the application.
 */
export function evaluateRyokoEquation() {
    // Ensure Ryoko mode is active and elements exist
    if (!ryokoCheckbox?.checked || !ryokoEquationInput || !charBaseMultiplierInput) {
        return; // Exit if not in Ryoko mode or elements missing
    }

    const expression = ryokoEquationInput.value.trim();
    let result = 1; // Default multiplier if evaluation fails or expression is empty

    // Reset error styling
    ryokoEquationInput.classList.remove('border-red-500', 'focus:ring-red-500');
    ryokoEquationInput.classList.add('border-gray-300', 'focus:ring-teal-focus'); // Revert to default/teal focus


    if (expression) {
        try {
            // Access MathJS library assumed to be loaded globally via CDN
            if (typeof math === 'undefined') {
                 throw new Error("MathJS library (math) not found. Please ensure it's loaded.");
            }
            const evaluatedResult = math.evaluate(expression);

            // Check if the result is a valid, finite number
            if (typeof evaluatedResult === 'number' && isFinite(evaluatedResult)) {
                result = evaluatedResult;
            } else {
                console.error("Ryoko equation evaluated to non-finite number:", evaluatedResult);
                throw new Error("Invalid result (NaN or Infinity)");
            }
        } catch (error) {
            console.error("Error evaluating Ryoko equation:", error);
            // Apply error styling
            ryokoEquationInput.classList.remove('focus:ring-teal-focus');
            ryokoEquationInput.classList.add('border-red-500', 'focus:ring-red-500'); // Use Tailwind error classes
            // TODO: Import showMessage
            showMessage(`Invalid Ryoko equation: ${error.message}`, 'error'); // Show error to user
            result = 1; // Reset to default on error
        }
    }

    // Update the Character Base Multiplier input field with the result
    charBaseMultiplierInput.value = formatSimpleNumber(result); // Use formatter

    // Trigger a full recalculation based on the new base multiplier
    handleStatChange();
}