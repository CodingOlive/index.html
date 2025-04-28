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
import { ENERGY_TYPE_DETAILS, ALL_ENERGY_TYPES, ATTACK_RESERVE_COLOR, SLIDER_TRACK_COLOR } from './config.js';
import { formatStatNumber, formatSimpleNumber, parseFormattedNumber, convertNumberToWords, safeParseFloat } from './formatters.js';
import { triggerAnimation } from './utils.js';
import { calculateAndResetEnergy, getEnergyElements } from './energy-pools.js';
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
     console.log(`UI_UPDATER: Running displayEnergyPool for type ID: "${typeIdToShow}"`); // DEBUG LOG
     if (!energyPoolsContainer || !energyTypeSelect || !kaiokenSection || !kaiokenCheckbox || !kaiokenDetails) {
         console.error("UI_UPDATER: Missing required elements for displayEnergyPool.");
         return;
     }

     // --- Find the type details from the MERGED list ---
     // Ensure mergedEnergyTypes is an array and has content
     if (!Array.isArray(mergedEnergyTypes) || mergedEnergyTypes.length === 0) {
         console.error("UI_UPDATER: mergedEnergyTypes array is empty or invalid. Cannot display pool.");
         // Hide all pools as a fallback
         energyPoolsContainer.querySelectorAll('.energy-pool').forEach(poolDiv => { poolDiv.style.display = 'none'; });
         return;
     }

     console.log("UI_UPDATER: Searching in mergedEnergyTypes:", JSON.stringify(mergedEnergyTypes)); // DEBUG LOG
     const energyType = mergedEnergyTypes.find(et => et && et.id === typeIdToShow); // Find by ID
     console.log(`UI_UPDATER: Found type data for "${typeIdToShow}":`, energyType ? 'Object found' : 'NOT FOUND'); // DEBUG LOG

     if (!energyType) {
         console.error(`UI_UPDATER: Energy type definition not found in merged list for ID: "${typeIdToShow}"`);
         // Hide all pools if the selected type is somehow invalid
         energyPoolsContainer.querySelectorAll('.energy-pool').forEach(poolDiv => { poolDiv.style.display = 'none'; });
         return; // Stop if type definition not found
     }

     const isStandard = energyType.isStandard;
     const details = energyType.details; // Standard type details from config
     const customColor = energyType.hexColor || energyType.color;

     // Hide all pools first and remove glow animations
     console.log("UI_UPDATER: Hiding all existing pool divs..."); // DEBUG LOG
     energyPoolsContainer.querySelectorAll('.energy-pool').forEach(poolDiv => {
        poolDiv.style.display = 'none';
        const poolType = poolDiv.id.replace('-pool', '');
        const poolDetails = mergedEnergyTypes.find(et => et.id === poolType)?.details;
        if(poolDetails) {
            if(poolDetails.pulseGlow) poolDiv.classList.remove(poolDetails.pulseGlow);
            if(poolDetails.staticGlow) poolDiv.classList.remove(poolDetails.staticGlow);
        }
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
                 poolToShowDiv.classList.add(details.pulseGlow);
                 if (poolToShowDiv._glowTimeoutId) { clearTimeout(poolToShowDiv._glowTimeoutId); }
                 poolToShowDiv._glowTimeoutId = setTimeout(() => {
                     if (energyTypeSelect?.value === typeIdToShow && details.staticGlow) {
                        poolToShowDiv.classList.remove(details.pulseGlow);
                        poolToShowDiv.classList.add(details.staticGlow);
                     }
                     poolToShowDiv._glowTimeoutId = null;
                 }, 5000);
             }
         } else {
              poolToShowDiv.classList.add('animate__animated', 'animate__fadeIn');
         }
         poolToShowDiv.addEventListener('animationend', (e) => { if (e.animationName === 'fadeIn') { poolToShowDiv.classList.remove('animate__animated', 'animate__fadeIn'); } }, { once: true });

     } else {
          console.error(`UI_UPDATER: Pool div #${typeIdToShow}-pool not found in DOM! Was it generated correctly?`); // More specific error
     }

     // Handle Kaioken section visibility...
     if (typeIdToShow === 'ki') { /* ... show/update Kaioken section ... */ }
     else { /* ... hide Kaioken section ... */ }
}


export function initializeDefaultUI() {
    console.log("Resetting UI to defaults...");
    // Uses imported elements and functions from this file
     if(baseDamageInput) baseDamageInput.value = '';
     // ... (reset all other inputs/checkboxes/etc.) ...
     if(charSpeedInput) charSpeedInput.value = '';
     // Reset Kaioken
     removeKaiokenStyle();
     if(kaiokenDetails) kaiokenDetails.classList.add('hidden');
     // Reset dynamic modifiers container
     if(dynamicModifiersContainer) dynamicModifiersContainer.innerHTML = '<h4 class="text-md font-semibold mb-2 text-gray-700">Additional Factors:</h4>';

     // --- Recalculate standard pools based on default stats & set current energy to max ---
     console.log("DEBUG: Resetting all standard energy pools to default max...");
     ALL_ENERGY_TYPES.forEach(type => { // Use imported config
         const totalEnergy = calculateAndResetEnergy(type); // Use imported function
         const els = getEnergyElements(type); // Use imported function
         if (els?.currentEnergyEl) { els.currentEnergyEl.textContent = formatStatNumber(totalEnergy); }
         updateSliderVisibility(type);
         const slider = document.getElementById(`${type}-energy-slider`);
         if (slider) slider.value = 0;
     });
     // --- End Energy Pool Reset ---

     // Reset sliders/visibility for speed
     updateSpeedSliderVisibility();
     const speedSlider = document.getElementById('speed-slider');
     if(speedSlider) speedSlider.value = 0;

     // Show default view and pool
     showCalculatorView();
     displayEnergyPool('ki'); // Display the default pool view

     // Update displays based on defaults
     updateStatsDisplay();
     updateEquationDisplay(); // Use imported function
     console.log("Default UI initialized.");
}

