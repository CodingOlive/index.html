// modifiers.js - Handles the behavior and event listeners for dynamic modifier boxes.

// --- Import Dependencies ---
// Import the function that updates the equation display string
import { updateEquationDisplay } from './equation.js';
// Import the function that triggers CSS animations
import { triggerAnimation } from './utils.js';


// --- Modifier Box Functions ---

/**
 * Attaches necessary event listeners to a newly created dynamic modifier box.
 * Handles remove button clicks, type selection (additive/multiplicative),
 * and input changes, triggering equation updates.
 * (Moved from dom-generators.js)
 * @param {HTMLElement} modifierDiv - The modifier box element (created by addDynamicModifier).
 */
export function addListenersToModifierBox(modifierDiv) {

    // --- Remove Button Listener ---
    const removeButton = modifierDiv.querySelector('.remove-dynamic-box');
    if (removeButton) {
        removeButton.addEventListener('click', function() {
            const targetBox = document.getElementById(this.dataset.target);
            if (targetBox) {
                // Use imported animation function
                triggerAnimation(targetBox, 'bounceOut'); // Animate before removing

                targetBox.addEventListener('animationend', () => {
                    targetBox.remove();
                    updateEquationDisplay(); // Update equation after removal (uses imported function)
                }, { once: true });
            } else {
                updateEquationDisplay(); // Update equation even if box was already gone (uses imported function)
            }
        });
    } else {
        console.warn("Remove button not found within modifier box:", modifierDiv.id);
    }

    // --- Type Selector (Additive/Multiplicative) Listener ---
    modifierDiv.querySelectorAll('.modifier-type-option').forEach(option => {
        option.addEventListener('click', function() {
            const box = this.closest('.dynamic-box');
            if (!box) return;

            const value = this.dataset.value;

            // Update radio buttons state
            const radioToCheck = box.querySelector(`input[type="radio"][value="${value}"]`);
            if (radioToCheck) radioToCheck.checked = true;

            // Update visual active state
            box.querySelectorAll('.modifier-type-option').forEach(opt => {
                const isActive = opt.dataset.value === value;
                opt.classList.toggle('active', isActive);
                opt.setAttribute('aria-checked', isActive.toString());
            });

            // Update box styling
            box.classList.remove('additive', 'multiplicative', 'bg-success-light', 'border-success', 'bg-ki/10', 'border-ki');
            if (value === 'additive') {
                box.classList.add('additive', 'bg-success-light', 'border-success');
            } else {
                box.classList.add('multiplicative', 'bg-ki/10', 'border-ki');
            }

            updateEquationDisplay(); // Update equation when type changes (uses imported function)
        });

        // Keyboard accessibility
        option.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    });

    // --- Input Listeners (Value and Name) ---
    const valueInput = modifierDiv.querySelector('.modifier-value-input');
    if (valueInput) {
        valueInput.addEventListener('input', updateEquationDisplay); // Uses imported function
        valueInput.addEventListener('change', updateEquationDisplay); // Uses imported function
    } else {
         console.warn("Value input not found within modifier box:", modifierDiv.id);
    }

    const nameInput = modifierDiv.querySelector('.modifier-name-input');
    if (nameInput) {
        nameInput.addEventListener('input', updateEquationDisplay); // Uses imported function
        nameInput.addEventListener('change', updateEquationDisplay); // Uses imported function
    } else {
        console.warn("Name input not found within modifier box:", modifierDiv.id);
    }
}

// ... (keep notes if desired) ...
import { updateEquationDisplay } from './equation.js'; // Needed when inputs/type change or box removed
import { triggerAnimation } from './utils.js'; // For remove animation


// --- Modifier Box Functions ---

/**
 * Attaches necessary event listeners to a newly created dynamic modifier box.
 * Handles remove button clicks, type selection (additive/multiplicative),
 * and input changes, triggering equation updates.
 * (Moved from dom-generators.js)
 * @param {HTMLElement} modifierDiv - The modifier box element (created by addDynamicModifier).
 */
export function addListenersToModifierBox(modifierDiv) {

    // --- Remove Button Listener ---
    const removeButton = modifierDiv.querySelector('.remove-dynamic-box');
    if (removeButton) {
        removeButton.addEventListener('click', function() {
            const targetBox = document.getElementById(this.dataset.target); // 'this' refers to the button here
            if (targetBox) {
                // Use imported animation function
                 triggerAnimation(targetBox, 'bounceOut'); // Animate before removing

                // Remove the element after the animation completes
                targetBox.addEventListener('animationend', () => {
                    targetBox.remove();
                    updateEquationDisplay(); // Update equation after removal
                }, { once: true });
            } else {
                // If box somehow already gone, still update equation
                updateEquationDisplay();
            }
        });
    } else {
        console.warn("Remove button not found within modifier box:", modifierDiv.id);
    }

    // --- Type Selector (Additive/Multiplicative) Listener ---
    modifierDiv.querySelectorAll('.modifier-type-option').forEach(option => {
        option.addEventListener('click', function() {
            const box = this.closest('.dynamic-box'); // 'this' refers to the clicked option div
            if (!box) return;

            const value = this.dataset.value; // 'additive' or 'multiplicative'

            // Update radio buttons state (primarily for accessibility/semantics)
            const radioToCheck = box.querySelector(`input[type="radio"][value="${value}"]`);
            if (radioToCheck) radioToCheck.checked = true;

            // Update visual active state for the type option divs
            box.querySelectorAll('.modifier-type-option').forEach(opt => {
                const isActive = opt.dataset.value === value;
                opt.classList.toggle('active', isActive);
                opt.setAttribute('aria-checked', isActive.toString()); // Use string for attribute
            });

            // Update box styling based on the selected type
            // Remove potentially conflicting classes first
            box.classList.remove('additive', 'multiplicative', 'bg-success-light', 'border-success', 'bg-ki/10', 'border-ki');
            // Add classes for the selected type (assumes Tailwind color classes)
            if (value === 'additive') {
                box.classList.add('additive', 'bg-success-light', 'border-success');
            } else {
                box.classList.add('multiplicative', 'bg-ki/10', 'border-ki');
            }

            updateEquationDisplay(); // Update equation when type changes
        });

        // Keyboard accessibility for type options (Enter or Space activates)
        option.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault(); // Prevent default space scroll or enter submission
                this.click(); // Trigger the click handler
            }
        });
    });

    // --- Input Listeners (Value and Name) ---
    // Update equation whenever name or value changes
    const valueInput = modifierDiv.querySelector('.modifier-value-input');
    if (valueInput) {
        valueInput.addEventListener('input', updateEquationDisplay);
        valueInput.addEventListener('change', updateEquationDisplay); // Handle paste, etc.
    } else {
         console.warn("Value input not found within modifier box:", modifierDiv.id);
    }

    const nameInput = modifierDiv.querySelector('.modifier-name-input');
    if (nameInput) {
        nameInput.addEventListener('input', updateEquationDisplay);
        nameInput.addEventListener('change', updateEquationDisplay);
    } else {
        console.warn("Name input not found within modifier box:", modifierDiv.id);
    }
}

// Note:
// - The creation of the modifier box HTML ('addDynamicModifier') resides in 'dom-generators.js'.
// - The event listener for the main "Add Factor" button resides in 'event-listeners.js' or 'main.js'.