// ui-updater.js - Functions for updating existing UI elements.

// --- Import Dependencies ---
import {
    statsPanel, statsPanelHeader, statCurrentEnergyEl, statTotalDamageEl,
    statTotalEnergySpentEl, statAttackCountEl, statHighestDamageEl,
    statFormAcBonusEl, statFormTrBonusEl, statTotalAcEl, statTotalTrEl, statSpeedEl,
    kaiokenSection, kaiokenDetails, kaiokenCheckbox, maxHealthInput, currentHealthEl,
    superAttackBtn, ultimateAttackBtn, attackStatusMessage,
    resultScientificEl, resultWordsEl, resultDiv,
    mainCalculatorContent, characterStatsScreen, mainTitle, showCharacterStatsBtn,
    energyTypeSelect, charBaseAcInput, charBaseTrInput, charSpeedInput, energyPoolsContainer,
    baseDamageInput, attackCompressionPointsInput, characterNameInput, charBaseHealthInput,
    charBaseMultiplierInput, charVitalityInput, charSoulPowerInput, charSoulHpInput,
    ryokoCheckbox, ryokoEquationInput, kaiokenStrainInput, dynamicModifiersContainer
} from './dom-elements.js';
import {
    totalDamageDealt, totalEnergySpent, attackCount, highestDamage, calculatorState, activeAttacks,
    mergedEnergyTypes // Import the merged list
} from './state.js';
import { ENERGY_TYPE_DETAILS, ALL_ENERGY_TYPES, ATTACK_RESERVE_COLOR, SLIDER_TRACK_COLOR } from './config.js'; // Keep for standard details fallback if needed
import { formatStatNumber, formatSimpleNumber, parseFormattedNumber, convertNumberToWords, safeParseFloat } from './formatters.js';
import { triggerAnimation } from './utils.js';
// Import energy pool calculation function needed for default UI reset
import { calculateAndResetEnergy, getEnergyElements } from './energy-pools.js';
// Import equation update function if needed by default UI reset
import { updateEquationDisplay } from './equation.js';


// --- UI Update Functions ---

export function updateStatsDisplay() { /* ... Function remains the same ... */ }
export function updateSliderVisibility(type) { /* ... Function remains the same ... */ }
export function updateSpeedSliderVisibility() { /* ... Function remains the same ... */ }
export function applyKaiokenStyle() { /* ... Function remains the same ... */ }
export function removeKaiokenStyle() { /* ... Function remains the same ... */ }
export function updateCurrentHealthDisplay() { /* ... Function remains the same ... */ }
export function updateAttackButtonStates(type) { /* ... Function remains the same ... */ }
export function updateSliderLimitAndStyle(type) { /* ... Function remains the same ... */ }
export function displayAllFormats(damage) { /* ... Function remains the same ... */ }
export function showCharacterStatsView() { /* ... Function remains the same ... */ }
export function showCalculatorView() { /* ... Function remains the same ... */ }


/**
 * Handles the UI updates for displaying a specific energy pool (showing/hiding/animating).
 * Uses the mergedEnergyTypes array to find details.
 * @param {string} typeIdToShow - The ID of the energy type to display (standard or custom).
 */
export function displayEnergyPool(typeIdToShow) {
     console.log(`UI_UPDATER: Running displayEnergyPool for type: ${typeIdToShow}`); // DEBUG LOG
     if (!energyPoolsContainer || !energyTypeSelect || !kaiokenSection || !kaiokenCheckbox || !kaiokenDetails) {
         console.error("UI_UPDATER: Missing required elements for displayEnergyPool.");
         return;
     }

     // --- Find the type details from the MERGED list ---
     const energyType = mergedEnergyTypes.find(et => et && et.id === typeIdToShow);
     console.log(`UI_UPDATER: Found type data for ${typeIdToShow}:`, energyType ? JSON.stringify(energyType) : 'undefined'); // DEBUG LOG

     if (!energyType) {
         console.error(`UI_UPDATER: Energy type definition not found in merged list for ID: ${typeIdToShow}`);
         // Optionally hide all pools if the selected type is invalid?
         energyPoolsContainer.querySelectorAll('.energy-pool').forEach(poolDiv => {
             poolDiv.style.display = 'none';
             // Clean up animation classes just in case
             poolDiv.classList.remove('animate__animated', 'animate__fadeIn', 'static-glow-ki', /* ... other glows ... */ 'animate-pulse-glow-ki');
         });
         return; // Stop if type definition not found
     }

     const isStandard = energyType.isStandard;
     const details = energyType.details; // Standard type details from config (might be null/empty for custom)
     const customColor = energyType.hexColor || energyType.color; // Use hexColor if available, fallback to color for custom

     // Hide all pools first and remove glow animations
     energyPoolsContainer.querySelectorAll('.energy-pool').forEach(poolDiv => {
        poolDiv.style.display = 'none';
        const poolType = poolDiv.id.replace('-pool', '');
        const poolDetails = mergedEnergyTypes.find(et => et.id === poolType)?.details; // Find details via merged list
        if(poolDetails) {
            // Remove specific glow classes if they exist in details
            if(poolDetails.pulseGlow) poolDiv.classList.remove(poolDetails.pulseGlow);
            if(poolDetails.staticGlow) poolDiv.classList.remove(poolDetails.staticGlow);
        }
        // Remove generic animation classes
        poolDiv.classList.remove('animate__animated', 'animate__fadeIn');
     });

     // Show the selected pool
     const poolToShowDiv = document.getElementById(`${typeIdToShow}-pool`); // Find div by ID
     if (poolToShowDiv) {
         console.log(`UI_UPDATER: Showing pool div: #${poolToShowDiv.id}`); // DEBUG LOG
         poolToShowDiv.style.display = 'block';

         // Apply animations/glows (primarily for standard types with defined classes)
         if (isStandard && details) {
             poolToShowDiv.classList.add('animate__animated', 'animate__fadeIn');
             if (details.pulseGlow) {
                 poolToShowDiv.classList.add(details.pulseGlow); // Start with pulse
                 // Set timeout to switch from pulse to static glow
                 if (poolToShowDiv._glowTimeoutId) { clearTimeout(poolToShowDiv._glowTimeoutId); }
                 poolToShowDiv._glowTimeoutId = setTimeout(() => {
                     if (energyTypeSelect?.value === typeIdToShow && details.staticGlow) { // Check if still selected
                        poolToShowDiv.classList.remove(details.pulseGlow);
                        poolToShowDiv.classList.add(details.staticGlow);
                     }
                     poolToShowDiv._glowTimeoutId = null;
                 }, 5000); // 5 second pulse duration
             }
         } else {
              // Apply basic fade-in for custom types
              poolToShowDiv.classList.add('animate__animated', 'animate__fadeIn');
         }

         // Clean up fade-in animation class
         poolToShowDiv.addEventListener('animationend', (e) => {
             if (e.animationName === 'fadeIn') {
                poolToShowDiv.classList.remove('animate__animated', 'animate__fadeIn');
             }
         }, { once: true });

     } else {
          console.error(`UI_UPDATER: Pool div not found for type: ${typeIdToShow}`);
     }

     // Handle Kaioken section visibility based on the *newly shown* type
     if (typeIdToShow === 'ki') { // Kaioken is tied to standard 'ki'
         kaiokenSection.classList.remove('hidden');
         if (kaiokenCheckbox?.checked) {
             if(kaiokenDetails) kaiokenDetails.classList.remove('hidden');
             updateCurrentHealthDisplay();
         }
     } else {
         kaiokenSection.classList.add('hidden');
         if (kaiokenCheckbox?.checked) {
             if(kaiokenDetails) kaiokenDetails.classList.add('hidden');
             removeKaiokenStyle();
         }
     }
}


