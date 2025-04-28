// ui-updater.js - Functions for updating existing UI elements.

// --- Import Dependencies ---
import { /* ... Keep all existing imports from response #49 ... */
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
import { totalDamageDealt, totalEnergySpent, attackCount, highestDamage, calculatorState, activeAttacks } from './state.js';
import { ENERGY_TYPE_DETAILS, ALL_ENERGY_TYPES, ATTACK_RESERVE_COLOR, SLIDER_TRACK_COLOR } from './config.js';
import { formatStatNumber, formatSimpleNumber, parseFormattedNumber, convertNumberToWords } from './formatters.js';
import { triggerAnimation } from './utils.js';
// import { updateSingleSliderDisplay } from './calculation.js'; // Likely not needed here


// --- UI Update Functions ---

export function updateStatsDisplay() { /* ... Function remains the same ... */ }

/**
 * Shows or hides a specific energy slider section based on its total energy.
 * @param {string} typeId - The energy type ID (standard or custom).
 */
export function updateSliderVisibility(typeId) {
    console.log(`UI_UPDATER: Running updateSliderVisibility for type: ${typeId}`); // DEBUG
    const sliderSection = document.getElementById(`${typeId}-slider-section`);
    const totalEnergyEl = document.getElementById(`${typeId}-total-energy`);
    const energySlider = document.getElementById(`${typeId}-energy-slider`);

    if (!sliderSection) {
        console.log(`UI_UPDATER: Slider section not found for ${typeId}`); // DEBUG
        return;
    }
    if (!totalEnergyEl) {
         console.log(`UI_UPDATER: Total energy element not found for ${typeId}`); // DEBUG
         sliderSection.classList.add('hidden'); // Hide slider if total can't be read
         return;
    }

    const totalEnergy = parseFormattedNumber(totalEnergyEl.textContent);
    const shouldShow = totalEnergy > 0;
    console.log(`UI_UPDATER: Type ${typeId} - Total Energy: ${totalEnergy}, Should Show Slider: ${shouldShow}`); // DEBUG
    sliderSection.classList.toggle('hidden', !shouldShow);
    if (!shouldShow && energySlider) {
        energySlider.value = 0;
        // updateSingleSliderDisplay(typeId); // Call if needed
    }
}

export function updateSpeedSliderVisibility() { /* ... Function remains the same ... */ }
export function applyKaiokenStyle() { /* ... Function remains the same ... */ }
export function removeKaiokenStyle() { /* ... Function remains the same ... */ }
export function updateCurrentHealthDisplay() { /* ... Function remains the same ... */ }
export function updateAttackButtonStates(type) { /* ... Function remains the same ... */ }
export function updateSliderLimitAndStyle(type) { /* ... Function remains the same ... */ }

/**
 * Handles the UI updates for displaying a specific energy pool (showing/hiding/animating).
 * @param {string} typeToShow - The energy type ID to display.
 */
export function displayEnergyPool(typeToShow) {
     console.log(`UI_UPDATER: Running displayEnergyPool for type: ${typeToShow}`); // DEBUG
     if (!energyPoolsContainer || !energyTypeSelect || !kaiokenSection || !kaiokenCheckbox || !kaiokenDetails) {
         console.error("UI_UPDATER: Missing required elements for displayEnergyPool.");
         return;
     }
     // Find details in the *merged* list - Requires mergedEnergyTypes import from state
     // TODO: Import mergedEnergyTypes from state.js
     const energyType = window._mergedEnergyTypes_temp?.find(et => et && et.id === typeToShow); // Placeholder access
     const details = energyType?.details; // Standard details
     const customColor = !energyType?.isStandard ? energyType?.color : null;
     const isStandard = energyType?.isStandard ?? true; // Default to assuming standard if type not found

     console.log(`UI_UPDATER: Found type data for ${typeToShow}:`, energyType); // DEBUG

     // Hide all pools first and remove glow animations
     energyPoolsContainer.querySelectorAll('.energy-pool').forEach(poolDiv => {
        poolDiv.style.display = 'none';
        const poolType = poolDiv.id.replace('-pool', '');
        // Remove potential glows based on standard OR custom logic if possible
        // This part is tricky without knowing the exact classes/styles used
        poolDiv.classList.remove('animate-pulse-glow-ki', /* ... other standard glows ... */ 'static-glow-ki', /* ... */ 'animate__animated', 'animate__fadeIn');
     });

     // Show the selected pool
     const poolToShowDiv = document.getElementById(`${typeToShow}-pool`);
     if (poolToShowDiv) {
         console.log(`UI_UPDATER: Found pool div #${poolToShowDiv.id}. Setting display to block.`); // DEBUG
         poolToShowDiv.style.display = 'block';

         // Start fade-in and pulse glow animation
         let pulseGlowClass = null;
         if (isStandard && details?.pulseGlow) {
             pulseGlowClass = details.pulseGlow;
         } else if (!isStandard) {
             // Maybe define a generic pulse animation or apply style dynamically? Harder.
             // For now, custom types might not pulse.
         }

         poolToShowDiv.classList.add('animate__animated', 'animate__fadeIn');
         if (pulseGlowClass) {
             poolToShowDiv.classList.add(pulseGlowClass);
         }

         poolToShowDiv.addEventListener('animationend', (e) => {
             if (e.animationName === 'fadeIn') {
                poolToShowDiv.classList.remove('animate__animated', 'animate__fadeIn');
             }
         }, { once: true });

         // Timeout to switch from pulse to static glow
         if (poolToShowDiv._glowTimeoutId) { clearTimeout(poolToShowDiv._glowTimeoutId); }
         poolToShowDiv._glowTimeoutId = setTimeout(() => {
             if (energyTypeSelect?.value === typeToShow) {
                 let staticGlowClass = null;
                 if (isStandard && details?.staticGlow) { staticGlowClass = details.staticGlow; }
                 // Remove pulse, add static
                 if (pulseGlowClass) poolToShowDiv.classList.remove(pulseGlowClass);
                 if (staticGlowClass) poolToShowDiv.classList.add(staticGlowClass);
                 // Custom static glow? Maybe border brightness?
                 // else if (!isStandard && customColor) { poolToShowDiv.style.boxShadow = `0 0 10px ${customColor}80`; }
             }
             poolToShowDiv._glowTimeoutId = null;
         }, 5000);
     } else {
          console.error(`UI_UPDATER: Pool div not found for type: ${typeToShow}`); // DEBUG
     }

     // Handle Kaioken section visibility... (logic remains the same)
     if (typeToShow === 'ki') { /* ... show/update kaioken ... */ }
     else { /* ... hide kaioken ... */ }
}

export function displayAllFormats(damage) { /* ... Function remains the same ... */ }
export function showCharacterStatsView() { /* ... Function remains the same ... */ }
export function showCalculatorView() { /* ... Function remains the same ... */ }
export function initializeDefaultUI() { /* ... Function remains the same ... */ }

// --- Make sure internal functions are included ---
// (These were omitted in previous snippets for brevity, but are needed)
function clearAdminEnergyForm() { /* ... */ }
function handleColorChange() { /* ... */ }
function populateCustomTypeList() { /* ... */ }
function handleEditCustomTypeClick(event) { /* ... */ }
async function handleDeleteCustomTypeClick(event) { /* ... */ }
async function handleSaveEnergyType() { /* ... */ }
async function refreshDataAndUI() { /* ... */ }

