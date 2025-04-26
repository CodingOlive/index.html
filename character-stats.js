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
import { safeParseFloat, formatSimpleNumber } from './formatters.js'; // Assuming combined for simplicity

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

// NOTE: Ensure there are no other declarations like 'const charBaseHealthInput = ...' in this file.

