// event-listeners.js - Sets up all application event listeners.

// --- Import DOM Elements ---
import {
    // Auth/Save/Load/View Buttons
    googleSignInBtn, signOutBtn, saveBtn, loadBtn, clearBtn, showCharacterStatsBtn,
    // Main Controls
    energyTypeSelect, calculateBtn, addDynamicBoxBtn, baseDamageInput,
    attackCompressionPointsInput, baseMultiplierInput, formMultiplierInput,
    // Containers for Delegation
    energyPoolsContainer, slidersGrid, allSlidersContainer,
    dynamicModifiersContainer,
    formListContainer, activeFormsListContainer, equationDisplayEl,
    // Stats Panel Buttons
    resetAttackCountBtn,
    superAttackBtn, ultimateAttackBtn,
    // Character Stats Screen Elements
    characterNameInput, charBaseHealthInput, charBaseMultiplierInput, charVitalityInput,
    charSoulPowerInput, charSoulHpInput, charBaseAcInput, charBaseTrInput, charSpeedInput,
    ryokoCheckbox, ryokoEquationInput,
    // Form Creator Elements
    formAffectsResistancesCheckbox, addFormButton,
    // Kaioken Elements
    kaiokenCheckbox, maxHealthInput, kaiokenStrainInput, regenHealthBtn, kaiokenDetails,
    // View Containers needed for the button handler
    characterStatsScreen, mainCalculatorContent, mainTitle,
    // Admin Elements
    adminPanelToggleBtn,
    // Speed slider is handled via delegation targetting slidersContainerElement below

} from './dom-elements.js';


// --- Import Handler Functions & State ---
import { handleGoogleSignIn, handleSignOut } from './auth.js'; // Removed setupAuthListener as it's called in main.js
import { saveStateToDb, loadStateAndApply, clearStateFromDb } from './database.js';
import { handleStatChange, handleRyokoCheckboxChange, evaluateRyokoEquation } from './character-stats.js';
import { handleAddForm, handleDeleteFormClick, handleActiveFormChange, handleAffectsResistanceToggle, applyActiveFormEffects } from './forms.js';
import { handleAttackButtonClick } from './attacks.js';
import { regenerateEnergy, calculateAndResetEnergy, getEnergyElements } from './energy-pools.js';
import { regenerateHealth } from './kaioken.js';
import { handleEquationClick, updateEquationDisplay } from './equation.js';
import { performCalculation, updateSingleSliderDisplay } from './calculation.js';
import { addDynamicModifier, generateSpeedSlider } from './dom-generators.js'; // Removed unused form/active list renderers
// Import the UI update functions that are DIRECTLY called by listeners here
import {
    showCharacterStatsView, showCalculatorView, updateStatsDisplay, displayEnergyPool, // <-- displayEnergyPool is key here
    updateAttackButtonStates, updateCurrentHealthDisplay,
    applyKaiokenStyle, removeKaiokenStyle // Added missing removeKaiokenStyle
} from './ui-updater.js';
import { updateSpeedSliderDisplay } from './speed-slider.js';
import { triggerAnimation } from './utils.js';
import { showMessage } from './ui-feedback.js';
import {
    currentUser, // Keep for read-only checks
    resetAttackStats // Import the setter/action for the reset button
} from './state.js';
// import { ALL_ENERGY_TYPES } from './config.js'; // Not directly used here
// import { toggleAdminPanel, setupAdminPanelListeners } from './admin.js'; // Listeners setup in main.js/admin.js
import { addListenersToModifierBox } from './modifiers.js';


// --- Event Listener Helper Functions ---

/**
 * Handles clicks on the "Regen" button within an energy pool (using delegation).
 * @param {Event} event - The click event.
 */
function handleRegenButtonClick(event) {
     const button = event.target.closest('.regen-btn'); // Find the button specifically
     if (button && button.dataset.type) {
         const energyType = button.dataset.type;
         console.log(`Regen button clicked for type: ${energyType}`);
         regenerateEnergy(energyType); // Call the specific logic function
         triggerAnimation(button, 'pulse'); // Add feedback
     }
}

/**
 * Handles input changes within the energy pools container (e.g., max multiplier, dpp, regen rate) using delegation.
 * @param {Event} event - The input event.
 */
