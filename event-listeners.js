// event-listeners.js - Sets up all application event listeners.

// --- Import DOM Elements ---
import {
    // Auth/Save/Load/View Buttons
    googleSignInBtn, signOutBtn, saveBtn, loadBtn, clearBtn, showCharacterStatsBtn,
    // Main Controls
    energyTypeSelect, calculateBtn, addDynamicBoxBtn, baseDamageInput,
    attackCompressionPointsInput, baseMultiplierInput, formMultiplierInput, // Added formMultiplierInput needed for direct listener below
    // Containers for Delegation
    energyPoolsContainer, slidersGrid, allSlidersContainer,
    dynamicModifiersContainer, // Added dynamicModifiersContainer needed for delegation
    formListContainer, activeFormsListContainer, equationDisplayEl,
    // Stats Panel Buttons
    resetAttackCountBtn, // <-- Need this button
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
    characterStatsScreen, mainCalculatorContent, mainTitle, // Added mainTitle
    // Admin Elements
    adminPanelToggleBtn, // Added adminPanelToggleBtn
    // Speed slider
    speedSlider // Added speedSlider (if direct listener needed, otherwise covered by delegation)

} from './dom-elements.js';


// --- Import Handler Functions & State ---
import { handleGoogleSignIn, handleSignOut, setupAuthListener } from './auth.js'; // Added setupAuthListener back for completeness
import { saveStateToDb, loadStateAndApply, clearStateFromDb } from './database.js';
import { handleStatChange, handleRyokoCheckboxChange, evaluateRyokoEquation } from './character-stats.js';
import { handleAddForm, handleDeleteFormClick, handleActiveFormChange, handleAffectsResistanceToggle, applyActiveFormEffects } from './forms.js';
import { handleAttackButtonClick } from './attacks.js';
import { regenerateEnergy, calculateAndResetEnergy, getEnergyElements } from './energy-pools.js'; // Added getEnergyElements
import { regenerateHealth } from './kaioken.js';
import { handleEquationClick, updateEquationDisplay } from './equation.js';
import { performCalculation, updateSingleSliderDisplay } from './calculation.js';
import { addDynamicModifier, renderFormList, renderActiveFormsSection, generateSpeedSlider } from './dom-generators.js'; // Added generateSpeedSlider
// Import the view switching functions
import {
    showCharacterStatsView, showCalculatorView, updateStatsDisplay, displayEnergyPool,
    updateAttackButtonStates, updateSliderLimitAndStyle, updateCurrentHealthDisplay,
    applyKaiokenStyle, removeKaiokenStyle, initializeDefaultUI, updateSpeedSliderVisibility // Added more UI updaters
} from './ui-updater.js';
import { updateSpeedSliderDisplay } from './speed-slider.js';
import { triggerAnimation } from './utils.js';
import { showMessage } from './ui-feedback.js';
import {
    currentUser, // Keep for read-only checks if needed
    resetAttackStats // <-- Import the new setter/action
} from './state.js';
import { ALL_ENERGY_TYPES } from './config.js';
import { toggleAdminPanel, setupAdminPanelListeners } from './admin.js'; // Added setupAdminPanelListeners
import { addListenersToModifierBox } from './modifiers.js'; // Added modifier listener setup


// --- Event Listener Helper Functions ---

/**
 * Handles clicks on the "Regen" button within an energy pool.
 * @param {Event} event - The click event.
 */
function handleRegenButtonClick(event) {
     const button = event.target.closest('.regen-btn');
     if (button && button.dataset.type) {
         const energyType = button.dataset.type;
         console.log(`Regen button clicked for type: ${energyType}`);
         regenerateEnergy(energyType); // Call the specific logic function
     }
}

/**
 * Handles input changes within the energy pools container (e.g., max multiplier, dpp, regen rate).
 * @param {Event} event - The input event.
 */
