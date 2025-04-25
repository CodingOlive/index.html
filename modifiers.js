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

                // Remove the element after the animation completes
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

// NOTE: There should be NO other function defined in this file named 'updateEquationDisplay'.

