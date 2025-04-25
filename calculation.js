// calculation.js - Core damage calculation logic and related helpers.

// --- Import Dependencies ---
// Import DOM Elements
import {
    baseDamageInput, attackCompressionPointsInput, baseMultiplierInput, formMultiplierInput,
    energyTypeSelect, kaiokenCheckbox, maxHealthInput, kaiokenStrainInput, currentHealthEl,
    charSpeedInput, resultValueEl, resultTotalEnergyUsedEl, resultTotalExtraDamageEl,
    dynamicModifiersContainer, equationDisplayEl, resultDiv // Import resultDiv too
    // Sliders/Pool elements accessed via getEnergyElements
} from './dom-elements.js';

// Import State (Read and Write access needed)
import {
    activeAttacks, characterForms, calculatorState,
    // Need mutable access to these via 'export let' in state.js
    totalDamageDealt, totalEnergySpent, attackCount, highestDamage
} from './state.js';

// Import Config
import { ALL_ENERGY_TYPES } from './config.js';

// Import Utilities & Formatters
import { safeParseFloat, parseFormattedNumber, formatStatNumber, formatSimpleNumber } from './formatters.js'; // Or split utils/formatters
import { triggerAnimation } from './utils.js';

// Import UI / Feedback / Other Logic Functions
import { showLoading, showMessage } from './ui-feedback.js';
import { updateStatsDisplay, displayAllFormats, updateCurrentHealthDisplay, applyKaiokenStyle, removeKaiokenStyle } from './ui-updater.js'; // Added apply/remove KaiokenStyle if needed within calc result
import { getEnergyElements } from './energy-pools.js';
import { updateEquationDisplay } from './equation.js';
import { renderFormList, renderActiveFormsSection } from './dom-generators.js'; // Needed if buffs applied
import { applyActiveFormEffects } from './forms.js'; // Needed if buffs applied


// --- Calculation Helper ---

/**
 * Updates the text display below an energy slider (e.g., "(E: 100, D: 100.00)").
 * Reads the slider percentage, current energy, and DPP to calculate values.
 * @param {string} type - The energy type (e.g., 'ki', 'nen').
 */