export function initializeDefaultUI() {
    console.log("Resetting UI to defaults...");
    // Uses imported elements and functions from this file
     if(baseDamageInput) baseDamageInput.value = '';
     if(attackCompressionPointsInput) attackCompressionPointsInput.value = '0';
     if(energyTypeSelect) energyTypeSelect.value = 'ki';
     if(resultDiv) resultDiv.classList.add('hidden');
     // Reset character stats inputs...
     if(characterNameInput) characterNameInput.value = '';
     if(charBaseHealthInput) charBaseHealthInput.value = '';
     if(charBaseMultiplierInput) charBaseMultiplierInput.value = '1';
     if(charVitalityInput) charVitalityInput.value = '';
     if(charSoulPowerInput) charSoulPowerInput.value = '';
     if(charSoulHpInput) charSoulHpInput.value = '';
     if(charBaseAcInput) charBaseAcInput.value = '10';
     if(charBaseTrInput) charBaseTrInput.value = '5';
     if(charSpeedInput) charSpeedInput.value = '';
     // Reset Ryoko
     if(ryokoCheckbox) ryokoCheckbox.checked = false;
     if(ryokoEquationInput) ryokoEquationInput.value = '';
     // Reset Kaioken
     if(kaiokenCheckbox) kaiokenCheckbox.checked = false;
     if(maxHealthInput) maxHealthInput.value = '1000';
     if(kaiokenStrainInput) kaiokenStrainInput.value = '10';
     if(currentHealthEl) currentHealthEl.textContent = formatStatNumber(safeParseFloat(maxHealthInput?.value, 1000));
     removeKaiokenStyle();
     if(kaiokenDetails) kaiokenDetails.classList.add('hidden');
     // Reset dynamic modifiers container
     if(dynamicModifiersContainer) dynamicModifiersContainer.innerHTML = '<h4 class="text-md font-semibold mb-2 text-gray-700">Additional Factors:</h4>';

     // --- Recalculate standard pools based on default stats & set current energy to max ---
     console.log("DEBUG: Resetting all standard energy pools to default max...");
     // Use standard types from config for initial reset, assuming merged list might be empty
     ALL_ENERGY_TYPES.forEach(type => {
         const totalEnergy = calculateAndResetEnergy(type); // Use imported function
         const els = getEnergyElements(type); // Use imported function
         if (els?.currentEnergyEl) {
             els.currentEnergyEl.textContent = formatStatNumber(totalEnergy);
         }
         updateSliderVisibility(type);
         const slider = document.getElementById(`${type}-energy-slider`);
         if (slider) slider.value = 0;
         // updateSingleSliderDisplay(type); // Needs import from calculation.js
     });
     // --- End Energy Pool Reset ---

     // Reset sliders/visibility for speed
     updateSpeedSliderVisibility();
     const speedSlider = document.getElementById('speed-slider');
     if(speedSlider) speedSlider.value = 0;
     // updateSpeedSliderDisplay(); // Needs import from speed-slider.js

     // Show default view and pool
     showCalculatorView();
     displayEnergyPool('ki'); // Display the default pool view

     // Update displays based on defaults
     updateStatsDisplay();
     updateEquationDisplay(); // Use imported function
     console.log("Default UI initialized.");
}

