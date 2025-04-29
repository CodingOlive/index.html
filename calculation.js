// calculation.js - Core damage calculation logic and related helpers.

// --- Import Dependencies ---
// Import DOM Elements
import {
    baseDamageInput, attackCompressionPointsInput, baseMultiplierInput, formMultiplierInput,
    energyTypeSelect, kaiokenCheckbox, maxHealthInput, kaiokenStrainInput, currentHealthEl,
    charSpeedInput, resultValueEl, resultTotalEnergyUsedEl, resultTotalExtraDamageEl,
    dynamicModifiersContainer, equationDisplayEl, resultDiv, resultScientificEl, resultWordsEl
} from './dom-elements.js';

// Import State (Setters and Read-only access)
import {
    // Import the NEW state setter functions INSTEAD of the variables themselves
    // totalDamageDealt, // Remove direct import
    // totalEnergySpent, // Remove direct import
    // attackCount,      // Remove direct import
    // highestDamage,    // Remove direct import
    addAttackResult,    // <-- Import the new setter function
    resetAttackStats,   // <-- Import the reset function (used by event listener, not directly here)

    // Import READ-ONLY state variables/objects needed for calculation
    activeAttacks, characterForms, calculatorState, mergedEnergyTypes // Keep mergedEnergyTypes if needed, otherwise remove
} from './state.js';

// Import Config
import { ALL_ENERGY_TYPES, ENERGY_TYPE_DETAILS } from './config.js'; // Keep ALL_ENERGY_TYPES, details optional if not used directly

// Import Utilities & Formatters
import { parseFormattedNumber, formatStatNumber, formatSimpleNumber } from './formatters.js';
import { safeParseFloat, triggerAnimation } from './utils.js';

// Import UI / Feedback / Other Logic Functions
import { showLoading, showMessage } from './ui-feedback.js';
import { updateStatsDisplay, displayAllFormats, updateCurrentHealthDisplay, applyKaiokenStyle, removeKaiokenStyle } from './ui-updater.js';
import { getEnergyElements } from './energy-pools.js'; // Keep this
import { updateEquationDisplay } from './equation.js';
import { renderFormList, renderActiveFormsSection } from './dom-generators.js';
import { applyActiveFormEffects } from './forms.js';


// --- Calculation Helper ---

/**
 * Updates the text display below an energy slider (e.g., "(E: 100, D: 100.00)").
 * Reads the slider percentage, current energy, and DPP to calculate values.
 * @param {string} type - The energy type (e.g., 'ki', 'nen', or custom ID).
 */
export function updateSingleSliderDisplay(type) {
    const els = getEnergyElements(type); // Use imported helper
    if (!els?.energySlider || !els?.sliderValueDisplay || !els?.currentEnergyEl || !els?.damagePerPowerEl) {
        // console.warn(`Slider display elements missing for type: ${type}`); // Reduce noise
        return;
    }
    const percentSpan = els.sliderValueDisplay.querySelector('.slider-percent-value');
    const detailsSpan = els.sliderValueDisplay.querySelector('.slider-details-value');
    if (!percentSpan || !detailsSpan) {
        console.error("Slider display spans not found for", type);
        return;
    }

    const sliderPercent = parseInt(els.energySlider.value);
    const currentEnergy = parseFormattedNumber(els.currentEnergyEl.textContent); // Use imported formatter
    const damagePerPower = safeParseFloat(els.damagePerPowerEl.value, 1); // Use imported util

    // Read active attack state for this type
    const attackState = activeAttacks[type] || null; // Use imported READ-ONLY state
    let limitPercent = 100;
    if (attackState === 'super') {
        limitPercent = 95;
    } else if (attackState === 'ultimate') {
        limitPercent = 90;
    }

    // Calculate based on effective percentage (capped by attack limit)
    const effectivePercent = Math.min(sliderPercent, limitPercent);
    const potentialEnergyUsed = currentEnergy * (effectivePercent / 100);
    // Ensure energy used doesn't exceed current available energy
    const actualEnergyUsed = Math.max(0, Math.min(potentialEnergyUsed, currentEnergy));
    const extraDamage = actualEnergyUsed * damagePerPower;

    // Update display text
    percentSpan.textContent = `${sliderPercent}%`; // Show actual slider %
    detailsSpan.textContent = `(E: ${formatStatNumber(actualEnergyUsed)}, D: ${formatStatNumber(extraDamage)})`; // Show calculated values
}


