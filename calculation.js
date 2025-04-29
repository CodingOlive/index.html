// calculation.js - Core damage calculation logic and related helpers.

// --- Import Dependencies ---
import {
    // DOM Elements
    baseDamageInput, attackCompressionPointsInput, baseMultiplierInput, formMultiplierInput,
    energyTypeSelect, kaiokenCheckbox, maxHealthInput, kaiokenStrainInput, currentHealthEl,
    charSpeedInput, resultValueEl, resultTotalEnergyUsedEl, resultTotalExtraDamageEl,
    dynamicModifiersContainer, equationDisplayEl, resultDiv, resultScientificEl, resultWordsEl
} from './dom-elements.js';
import {
    // State Setters & Readers
    addAttackResult, resetAttackStats,
    activeAttacks, characterForms, calculatorState, mergedEnergyTypes
} from './state.js';
import { ALL_ENERGY_TYPES, ENERGY_TYPE_DETAILS } from './config.js'; // Keep config
import { parseFormattedNumber, formatStatNumber, formatSimpleNumber } from './formatters.js'; // Keep formatters
import { safeParseFloat, triggerAnimation } from './utils.js'; // Keep utils
import { showLoading, showMessage } from './ui-feedback.js'; // Keep feedback
import { updateStatsDisplay, displayAllFormats, updateCurrentHealthDisplay, applyKaiokenStyle, removeKaiokenStyle } from './ui-updater.js'; // Keep UI updaters
import { getEnergyElements } from './energy-pools.js';
import { updateEquationDisplay } from './equation.js';
import { renderFormList, renderActiveFormsSection } from './dom-generators.js';
import { applyActiveFormEffects } from './forms.js';

// --- Animation Variables ---
let currentAnimationId = null; // To cancel ongoing animations

// --- Animation Function ---

/**
 * Animates the text content of an element to count up (or down) to a target value.
 * @param {HTMLElement} element - The DOM element to update (e.g., resultValueEl).
 * @param {number} targetValue - The final number value to display.
 * @param {number} [duration=500] - Animation duration in milliseconds.
 */
function animateValue(element, targetValue, duration = 30000) {
    if (!element) return;

    // Cancel any previous animation on this element
    if (currentAnimationId) {
        cancelAnimationFrame(currentAnimationId);
    }

    const startValue = parseFormattedNumber(element.textContent) || 0; // Start from current displayed value or 0
    const change = targetValue - startValue;
    let startTime = null;

    function animationLoop(currentTime) {
        if (startTime === null) startTime = currentTime;
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(1, elapsedTime / duration); // Ensure progress doesn't exceed 1

        // Calculate value using an easing function (quadratic ease-out) for smoother effect
        const easedProgress = 1 - Math.pow(1 - progress, 3); // Ease-out cubic
        const currentValue = startValue + change * easedProgress;

        // Update element text, formatting the intermediate value
        element.textContent = formatSimpleNumber(Math.round(currentValue)); // Round for display

        if (progress < 1) {
            // Continue animation
            currentAnimationId = requestAnimationFrame(animationLoop);
        } else {
            // Animation finished - ensure final value is exact
            element.textContent = formatSimpleNumber(targetValue);
            currentAnimationId = null; // Clear animation ID
            console.log("Count-up animation finished.");
        }
    }

    // Start the animation loop
    currentAnimationId = requestAnimationFrame(animationLoop);
}


// --- Calculation Helper ---

/**
 * Updates the text display below an energy slider.
 * @param {string} type - The energy type ID.
 */
