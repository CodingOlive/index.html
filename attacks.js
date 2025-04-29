// attacks.js - Handles logic for Super/Ultimate attack buttons.

// --- Import Dependencies ---
// Import state (setter for modification, variable for reading current state)
import {
    // activeAttacks, // Remove direct import for mutation
    setActiveAttack, // <-- Import the new setter
    activeAttacks   // <-- Keep importing for READ access needed below
} from './state.js';
// Import DOM elements
import { energyTypeSelect } from './dom-elements.js'; // Keep needed DOM elements

// Import UI update functions
import {
    updateAttackButtonStates,
    updateSliderLimitAndStyle
} from './ui-updater.js'; // Keep UI updaters

// Import utilities
import { triggerAnimation } from './utils.js'; // Keep utilities


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

    const selectedEnergyType = energyTypeSelect.value;
     if (!selectedEnergyType) {
         console.error("Cannot handle attack button click: No energy type selected.");
         // Optionally show a user message here
         return;
     }

    // Check if the imported state object exists for reading current state
    if (typeof activeAttacks === 'undefined') {
        console.error("Cannot handle attack button click: activeAttacks state is not available for reading.");
        return;
    }


    // Determine the new state: if the current attack is the one clicked, turn it off (null).
    // Otherwise, set the new attack type.
    const currentAttackForType = activeAttacks[selectedEnergyType] || null; // Read current state
    const newAttackState = (currentAttackForType === attackType) ? null : attackType;

    // ********************************************
    // *** CHANGE IS HERE ***
    // Update the state object using the SETTER
    setActiveAttack(selectedEnergyType, newAttackState);
    // activeAttacks[selectedEnergyType] = newAttackState; // <-- OLD WAY
    // ********************************************


    console.log(`Active attack state updated (via setter) for ${selectedEnergyType} to:`, newAttackState); // Log the state after update

    // Trigger UI updates using imported functions
    updateAttackButtonStates(selectedEnergyType);
    updateSliderLimitAndStyle(selectedEnergyType); // Update slider gradient/limit

    // Optional: Visual feedback for the button click
    triggerAnimation(button, 'pulse'); // Use imported util
}

// NOTE: Ensure there are no other declarations like 'let activeAttacks = ...' in this file.
