// attacks.js - Handles logic for Super/Ultimate attack buttons.

// --- Import Dependencies ---
// Import state (needs to be mutable 'export let' in state.js)
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
    const button = event.currentTarget;
    const attackType = button.dataset.attackType;

    // Use imported elements/state
    if (!energyTypeSelect || !attackType) {
        console.error("Cannot handle attack button click: energy type select or attack type missing.");
        return;
    }
    if (typeof activeAttacks === 'undefined') { // Check if state is available
         console.error("Cannot handle attack button click: activeAttacks state is not available.");
        return;
    }

    const selectedEnergyType = energyTypeSelect.value;

    // Determine the new state
    const currentAttackForType = activeAttacks[selectedEnergyType] || null;
    const newAttackState = (currentAttackForType === attackType) ? null : attackType;

    // Update the state object (modifies the imported 'let' variable)
    activeAttacks[selectedEnergyType] = newAttackState;
    console.log(`Active attack state updated for ${selectedEnergyType}:`, activeAttacks);

    // Trigger UI updates using imported functions
    updateAttackButtonStates(selectedEnergyType);
    updateSliderLimitAndStyle(selectedEnergyType);

    // Trigger animation using imported function
    triggerAnimation(button, 'pulse');
}

// ... (keep notes if desired) ...
import { activeAttacks } from './state.js'; // Need mutable access to the activeAttacks state object
import { energyTypeSelect } from './dom-elements.js'; // Need the dropdown to know the current type

// Import UI update functions
import {
    updateAttackButtonStates,
    updateSliderLimitAndStyle
} from './ui-updater.js'; // Assuming these are in ui-updater.js

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

    if (!energyTypeSelect || !attackType) {
        console.error("Cannot handle attack button click: energy type select or attack type missing.");
        return;
    }
    if (!activeAttacks) {
         console.error("Cannot handle attack button click: activeAttacks state is not available.");
        return;
    }


    const selectedEnergyType = energyTypeSelect.value;

    // Determine the new state: if the current attack is the one clicked, turn it off (null).
    // Otherwise, set the new attack type.
    const currentAttackForType = activeAttacks[selectedEnergyType] || null;
    const newAttackState = (currentAttackForType === attackType) ? null : attackType;

    // Update the state object (assuming activeAttacks is 'export let' from state.js)
    activeAttacks[selectedEnergyType] = newAttackState;
    console.log(`Active attack state updated for ${selectedEnergyType}:`, activeAttacks);

    // Trigger UI updates (these functions need to be imported)
    updateAttackButtonStates(selectedEnergyType);
    updateSliderLimitAndStyle(selectedEnergyType); // Update slider gradient/limit

    // Optional: Visual feedback for the button click
    triggerAnimation(button, 'pulse');
}

// Note:
// - The event listeners for the attack buttons themselves (`superAttackBtn`, `ultimateAttackBtn`)
//   will be set up in `event-listeners.js` or `main.js` and will call this handler.
// - The actual effect of the attack reservation (limiting slider percentage during calculation)
//   is handled within the calculation logic (`calculation.js`).