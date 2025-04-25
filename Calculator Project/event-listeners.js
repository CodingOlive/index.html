// event-listeners.js - Sets up all application event listeners.

// --- Import DOM Elements ---
// Import practically all interactive elements
import {
    // Auth/Save/Load/View Buttons
    googleSignInBtn, signOutBtn, saveBtn, loadBtn, clearBtn, showCharacterStatsBtn,
    // Main Controls
    energyTypeSelect, calculateBtn, addDynamicBoxBtn, baseDamageInput,
    attackCompressionPointsInput, baseMultiplierInput,
    // Containers for Delegation
    energyPoolsContainer, slidersGrid, allSlidersContainer, // Use 'allSlidersContainer' for delegation
    formListContainer, activeFormsListContainer, equationDisplayEl,
    // Stats Panel Buttons
    resetAttackCountBtn, superAttackBtn, ultimateAttackBtn,
    // Character Stats Screen Elements
    characterNameInput, charBaseHealthInput, charBaseMultiplierInput, charVitalityInput,
    charSoulPowerInput, charSoulHpInput, charBaseAcInput, charBaseTrInput, charSpeedInput,
    ryokoCheckbox, ryokoEquationInput,
    // Form Creator Elements
    formAffectsResistancesCheckbox, addFormButton,
    // Kaioken Elements
    kaiokenCheckbox, maxHealthInput, kaiokenStrainInput, regenHealthBtn,
    // Misc
    characterStatsScreen // Needed for view toggle logic
} from './dom-elements.js';


// --- Import Handler Functions & State ---
// Import handlers from all relevant modules
import { handleGoogleSignIn, handleSignOut } from './auth.js';
import { saveStateToDb, loadStateAndApply, clearStateFromDb } from './database.js';
import { handleStatChange, handleRyokoCheckboxChange, evaluateRyokoEquation } from './character-stats.js';
import { handleAddForm, handleDeleteFormClick, handleActiveFormChange, handleAffectsResistanceToggle, applyActiveFormEffects } from './forms.js'; // Added applyActiveFormEffects
import { handleAttackButtonClick } from './attacks.js';
import { regenerateEnergy } from './energy-pools.js';
import { regenerateHealth } from './kaioken.js';
import { handleEquationClick, updateEquationDisplay } from './equation.js';
import { performCalculation, updateSingleSliderDisplay } from './calculation.js';
import { addDynamicModifier } from './dom-generators.js';
import { showCharacterStatsView, showCalculatorView, updateStatsDisplay, displayEnergyPool, updateAttackButtonStates, updateSliderLimitAndStyle, updateCurrentHealthDisplay } from './ui-updater.js'; // Added more UI handlers
import { updateSpeedSliderDisplay } from './speed-slider.js';
import { triggerAnimation } from './utils.js';
import { showMessage } from './ui-feedback.js';
import { currentUser, attackCount as _attackCount, activeAttacks } from './state.js'; // Import state vars needed directly
import { ALL_ENERGY_TYPES } from './config.js'; // Import config needed for delegation logic

// Use a local variable for mutable attackCount state for clarity
let attackCount = _attackCount;


// --- Event Listener Setup Function ---

/**
 * Attaches all necessary event listeners to the DOM elements.
 * Should be called once during application initialization.
 */