export function updateSingleSliderDisplay(type) {
    // ... (function code remains the same as before) ...
    const els = getEnergyElements(type);
    if (!els?.energySlider || !els?.sliderValueDisplay || !els?.currentEnergyEl || !els?.damagePerPowerEl) {
        return;
    }
    const percentSpan = els.sliderValueDisplay.querySelector('.slider-percent-value');
    const detailsSpan = els.sliderValueDisplay.querySelector('.slider-details-value');
    if (!percentSpan || !detailsSpan) {
        console.error("Slider display spans not found for", type);
        return;
    }
    const sliderPercent = parseInt(els.energySlider.value);
    const currentEnergy = parseFormattedNumber(els.currentEnergyEl.textContent);
    const damagePerPower = safeParseFloat(els.damagePerPowerEl.value, 1);
    const attackState = activeAttacks[type] || null;
    let limitPercent = 100;
    if (attackState === 'super') limitPercent = 95;
    else if (attackState === 'ultimate') limitPercent = 90;
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

    let finalDamage = 0;
    let healthDepleted = false;
    let speedDamage = 0;
    let currentTotalEnergyUsedFromSliders = 0;
    let currentTotalExtraDamageFromEnergy = 0;
    const calculationSteps = [];

    try {
        // --- Steps 1-6: Calculation ---
        // ... (Calculations for base, compression, multiplicative, energy, additive, speed, kaioken - remain the same) ...
        // 1. Base Damage & Compression
        const baseDamage = safeParseFloat(baseDamageInput?.value, 0);
        const compressionPoints = safeParseFloat(attackCompressionPointsInput?.value, 0);
        const baseMultiplier = safeParseFloat(baseMultiplierInput?.value, 1);
        const formMultiplierVal = safeParseFloat(formMultiplierInput?.value, 1);
        let baseDamagePart = baseDamage * baseMultiplier * formMultiplierVal;
        let compressionMultiplierValue = 1;
        if (compressionPoints > 0) {
            compressionMultiplierValue = Math.max(1, (compressionPoints * 1.5) + (Math.floor(compressionPoints / 10) * 3));
        }
        finalDamage = baseDamagePart * compressionMultiplierValue;
        // calculationSteps.push(`Base: ...`); // Keep logging if desired

        // 2. Multiplicative Mods
        let runningDamage = finalDamage;
        dynamicModifiersContainer?.querySelectorAll('.dynamic-box').forEach(modifierDiv => {
            const valueInput = modifierDiv.querySelector('.modifier-value-input');
            const typeOption = modifierDiv.querySelector('.modifier-type-option.active');
            if (valueInput && typeOption?.dataset.value === 'multiplicative') {
                 const modValue = safeParseFloat(valueInput.value, 1);
                 runningDamage *= modValue;
                 // calculationSteps.push(`* Multiplicative Mod ...`);
            }
        });
         finalDamage = runningDamage;

        // 3. Energy Damage
         mergedEnergyTypes.forEach(energyType => {
              if (!energyType || !energyType.id) return;
             const type = energyType.id;
            const els = getEnergyElements(type);
            if (els?.energySlider && els.currentEnergyEl && els.damagePerPowerEl) {
                const sliderPercent = safeParseFloat(els.energySlider.value, 0);
                const attackState = activeAttacks[type] || null;
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
                        let newCurrentEnergyThisType = Math.max(0, currentEnergy - actualEnergyUsed);
                        els.currentEnergyEl.textContent = formatStatNumber(newCurrentEnergyThisType);
                        if (newCurrentEnergyThisType < currentEnergy) {
                            triggerAnimation(els.currentEnergyEl, 'flash-red');
                        }
                         updateSingleSliderDisplay(type);
                         // calculationSteps.push(`+ Energy Damage (${type}) ...`);
                    }
                }
            }
        });
        finalDamage += currentTotalExtraDamageFromEnergy;
        // calculationSteps.push(`After Energy: ...`);

        // 4. Additive Mods
        dynamicModifiersContainer?.querySelectorAll('.dynamic-box').forEach(modifierDiv => {
            const valueInput = modifierDiv.querySelector('.modifier-value-input');
            const typeOption = modifierDiv.querySelector('.modifier-type-option.active');
            if (valueInput && typeOption?.dataset.value === 'additive') {
                const modValue = safeParseFloat(valueInput.value, 0);
                 finalDamage += modValue;
                 // calculationSteps.push(`+ Additive Mod ...`);
            }
        });

        // 5. Speed Damage
        speedDamage = 0;
        const speedSlider = document.getElementById('speed-slider');
        const baseSpeed = safeParseFloat(charSpeedInput?.value, 0);
        if (speedSlider && baseSpeed > 0) {
            const sliderPercent = safeParseFloat(speedSlider.value, 0);
            if (sliderPercent > 0) {
                const speedUsed = baseSpeed * (sliderPercent / 100);
                speedDamage = speedUsed * 1;
                finalDamage += speedDamage;
                 // calculationSteps.push(`+ Speed Damage ...`);
            }
        }

        // 6. Kaioken Strain
        healthDepleted = false;
        const currentEnergyTypeFocus = energyTypeSelect?.value;
        if (currentEnergyTypeFocus === 'ki' && kaiokenCheckbox?.checked) {
            const currentHealthVal = parseFormattedNumber(currentHealthEl?.textContent);
            if (currentHealthVal > 0) {
                const maxHealth = safeParseFloat(maxHealthInput?.value, 0);
                const kaiokenStrainPercent = safeParseFloat(kaiokenStrainInput?.value, 0);
                if (maxHealth > 0 && kaiokenStrainPercent > 0) {
                    const strainCost = maxHealth * (kaiokenStrainPercent / 100);
                    let newHealth = Math.max(0, currentHealthVal - strainCost);
                    if (currentHealthEl) currentHealthEl.textContent = formatStatNumber(newHealth);
                    if (newHealth < currentHealthVal) {
                        triggerAnimation(currentHealthEl, 'flash-red');
                    }
                    if (newHealth === 0) healthDepleted = true;
                    // calculationSteps.push(`Kaioken Strain ...`);
                }
            }
        }
        // --- End of Calculation Steps ---

        // Ensure final damage is not negative
        finalDamage = Math.max(0, finalDamage);

        // --- 7. Update Overall Stats USING SETTER ---
        addAttackResult(finalDamage, currentTotalEnergyUsedFromSliders);
        updateStatsDisplay(); // Update UI based on the new state

        // --- 8. Apply Form Buffs (for NEXT turn) ---
         // ... (Form buff application logic remains the same) ...
         const activeFormIdsThisTurn = [...(calculatorState.activeFormIds || [])];
         let anyFormBuffed = false;
         if (activeFormIdsThisTurn.length > 0) {
              activeFormIdsThisTurn.forEach(formId => {
                 const formIndex = characterForms.findIndex(f => f.id === formId);
                 if (formIndex > -1) {
                     const form = characterForms[formIndex];
                     let formUpdated = false;
                     // Apply Form Multiplier Buff
                     if (form.enableFormBuff && form.formBuffValue != 0) {
                         const buffVal = safeParseFloat(form.formBuffValue, 0);
                         const currentMult = form.formMultiplier;
                         if (form.formBuffType === 'add') { form.formMultiplier += buffVal; }
                         else if (form.formBuffType === 'multiply') { form.formMultiplier *= buffVal; }
                         form.formMultiplier = Math.max(0, form.formMultiplier);
                         if (form.formMultiplier !== currentMult) formUpdated = true;
                     }
                     // Apply Pool Max Multiplier Buff
                     if (form.enablePoolBuff && form.poolBuffValue != 0) {
                         const buffVal = safeParseFloat(form.poolBuffValue, 0);
                         const currentMult = form.poolMaxMultiplier;
                         if (form.poolBuffType === 'add') { form.poolMaxMultiplier += buffVal; }
                         else if (form.poolBuffType === 'multiply') { form.poolMaxMultiplier *= buffVal; }
                         form.poolMaxMultiplier = Math.max(0, form.poolMaxMultiplier);
                          if (form.poolMaxMultiplier !== currentMult) formUpdated = true;
                     }
                     if (formUpdated) {
                         anyFormBuffed = true;
                         // calculationSteps.push(`Form Buff Applied...`);
                     }
                 }
              });
               if (anyFormBuffed) {
                   renderFormList();
                   renderActiveFormsSection();
                   applyActiveFormEffects();
                   // calculationSteps.push(`-> Form effects recalculated.`);
               }
         }


        // --- 9. Display results ---
        finalDamage = Math.max(0, finalDamage); // Final check

        // *** CHANGE IS HERE: Use animation for result value ***
        if (resultValueEl) {
             animateValue(resultValueEl, finalDamage, 500); // Animate over 500ms
        }
        // if(resultValueEl) resultValueEl.textContent = formatSimpleNumber(finalDamage); // <-- OLD WAY

        // Update other result fields directly
        if(resultTotalEnergyUsedEl) resultTotalEnergyUsedEl.textContent = formatStatNumber(currentTotalEnergyUsedFromSliders);
        const totalExtraDamage = currentTotalExtraDamageFromEnergy + speedDamage;
        if(resultTotalExtraDamageEl) resultTotalExtraDamageEl.textContent = formatStatNumber(totalExtraDamage);
        const extraDamageLabel = resultTotalExtraDamageEl?.closest('p')?.querySelector('strong');
        if (extraDamageLabel) extraDamageLabel.textContent = 'Total Extra Damage (Energy + Speed):';

        displayAllFormats(finalDamage); // Update scientific/words display (instantly is fine)
        updateEquationDisplay();       // Update the equation breakdown

        if(resultDiv) {
            resultDiv.classList.remove('hidden', 'bg-error-light', 'border-error', 'text-error-dark');
            resultDiv.classList.add('bg-success-light', 'border-success', 'text-success-dark');
            const resultTitle = resultDiv.querySelector('.result-title');
            if (resultTitle) resultTitle.className = 'result-title text-lg font-semibold mb-2 text-success-dark';
            triggerAnimation(resultDiv, 'fadeInUp');
        }

        let successMsg = 'Calculation successful!';
        if (healthDepleted) {
            successMsg += ' Warning: Health depleted by Kaioken strain!';
        }
        showMessage(successMsg, healthDepleted ? 'warning' : 'success');

        // console.log("Calculation Steps:", calculationSteps); // Optional logging

    } catch (error) {
         // *** Ensure animation is cancelled on error ***
         if (currentAnimationId) {
             cancelAnimationFrame(currentAnimationId);
             currentAnimationId = null;
         }
         if(resultValueEl) resultValueEl.textContent = 'Error'; // Set text directly on error
        console.error("Calculation Error:", error);
        // ... (rest of error handling display logic remains the same) ...
         if(resultTotalEnergyUsedEl) resultTotalEnergyUsedEl.textContent = 'N/A';
         if(resultTotalExtraDamageEl) resultTotalExtraDamageEl.textContent = 'N/A';
         if(resultScientificEl) resultScientificEl.textContent = 'N/A';
         if(resultWordsEl) resultWordsEl.textContent = 'Error';
         if(resultDiv) {
              resultDiv.classList.remove('hidden', 'bg-success-light', 'border-success', 'text-success-dark');
              resultDiv.classList.add('bg-error-light', 'border-error', 'text-error-dark');
              const resultTitle = resultDiv.querySelector('.result-title');
             if (resultTitle) resultTitle.className = 'result-title text-lg font-semibold mb-2 text-error-dark';
              triggerAnimation(resultDiv, 'shake');
         }
         if(equationDisplayEl) equationDisplayEl.innerHTML = '<span class="text-error-dark">Error during calculation.</span>';
         showMessage(`Calculation failed: ${error.message || 'Unknown error'}`, 'error');
    } finally {
        showLoading(false);
    }
}