function handleEnergyPoolInputChange(event) {
    const input = event.target;
    // Check if the event target is one of the inputs we care about
    if (input.classList.contains('max-multiplier') ||
        input.classList.contains('damage-per-power') ||
        input.classList.contains('regen-percent'))
    {
        // Identify the energy type from a parent element or input ID structure
        const poolDiv = input.closest('.energy-pool');
        const typeId = poolDiv?.id.replace('-pool', ''); // Example: Extract 'ki' from 'ki-pool'

        if (typeId) {
            console.log(`Input changed in pool ${typeId}:`, input.className);
            // Check which input changed and trigger appropriate updates
            if (input.classList.contains('max-multiplier')) {
                // Recalculate energy for this pool
                 calculateAndResetEnergy(typeId);
                 // Stats display might need update if total energy affects something shown there
                 updateStatsDisplay();
                  // Update equation display as pool multipliers can affect it indirectly via total energy affecting current
                 updateEquationDisplay();
            } else if (input.classList.contains('damage-per-power')) {
                 // Update the slider display text and the main equation when DPP changes
                 updateSingleSliderDisplay(typeId);
                 updateEquationDisplay();
            } else if (input.classList.contains('regen-percent')){
                 // Only need to update UI if regen rate itself is displayed elsewhere,
                 // otherwise just wait for the regen button click.
                 // If calculation depends on it changing, updateEquationDisplay() might be needed.
            }
        }
    }
}

/**
 * Handles input changes within the sliders container (energy sliders, speed slider) using delegation.
 * @param {Event} event - The input event.
 */
function handleSliderInputChange(event) {
     const slider = event.target;
     // Check if the event target is an input of type range (our sliders)
     if (slider.type === 'range' && (slider.classList.contains('energy-slider') || slider.id === 'speed-slider')) {
         const type = slider.dataset.type; // 'ki', 'nen', 'speed', etc.
         console.log(`Slider input changed for type: ${type}, value: ${slider.value}`);
         if (type === 'speed') {
             updateSpeedSliderDisplay(); // Update speed display text (S: xxx, D: xxx)
         } else if (type) {
             updateSingleSliderDisplay(type); // Update energy display text (E: xxx, D: xxx)
         }
         // Any slider change affects the final calculation equation
         updateEquationDisplay();
     }
}


/**
 * Handles the click event for the "Reset Attack Stats" button.
 * Uses the resetAttackStats action from state.js.
 */
function handleResetAttackStatsClick() {
    if (confirm("Are you sure you want to reset the total damage, energy spent, attack count, and highest damage stats?")) {
        resetAttackStats();   // <-- Use the action/setter from state.js
        updateStatsDisplay(); // <-- Update the UI to reflect the reset
        showMessage("Attack stats reset.", "info"); // <-- Give user feedback
        triggerAnimation(resetAttackCountBtn, 'pulse'); // Feedback on button
    }
}