export function setupAllEventListeners() {
    console.log("Setting up event listeners...");

    // --- Static element listeners ---

    // Auth Buttons
    googleSignInBtn?.addEventListener('click', handleGoogleSignIn);
    signOutBtn?.addEventListener('click', handleSignOut);

    // Save/Load/Clear Buttons
    saveBtn?.addEventListener('click', () => {
        if (!currentUser) { showMessage('You must be signed in to save.', 'error'); return; }
        saveStateToDb(currentUser.uid); // Use imported function
    });
    loadBtn?.addEventListener('click', () => {
        if (!currentUser) { showMessage('You must be signed in to load.', 'error'); return; }
        loadStateAndApply(currentUser.uid).then(loaded => { // Use imported function
             showMessage(loaded ? 'State loaded successfully.' : 'No saved state found or failed to load.', loaded ? 'success' : 'info');
        });
    });
    clearBtn?.addEventListener('click', () => {
        if (!currentUser) { showMessage('You must be signed in to clear.', 'error'); return; }
        if (confirm('Are you sure you want to clear your saved state FROM FIREBASE? This cannot be undone.')) {
            clearStateFromDb(currentUser.uid).then(cleared => { // Use imported function
                if(cleared) setTimeout(() => window.location.reload(), 1000);
            });
        }
    });

    // Tab Switching Button
     showCharacterStatsBtn?.addEventListener('click', () => {
        // Use imported elements and view functions
        if (characterStatsScreen?.classList.contains('hidden')) {
            showCharacterStatsView();
        } else {
            showCalculatorView();
        }
        triggerAnimation(showCharacterStatsBtn, 'pulse'); // Use imported util
    });


    // Main Controls
    energyTypeSelect?.addEventListener('change', () => {
        // Handles multiple UI updates based on the selected energy type
        const selectedType = energyTypeSelect.value;
        console.log('Energy type changed to:', selectedType);
        displayEnergyPool(selectedType);        // Update pool display/visibility/glow
        updateAttackButtonStates(selectedType); // Update attack button active state
        updateSliderLimitAndStyle(selectedType); // Update focused slider reserve style
        updateStatsDisplay();                   // Update stats panel (e.g., current energy)
        updateEquationDisplay();                // Update equation display
    });
    calculateBtn?.addEventListener('click', () => {
        triggerAnimation(calculateBtn, 'pulse');
        performCalculation(); // Use imported function
    });
    addDynamicBoxBtn?.addEventListener('click', () => {
        triggerAnimation(addDynamicBoxBtn, 'pulse');
        addDynamicModifier(); // Use imported function
        updateEquationDisplay(); // Use imported function
    });

    // Base Damage / Compression / Base Multiplier Inputs
    baseDamageInput?.addEventListener('input', updateEquationDisplay);
    attackCompressionPointsInput?.addEventListener('input', updateEquationDisplay);
    baseMultiplierInput?.addEventListener('input', () => {
        // Base Multiplier might trigger full recalc if not in Ryoko mode
        if (!baseMultiplierInput?.readOnly) {
             handleStatChange(); // Full recalc (imports many things indirectly)
        } else {
             updateEquationDisplay(); // Just update equation if Ryoko
        }
    });
    baseMultiplierInput?.addEventListener('change', () => { // Handle paste etc.
         if (!baseMultiplierInput?.readOnly) handleStatChange(); else updateEquationDisplay();
    });


    // --- Character Stat inputs listener ---
    const charStatInputs = [
        charBaseHealthInput, charVitalityInput, charSoulPowerInput, charSoulHpInput,
        charBaseAcInput, charBaseTrInput, charSpeedInput
    ];
    charStatInputs.forEach(input => {
        input?.addEventListener('input', handleStatChange); // Use imported handler
        input?.addEventListener('change', handleStatChange);
    });

    // Ryoko Mode Listeners
    ryokoCheckbox?.addEventListener('change', handleRyokoCheckboxChange); // Use imported handler
    ryokoEquationInput?.addEventListener('input', evaluateRyokoEquation); // Use imported handler
    ryokoEquationInput?.addEventListener('change', evaluateRyokoEquation);

    // --- Kaioken section listeners ---
    kaiokenCheckbox?.addEventListener('change', () => {
        // Handles UI changes directly related to checkbox state
        const isChecked = kaiokenCheckbox.checked;
        kaiokenDetails?.classList.toggle('hidden', !isChecked); // Use imported element
        if (isChecked) {
            applyKaiokenStyle(); // Use imported UI function
            updateCurrentHealthDisplay(); // Use imported UI function
        } else {
            removeKaiokenStyle(); // Use imported UI function
        }
        // Equation doesn't directly depend on checkbox, but calculation might, so update is safe
        updateEquationDisplay(); // Use imported function
    });
    maxHealthInput?.addEventListener('input', updateCurrentHealthDisplay); // Use imported UI function
    maxHealthInput?.addEventListener('change', updateCurrentHealthDisplay);
    kaiokenStrainInput?.addEventListener('input', updateEquationDisplay); // Update equation as strain changes
    kaiokenStrainInput?.addEventListener('change', updateEquationDisplay);
    regenHealthBtn?.addEventListener('click', () => {
        triggerAnimation(regenHealthBtn, 'pulse'); // Use imported util
        regenerateHealth(); // Use imported handler
    });


    // --- Form Creator Listeners ---
    formAffectsResistancesCheckbox?.addEventListener('change', handleAffectsResistanceToggle); // Use imported handler
    addFormButton?.addEventListener('click', () => {
        triggerAnimation(addFormButton, 'pulse'); // Use imported util
        handleAddForm(); // Use imported handler
    });


    // --- Equation click listener ---
    equationDisplayEl?.addEventListener('click', handleEquationClick); // Use imported handler


    // --- Reset Attack Count button listener ---
    resetAttackCountBtn?.addEventListener('click', () => {
        // Modifies imported state variable directly for now
        attackCount = 0;
        // We might need a setter in state.js like setAttackCount(0) in future
        updateStatsDisplay(); // Use imported UI function
        showMessage('Attack count reset.', 'info'); // Use imported UI function
        triggerAnimation(resetAttackCountBtn, 'pulse'); // Use imported util
    });


    // --- Attack Button Listeners ---
    superAttackBtn?.addEventListener('click', handleAttackButtonClick); // Use imported handler
    ultimateAttackBtn?.addEventListener('click', handleAttackButtonClick); // Use imported handler


    // --- Event Delegation Setup ---

    // Energy Pool Inputs (DPP, Regen %) using delegation
    energyPoolsContainer?.addEventListener('input', (event) => {
        const target = event.target;
        if (target.matches('.damage-per-power, .max-multiplier')) { // Update equation if DPP or Pool Max Mult changes manually
            updateEquationDisplay(); // Use imported function
        }
        // Also update slider display if DPP changes, as it affects damage output
        if (target.matches('.damage-per-power')) {
            const type = target.id.split('-')[0];
            updateSingleSliderDisplay(type); // Use imported function
        }
         // If max multiplier is changed manually, need to recalculate energy
         if (target.matches('.max-multiplier')) {
            const type = target.id.split('-')[0];
            // applyActiveFormEffects(); // Re-applying effects might overwrite manual change? Better recalculate specific pool
             calculateAndResetEnergy(type); // TODO: Import calculateAndResetEnergy
             updateStatsDisplay(); // Stats panel depends on pool energy
        }

    });

    // Energy Pool Regen Button Clicks using delegation
    energyPoolsContainer?.addEventListener('click', (event) => {
        const button = event.target.closest('.regen-btn');
        if (button && button.dataset.type) {
             triggerAnimation(button, 'pulse'); // Use imported util
            regenerateEnergy(button.dataset.type); // Use imported handler
        }
    });


     // Sliders Grid Input (Energy + Speed sliders) using delegation
     const slidersContainerElement = allSlidersContainer || slidersGrid; // Prefer overall container if available
     slidersContainerElement?.addEventListener('input', (event) => {
        const slider = event.target;
        if (slider.type === 'range' && slider.classList.contains('energy-slider')) {
            const sliderType = slider.dataset.type;

            if (sliderType === 'speed') {
                 updateSpeedSliderDisplay(); // Use imported handler
                 updateEquationDisplay(); // Use imported handler
            } else if (ALL_ENERGY_TYPES.includes(sliderType)) { // Use imported config
                 // Enforce attack reserve limit
                const attackState = activeAttacks[sliderType] || null; // Use imported state
                let limitPercent = 100;
                if (attackState === 'super') limitPercent = 95;
                else if (attackState === 'ultimate') limitPercent = 90;
                if (parseInt(slider.value) > limitPercent) {
                    slider.value = limitPercent;
                }
                updateSingleSliderDisplay(sliderType); // Use imported handler
                updateEquationDisplay(); // Use imported handler
            }
        }
    });

     // Form List Delete Buttons (Stats Panel) using delegation
     formListContainer?.addEventListener('click', handleDeleteFormClick); // Use imported handler


     // Active Forms Checkboxes (Main Area) using delegation
     activeFormsListContainer?.addEventListener('change', (event) => {
         if (event.target.matches('input[type="checkbox"][id^="active-form-"]')) {
             handleActiveFormChange(event); // Use imported handler
         }
     });

    console.log("Event listeners setup complete.");
}