function handleEnergyPoolInputChange(event) {
    const input = event.target;
    // Identify the energy type from a parent element or input ID structure
    const poolDiv = input.closest('.energy-pool');
    const typeId = poolDiv?.id.replace('-pool', ''); // Example: Extract 'ki' from 'ki-pool'

    if (typeId) {
        // Check which input changed and trigger appropriate updates
        if (input.classList.contains('max-multiplier') || input.classList.contains('regen-percent')) {
            // Recalculate energy for this pool if max multiplier or regen rate changes
             calculateAndResetEnergy(typeId);
             // Stats display might need update if total energy affects something shown there
             updateStatsDisplay();
              // Update equation display as pool multipliers can affect it indirectly
             updateEquationDisplay();
        } else if (input.classList.contains('damage-per-power')) {
             // Update the slider display text and the main equation when DPP changes
             updateSingleSliderDisplay(typeId);
             updateEquationDisplay();
        }
        // Add more conditions if other inputs trigger different actions
    }
}

/**
 * Handles input changes within the sliders container (energy sliders, speed slider).
 * @param {Event} event - The input event.
 */
function handleSliderInputChange(event) {
     const slider = event.target;
     if (slider.type === 'range') {
         const type = slider.dataset.type; // 'ki', 'nen', 'speed', etc.
         if (type === 'speed') {
             updateSpeedSliderDisplay(); // Update speed display text
         } else if (type) {
             updateSingleSliderDisplay(type); // Update energy display text
         }
         updateEquationDisplay(); // Any slider change affects the final calculation equation
     }
}


// ********************************************
// *** NEW HANDLER FUNCTION ***
/**
 * Handles the click event for the "Reset Attack Stats" button.
 * Uses the resetAttackStats setter from state.js.
 */
function handleResetAttackStatsClick() {
    if (confirm("Are you sure you want to reset the total damage, energy spent, attack count, and highest damage stats?")) {
        resetAttackStats();   // <-- Use the action/setter from state.js
        updateStatsDisplay(); // <-- Update the UI to reflect the reset
        showMessage("Attack stats reset.", "info"); // <-- Give user feedback
    }
}
// ********************************************


