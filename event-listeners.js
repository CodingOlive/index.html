// event-listeners.js - Sets up all application event listeners.

// --- Import DOM Elements ---
import {
    // Auth/Save/Load/View Buttons
    googleSignInBtn, signOutBtn, saveBtn, loadBtn, clearBtn, showCharacterStatsBtn, // <-- Need this button
    // Main Controls
    energyTypeSelect, calculateBtn, addDynamicBoxBtn, baseDamageInput,
    attackCompressionPointsInput, baseMultiplierInput,
    // Containers for Delegation
    energyPoolsContainer, slidersGrid, allSlidersContainer,
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
    // View Containers needed for the button handler
    characterStatsScreen, mainCalculatorContent, // <-- Need these containers
    // Admin Elements
    adminPanelToggleBtn
} from './dom-elements.js';


// --- Import Handler Functions & State ---
import { handleGoogleSignIn, handleSignOut } from './auth.js';
import { saveStateToDb, loadStateAndApply, clearStateFromDb } from './database.js';
import { handleStatChange, handleRyokoCheckboxChange, evaluateRyokoEquation } from './character-stats.js';
import { handleAddForm, handleDeleteFormClick, handleActiveFormChange, handleAffectsResistanceToggle, applyActiveFormEffects } from './forms.js';
import { handleAttackButtonClick } from './attacks.js';
import { regenerateEnergy, calculateAndResetEnergy } from './energy-pools.js';
import { regenerateHealth } from './kaioken.js';
import { handleEquationClick, updateEquationDisplay } from './equation.js';
import { performCalculation, updateSingleSliderDisplay } from './calculation.js';
import { addDynamicModifier } from './dom-generators.js';
// Import the view switching functions
import { showCharacterStatsView, showCalculatorView, updateStatsDisplay, displayEnergyPool, updateAttackButtonStates, updateSliderLimitAndStyle, updateCurrentHealthDisplay, applyKaiokenStyle, removeKaiokenStyle } from './ui-updater.js'; // <-- Need these handlers
import { updateSpeedSliderDisplay } from './speed-slider.js';
import { triggerAnimation } from './utils.js'; // <-- Need this utility
import { showMessage } from './ui-feedback.js';
import { currentUser, activeAttacks, attackCount as _attackCount } from './state.js';
import { ALL_ENERGY_TYPES } from './config.js';
import { toggleAdminPanel } from './admin.js';

let attackCount = _attackCount; // Local variable for modification

// --- Event Listener Setup Function ---
export function setupAllEventListeners() {
    console.log("Setting up event listeners...");

    // Auth Buttons
    googleSignInBtn?.addEventListener('click', handleGoogleSignIn);
    signOutBtn?.addEventListener('click', handleSignOut);

    // Save/Load/Clear Buttons
    saveBtn?.addEventListener('click', () => { /* ... */ });
    loadBtn?.addEventListener('click', () => { /* ... */ });
    clearBtn?.addEventListener('click', () => { /* ... */ });

    // --- Tab Switching Button ---
     showCharacterStatsBtn?.addEventListener('click', () => {
        console.log("Character Stats / Calculator Toggle Button Clicked!"); // DEBUG LOG
        // Use imported elements and view functions
        if (characterStatsScreen?.classList.contains('hidden')) {
            console.log("Switching TO Character Stats View"); // DEBUG LOG
            showCharacterStatsView(); // Use imported function from ui-updater.js
        } else {
            console.log("Switching TO Calculator View"); // DEBUG LOG
            showCalculatorView(); // Use imported function from ui-updater.js
        }
        triggerAnimation(showCharacterStatsBtn, 'pulse'); // Use imported function from utils.js
    });
    // --- End Tab Switching ---

    // Admin Panel Toggle Button Listener
    adminPanelToggleBtn?.addEventListener('click', toggleAdminPanel);

    // Main Controls
    energyTypeSelect?.addEventListener('change', () => { /* ... */ });
    calculateBtn?.addEventListener('click', () => { /* ... */ });
    addDynamicBoxBtn?.addEventListener('click', () => { /* ... */ });

    // Base Damage / Compression / Base Multiplier Inputs
    baseDamageInput?.addEventListener('input', updateEquationDisplay);
    attackCompressionPointsInput?.addEventListener('input', updateEquationDisplay);
    baseMultiplierInput?.addEventListener('input', () => { /* ... */ });
    baseMultiplierInput?.addEventListener('change', () => { /* ... */ });

    // Character Stat inputs listener
    const charStatInputs = [ charBaseHealthInput, charVitalityInput, charSoulPowerInput, charSoulHpInput, charBaseAcInput, charBaseTrInput, charSpeedInput ];
    charStatInputs.forEach(input => { input?.addEventListener('input', handleStatChange); input?.addEventListener('change', handleStatChange); });

    // Ryoko Mode Listeners
    ryokoCheckbox?.addEventListener('change', handleRyokoCheckboxChange);
    ryokoEquationInput?.addEventListener('input', evaluateRyokoEquation);
    ryokoEquationInput?.addEventListener('change', evaluateRyokoEquation);

    // Kaioken section listeners
    kaiokenCheckbox?.addEventListener('change', () => { /* ... */ });
    maxHealthInput?.addEventListener('input', updateCurrentHealthDisplay);
    maxHealthInput?.addEventListener('change', updateCurrentHealthDisplay);
    kaiokenStrainInput?.addEventListener('input', updateEquationDisplay);
    kaiokenStrainInput?.addEventListener('change', updateEquationDisplay);
    regenHealthBtn?.addEventListener('click', () => { /* ... */ });

    // Form Creator Listeners
    formAffectsResistancesCheckbox?.addEventListener('change', handleAffectsResistanceToggle);
    addFormButton?.addEventListener('click', () => { /* ... */ });

    // Equation click listener
    equationDisplayEl?.addEventListener('click', handleEquationClick);

    // Reset Attack Count button listener
    resetAttackCountBtn?.addEventListener('click', () => { /* ... */ });

    // Attack Button Listeners
    superAttackBtn?.addEventListener('click', handleAttackButtonClick);
    ultimateAttackBtn?.addEventListener('click', handleAttackButtonClick);

    // --- Event Delegation Setup ---
    energyPoolsContainer?.addEventListener('input', (event) => { /* ... */ });
    energyPoolsContainer?.addEventListener('click', (event) => { /* ... */ });
     const slidersContainerElement = allSlidersContainer || slidersGrid;
     slidersContainerElement?.addEventListener('input', (event) => { /* ... */ });
     formListContainer?.addEventListener('click', handleDeleteFormClick);
     activeFormsListContainer?.addEventListener('change', (event) => { /* ... */ });

    console.log("Event listeners setup complete.");
}
