// event-listeners.js - Sets up all application event listeners.

// --- Import DOM Elements ---
import {
    // Auth/Save/Load/View Buttons
    googleSignInBtn, signOutBtn, saveBtn, loadBtn, clearBtn, showCharacterStatsBtn,
    // Main Controls
    energyTypeSelect, calculateBtn, addDynamicBoxBtn, baseDamageInput,
    attackCompressionPointsInput, baseMultiplierInput,
    // Containers for Delegation
    energyPoolsContainer, slidersGrid, allSlidersContainer, // Use 'allSlidersContainer' or 'slidersGrid' based on structure
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
    kaiokenCheckbox, maxHealthInput, kaiokenStrainInput, regenHealthBtn, kaiokenDetails,
    // Misc
    characterStatsScreen, adminPanelToggleBtn // Added admin toggle button
} from './dom-elements.js';


// --- Import Handler Functions & State ---
import { handleGoogleSignIn, handleSignOut, setupAuthListener } from './auth.js'; // setupAuthListener called in main.js
import { saveStateToDb, loadStateAndApply, clearStateFromDb } from './database.js';
import { handleStatChange, handleRyokoCheckboxChange, evaluateRyokoEquation } from './character-stats.js';
import { handleAddForm, handleDeleteFormClick, handleActiveFormChange, handleAffectsResistanceToggle, applyActiveFormEffects } from './forms.js';
import { handleAttackButtonClick } from './attacks.js';
import { regenerateEnergy, calculateAndResetEnergy } from './energy-pools.js';
import { regenerateHealth } from './kaioken.js';
import { handleEquationClick, updateEquationDisplay } from './equation.js';
import { performCalculation, updateSingleSliderDisplay } from './calculation.js';
import { addDynamicModifier } from './dom-generators.js';
import { showCharacterStatsView, showCalculatorView, updateStatsDisplay, displayEnergyPool, updateAttackButtonStates, updateSliderLimitAndStyle, updateCurrentHealthDisplay, applyKaiokenStyle, removeKaiokenStyle } from './ui-updater.js';
import { updateSpeedSliderDisplay } from './speed-slider.js';
import { triggerAnimation } from './utils.js';
import { showMessage } from './ui-feedback.js';
import { currentUser, activeAttacks, attackCount as _attackCount } from './state.js'; // Import state vars needed directly
import { ALL_ENERGY_TYPES } from './config.js';
// Import admin panel toggle function
import { toggleAdminPanel } from './admin.js'; // Assuming toggle function is exported from admin.js


// Use a local variable for mutable attackCount state for clarity
// Note: Directly modifying imported 'let' works but isn't always best practice.
let attackCount = _attackCount;


// --- Event Listener Setup Function ---

/**
 * Attaches all necessary event listeners to the DOM elements.
 * Should be called once during application initialization.
 */