// --- Main Calculation Function ---

/**
 * Performs the main damage calculation when the Calculate button is pressed.
 */
export function performCalculation() {
    showLoading(true); // Use imported function

    // Removed the small timeout, calculation should be fast enough generally
    // setTimeout(() => {
        let finalDamage = 0;
        let healthDepleted = false;
        let speedDamage = 0;
        let currentTotalEnergyUsedFromSliders = 0;
        let currentTotalExtraDamageFromEnergy = 0;
        const calculationSteps = []; // For detailed logging/debugging if needed

        try {
            // --- Steps 1-6: Calculation ---
            // 1. Base Damage & Compression
            const baseDamage = safeParseFloat(baseDamageInput?.value, 0);
            const compressionPoints = safeParseFloat(attackCompressionPointsInput?.value, 0);
            const baseMultiplier = safeParseFloat(baseMultiplierInput?.value, 1);
            const formMultiplierVal = safeParseFloat(formMultiplierInput?.value, 1); // Read combined form mult from its display
            let baseDamagePart = baseDamage * baseMultiplier * formMultiplierVal;
            let compressionMultiplierValue = 1;
            if (compressionPoints > 0) {
                compressionMultiplierValue = Math.max(1, (compressionPoints * 1.5) + (Math.floor(compressionPoints / 10) * 3));
            }
            finalDamage = baseDamagePart * compressionMultiplierValue;
            calculationSteps.push(`Base: (${baseDamage} * ${baseMultiplier} * ${formMultiplierVal}) * ${compressionMultiplierValue} = ${finalDamage}`);


            // 2. Multiplicative Mods
            let runningDamage = finalDamage; // Track damage for logging steps
            dynamicModifiersContainer?.querySelectorAll('.dynamic-box').forEach(modifierDiv => {
                const valueInput = modifierDiv.querySelector('.modifier-value-input');
                const typeOption = modifierDiv.querySelector('.modifier-type-option.active');
                if (valueInput && typeOption?.dataset.value === 'multiplicative') {
                     const modValue = safeParseFloat(valueInput.value, 1);
                     runningDamage *= modValue;
                     calculationSteps.push(`* Multiplicative Mod (${valueInput.value}): ${runningDamage}`);
                }
            });
             finalDamage = runningDamage; // Update final damage after multiplicative mods


            // 3. Energy Damage
            // Iterate using the merged list for accuracy
             mergedEnergyTypes.forEach(energyType => {
                  if (!energyType || !energyType.id) return; // Skip invalid entries
                 const type = energyType.id;
                const els = getEnergyElements(type); // Use imported helper
                if (els?.energySlider && els.currentEnergyEl && els.damagePerPowerEl) {
                    const sliderPercent = safeParseFloat(els.energySlider.value, 0);
                    const attackState = activeAttacks[type] || null; // Use imported READ-ONLY state
                    let limitPercent = 100;
                    if (attackState === 'super') limitPercent = 95;
                    else if (attackState === 'ultimate') limitPercent = 90;

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

                            // Decrease current energy display
                            let newCurrentEnergyThisType = Math.max(0, currentEnergy - actualEnergyUsed);
                            els.currentEnergyEl.textContent = formatStatNumber(newCurrentEnergyThisType);
                            if (newCurrentEnergyThisType < currentEnergy) {
                                triggerAnimation(els.currentEnergyEl, 'flash-red'); // Animate change
                            }

                            // Update the slider's own display text immediately
                             updateSingleSliderDisplay(type);

                             calculationSteps.push(`+ Energy Damage (${type}): ${actualEnergyUsed} * ${damagePerPower} = ${extraDamageThisType}`);
                        }
                    }
                }
            });
            finalDamage += currentTotalExtraDamageFromEnergy;
            calculationSteps.push(`After Energy: ${finalDamage}`);


            // 4. Additive Mods
            dynamicModifiersContainer?.querySelectorAll('.dynamic-box').forEach(modifierDiv => {
                const valueInput = modifierDiv.querySelector('.modifier-value-input');
                const typeOption = modifierDiv.querySelector('.modifier-type-option.active');
                if (valueInput && typeOption?.dataset.value === 'additive') {
                    const modValue = safeParseFloat(valueInput.value, 0);
                     finalDamage += modValue;
                     calculationSteps.push(`+ Additive Mod (${valueInput.value}): ${finalDamage}`);
                }
            });


            // 5. Speed Damage
            speedDamage = 0;
            const speedSlider = document.getElementById('speed-slider'); // Direct lookup ok here
            const baseSpeed = safeParseFloat(charSpeedInput?.value, 0);
            if (speedSlider && baseSpeed > 0) {
                const sliderPercent = safeParseFloat(speedSlider.value, 0);
                if (sliderPercent > 0) {
                    const speedUsed = baseSpeed * (sliderPercent / 100);
                    speedDamage = speedUsed * 1; // Assuming 1 damage per speed point used
                    finalDamage += speedDamage;
                     calculationSteps.push(`+ Speed Damage (${sliderPercent}%): ${speedDamage}. Final: ${finalDamage}`);
                }
            }

            // 6. Kaioken Strain
            healthDepleted = false;
            const currentEnergyTypeFocus = energyTypeSelect?.value;
            if (currentEnergyTypeFocus === 'ki' && kaiokenCheckbox?.checked) { // Check for KI focus specifically
                const currentHealthVal = parseFormattedNumber(currentHealthEl?.textContent);
                if (currentHealthVal > 0) {
                    const maxHealth = safeParseFloat(maxHealthInput?.value, 0);
                    const kaiokenStrainPercent = safeParseFloat(kaiokenStrainInput?.value, 0);
                    if (maxHealth > 0 && kaiokenStrainPercent > 0) {
                        const strainCost = maxHealth * (kaiokenStrainPercent / 100);
                        let newHealth = Math.max(0, currentHealthVal - strainCost);
                        if (currentHealthEl) currentHealthEl.textContent = formatStatNumber(newHealth); // Update display
                        if (newHealth < currentHealthVal) {
                            triggerAnimation(currentHealthEl, 'flash-red'); // Animate change
                        }
                        if (newHealth === 0) {
                            healthDepleted = true;
                            calculationSteps.push(`! Health depleted by Kaioken (${strainCost})!`);
                        } else {
                             calculationSteps.push(`- Kaioken Strain: ${strainCost} HP`);
                        }
                    }
                }
            }

            // Ensure final damage is not negative
            finalDamage = Math.max(0, finalDamage);


            // --- 7. Update Overall Stats USING SETTER ---
            // ********************************************
            // *** CHANGE IS HERE ***
            // Instead of modifying state variables directly:
            // totalDamageDealt += finalDamage;
            // totalEnergySpent += currentTotalEnergyUsedFromSliders;
            // attackCount++;
            // if (finalDamage > highestDamage) { highestDamage = finalDamage; }
            // Use the imported setter function:
            addAttackResult(finalDamage, currentTotalEnergyUsedFromSliders);
            // ********************************************

            updateStatsDisplay(); // Update UI based on the new state


            // --- 8. Apply Form Buffs (for NEXT turn) ---
            // This logic modifies the form objects directly in the characterForms state array.
            // If full setter usage is desired, this would involve getting form by ID,
            // calculating new values, and calling an `updateCharacterForm(id, updates)` setter.
            // For now, direct mutation is kept as in the original file for simplicity here.
            const activeFormIdsThisTurn = [...(calculatorState.activeFormIds || [])];
            let anyFormBuffed = false;
            if (activeFormIdsThisTurn.length > 0) {
                 activeFormIdsThisTurn.forEach(formId => {
                    const formIndex = characterForms.findIndex(f => f.id === formId);
                    if (formIndex > -1) {
                        const form = characterForms[formIndex]; // Direct reference for mutation
                        let formUpdated = false;
                        // Apply Form Multiplier Buff
                        if (form.enableFormBuff && form.formBuffValue != 0) {
                            const buffVal = safeParseFloat(form.formBuffValue, 0);
                            const currentMult = form.formMultiplier;
                            if (form.formBuffType === 'add') { form.formMultiplier += buffVal; }
                            else if (form.formBuffType === 'multiply') { form.formMultiplier *= buffVal; }
                            form.formMultiplier = Math.max(0, form.formMultiplier); // Prevent negative multiplier
                            if (form.formMultiplier !== currentMult) formUpdated = true;
                        }
                        // Apply Pool Max Multiplier Buff
                        if (form.enablePoolBuff && form.poolBuffValue != 0) {
                            const buffVal = safeParseFloat(form.poolBuffValue, 0);
                            const currentMult = form.poolMaxMultiplier;
                            if (form.poolBuffType === 'add') { form.poolMaxMultiplier += buffVal; }
                            else if (form.poolBuffType === 'multiply') { form.poolMaxMultiplier *= buffVal; }
                            form.poolMaxMultiplier = Math.max(0, form.poolMaxMultiplier); // Prevent negative multiplier
                             if (form.poolMaxMultiplier !== currentMult) formUpdated = true;
                        }
                        if (formUpdated) {
                            anyFormBuffed = true;
                            calculationSteps.push(`Form Buff Applied: ${form.name} updated.`);
                        }
                    }
                 });
                 // If any form was updated, re-render the lists and apply effects (updates pool multipliers)
                  if (anyFormBuffed) {
                      renderFormList(); // Update display in stats panel
                      renderActiveFormsSection(); // Update display in main area (tooltips)
                      applyActiveFormEffects(); // Recalculate combined effects and update pool inputs/energy
                      calculationSteps.push(`-> Form effects recalculated.`);
                  }
            }

            // --- 9. Display results ---
            finalDamage = Math.max(0, finalDamage); // Final check
            if(resultValueEl) resultValueEl.textContent = formatSimpleNumber(finalDamage);
            if(resultTotalEnergyUsedEl) resultTotalEnergyUsedEl.textContent = formatStatNumber(currentTotalEnergyUsedFromSliders);
            const totalExtraDamage = currentTotalExtraDamageFromEnergy + speedDamage;
            if(resultTotalExtraDamageEl) resultTotalExtraDamageEl.textContent = formatStatNumber(totalExtraDamage);
            const extraDamageLabel = resultTotalExtraDamageEl?.closest('p')?.querySelector('strong');
            if (extraDamageLabel) extraDamageLabel.textContent = 'Total Extra Damage (Energy + Speed):';

            displayAllFormats(finalDamage); // Update scientific/words display
            updateEquationDisplay();       // Update the equation breakdown

            if(resultDiv) {
                // Apply success styles
                resultDiv.classList.remove('hidden', 'bg-error-light', 'border-error', 'text-error-dark');
                resultDiv.classList.add('bg-success-light', 'border-success', 'text-success-dark');
                const resultTitle = resultDiv.querySelector('.result-title');
                if (resultTitle) resultTitle.className = 'result-title text-lg font-semibold mb-2 text-success-dark';
                triggerAnimation(resultDiv, 'fadeInUp'); // Animate result display
            }

            let successMsg = 'Calculation successful!';
            if (healthDepleted) {
                successMsg += ' Warning: Health depleted by Kaioken strain!';
            }
            showMessage(successMsg, healthDepleted ? 'warning' : 'success'); // Use 'warning' if health depleted


             // Optional detailed logging
             console.log("Calculation Steps:", calculationSteps);

        } catch (error) {
            console.error("Calculation Error:", error);
            // Display error state in results area
            if(resultValueEl) resultValueEl.textContent = 'Error';
            if(resultTotalEnergyUsedEl) resultTotalEnergyUsedEl.textContent = 'N/A';
            if(resultTotalExtraDamageEl) resultTotalExtraDamageEl.textContent = 'N/A';
            if(resultScientificEl) resultScientificEl.textContent = 'N/A';
            if(resultWordsEl) resultWordsEl.textContent = 'Error';
            if(resultDiv) {
                 resultDiv.classList.remove('hidden', 'bg-success-light', 'border-success', 'text-success-dark');
                 resultDiv.classList.add('bg-error-light', 'border-error', 'text-error-dark');
                 const resultTitle = resultDiv.querySelector('.result-title');
                if (resultTitle) resultTitle.className = 'result-title text-lg font-semibold mb-2 text-error-dark';
                 triggerAnimation(resultDiv, 'shake'); // Animate result display
            }
            if(equationDisplayEl) equationDisplayEl.innerHTML = '<span class="text-error-dark">Error during calculation.</span>';

            showMessage(`Calculation failed: ${error.message || 'Unknown error'}`, 'error');
        } finally {
            showLoading(false); // Ensure loading indicator is hidden
        }
    // }, 50); // End of commented-out timeout
}
