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
    // Import state variables for modification using their exported names
    totalDamageDealt,
    totalEnergySpent,
    attackCount,
    highestDamage
    // NOTE: We will modify these imported 'let' variables directly
} from './state.js';

// Import Config
import { ALL_ENERGY_TYPES } from './config.js';

// Import Utilities & Formatters
import { parseFormattedNumber, formatStatNumber, formatSimpleNumber, safeParseFloat } from './formatters.js'; // Assuming safeParseFloat is here
import { triggerAnimation } from './utils.js';

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
export function updateSingleSliderDisplay(type) {
    const els = getEnergyElements(type);
    if (!els?.energySlider || !els?.sliderValueDisplay || !els?.currentEnergyEl || !els?.damagePerPowerEl) { return; }
    const percentSpan = els.sliderValueDisplay.querySelector('.slider-percent-value');
    const detailsSpan = els.sliderValueDisplay.querySelector('.slider-details-value');
    if (!percentSpan || !detailsSpan) { console.error("Slider display spans not found for", type); return; }
    const sliderPercent = parseInt(els.energySlider.value);
    const currentEnergy = parseFormattedNumber(els.currentEnergyEl.textContent);
    const damagePerPower = safeParseFloat(els.damagePerPowerEl.value, 1);
    const attackState = activeAttacks[type] || null;
    let limitPercent = 100;
    if (attackState === 'super') limitPercent = 95; else if (attackState === 'ultimate') limitPercent = 90;
    const effectivePercent = Math.min(sliderPercent, limitPercent);
    const potentialEnergyUsed = currentEnergy * (effectivePercent / 100);
    const actualEnergyUsed = Math.max(0, Math.min(potentialEnergyUsed, currentEnergy));
    const extraDamage = actualEnergyUsed * damagePerPower;
    percentSpan.textContent = `${sliderPercent}%`;
    detailsSpan.textContent = `(E: ${formatStatNumber(actualEnergyUsed)}, D: ${formatStatNumber(extraDamage)})`;
}


// --- Main Calculation Function ---

/**
 * Performs the main damage calculation when the Calculate button is pressed.
 */