export function setupAllEventListeners() {
    console.log("Setting up event listeners...");

    // --- Static element listeners ---
    // Using imported elements and handlers

    // Auth Buttons
    googleSignInBtn?.addEventListener('click', handleGoogleSignIn);
    signOutBtn?.addEventListener('click', handleSignOut);

    // Save/Load/Clear Buttons
    saveBtn?.addEventListener('click', () => {
        if (!currentUser) { showMessage('You must be signed in to save.', 'error'); return; }
        saveStateToDb(currentUser.uid);
    });
    loadBtn?.addEventListener('click', () => {
        if (!currentUser) { showMessage('You must be signed in to load.', 'error'); return; }
        loadStateAndApply(currentUser.uid).then(loaded => {
             showMessage(loaded ? 'State loaded successfully.' : 'No saved state found or failed to load.', loaded ? 'success' : 'info');
        });
    });
    clearBtn?.addEventListener('click', () => {
        if (!currentUser) { showMessage('You must be signed in to clear.', 'error'); return; }
        if (confirm('Are you sure you want to clear your saved state FROM FIREBASE? This cannot be undone.')) {
            clearStateFromDb(currentUser.uid).then(cleared => {
                if(cleared) setTimeout(() => window.location.reload(), 1000);
            });
        }
    });

    // Tab Switching Button
     showCharacterStatsBtn?.addEventListener('click', () => {
        if (characterStatsScreen?.classList.contains('hidden')) {
            showCharacterStatsView();
        } else {
            showCalculatorView();
        }
        triggerAnimation(showCharacterStatsBtn, 'pulse');
    });

    // --- NEW: Admin Panel Toggle Button Listener ---
    adminPanelToggleBtn?.addEventListener('click', toggleAdminPanel); // Use imported handler


    // Main Controls
    energyTypeSelect?.addEventListener('change', () => {
        const selectedType = energyTypeSelect.value;
        console.log('Energy type changed to:', selectedType);
        displayEnergyPool(selectedType);
        updateAttackButtonStates(selectedType);
        updateSliderLimitAndStyle(selectedType);
        updateStatsDisplay();
        updateEquationDisplay();
    });
    calculateBtn?.addEventListener('click', () => {
        triggerAnimation(calculateBtn, 'pulse');
        performCalculation();
    });
    addDynamicBoxBtn?.addEventListener('click', () => {
        triggerAnimation(addDynamicBoxBtn, 'pulse');
        addDynamicModifier();
        updateEquationDisplay();
    });

    // Base Damage / Compression / Base Multiplier Inputs
    baseDamageInput?.addEventListener('input', updateEquationDisplay);
    attackCompressionPointsInput?.addEventListener('input', updateEquationDisplay);
    baseMultiplierInput?.addEventListener('input', () => {
        if (!baseMultiplierInput?.readOnly) { handleStatChange(); }
        else { updateEquationDisplay(); }
    });
    baseMultiplierInput?.addEventListener('change', () => {
         if (!baseMultiplierInput?.readOnly) handleStatChange(); else updateEquationDisplay();
    });


    // --- Character Stat inputs listener ---
    const charStatInputs = [
        charBaseHealthInput, charVitalityInput, charSoulPowerInput, charSoulHpInput,
        charBaseAcInput, charBaseTrInput, charSpeedInput
    ];
    charStatInputs.forEach(input => {
        input?.addEventListener('input', handleStatChange);
        input?.addEventListener('change', handleStatChange);
    });

    // Ryoko Mode Listeners
    ryokoCheckbox?.addEventListener('change', handleRyokoCheckboxChange);
    ryokoEquationInput?.addEventListener('input', evaluateRyokoEquation);
    ryokoEquationInput?.addEventListener('change', evaluateRyokoEquation);

    // --- Kaioken section listeners ---
    kaiokenCheckbox?.addEventListener('change', () => {
        const isChecked = kaiokenCheckbox.checked;
        kaiokenDetails?.classList.toggle('hidden', !isChecked);
        if (isChecked) {
            if(energyTypeSelect?.value === 'ki') {
                applyKaiokenStyle();
                updateCurrentHealthDisplay();
            }
        } else {
            removeKaiokenStyle();
        }
        updateEquationDisplay();
    });
    maxHealthInput?.addEventListener('input', updateCurrentHealthDisplay);
    maxHealthInput?.addEventListener('change', updateCurrentHealthDisplay);
    kaiokenStrainInput?.addEventListener('input', updateEquationDisplay);
    kaiokenStrainInput?.addEventListener('change', updateEquationDisplay);
    regenHealthBtn?.addEventListener('click', () => {
        triggerAnimation(regenHealthBtn, 'pulse');
        regenerateHealth();
    });


    // --- Form Creator Listeners ---
    formAffectsResistancesCheckbox?.addEventListener('change', handleAffectsResistanceToggle);
    addFormButton?.addEventListener('click', () => {
        triggerAnimation(addFormButton, 'pulse');
        handleAddForm();
    });


    // --- Equation click listener ---
    equationDisplayEl?.addEventListener('click', handleEquationClick);


    // --- Reset Attack Count button listener ---
    resetAttackCountBtn?.addEventListener('click', () => {
        attackCount = 0; // Modify state directly
        updateStatsDisplay();
        showMessage('Attack count reset.', 'info');
        triggerAnimation(resetAttackCountBtn, 'pulse');
    });


    // --- Attack Button Listeners ---
    superAttackBtn?.addEventListener('click', handleAttackButtonClick);
    ultimateAttackBtn?.addEventListener('click', handleAttackButtonClick);


    // --- Event Delegation Setup ---

    // Energy Pool Inputs (DPP, Regen %, Manual Max Multiplier) using delegation
    energyPoolsContainer?.addEventListener('input', (event) => {
        const target = event.target;
        let type = target.id?.split('-')[0];

        if (target.matches('.damage-per-power')) {
            // Check if type is valid (could be from a standard or custom pool ID)
            // We might need a better way to validate type extracted from ID if custom IDs are complex
            if(type) { // Basic check for now
                updateSingleSliderDisplay(type);
                updateEquationDisplay();
            }
        }
        if (target.matches('.max-multiplier')) {
             if(type) { // Basic check for now
                 console.warn(`Manual update to ${type} max multiplier. May be overwritten by form effects.`);
                 calculateAndResetEnergy(type);
                 updateStatsDisplay();
                 updateEquationDisplay();
             }
        }
    });

    // Energy Pool Regen Button Clicks using delegation
    energyPoolsContainer?.addEventListener('click', (event) => {
        const button = event.target.closest('.regen-btn');
        if (button && button.dataset.type) {
             triggerAnimation(button, 'pulse');
            regenerateEnergy(button.dataset.type);
        }
    });


     // Sliders Grid Input (Energy + Speed sliders) using delegation
     const slidersContainerElement = allSlidersContainer || slidersGrid;
     slidersContainerElement?.addEventListener('input', (event) => {
        const slider = event.target;
        if (slider.type === 'range' && slider.classList.contains('energy-slider')) {
            const sliderType = slider.dataset.type; // Standard key or custom ID

            if (sliderType === 'speed') {
                 updateSpeedSliderDisplay();
                 updateEquationDisplay();
            } else { // Assume it's an energy type (standard or custom)
                // Enforce attack reserve limit
                const attackState = activeAttacks[sliderType] || null;
                let limitPercent = 100;
                if (attackState === 'super') limitPercent = 95;
                else if (attackState === 'ultimate') limitPercent = 90;
                if (parseInt(slider.value) > limitPercent) {
                    slider.value = limitPercent;
                }
                updateSingleSliderDisplay(sliderType);
                updateEquationDisplay();
            }
        }
    });

     // Form List Delete Buttons (Stats Panel) using delegation
     formListContainer?.addEventListener('click', handleDeleteFormClick);


     // Active Forms Checkboxes (Main Area) using delegation
     activeFormsListContainer?.addEventListener('change', (event) => {
         if (event.target.matches('input[type="checkbox"][id^="active-form-"]')) {
             handleActiveFormChange(event);
         }
     });

    console.log("Event listeners setup complete.");
}