export function updateSingleSliderDisplay(type) {
    const els = getEnergyElements(type); // Use imported helper
    // ... (rest of function uses imported state, formatters, utils) ...
     if (!els?.energySlider || !els?.sliderValueDisplay || !els?.currentEnergyEl || !els?.damagePerPowerEl) {
        return;
    }
    const percentSpan = els.sliderValueDisplay.querySelector('.slider-percent-value');
    const detailsSpan = els.sliderValueDisplay.querySelector('.slider-details-value');
    if (!percentSpan || !detailsSpan) { /* ... error ... */ return; }

    const sliderPercent = parseInt(els.energySlider.value);
    const currentEnergy = parseFormattedNumber(els.currentEnergyEl.textContent); // Use imported formatter
    const damagePerPower = safeParseFloat(els.damagePerPowerEl.value, 1); // Use imported util
    const attackState = activeAttacks[type] || null; // Use imported state

    let limitPercent = 100;
    if (attackState === 'super') limitPercent = 95;
    else if (attackState === 'ultimate') limitPercent = 90;

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
    // Use imported functions/elements
    showLoading(true);

    setTimeout(() => {
        let finalDamage = 0;
        let healthDepleted = false;
        let speedDamage = 0;
        let totalEnergyUsedFromSliders = 0;
        let totalExtraDamageFromEnergy = 0;

        try {
            // --- Steps 1-6: Calculation using imported elements, state, utils, formatters ---
            // ... (Calculation logic as defined before, ensuring it uses imported variables) ...
             // 1. Base Damage Calculation
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

            // 2. Apply Dynamic Multiplicative Factors
             dynamicModifiersContainer?.querySelectorAll('.dynamic-box').forEach(modifierDiv => {
                 const valueInput = modifierDiv.querySelector('.modifier-value-input');
                 const typeOption = modifierDiv.querySelector('.modifier-type-option.active');
                 if (valueInput && typeOption?.dataset.value === 'multiplicative') {
                     finalDamage *= safeParseFloat(valueInput.value, 1);
                 }
             });

            // 3. Calculate and Add Energy Damage (and deplete energy)
            ALL_ENERGY_TYPES.forEach(type => {
                 const els = getEnergyElements(type); // Use imported helper
                 if (els?.energySlider && els.currentEnergyEl && els.damagePerPowerEl) {
                     const sliderPercent = safeParseFloat(els.energySlider.value, 0);
                     const attackState = activeAttacks[type] || null; // Use imported state
                     let limitPercent = 100;
                     if (attackState === 'super') limitPercent = 95;
                     else if (attackState === 'ultimate') limitPercent = 90;
                     const effectivePercent = Math.min(sliderPercent, limitPercent);

                     if (effectivePercent > 0) {
                         const currentEnergy = parseFormattedNumber(els.currentEnergyEl.textContent); // Use imported formatter
                         if (currentEnergy > 0) {
                             const damagePerPower = safeParseFloat(els.damagePerPowerEl.value, 1); // Use imported util
                             const energyUsedThisType = currentEnergy * (effectivePercent / 100);
                             const actualEnergyUsed = Math.max(0, Math.min(energyUsedThisType, currentEnergy));
                             const extraDamageThisType = actualEnergyUsed * damagePerPower;

                             totalEnergyUsedFromSliders += actualEnergyUsed;
                             totalExtraDamageFromEnergy += extraDamageThisType;

                             let newCurrentEnergyThisType = Math.max(0, currentEnergy - actualEnergyUsed);
                             els.currentEnergyEl.textContent = formatStatNumber(newCurrentEnergyThisType); // Use imported formatter
                             if (newCurrentEnergyThisType < currentEnergy) {
                                 triggerAnimation(els.currentEnergyEl, 'flash-red'); // Use imported util
                             }
                              updateSingleSliderDisplay(type); // Update display (uses function in this file)
                         }
                     }
                 }
            });
            finalDamage += totalExtraDamageFromEnergy;

            // 4. Apply Dynamic Additive Factors
             dynamicModifiersContainer?.querySelectorAll('.dynamic-box').forEach(modifierDiv => {
                 const valueInput = modifierDiv.querySelector('.modifier-value-input');
                 const typeOption = modifierDiv.querySelector('.modifier-type-option.active');
                 if (valueInput && typeOption?.dataset.value === 'additive') {
                     finalDamage += safeParseFloat(valueInput.value, 0); // Use imported util
                 }
            });

            // 5. Calculate and Add Speed Damage
            speedDamage = 0;
            const speedSlider = document.getElementById('speed-slider'); // Direct lookup ok
            const baseSpeed = safeParseFloat(charSpeedInput?.value, 0); // Use imported element+util
            if (speedSlider && baseSpeed > 0) {
                const sliderPercent = safeParseFloat(speedSlider.value, 0);
                if (sliderPercent > 0) {
                    const speedUsed = baseSpeed * (sliderPercent / 100);
                    speedDamage = speedUsed * 1;
                    finalDamage += speedDamage;
                }
            }

            // 6. Apply Kaioken Health Strain
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
            // Modifies imported state variables directly
            finalDamage = Math.max(0, finalDamage);
            totalDamageDealt += finalDamage;
            totalEnergySpent += totalEnergyUsedFromSliders;
            attackCount++;
            if (finalDamage > highestDamage) {
                highestDamage = finalDamage;
            }
            updateStatsDisplay(); // Use imported UI function

            // --- 8. Apply Form Buffs (for NEXT turn) ---
            // Modifies imported characterForms state variable
             const activeFormIdsThisTurn = [...(calculatorState.activeFormIds || [])];
             let anyFormBuffed = false;
             if (activeFormIdsThisTurn.length > 0) {
                  activeFormIdsThisTurn.forEach(formId => {
                     const formIndex = characterForms.findIndex(f => f.id === formId);
                     if (formIndex > -1) { /* ... buff logic modifying characterForms[formIndex] ... */ }
                  });
                  if (anyFormBuffed) {
                      console.log("Forms were buffed, UI refresh needed...");
                      // Use imported functions
                      renderFormList();
                      renderActiveFormsSection();
                      applyActiveFormEffects();
                  }
             }


            // --- 9. Display results ---
            // Uses imported result elements, formatters, UI functions
            if(resultValueEl) resultValueEl.textContent = formatSimpleNumber(finalDamage);
            if(resultTotalEnergyUsedEl) resultTotalEnergyUsedEl.textContent = formatStatNumber(totalEnergyUsedFromSliders);
            const totalExtraDamage = totalExtraDamageFromEnergy + speedDamage;
            if(resultTotalExtraDamageEl) resultTotalExtraDamageEl.textContent = formatStatNumber(totalExtraDamage);
            const extraDamageLabel = resultTotalExtraDamageEl?.closest('p')?.querySelector('strong');
            if (extraDamageLabel) extraDamageLabel.textContent = 'Total Extra Damage (Energy + Speed):';

            displayAllFormats(finalDamage); // Use imported UI function
            updateEquationDisplay(); // Use imported equation function

            if(resultDiv) { // Use imported resultDiv
                resultDiv.classList.remove('hidden', 'bg-error-light', 'border-error', 'text-error-dark');
                resultDiv.classList.add('bg-success-light', 'border-success', 'text-success-dark');
                const resultTitle = resultDiv.querySelector('.result-title');
                if (resultTitle) resultTitle.className = 'result-title text-lg font-semibold mb-2 text-success-dark';
                triggerAnimation(resultDiv, 'fadeInUp'); // Use imported util
            }

            let successMsg = 'Calculation successful!';
            if (healthDepleted) { successMsg += ' Warning: Health depleted by Kaioken strain!'; }
            showMessage(successMsg, healthDepleted ? 'error' : 'success'); // Use imported UI function

        } catch (error) {
            // ... Error handling using imported elements and showMessage ...
             console.error("Calculation Error:", error);
             if(resultValueEl) resultValueEl.textContent = 'Error';
             if(resultTotalEnergyUsedEl) resultTotalEnergyUsedEl.textContent = 'N/A';
             if(resultTotalExtraDamageEl) resultTotalExtraDamageEl.textContent = 'N/A';
             // Need resultScientificEl, resultWordsEl from dom-elements.js for full error display
             // if(resultScientificEl) resultScientificEl.textContent = 'N/A';
             // if(resultWordsEl) resultWordsEl.textContent = 'Error';
             if(resultDiv) { /* ... apply error styles ... */ }
             if(equationDisplayEl) equationDisplayEl.innerHTML = '<span class="text-error-dark">Error during calculation.</span>';
             showMessage(`Calculation failed: ${error.message || 'Unknown error'}`, 'error');

        } finally {
            showLoading(false); // Use imported UI function
        }
    }, 50);
}
// --- Calculation Helper ---

