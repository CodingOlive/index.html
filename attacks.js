// attacks.js - Handles logic for Super/Ultimate attack buttons.

// --- Import Dependencies ---
// Import state (needs mutable access to the activeAttacks state object)
import { activeAttacks } from './state.js';
// Import DOM elements
import { energyTypeSelect } from './dom-elements.js';

// Import UI update functions
import {
    updateAttackButtonStates,
    updateSliderLimitAndStyle
} from './ui-updater.js';

// Import utilities
import { triggerAnimation } from './utils.js';


// --- Attack Button Logic ---

/**
 * Handles clicks on the Super and Ultimate attack buttons.
 * Toggles the active attack state for the currently selected energy type
 * and triggers UI updates.
 * @param {Event} event - The click event object.
 */
export function handleAttackButtonClick(event) {
    const button = event.currentTarget; // Get the button that was clicked
    const attackType = button.dataset.attackType; // 'super' or 'ultimate'

    // Use imported elements/state
    if (!energyTypeSelect || !attackType) {
        console.error("Cannot handle attack button click: energy type select or attack type missing.");
        return;
    }
    // Check if the imported state object exists
    if (typeof activeAttacks === 'undefined') {
         console.error("Cannot handle attack button click: activeAttacks state is not available.");
        return;
    }


    const selectedEnergyType = energyTypeSelect.value;

    // Determine the new state: if the current attack is the one clicked, turn it off (null).
    // Otherwise, set the new attack type.
    const currentAttackForType = activeAttacks[selectedEnergyType] || null; // Read from imported state
    const newAttackState = (currentAttackForType === attackType) ? null : attackType;

    // Update the state object (modifies the imported 'let' variable from state.js)
    activeAttacks[selectedEnergyType] = newAttackState;
    console.log(`Active attack state updated for ${selectedEnergyType}:`, activeAttacks);

    // Trigger UI updates using imported functions
    updateAttackButtonStates(selectedEnergyType);
    updateSliderLimitAndStyle(selectedEnergyType); // Update slider gradient/limit

    // Optional: Visual feedback for the button click
    triggerAnimation(button, 'pulse'); // Use imported util
}

// NOTE: Ensure there are no other declarations like 'let activeAttacks = ...' in this file.