// --- Event Listener Setup Function ---
export function setupAllEventListeners() {
    console.log("Setting up event listeners...");

    // --- Top Bar Buttons ---
    googleSignInBtn?.addEventListener('click', handleGoogleSignIn);
    signOutBtn?.addEventListener('click', handleSignOut);
    saveBtn?.addEventListener('click', () => {
         if (!currentUser) { showMessage("Please sign in to save your state.", "error"); return; }
         saveStateToDb(currentUser.uid);
         triggerAnimation(saveBtn,'pulse');
     });
    loadBtn?.addEventListener('click', async () => {
         if (!currentUser) { showMessage("Please sign in to load your state.", "error"); return; }
         showMessage("Attempting to load state...", "info");
         triggerAnimation(loadBtn,'pulse'); // Indicate action start
         const success = await loadStateAndApply(currentUser.uid); // Wait for load/apply
         // Note: applyState should handle success/error messages internally now
         // if (success) { showMessage("State loaded and applied successfully!", "success"); }
         // else { showMessage("Failed to load state or no state found.", "error"); }
     });
    clearBtn?.addEventListener('click', () => {
         if (!currentUser) { showMessage("Please sign in to clear your saved state.", "error"); return; }
         if (confirm("Are you sure you want to clear your SAVED state in the cloud? This cannot be undone.")) {
             clearStateFromDb(currentUser.uid);
             triggerAnimation(clearBtn,'pulse');
             // Optionally reset local UI here if desired, though logout/login would handle it
         }
     });
    showCharacterStatsBtn?.addEventListener('click', () => {
        // Logic to switch views is now inside the view functions themselves mostly
        if (characterStatsScreen?.classList.contains('hidden')) {
            showCharacterStatsView();
        } else {
            showCalculatorView();
        }
        triggerAnimation(showCharacterStatsBtn, 'pulse');
    });
    // Admin Panel Toggle listener is set up in admin.js

    // --- Main Calculation Area ---

    // ** Dropdown Change Listener **
    energyTypeSelect?.addEventListener('change', (event) => {
        const selectedType = event.target.value;
        if (selectedType) { // Ensure a value is selected
            console.log(`Dropdown changed. Attempting to display pool for: ${selectedType}`);
            // Call the UI update functions
            displayEnergyPool(selectedType);        // <-- Key function call from ui-updater.js
            updateStatsDisplay();                 // <-- Update stats panel
            updateAttackButtonStates(selectedType); // <-- Update attack button style/text
        } else {
             console.warn("Dropdown changed to an empty value.");
             // Optionally hide all pools if the selection is somehow empty
             displayEnergyPool(null);
        }
    });

    calculateBtn?.addEventListener('click', () => {
        performCalculation();
        triggerAnimation(calculateBtn, 'pulse-result');
    });
    addDynamicBoxBtn?.addEventListener('click', () => {
         addDynamicModifier(); // Add a new empty modifier box
         triggerAnimation(addDynamicBoxBtn, 'pulse');
     });

    // Direct listeners for inputs that ONLY affect the equation display in real-time
    baseDamageInput?.addEventListener('input', updateEquationDisplay);
    attackCompressionPointsInput?.addEventListener('input', updateEquationDisplay);
    // baseMultiplierInput listener handled by handleStatChange (affects pools)
    // formMultiplierInput is read-only

     // Listener for the read-only form multiplier input for interaction hint
     formMultiplierInput?.addEventListener('click', () => {
         const targetSection = document.getElementById('active-forms-section');
         if (targetSection) {
             targetSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
             triggerAnimation(targetSection, 'pulse-source');
         }
     });


    // --- Character Stats Screen Inputs ---
    const charStatInputs = [
        charBaseHealthInput, charVitalityInput, charSoulPowerInput, charSoulHpInput,
        charBaseAcInput, charBaseTrInput, charSpeedInput, charBaseMultiplierInput // Base multiplier IS a stat input
    ];
    charStatInputs.forEach(input => {
        // 'input' for real-time updates (e.g., equation), 'change' for confirmation
        input?.addEventListener('input', handleStatChange); // handleStatChange updates pools, stats, speed slider visibility etc.
        // 'change' might be redundant if 'input' covers it, but safe to keep
        // input?.addEventListener('change', handleStatChange);
    });
    characterNameInput?.addEventListener('change', () => {
        // Auto-save name or handle as needed
        console.log("Character name changed to:", characterNameInput.value);
    });


    // --- Ryoko Mode ---
    ryokoCheckbox?.addEventListener('change', handleRyokoCheckboxChange);
    ryokoEquationInput?.addEventListener('input', evaluateRyokoEquation);
    // ryokoEquationInput?.addEventListener('change', evaluateRyokoEquation); // 'input' likely sufficient


    // --- Kaioken Section (Stats Panel) ---
    kaiokenCheckbox?.addEventListener('change', () => {
        const isChecked = kaiokenCheckbox.checked;
        if (kaiokenDetails) kaiokenDetails.classList.toggle('hidden', !isChecked);
        // Apply/remove styles
        if (isChecked) { applyKaiokenStyle(); } else { removeKaiokenStyle(); }
        updateEquationDisplay(); // Strain affects equation, toggle might change defaults
    });
    maxHealthInput?.addEventListener('input', updateCurrentHealthDisplay); // Update current health display based on max
    // maxHealthInput?.addEventListener('change', updateCurrentHealthDisplay);
    kaiokenStrainInput?.addEventListener('input', updateEquationDisplay); // Strain value affects equation
    // kaiokenStrainInput?.addEventListener('change', updateEquationDisplay);
    regenHealthBtn?.addEventListener('click', () => {
         regenerateHealth(); // Call the handler from kaioken.js
         triggerAnimation(regenHealthBtn, 'pulse');
     });


    // --- Form Creator (Character Stats Screen) ---
    formAffectsResistancesCheckbox?.addEventListener('change', handleAffectsResistanceToggle);
    addFormButton?.addEventListener('click', () => {
        handleAddForm(); // Call handler from forms.js
        triggerAnimation(addFormButton, 'pulse');
    });


    // --- Result Area ---
    equationDisplayEl?.addEventListener('click', handleEquationClick); // Handle clicks on numbers in equation


    // --- Stats Panel ---
    resetAttackCountBtn?.addEventListener('click', handleResetAttackStatsClick); // Attach the reset handler
    superAttackBtn?.addEventListener('click', handleAttackButtonClick); // Handler in attacks.js
    ultimateAttackBtn?.addEventListener('click', handleAttackButtonClick); // Handler in attacks.js


    // --- Event Delegation Setup ---

    // Delegation for Energy Pool inputs ('input') and regen buttons ('click')
    energyPoolsContainer?.addEventListener('input', handleEnergyPoolInputChange);
    energyPoolsContainer?.addEventListener('click', handleRegenButtonClick);

    // Delegation for Dynamic Modifier boxes is handled internally by addListenersToModifierBox

    // Delegation for Energy/Speed Sliders ('input')
    // Use allSlidersContainer if it exists and wraps slidersGrid, otherwise use slidersGrid
    const slidersContainerElement = allSlidersContainer || slidersGrid;
    slidersContainerElement?.addEventListener('input', handleSliderInputChange);


    // Delegation for Form List Delete buttons ('click') in Stats Panel
    formListContainer?.addEventListener('click', handleDeleteFormClick);


    // Delegation for Active Form Checkboxes ('change') in Main Area
     activeFormsListContainer?.addEventListener('change', handleActiveFormChange);


    console.log("Event listeners setup complete.");
}