// --- Event Listener Setup Function ---
export function setupAllEventListeners() {
    console.log("Setting up event listeners...");

    // --- Top Bar Buttons ---
    googleSignInBtn?.addEventListener('click', handleGoogleSignIn);
    signOutBtn?.addEventListener('click', handleSignOut);
    saveBtn?.addEventListener('click', () => {
         if (!currentUser) { showMessage("Please sign in to save your state.", "error"); return; }
         saveStateToDb(currentUser.uid);
     });
    loadBtn?.addEventListener('click', async () => { // Made async
         if (!currentUser) { showMessage("Please sign in to load your state.", "error"); return; }
         showMessage("Attempting to load state...", "info");
         const success = await loadStateAndApply(currentUser.uid); // Wait for load/apply
         if (success) {
             // State applied successfully via loadStateAndApply and auth listener updates
             showMessage("State loaded and applied successfully!", "success");
         } else {
             showMessage("Failed to load state or no state found.", "error");
         }
     });
    clearBtn?.addEventListener('click', () => {
         if (!currentUser) { showMessage("Please sign in to clear your saved state.", "error"); return; }
         if (confirm("Are you sure you want to clear your SAVED state in the cloud? This cannot be undone.")) {
             clearStateFromDb(currentUser.uid);
             // Optional: Also reset local state/UI to defaults?
             // initializeCoreState();
             // initializeDefaultUI();
             // updateStatsDisplay();
             // updateEquationDisplay();
         }
     });
    showCharacterStatsBtn?.addEventListener('click', () => {
        if (characterStatsScreen?.classList.contains('hidden')) {
            showCharacterStatsView();
        } else {
            showCalculatorView();
        }
        triggerAnimation(showCharacterStatsBtn, 'pulse');
    });
    // Admin Panel Toggle (Listener setup moved to setupAdminPanelListeners in admin.js, called from main.js)

    // --- Main Calculation Area ---
    energyTypeSelect?.addEventListener('change', (event) => {
        const selectedType = event.target.value;
        displayEnergyPool(selectedType); // Show the selected pool
        updateStatsDisplay(); // Update stats panel (mainly current energy display)
        updateAttackButtonStates(selectedType); // Update attack button active state/styles
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
    // Base Multiplier might affect pools if Ryoko mode is off, handled by handleStatChange
    // Form Multiplier is read-only, updated by applyActiveFormEffects

     // Listener for the form multiplier input (read-only) to potentially allow clicking it
     // to highlight the active forms section.
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
        charBaseAcInput, charBaseTrInput, charSpeedInput, charBaseMultiplierInput
        // Don't include characterNameInput here as it doesn't trigger calculations
    ];
    charStatInputs.forEach(input => {
        // 'input' for real-time updates (e.g., equation), 'change' for final value confirmation
        input?.addEventListener('input', handleStatChange);
        input?.addEventListener('change', handleStatChange); // handleStatChange updates pools, stats, speed slider visibility etc.
    });
    characterNameInput?.addEventListener('change', () => {
        // Maybe save character name automatically? Or just let gatherState pick it up.
        console.log("Character name changed to:", characterNameInput.value);
    });


    // --- Ryoko Mode ---
    ryokoCheckbox?.addEventListener('change', handleRyokoCheckboxChange);
    ryokoEquationInput?.addEventListener('input', evaluateRyokoEquation);
    ryokoEquationInput?.addEventListener('change', evaluateRyokoEquation);


    // --- Kaioken Section (Stats Panel) ---
    kaiokenCheckbox?.addEventListener('change', () => {
        const isChecked = kaiokenCheckbox.checked;
        if (kaiokenDetails) kaiokenDetails.classList.toggle('hidden', !isChecked);
        if (isChecked) { applyKaiokenStyle(); } else { removeKaiokenStyle(); }
        updateEquationDisplay(); // Strain affects equation
    });
    maxHealthInput?.addEventListener('input', updateCurrentHealthDisplay); // Update current health display based on max
    maxHealthInput?.addEventListener('change', updateCurrentHealthDisplay);
    kaiokenStrainInput?.addEventListener('input', updateEquationDisplay); // Strain value affects equation
    kaiokenStrainInput?.addEventListener('change', updateEquationDisplay);
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
    // ********************************************
    // *** NEW LISTENER ATTACHED HERE ***
    resetAttackCountBtn?.addEventListener('click', handleResetAttackStatsClick);
    // ********************************************
    superAttackBtn?.addEventListener('click', handleAttackButtonClick); // Handler in attacks.js
    ultimateAttackBtn?.addEventListener('click', handleAttackButtonClick); // Handler in attacks.js


    // --- Event Delegation Setup ---

    // Delegation for Energy Pool inputs and regen buttons
    energyPoolsContainer?.addEventListener('input', handleEnergyPoolInputChange);
    energyPoolsContainer?.addEventListener('click', handleRegenButtonClick); // Delegate regen clicks


     // Delegation for Dynamic Modifier box clicks/inputs (remove is handled internally in addListenersToModifierBox)
     dynamicModifiersContainer?.addEventListener('click', (event) => {
         // Handle clicks on type options if not handled directly in addListenersToModifierBox
         const option = event.target.closest('.modifier-type-option');
         if (option) {
             // The logic is now within addListenersToModifierBox, called when box is created.
             // If that failed, you could put fallback logic here.
         }
     });
     dynamicModifiersContainer?.addEventListener('input', (event) => {
         // Handle input changes if not handled directly
         if (event.target.classList.contains('modifier-value-input') || event.target.classList.contains('modifier-name-input')) {
             // Logic is now within addListenersToModifierBox.
         }
     });


    // Delegation for Energy/Speed Sliders
    // Use allSlidersContainer if it exists and wraps slidersGrid, otherwise use slidersGrid
    const slidersContainerElement = allSlidersContainer || slidersGrid;
    slidersContainerElement?.addEventListener('input', handleSliderInputChange);


    // Delegation for Form List (Delete buttons) in Stats Panel
    // The handler function `handleDeleteFormClick` is directly attached here.
    formListContainer?.addEventListener('click', handleDeleteFormClick);


     // Delegation for Active Form Checkboxes in Main Area
     // The handler function `handleActiveFormChange` is directly attached here.
     activeFormsListContainer?.addEventListener('change', handleActiveFormChange);


    console.log("Event listeners setup complete.");
}