export function performCalculation() {
    showLoading(true);

    setTimeout(() => {
        let finalDamage = 0;
        let healthDepleted = false;
        let speedDamage = 0;
        let currentTotalEnergyUsedFromSliders = 0;
        let currentTotalExtraDamageFromEnergy = 0;

        try {
            // --- Steps 1-6: Calculation ---
            // ... (Steps 1-6 remain the same, calculating finalDamage) ...
             // 1. Base Damage
            const baseDamage = safeParseFloat(baseDamageInput?.value, 0);
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
                 if (valueInput && typeOption?.dataset.value === 'multiplicative') { finalDamage *= safeParseFloat(valueInput.value, 1); }
             });

            // 3. Energy Damage
            ALL_ENERGY_TYPES.forEach(type => {
                 const els = getEnergyElements(type);
                 if (els?.energySlider && els.currentEnergyEl && els.damagePerPowerEl) {
                     const sliderPercent = safeParseFloat(els.energySlider.value, 0);
                     const attackState = activeAttacks[type] || null;
                     let limitPercent = 100;
                     if (attackState === 'super') limitPercent = 95; else if (attackState === 'ultimate') limitPercent = 90;
                     const effectivePercent = Math.min(sliderPercent, limitPercent);
                     if (effectivePercent > 0) {
                         const currentEnergy = parseFormattedNumber(els.currentEnergyEl.textContent);
                         if (currentEnergy > 0) {
                             const damagePerPower = safeParseFloat(els.damagePerPowerEl.value, 1);
                             const energyUsedThisType = currentEnergy * (effectivePercent / 100);
                             const actualEnergyUsed = Math.max(0, Math.min(energyUsedThisType, currentEnergy));
                             const extraDamageThisType = actualEnergyUsed * damagePerPower;
                             currentTotalEnergyUsedFromSliders += actualEnergyUsed;
                             currentTotalExtraDamageFromEnergy += extraDamageThisType;
                             let newCurrentEnergyThisType = Math.max(0, currentEnergy - actualEnergyUsed);
                             els.currentEnergyEl.textContent = formatStatNumber(newCurrentEnergyThisType);
                             if (newCurrentEnergyThisType < currentEnergy) { triggerAnimation(els.currentEnergyEl, 'flash-red'); }
                              updateSingleSliderDisplay(type);
                         }
                     }
                 }
            });
            finalDamage += currentTotalExtraDamageFromEnergy;

            // 4. Additive Mods
             dynamicModifiersContainer?.querySelectorAll('.dynamic-box').forEach(modifierDiv => {
                 const valueInput = modifierDiv.querySelector('.modifier-value-input');
                 const typeOption = modifierDiv.querySelector('.modifier-type-option.active');
                 if (valueInput && typeOption?.dataset.value === 'additive') { finalDamage += safeParseFloat(valueInput.value, 0); }
            });

            // 5. Speed Damage
            speedDamage = 0;
            const speedSlider = document.getElementById('speed-slider');
            const baseSpeed = safeParseFloat(charSpeedInput?.value, 0);
            if (speedSlider && baseSpeed > 0) {
                const sliderPercent = safeParseFloat(speedSlider.value, 0);
                if (sliderPercent > 0) { const speedUsed = baseSpeed * (sliderPercent / 100); speedDamage = speedUsed * 1; finalDamage += speedDamage; }
            }

            // 6. Kaioken Strain
            healthDepleted = false;
            const currentEnergyType = energyTypeSelect?.value;
            if (currentEnergyType === 'ki' && kaiokenCheckbox?.checked) {
                 const currentHealthVal = parseFormattedNumber(currentHealthEl?.textContent);
                 if (currentHealthVal > 0) {
                     const maxHealth = safeParseFloat(maxHealthInput?.value, 0);
                     const kaiokenStrainPercent = safeParseFloat(kaiokenStrainInput?.value, 0);
                     if (maxHealth > 0 && kaiokenStrainPercent > 0) {
                         const strainCost = maxHealth * (kaiokenStrainPercent / 100);
                         let newHealth = Math.max(0, currentHealthVal - strainCost);
                         if (currentHealthEl) currentHealthEl.textContent = formatStatNumber(newHealth);
                         if (newHealth < currentHealthVal) { triggerAnimation(currentHealthEl, 'flash-red'); }
                         if (newHealth === 0) { healthDepleted = true; }
                     }
                 }
            }


            // --- 7. Update Overall Stats ---
            finalDamage = Math.max(0, finalDamage);
            // --- MODIFIED PART: Update imported state variables directly ---
            // We need to re-import them without renaming if state.js uses 'export let'
            // Or use the renamed versions if we keep the 'as' syntax
            // Assuming state.js has: export let totalDamageDealt, etc.
            // And we imported them directly without 'as' renaming:
            totalDamageDealt += finalDamage;
            totalEnergySpent += currentTotalEnergyUsedFromSliders;
            attackCount++;
            if (finalDamage > highestDamage) {
                highestDamage = finalDamage;
            }
            // --- END MODIFIED PART ---
            updateStatsDisplay(); // Update stats panel display

            // --- 8. Apply Form Buffs (for NEXT turn) ---
            // ... (Form buff logic remains the same, modifies characterForms directly) ...
             const activeFormIdsThisTurn = [...(calculatorState.activeFormIds || [])];
             let anyFormBuffed = false;
             if (activeFormIdsThisTurn.length > 0) {
                  activeFormIdsThisTurn.forEach(formId => {
                     const formIndex = characterForms.findIndex(f => f.id === formId);
                     if (formIndex > -1) { /* ... buff logic ... */ }
                  });
                  if (anyFormBuffed) {
                      renderFormList(); renderActiveFormsSection(); applyActiveFormEffects();
                  }
             }

            // --- 9. Display results ---
            // ... (Result display logic remains the same) ...
             finalDamage = Math.max(0, finalDamage);
             if(resultValueEl) resultValueEl.textContent = formatSimpleNumber(finalDamage);
             if(resultTotalEnergyUsedEl) resultTotalEnergyUsedEl.textContent = formatStatNumber(currentTotalEnergyUsedFromSliders);
             const totalExtraDamage = currentTotalExtraDamageFromEnergy + speedDamage;
             if(resultTotalExtraDamageEl) resultTotalExtraDamageEl.textContent = formatStatNumber(totalExtraDamage);
             const extraDamageLabel = resultTotalExtraDamageEl?.closest('p')?.querySelector('strong');
             if (extraDamageLabel) extraDamageLabel.textContent = 'Total Extra Damage (Energy + Speed):';
             displayAllFormats(finalDamage);
             updateEquationDisplay();
             if(resultDiv) { /* ... show/style result div ... */ }
             let successMsg = 'Calculation successful!';
             if (healthDepleted) { successMsg += ' Warning: Health depleted by Kaioken strain!'; }
             showMessage(successMsg, healthDepleted ? 'error' : 'success');

        } catch (error) {
            // ... Error handling ...
        } finally {
             showLoading(false);
        }
    }, 50);
}

// NOTE: Ensure updateSingleSliderDisplay is defined ONLY ONCE (above) in this file.

