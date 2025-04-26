// calculation.js - Core damage calculation logic and related helpers.

// --- Import Dependencies ---
// Import DOM Elements
import {
    baseDamageInput, attackCompressionPointsInput, baseMultiplierInput, formMultiplierInput,
    energyTypeSelect, kaiokenCheckbox, maxHealthInput, kaiokenStrainInput, currentHealthEl,
    charSpeedInput, resultValueEl, resultTotalEnergyUsedEl, resultTotalExtraDamageEl,
    dynamicModifiersContainer, equationDisplayEl, resultDiv, resultScientificEl, resultWordsEl
} from './dom-elements.js';

// Import State (Read and Write access needed)
import {
    activeAttacks, characterForms, calculatorState,
    // Import state variables directly for modification
    totalDamageDealt,
    totalEnergySpent,
    attackCount,
    highestDamage
} from './state.js';

// Import Config
import { ALL_ENERGY_TYPES } from './config.js';

// Import Utilities & Formatters
import { parseFormattedNumber, formatStatNumber, formatSimpleNumber } from './formatters.js'; // Import formatters
import { safeParseFloat, triggerAnimation } from './utils.js'; // Import utils (including safeParseFloat)

// Import UI / Feedback / Other Logic Functions
import { showLoading, showMessage } from './ui-feedback.js';
import { updateStatsDisplay, displayAllFormats, updateCurrentHealthDisplay, applyKaiokenStyle, removeKaiokenStyle } from './ui-updater.js';
import { getEnergyElements } from './energy-pools.js';
import { updateEquationDisplay } from './equation.js';
import { renderFormList, renderActiveFormsSection } from './dom-generators.js';
import { applyActiveFormEffects } from './forms.js';


// --- Calculation Helper ---

/**
 * Updates the text display below an energy slider (e.g., "(E: 100, D: 100.00)").
 * Reads the slider percentage, current energy, and DPP to calculate values.
 * @param {string} type - The energy type (e.g., 'ki', 'nen').
 */
export function updateSingleSliderDisplay(type) { // Defined HERE
    const els = getEnergyElements(type);
    if (!els?.energySlider || !els?.sliderValueDisplay || !els?.currentEnergyEl || !els?.damagePerPowerEl) { return; }
    const percentSpan = els.sliderValueDisplay.querySelector('.slider-percent-value');
    const detailsSpan = els.sliderValueDisplay.querySelector('.slider-details-value');
    if (!percentSpan || !detailsSpan) { console.error("Slider display spans not found for", type); return; }
    const sliderPercent = parseInt(els.energySlider.value);
    const currentEnergy = parseFormattedNumber(els.currentEnergyEl.textContent); // Use imported formatter
    const damagePerPower = safeParseFloat(els.damagePerPowerEl.value, 1); // Use imported util
    const attackState = activeAttacks[type] || null; // Use imported state
    let limitPercent = 100;
    if (attackState === 'super') limitPercent = 95; else if (attackState === 'ultimate') limitPercent = 90;
    const effectivePercent = Math.min(sliderPercent, limitPercent);
    const potentialEnergyUsed = currentEnergy * (effectivePercent / 100);
    const actualEnergyUsed = Math.max(0, Math.min(potentialEnergyUsed, currentEnergy));
    const extraDamage = actualEnergyUsed * damagePerPower;
    percentSpan.textContent = `${sliderPercent}%`;
    detailsSpan.textContent = `(E: ${formatStatNumber(actualEnergyUsed)}, D: ${formatStatNumber(extraDamage)})`; // Use imported formatter
}


// --- Main Calculation Function ---

/**
 * Performs the main damage calculation when the Calculate button is pressed.
 */