/**
 * Updates the text display below an energy slider (e.g., "(E: 100, D: 100.00)").
 * Reads the slider percentage, current energy, and DPP to calculate values.
 * @param {string} type - The energy type (e.g., 'ki', 'nen').
 */
export function updateSingleSliderDisplay(type) {
    const els = getEnergyElements(type); // Use helper from energy-pools.js
    if (!els?.energySlider || !els?.sliderValueDisplay || !els?.currentEnergyEl || !els?.damagePerPowerEl) {
        // console.warn(`Required elements missing for slider display update: ${type}`);
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
    const attackState = activeAttacks[type] || null; // Read from imported state

    // Determine reserve limit
    let limitPercent = 100;
    if (attackState === 'super') limitPercent = 95;
    else if (attackState === 'ultimate') limitPercent = 90;

    const effectivePercent = Math.min(sliderPercent, limitPercent); // Use limited % for calculation
    const potentialEnergyUsed = currentEnergy * (effectivePercent / 100);
    // Actual energy used cannot exceed current energy
    const actualEnergyUsed = Math.max(0, Math.min(potentialEnergyUsed, currentEnergy));
    const extraDamage = actualEnergyUsed * damagePerPower;

    // Update display
    percentSpan.textContent = `${sliderPercent}%`; // Show the actual slider %
    detailsSpan.textContent = `(E: ${formatStatNumber(actualEnergyUsed)}, D: ${formatStatNumber(extraDamage)})`;
}


// --- Main Calculation Function ---

/**
 * Performs the main damage calculation when the Calculate button is pressed.
 * Reads all inputs/state, calculates damage step-by-step, applies energy/health costs,
 * applies form buffs for the next turn, updates stats, and displays results.
 */
export function performCalculation() {
    // TODO: Import showLoading, resultDiv later
    showLoading(true); // Assumes showLoading is imported
    const resultDiv = document.getElementById('result'); // Placeholder lookup

    // Use a short timeout to allow the loading indicator to render
    setTimeout(() => {
        let finalDamage = 0;
        let healthDepleted = false;
        let speedDamage = 0; // Initialize speed damage for this calculation
        let totalEnergyUsedFromSliders = 0;
        let totalExtraDamageFromEnergy = 0;

        try {
            // --- 1. Base Damage Calculation ---
            const baseDamage = safeParseFloat(baseDamageInput?.value, 0);
            const compressionPoints = safeParseFloat(attackCompressionPointsInput?.value, 0);
            const baseMultiplier = safeParseFloat(baseMultiplierInput?.value, 1);
            // Form multiplier is read from its display input (updated by applyActiveFormEffects)
            const formMultiplierVal = safeParseFloat(formMultiplierInput?.value, 1);

            let baseDamagePart = baseDamage * baseMultiplier * formMultiplierVal;

            // Apply Compression multiplier
            let compressionMultiplierValue = 1;
            if (compressionPoints > 0) {
                compressionMultiplierValue = Math.max(1, (compressionPoints * 1.5) + (Math.floor(compressionPoints / 10) * 3));
            }
            finalDamage = baseDamagePart * compressionMultiplierValue;
            console.log(`Calc Step 1 (Base/Form/Compression): ${finalDamage}`);

            // --- 2. Apply Dynamic Multiplicative Factors ---
            dynamicModifiersContainer?.querySelectorAll('.dynamic-box').forEach(modifierDiv => {
                const valueInput = modifierDiv.querySelector('.modifier-value-input');
                const typeOption = modifierDiv.querySelector('.modifier-type-option.active');
                if (valueInput && typeOption?.dataset.value === 'multiplicative') {
                    const modifierValue = safeParseFloat(valueInput.value, 1);
                    if (modifierValue !== 1) { // Optimization: only multiply if it's not 1
                         finalDamage *= modifierValue;
                    }
                }
            });
            console.log(`Calc Step 2 (Multiplicative Mods): ${finalDamage}`);

            // --- 3. Calculate and Add Energy Damage (and deplete energy) ---
            totalEnergyUsedFromSliders = 0;
            totalExtraDamageFromEnergy = 0;
            ALL_ENERGY_TYPES.forEach(type => {
                const els = getEnergyElements(type); // Assumes imported
                if (els?.energySlider && els.currentEnergyEl && els.damagePerPowerEl) {
                    const sliderPercent = safeParseFloat(els.energySlider.value, 0);
                    const attackState = activeAttacks[type] || null; // Read from state

                    let limitPercent = 100;
                    if (attackState === 'super') limitPercent = 95;
                    else if (attackState === 'ultimate') limitPercent = 90;

                    const effectivePercent = Math.min(sliderPercent, limitPercent);

                    if (effectivePercent > 0) {
                        const currentEnergy = parseFormattedNumber(els.currentEnergyEl.textContent);
                        if (currentEnergy > 0) {
                            const damagePerPower = safeParseFloat(els.damagePerPowerEl.value, 1);
                            const energyUsedThisType = currentEnergy * (effectivePercent / 100);
                            const actualEnergyUsed = Math.max(0, Math.min(energyUsedThisType, currentEnergy)); // Ensure non-negative and capped
                            const extraDamageThisType = actualEnergyUsed * damagePerPower;

                            totalEnergyUsedFromSliders += actualEnergyUsed;
                            totalExtraDamageFromEnergy += extraDamageThisType;
                            console.log(`Energy Damage (${type}): Used ${actualEnergyUsed}, Added ${extraDamageThisType}`);

                            // Deplete energy
                            let newCurrentEnergyThisType = Math.max(0, currentEnergy - actualEnergyUsed);
                            els.currentEnergyEl.textContent = formatStatNumber(newCurrentEnergyThisType);
                            if (newCurrentEnergyThisType < currentEnergy) {
                                triggerAnimation(els.currentEnergyEl, 'flash-red'); // Assumes imported
                            }
                             updateSingleSliderDisplay(type); // Update display after depletion
                        }
                    }
                }
            });
            finalDamage += totalExtraDamageFromEnergy; // Add total energy damage
            console.log(`Calc Step 3 (Energy Damage): ${finalDamage}`);

            // --- 4. Apply Dynamic Additive Factors ---
            dynamicModifiersContainer?.querySelectorAll('.dynamic-box').forEach(modifierDiv => {
                 const valueInput = modifierDiv.querySelector('.modifier-value-input');
                 const typeOption = modifierDiv.querySelector('.modifier-type-option.active');
                 if (valueInput && typeOption?.dataset.value === 'additive') {
                     const modifierValue = safeParseFloat(valueInput.value, 0);
                      if (modifierValue !== 0) { // Optimization: only add if not 0
                          finalDamage += modifierValue;
                      }
                 }
            });
            console.log(`Calc Step 4 (Additive Mods): ${finalDamage}`);

            // --- 5. Calculate and Add Speed Damage ---
            speedDamage = 0;
            const speedSlider = document.getElementById('speed-slider'); // Or import if defined
            const baseSpeed = safeParseFloat(charSpeedInput?.value, 0);
            if (speedSlider && baseSpeed > 0) {
                const sliderPercent = safeParseFloat(speedSlider.value, 0);
                if (sliderPercent > 0) {
                    const speedUsed = baseSpeed * (sliderPercent / 100);
                    speedDamage = speedUsed * 1; // 1:1 conversion
                    finalDamage += speedDamage;
                    console.log(`Calc Step 5 (Speed Damage): Used ${speedUsed}, Added ${speedDamage}`);
                }
            }
            console.log(`Calc Step 5 Result: ${finalDamage}`);

            // --- 6. Apply Kaioken Health Strain ---
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
                        console.log(`Kaioken Strain: Cost ${strainCost}, New Health ${newHealth}`);
                        if (newHealth < currentHealthVal) { triggerAnimation(currentHealthEl, 'flash-red'); } // Assumes imported
                        if (newHealth === 0) { healthDepleted = true; console.warn("Health depleted by Kaioken!"); }
                    }
                }
            }

            // --- 7. Update Overall Stats (using imported state variables directly) ---
            finalDamage = Math.max(0, finalDamage); // Ensure final damage isn't negative
            // These need to modify the exported 'let' variables from state.js
            totalDamageDealt += finalDamage;
            totalEnergySpent += totalEnergyUsedFromSliders;
            attackCount++;
            if (finalDamage > highestDamage) {
                highestDamage = finalDamage;
            }
            updateStatsDisplay(); // Update stats panel BEFORE applying buffs // Assumes imported

            // --- 8. Apply Form Buffs (for NEXT turn) ---
            // Modifies the characterForms array in state.js directly
            const activeFormIdsThisTurn = [...(calculatorState.activeFormIds || [])];
            let anyFormBuffed = false;
            if (activeFormIdsThisTurn.length > 0) {
                 activeFormIdsThisTurn.forEach(formId => {
                    const formIndex = characterForms.findIndex(f => f.id === formId);
                    if (formIndex > -1) {
                         const form = characterForms[formIndex]; // Direct reference
                         let formUpdated = false;
                         // Apply Form Multiplier Buff
                         if (form.enableFormBuff && form.formBuffValue != 0) {
                             const buffVal = safeParseFloat(form.formBuffValue, 0);
                             const currentMult = form.formMultiplier;
                             if (form.formBuffType === 'add') { form.formMultiplier += buffVal; }
                             else if (form.formBuffType === 'multiply') { form.formMultiplier *= buffVal; }
                             form.formMultiplier = Math.max(0, form.formMultiplier); // Ensure non-negative
                             if (form.formMultiplier !== currentMult) formUpdated = true;
                         }
                         // Apply Pool Max Multiplier Buff
                         if (form.enablePoolBuff && form.poolBuffValue != 0) {
                              const buffVal = safeParseFloat(form.poolBuffValue, 0);
                              const currentMult = form.poolMaxMultiplier;
                              if (form.poolBuffType === 'add') { form.poolMaxMultiplier += buffVal; }
                              else if (form.poolBuffType === 'multiply') { form.poolMaxMultiplier *= buffVal; }
                              form.poolMaxMultiplier = Math.max(0, form.poolMaxMultiplier); // Ensure non-negative
                              if (form.poolMaxMultiplier !== currentMult) formUpdated = true;
                         }
                         if (formUpdated) anyFormBuffed = true;
                    }
                 });
                 // If buffs applied, UI updates needed for forms (tooltips etc.)
                 if (anyFormBuffed) {
                     console.log("Forms were buffed, UI refresh needed for lists/effects");
                     // TODO: Import and call functions later
                     // renderFormList();
                     // renderActiveFormsSection();
                     // applyActiveFormEffects(); // Re-apply to update multipliers based on buffed forms
                 }
            }

            // --- 9. Display results ---
            finalDamage = Math.max(0, finalDamage); // Final check before display
            if(resultValueEl) resultValueEl.textContent = formatSimpleNumber(finalDamage);
            if(resultTotalEnergyUsedEl) resultTotalEnergyUsedEl.textContent = formatStatNumber(totalEnergyUsedFromSliders);
            const totalExtraDamage = totalExtraDamageFromEnergy + speedDamage;
            if(resultTotalExtraDamageEl) resultTotalExtraDamageEl.textContent = formatStatNumber(totalExtraDamage);
            // Update label text for extra damage (example of direct DOM manipulation if needed)
            const extraDamageLabel = resultTotalExtraDamageEl?.closest('p')?.querySelector('strong');
            if (extraDamageLabel) extraDamageLabel.textContent = 'Total Extra Damage (Energy + Speed):';

            displayAllFormats(finalDamage); // Update scientific/words formats // Assumes imported
            updateEquationDisplay(); // Update equation one last time // Assumes imported

            // Style and show result area
            if(resultDiv) {
                resultDiv.classList.remove('hidden', 'bg-error-light', 'border-error', 'text-error-dark');
                resultDiv.classList.add('bg-success-light', 'border-success', 'text-success-dark');
                const resultTitle = resultDiv.querySelector('.result-title');
                if (resultTitle) resultTitle.className = 'result-title text-lg font-semibold mb-2 text-success-dark';
                triggerAnimation(resultDiv, 'fadeInUp'); // Assumes imported
            }

            let successMsg = 'Calculation successful!';
            if (healthDepleted) { successMsg += ' Warning: Health depleted by Kaioken strain!'; }
             showMessage(successMsg, healthDepleted ? 'error' : 'success'); // Assumes imported

        } catch (error) {
            console.error("Calculation Error:", error);
            // Display error state in result area (pseudo-code)
             if(resultValueEl) resultValueEl.textContent = 'Error';
             // ... set other result fields to N/A or Error ...
             if(resultDiv) {
                 resultDiv.classList.remove('hidden', 'bg-success-light', 'border-success', 'text-success-dark');
                 resultDiv.classList.add('bg-error-light', 'border-error', 'text-error-dark');
                 const resultTitle = resultDiv.querySelector('.result-title');
                 if (resultTitle) resultTitle.className = 'result-title text-lg font-semibold mb-2 text-error-dark';
             }
             if(equationDisplayEl) equationDisplayEl.innerHTML = '<span class="text-error-dark">Error during calculation.</span>'; // Assumes imported
             showMessage(`Calculation failed: ${error.message || 'Unknown error'}`, 'error'); // Assumes imported
        } finally {
             showLoading(false); // Assumes imported
        }
    }, 50); // 50ms delay for loading indicator render
}