export function performCalculation() {
    showLoading(true); // Use imported function

    setTimeout(() => {
        let finalDamage = 0;
        let healthDepleted = false;
        let speedDamage = 0;
        let currentTotalEnergyUsedFromSliders = 0;
        let currentTotalExtraDamageFromEnergy = 0;

        try {
            // --- Steps 1-6: Calculation ---
            // 1. Base Damage
            const baseDamage = safeParseFloat(baseDamageInput?.value, 0); // Use imported util
            const compressionPoints = safeParseFloat(attackCompressionPointsInput?.value, 0);
            const baseMultiplier = safeParseFloat(baseMultiplierInput?.value, 1);
            const formMultiplierVal = safeParseFloat(formMultiplierInput?.value, 1);
            let baseDamagePart = baseDamage * baseMultiplier * formMultiplierVal;
            let compressionMultiplierValue = 1;
            if (compressionPoints > 0) { compressionMultiplierValue = Math.max(1, (compressionPoints * 1.5) + (Math.floor(compressionPoints / 10) * 3)); }
            finalDamage = baseDamagePart * compressionMultiplierValue;

            // 2. Multiplicative Mods
             dynamicModifiersContainer?.querySelectorAll('.dynamic-box').forEach(modifierDiv => {
                 const valueInput = modifierDiv.querySelector('.modifier-value-input');
                 const typeOption = modifierDiv.querySelector('.modifier-type-option.active');
                 if (valueInput && typeOption?.dataset.value === 'multiplicative') { finalDamage *= safeParseFloat(valueInput.value, 1); } // Use imported util
             });

            // 3. Energy Damage
            ALL_ENERGY_TYPES.forEach(type => { // Use imported config
                 const els = getEnergyElements(type); // Use imported helper
                 if (els?.energySlider && els.currentEnergyEl && els.damagePerPowerEl) {
                     const sliderPercent = safeParseFloat(els.energySlider.value, 0); // Use imported util
                     const attackState = activeAttacks[type] || null; // Use imported state
                     let limitPercent = 100;
                     if (attackState === 'super') limitPercent = 95; else if (attackState === 'ultimate') limitPercent = 90;
                     const effectivePercent = Math.min(sliderPercent, limitPercent);
                     if (effectivePercent > 0) {
                         const currentEnergy = parseFormattedNumber(els.currentEnergyEl.textContent); // Use imported formatter
                         if (currentEnergy > 0) {
                             const damagePerPower = safeParseFloat(els.damagePerPowerEl.value, 1); // Use imported util
                             const energyUsedThisType = currentEnergy * (effectivePercent / 100);
                             const actualEnergyUsed = Math.max(0, Math.min(energyUsedThisType, currentEnergy));
                             const extraDamageThisType = actualEnergyUsed * damagePerPower;
                             currentTotalEnergyUsedFromSliders += actualEnergyUsed;
                             currentTotalExtraDamageFromEnergy += extraDamageThisType;
                             let newCurrentEnergyThisType = Math.max(0, currentEnergy - actualEnergyUsed);
                             els.currentEnergyEl.textContent = formatStatNumber(newCurrentEnergyThisType); // Use imported formatter
                             if (newCurrentEnergyThisType < currentEnergy) { triggerAnimation(els.currentEnergyEl, 'flash-red'); } // Use imported util
                              updateSingleSliderDisplay(type); // Update display (uses function in this file)
                         }
                     }
                 }
            });
            finalDamage += currentTotalExtraDamageFromEnergy;

            // 4. Additive Mods
             dynamicModifiersContainer?.querySelectorAll('.dynamic-box').forEach(modifierDiv => {
                 const valueInput = modifierDiv.querySelector('.modifier-value-input');
                 const typeOption = modifierDiv.querySelector('.modifier-type-option.active');
                 if (valueInput && typeOption?.dataset.value === 'additive') { finalDamage += safeParseFloat(valueInput.value, 0); } // Use imported util
            });

            // 5. Speed Damage
            speedDamage = 0;
            const speedSlider = document.getElementById('speed-slider');
            const baseSpeed = safeParseFloat(charSpeedInput?.value, 0); // Use imported element+util
            if (speedSlider && baseSpeed > 0) {
                const sliderPercent = safeParseFloat(speedSlider.value, 0); // Use imported util
                if (sliderPercent > 0) { const speedUsed = baseSpeed * (sliderPercent / 100); speedDamage = speedUsed * 1; finalDamage += speedDamage; }
            }

            // 6. Kaioken Strain
            healthDepleted = false;
            const currentEnergyType = energyTypeSelect?.value; // Use imported element
            if (currentEnergyType === 'ki' && kaiokenCheckbox?.checked) { // Use imported element
                 const currentHealthVal = parseFormattedNumber(currentHealthEl?.textContent); // Use imported element+formatter
                 if (currentHealthVal > 0) {
                     const maxHealth = safeParseFloat(maxHealthInput?.value, 0); // Use imported element+util
                     const kaiokenStrainPercent = safeParseFloat(kaiokenStrainInput?.value, 0); // Use imported element+util
                     if (maxHealth > 0 && kaiokenStrainPercent > 0) {
                         const strainCost = maxHealth * (kaiokenStrainPercent / 100);
                         let newHealth = Math.max(0, currentHealthVal - strainCost);
                         if (currentHealthEl) currentHealthEl.textContent = formatStatNumber(newHealth); // Use imported element+formatter
                         if (newHealth < currentHealthVal) { triggerAnimation(currentHealthEl, 'flash-red'); } // Use imported util
                         if (newHealth === 0) { healthDepleted = true; }
                     }
                 }
            }


            // --- 7. Update Overall Stats ---
            finalDamage = Math.max(0, finalDamage);
            // Modify imported state variables directly
            totalDamageDealt += finalDamage;
            totalEnergySpent += currentTotalEnergyUsedFromSliders;
            attackCount++;
            if (finalDamage > highestDamage) {
                highestDamage = finalDamage;
            }
            updateStatsDisplay(); // Use imported UI function

            // --- 8. Apply Form Buffs (for NEXT turn) ---
             const activeFormIdsThisTurn = [...(calculatorState.activeFormIds || [])]; // Use imported state
             let anyFormBuffed = false;
             if (activeFormIdsThisTurn.length > 0) {
                  activeFormIdsThisTurn.forEach(formId => {
                     const formIndex = characterForms.findIndex(f => f.id === formId); // Use imported state
                     if (formIndex > -1) {
                         const form = characterForms[formIndex]; // Direct reference to modify state
                         let formUpdated = false;
                         if (form.enableFormBuff && form.formBuffValue != 0) {
                            const buffVal = safeParseFloat(form.formBuffValue, 0);
                            const currentMult = form.formMultiplier;
                            if (form.formBuffType === 'add') { form.formMultiplier += buffVal; }
                            else if (form.formBuffType === 'multiply') { form.formMultiplier *= buffVal; }
                            form.formMultiplier = Math.max(0, form.formMultiplier);
                            if (form.formMultiplier !== currentMult) formUpdated = true;
                         }
                         if (form.enablePoolBuff && form.poolBuffValue != 0) {
                            const buffVal = safeParseFloat(form.poolBuffValue, 0);
                            const currentMult = form.poolMaxMultiplier;
                            if (form.poolBuffType === 'add') { form.poolMaxMultiplier += buffVal; }
                            else if (form.poolBuffType === 'multiply') { form.poolMaxMultiplier *= buffVal; }
                            form.poolMaxMultiplier = Math.max(0, form.poolMaxMultiplier);
                            if (form.poolMaxMultiplier !== currentMult) formUpdated = true;
                         }
                         if (formUpdated) anyFormBuffed = true;
                     }
                  });
                  if (anyFormBuffed) {
                      renderFormList(); // Use imported generator
                      renderActiveFormsSection(); // Use imported generator
                      applyActiveFormEffects(); // Use imported form logic
                  }
             }

            // --- 9. Display results ---
            finalDamage = Math.max(0, finalDamage);
            // Use imported elements, formatters, UI functions
            if(resultValueEl) resultValueEl.textContent = formatSimpleNumber(finalDamage);
            if(resultTotalEnergyUsedEl) resultTotalEnergyUsedEl.textContent = formatStatNumber(currentTotalEnergyUsedFromSliders);
            const totalExtraDamage = currentTotalExtraDamageFromEnergy + speedDamage;
            if(resultTotalExtraDamageEl) resultTotalExtraDamageEl.textContent = formatStatNumber(totalExtraDamage);
            const extraDamageLabel = resultTotalExtraDamageEl?.closest('p')?.querySelector('strong');
            if (extraDamageLabel) extraDamageLabel.textContent = 'Total Extra Damage (Energy + Speed):';
            displayAllFormats(finalDamage);
            updateEquationDisplay();
            if(resultDiv) {
                resultDiv.classList.remove('hidden', 'bg-error-light', 'border-error', 'text-error-dark');
                resultDiv.classList.add('bg-success-light', 'border-success', 'text-success-dark');
                const resultTitle = resultDiv.querySelector('.result-title');
                if (resultTitle) resultTitle.className = 'result-title text-lg font-semibold mb-2 text-success-dark';
                triggerAnimation(resultDiv, 'fadeInUp');
            }
            let successMsg = 'Calculation successful!';
            if (healthDepleted) { successMsg += ' Warning: Health depleted by Kaioken strain!'; }
            showMessage(successMsg, healthDepleted ? 'error' : 'success');

        } catch (error) {
            // ... Error handling using imported elements and showMessage ...
             console.error("Calculation Error:", error);
             if(resultValueEl) resultValueEl.textContent = 'Error';
             if(resultTotalEnergyUsedEl) resultTotalEnergyUsedEl.textContent = 'N/A';
             if(resultTotalExtraDamageEl) resultTotalExtraDamageEl.textContent = 'N/A';
             if(resultScientificEl) resultScientificEl.textContent = 'N/A';
             if(resultWordsEl) resultWordsEl.textContent = 'Error';
             if(resultDiv) { /* ... apply error styles ... */ }
             if(equationDisplayEl) equationDisplayEl.innerHTML = '<span class="text-error-dark">Error during calculation.</span>';
             showMessage(`Calculation failed: ${error.message || 'Unknown error'}`, 'error');
        } finally {
             showLoading(false); // Use imported UI function
        }
    }, 50);
}

// NOTE: Ensure updateSingleSliderDisplay is defined ONLY ONCE (above) in this file.

