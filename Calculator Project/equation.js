// equation.js - Handles generation and interaction for the calculation equation display.

// --- Import Dependencies ---
// Import DOM Elements (many needed to read current values)
import {
    equationDisplayEl, baseDamageInput, baseMultiplierInput, formMultiplierInput,
    attackCompressionPointsInput, dynamicModifiersContainer, energyTypeSelect,
    charSpeedInput // speedSlider and energy sliders/inputs accessed by ID below for now
    // If getEnergyElements is imported/used, specific slider/input imports might not be needed
} from './dom-elements.js';

// Import State
import { activeAttacks } from './state.js'; // Need attack state for slider limits in equation

// Import Config
import { ALL_ENERGY_TYPES, ENERGY_TYPE_DETAILS } from './config.js';

// Import Formatters & Utilities
import { formatSimpleNumber, parseFormattedNumber } from './formatters.js';
import { safeParseFloat, escapeHtml, triggerAnimation } from './utils.js';

// Import UI functions
import { displayEnergyPool } from './ui-updater.js'; // For switching views on click


// --- Equation Functions ---

/**
 * Updates the equation display in the results area based on current inputs and settings.
 * Creates clickable links from numbers in the equation to their source inputs/sliders.
 */
export function updateEquationDisplay() {
    if (!equationDisplayEl) {
        console.warn("Equation display element not found.");
        return;
    }

    // Use imported helpers/formatters/utils
    const op = (operator) => `<span class="equation-operator">${operator}</span>`;
    const group = (content) => `<span class="equation-group">(</span>${content}<span class="equation-group">)</span>`;
    const num = (value, targetId, title = '') => {
        const cleanValue = safeParseFloat(value, 0);
        const displayValue = formatSimpleNumber(cleanValue);
        const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
        const targetAttr = targetId ? ` data-target-id="${targetId}"` : '';
        return `<span class="equation-number"${targetAttr}${titleAttr}>${displayValue}</span>`;
    };

    let equationHTML = '';

    try {
        // --- 1. Base Damage, Base Multiplier, Form Multiplier ---
        // Use imported DOM elements and utils
        const baseDamage = safeParseFloat(baseDamageInput?.value, 0);
        const baseMultiplier = safeParseFloat(baseMultiplierInput?.value, 1);
        const formMultiplierVal = safeParseFloat(formMultiplierInput?.value, 1);

        let basePart = num(baseDamage, 'base-damage', 'Base Damage');
        if (baseMultiplier !== 1 || baseMultiplierInput?.value.trim() !== '1') {
            basePart += op('&times;') + num(baseMultiplier, 'base-multiplier', 'Base Multiplier');
        }
        if (formMultiplierVal !== 1 || formMultiplierInput?.value.trim() !== '1') {
            basePart += op('&times;') + num(formMultiplierVal, 'form-multiplier', 'Combined Form Multiplier');
        }
        let baseCalculationHTML = (basePart.includes(op('&times;'))) ? group(basePart) : basePart;

        // --- 2. Compression Points ---
        // Use imported DOM element and utils
        const compressionPoints = safeParseFloat(attackCompressionPointsInput?.value, 0);
        if (compressionPoints > 0) {
             let compressionMultiplierValue = Math.max(1, (compressionPoints * 1.5) + (Math.floor(compressionPoints / 10) * 3));
             const compTitle = `${compressionPoints} Comp. Points -> &times;${formatSimpleNumber(compressionMultiplierValue)} Multiplier`;
             if (baseCalculationHTML && baseCalculationHTML !== '0') {
                 if(baseCalculationHTML !== num(baseDamage, 'base-damage', 'Base Damage')) {
                    baseCalculationHTML = group(baseCalculationHTML);
                 }
             } else if (!baseCalculationHTML || baseCalculationHTML === '0') {
                 baseCalculationHTML = '';
             }
             baseCalculationHTML += (baseCalculationHTML ? op('&times;') : '') + num(compressionMultiplierValue, 'attack-compression-points', compTitle);
        }
        equationHTML = baseCalculationHTML || '0';

        // --- 3. Dynamic Multiplicative Modifiers ---
        // Use imported container element
        let multiplicativeTerms = [];
         dynamicModifiersContainer?.querySelectorAll('.dynamic-box').forEach((modifierDiv) => {
            const valueInput = modifierDiv.querySelector('.modifier-value-input');
            const typeOption = modifierDiv.querySelector('.modifier-type-option.active');
            const nameInput = modifierDiv.querySelector('.modifier-name-input');
            const modifierId = valueInput?.id;
            const factorName = nameInput?.value.trim() || 'Unnamed Multiplier';
            if (valueInput && typeOption?.dataset.value === 'multiplicative' && modifierId) {
                const multiplier = safeParseFloat(valueInput.value, 1); // Use util
                if (multiplier !== 1 || valueInput.value.trim() !== '1') {
                    multiplicativeTerms.push(num(multiplier, modifierId, factorName));
                }
            }
        });
        if (multiplicativeTerms.length > 0) {
            if ((equationHTML.includes(op('&times;')) || equationHTML.includes(op('+'))) && equationHTML !== '0') {
                equationHTML = group(equationHTML);
            }
            if (equationHTML === '0') equationHTML = '';
            const multPart = multiplicativeTerms.length > 1 ? group(multiplicativeTerms.join(op('&times;'))) : multiplicativeTerms[0];
            equationHTML += (equationHTML ? op('&times;') : '') + multPart;
        }

        // --- 4. Energy Damage Terms ---
        // Use imported ALL_ENERGY_TYPES, activeAttacks, ENERGY_TYPE_DETAILS, formatters, utils
        let energyTerms = [];
        ALL_ENERGY_TYPES.forEach(type => {
            const energySlider = document.getElementById(`${type}-energy-slider`); // Direct lookup ok here
            const currentEnergyEl = document.getElementById(`${type}-current-energy`);
            const damagePerPowerEl = document.getElementById(`${type}-damage-per-power`);

            if (energySlider && currentEnergyEl && damagePerPowerEl) {
                const sliderPercent = safeParseFloat(energySlider.value, 0);
                const attackState = activeAttacks[type] || null; // Use imported state
                let limitPercent = 100;
                if (attackState === 'super') limitPercent = 95;
                else if (attackState === 'ultimate') limitPercent = 90;
                const effectivePercent = Math.min(sliderPercent, limitPercent);

                if (effectivePercent > 0) {
                    const currentEnergy = parseFormattedNumber(currentEnergyEl.textContent); // Use formatter
                    if (currentEnergy > 0) {
                        const damagePerPower = safeParseFloat(damagePerPowerEl.value, 1); // Use util
                        const energyUsed = Math.max(0, Math.min(currentEnergy * (effectivePercent / 100), currentEnergy));
                        const energyDamage = energyUsed * damagePerPower;

                        if (energyDamage !== 0 || energyUsed !== 0) {
                            const energyTitle = `${ENERGY_TYPE_DETAILS[type]?.name || type} Used (${sliderPercent}%) = ${formatSimpleNumber(energyUsed)}`; // Use config + formatter
                            const dppTitle = `${ENERGY_TYPE_DETAILS[type]?.name || type} Damage/Point`; // Use config
                            let term = num(energyUsed, `${type}-energy-slider`, energyTitle);

                            if (damagePerPower !== 1 || damagePerPowerEl.value.trim() !== '1') {
                                term += op('&times;') + num(damagePerPower, `${type}-damage-per-power`, dppTitle);
                                term = group(term);
                            }
                            energyTerms.push(term);
                        }
                    }
                }
            }
        });
        if (energyTerms.length > 0) {
            if ((equationHTML.includes(op('&times;')) || equationHTML.includes(op('+'))) && equationHTML !== '0') {
                 equationHTML = group(equationHTML);
            }
            if (equationHTML === '0') equationHTML = '';
            equationHTML += (equationHTML ? op('+') : '') + group(energyTerms.join(op('+')));
        }

        // --- 5. Dynamic Additive Modifiers ---
        // Uses imported container and utils
        let additiveTerms = [];
         dynamicModifiersContainer?.querySelectorAll('.dynamic-box').forEach((modifierDiv) => {
            // ... (logic as before, uses safeParseFloat and num helper) ...
             const valueInput = modifierDiv.querySelector('.modifier-value-input');
            const typeOption = modifierDiv.querySelector('.modifier-type-option.active');
            const nameInput = modifierDiv.querySelector('.modifier-name-input');
            const modifierId = valueInput?.id;
            const factorName = nameInput?.value.trim() || 'Unnamed Additive';
            if (valueInput && typeOption?.dataset.value === 'additive' && modifierId) {
                const modifierValue = safeParseFloat(valueInput.value, 0);
                if (modifierValue !== 0 || valueInput.value.trim() !== '0') {
                    additiveTerms.push(num(modifierValue, modifierId, factorName));
                }
            }
        });
        if (additiveTerms.length > 0) {
            if ((equationHTML.includes(op('&times;')) || equationHTML.includes(op('+'))) && equationHTML !== '0') {
                 equationHTML = group(equationHTML);
            }
            if (equationHTML === '0') equationHTML = '';
            const addPart = additiveTerms.length > 1 ? group(additiveTerms.join(op('+'))) : additiveTerms[0];
            equationHTML += (equationHTML ? op('+') : '') + addPart;
        }

        // --- 6. Speed Term ---
        // Uses imported charSpeedInput element, utils, formatters
        const speedSliderEq = document.getElementById('speed-slider'); // Direct lookup ok
        const baseSpeedEq = safeParseFloat(charSpeedInput?.value, 0);
        if (speedSliderEq && baseSpeedEq > 0) {
            // ... (logic as before, uses safeParseFloat, formatSimpleNumber, num helper) ...
            const sliderPercentEq = safeParseFloat(speedSliderEq.value, 0);
            if (sliderPercentEq > 0) {
                const speedUsedEq = baseSpeedEq * (sliderPercentEq / 100);
                const speedDamageEq = speedUsedEq * 1;
                if (speedDamageEq !== 0) {
                    if ((equationHTML.includes(op('&times;')) || equationHTML.includes(op('+'))) && equationHTML !== '0') {
                         equationHTML = group(equationHTML);
                    }
                    if (equationHTML === '0') equationHTML = '';
                    equationHTML += (equationHTML ? op('+') : '') + num(speedDamageEq, 'speed-slider', `${formatSimpleNumber(speedUsedEq)} Speed Used -> +${formatSimpleNumber(speedDamageEq)} Damage`);
                }
            }
        }

        // Final display assignment using imported element
        if (!equationHTML || equationHTML.trim() === '0') {
            equationHTML = '0';
        }
        equationDisplayEl.innerHTML = equationHTML;

    } catch (error) {
        console.error("Error updating equation:", error);
         if(equationDisplayEl) equationDisplayEl.innerHTML = '<span class="text-error-dark">Could not generate equation.</span>';
    }
}


/**
 * Handles clicks within the equation display area. If a number with a
 * data-target-id is clicked, scrolls to and highlights the corresponding element.
 * @param {Event} event - The click event.
 */
export function handleEquationClick(event) {
    const target = event.target;
    if (target.classList.contains('equation-number') && target.dataset.targetId) {
        const targetId = target.dataset.targetId;
        const sourceElement = document.getElementById(targetId);

        if (sourceElement) {
            sourceElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            let elementToPulse = sourceElement;
            // ... (logic to determine elementToPulse remains the same) ...
            if (sourceElement.tagName === 'SPAN' && sourceElement.classList.contains('readonly-display')) {
                elementToPulse = sourceElement.closest('.energy-pool') || sourceElement;
            } else if (sourceElement.type === 'range') {
                elementToPulse = sourceElement.closest('.energy-slider-section') || sourceElement;
            } else if (sourceElement.classList.contains('modifier-value-input')) {
                 elementToPulse = sourceElement.closest('.dynamic-box') || sourceElement;
            } else if (targetId === 'speed-slider') {
                 elementToPulse = document.getElementById('speed-slider-section') || sourceElement;
            } else if (targetId === 'form-multiplier') {
                elementToPulse = document.getElementById('active-forms-section') || sourceElement;
            }

            triggerAnimation(elementToPulse, 'pulse-source'); // Use imported util

            if (sourceElement.tagName === 'INPUT' && !sourceElement.readOnly && sourceElement.type !== 'range') {
                 sourceElement.focus();
            }

            // Energy pool switching logic
            const energyTypeMatch = targetId.match(/^([a-z]+)-(damage-per-power|energy-slider|max-multiplier)/);
            if (energyTypeMatch) {
                const energyType = energyTypeMatch[1];
                 // Uses imported ALL_ENERGY_TYPES, energyTypeSelect element, displayEnergyPool function
                if (ALL_ENERGY_TYPES.includes(energyType) && energyTypeSelect?.value !== energyType) {
                    console.log(`Switching view to ${energyType} pool triggered by equation click...`);
                    if(energyTypeSelect) energyTypeSelect.value = energyType;
                    displayEnergyPool(energyType); // Use imported UI function
                }
            }
        } else {
            console.warn(`Equation link target element not found: #${targetId}`);
        }
    }
}
import {
    // Input Elements needed to read values for the equation
    equationDisplayEl, baseDamageInput, baseMultiplierInput, formMultiplierInput,
    attackCompressionPointsInput, dynamicModifiersContainer,
    energyTypeSelect, charSpeedInput // speedSlider, energy sliders accessed by ID below
    // May need getEnergyElements if used, or direct element access
} from './dom-elements.js';

import { activeAttacks } from './state.js'; // Need attack state for slider limits
import { ALL_ENERGY_TYPES, ENERGY_TYPE_DETAILS } from './config.js'; // Need energy details
import { formatSimpleNumber, safeParseFloat } from './formatters.js'; // Or utils / formatters
import { escapeHtml, triggerAnimation } from './utils.js';
import { displayEnergyPool } from './ui-updater.js'; // Needed if equation click triggers view switch

// --- Equation Functions ---

/**
 * Updates the equation display in the results area based on current inputs and settings.
 * Creates clickable links from numbers in the equation to their source inputs/sliders.
 */
export function updateEquationDisplay() {
    if (!equationDisplayEl) {
        console.warn("Equation display element not found.");
        return;
    }

    // --- Helper functions for building HTML ---
    const op = (operator) => `<span class="equation-operator">${operator}</span>`; // Operator style
    const group = (content) => `<span class="equation-group">(</span>${content}<span class="equation-group">)</span>`; // Parentheses
    // Creates clickable number span linked to an input's ID
    const num = (value, targetId, title = '') => {
        const cleanValue = safeParseFloat(value, 0); // Ensure we're working with a number for formatting
        const displayValue = formatSimpleNumber(cleanValue); // Format for display
        const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
        // Ensure targetId is not null/undefined before using it
        const targetAttr = targetId ? ` data-target-id="${targetId}"` : '';
        return `<span class="equation-number"${targetAttr}${titleAttr}>${displayValue}</span>`;
    };
    // --- End Helpers ---

    let equationHTML = ''; // Start building the HTML string

    try {
        // --- 1. Base Damage, Base Multiplier, Form Multiplier ---
        const baseDamage = safeParseFloat(baseDamageInput?.value, 0);
        const baseMultiplier = safeParseFloat(baseMultiplierInput?.value, 1);
        // Use the *combined* form multiplier currently displayed
        const formMultiplierVal = safeParseFloat(formMultiplierInput?.value, 1);

        let basePart = num(baseDamage, 'base-damage', 'Base Damage');
        // Only show base multiplier if not default 1
        if (baseMultiplier !== 1 || baseMultiplierInput?.value.trim() !== '1') {
            basePart += op('&times;') + num(baseMultiplier, 'base-multiplier', 'Base Multiplier'); // Use × symbol
        }
        // Only show combined form multiplier if not default 1
        if (formMultiplierVal !== 1 || formMultiplierInput?.value.trim() !== '1') {
            basePart += op('&times;') + num(formMultiplierVal, 'form-multiplier', 'Combined Form Multiplier');
        }
        // Group base parts only if there was multiplication involved
        let baseCalculationHTML = (basePart.includes(op('&times;'))) ? group(basePart) : basePart;

        // --- 2. Compression Points ---
        const compressionPoints = safeParseFloat(attackCompressionPointsInput?.value, 0);
        if (compressionPoints > 0) {
            let compressionMultiplierValue = Math.max(1, (compressionPoints * 1.5) + (Math.floor(compressionPoints / 10) * 3));
            const compTitle = `${compressionPoints} Comp. Points -> &times;${formatSimpleNumber(compressionMultiplierValue)} Multiplier`;
            // Ensure grouping if previous part exists and compression is added
            if (baseCalculationHTML && baseCalculationHTML !== '0') {
                 // Group if previous part wasn't just the base number or 0
                 if(baseCalculationHTML !== num(baseDamage, 'base-damage', 'Base Damage')) {
                    baseCalculationHTML = group(baseCalculationHTML);
                 }
            } else if (!baseCalculationHTML || baseCalculationHTML === '0') {
                // If base damage part was 0 or empty, start fresh (don't show 0 * comp)
                baseCalculationHTML = '';
            }
            // Add compression multiplier term
            baseCalculationHTML += (baseCalculationHTML ? op('&times;') : '') + num(compressionMultiplierValue, 'attack-compression-points', compTitle);
        }
        equationHTML = baseCalculationHTML || '0'; // Start with base/compression calc or 0

        // --- 3. Dynamic Multiplicative Modifiers ---
        let multiplicativeTerms = [];
        dynamicModifiersContainer?.querySelectorAll('.dynamic-box').forEach((modifierDiv) => {
            const valueInput = modifierDiv.querySelector('.modifier-value-input');
            const typeOption = modifierDiv.querySelector('.modifier-type-option.active');
            const nameInput = modifierDiv.querySelector('.modifier-name-input');
            const modifierId = valueInput?.id; // ID of the value input itself
            const factorName = nameInput?.value.trim() || 'Unnamed Multiplier';
            if (valueInput && typeOption?.dataset.value === 'multiplicative' && modifierId) {
                const multiplier = safeParseFloat(valueInput.value, 1);
                if (multiplier !== 1 || valueInput.value.trim() !== '1') { // Only include if not default 1
                    multiplicativeTerms.push(num(multiplier, modifierId, factorName));
                }
            }
        });
        if (multiplicativeTerms.length > 0) {
             // Group previous part if it contained operations or wasn't just '0'
            if ((equationHTML.includes(op('&times;')) || equationHTML.includes(op('+'))) && equationHTML !== '0') {
                equationHTML = group(equationHTML);
            }
            if (equationHTML === '0') equationHTML = ''; // Avoid showing "0 * (...)"
            // Join multiplicative terms, grouping them if there's more than one
            const multPart = multiplicativeTerms.length > 1 ? group(multiplicativeTerms.join(op('&times;'))) : multiplicativeTerms[0];
            equationHTML += (equationHTML ? op('&times;') : '') + multPart;
        }

        // --- 4. Energy Damage Terms ---
        let energyTerms = [];
        // const getEnergyElements = ... // TODO: Import or use direct lookup
        ALL_ENERGY_TYPES.forEach(type => {
            // const els = getEnergyElements(type); // Use helper later
            const energySlider = document.getElementById(`${type}-energy-slider`);
            const currentEnergyEl = document.getElementById(`${type}-current-energy`);
            const damagePerPowerEl = document.getElementById(`${type}-damage-per-power`);

            if (energySlider && currentEnergyEl && damagePerPowerEl) {
                const sliderPercent = safeParseFloat(energySlider.value, 0);
                const attackState = activeAttacks[type] || null; // Read from state
                let limitPercent = 100;
                if (attackState === 'super') limitPercent = 95;
                else if (attackState === 'ultimate') limitPercent = 90;
                const effectivePercent = Math.min(sliderPercent, limitPercent);

                if (effectivePercent > 0) {
                    const currentEnergy = parseFormattedNumber(currentEnergyEl.textContent);
                    if (currentEnergy > 0) {
                        const damagePerPower = safeParseFloat(damagePerPowerEl.value, 1);
                        const energyUsed = Math.max(0, Math.min(currentEnergy * (effectivePercent / 100), currentEnergy));
                        const energyDamage = energyUsed * damagePerPower;

                        if (energyDamage !== 0 || energyUsed !== 0) { // Include term even if damage is 0 but energy was used
                            const energyTitle = `${ENERGY_TYPE_DETAILS[type]?.name || type} Used (${sliderPercent}%) = ${formatSimpleNumber(energyUsed)}`;
                            const dppTitle = `${ENERGY_TYPE_DETAILS[type]?.name || type} Damage/Point`;
                            let term = num(energyUsed, `${type}-energy-slider`, energyTitle); // Link energy used to the slider

                            if (damagePerPower !== 1 || damagePerPowerEl.value.trim() !== '1') {
                                term += op('&times;') + num(damagePerPower, `${type}-damage-per-power`, dppTitle); // Link DPP to its input
                                term = group(term); // Group if DPP is involved
                            }
                            energyTerms.push(term);
                        }
                    }
                }
            }
        });
        if (energyTerms.length > 0) {
            // Group previous calculation before adding energy terms
             if ((equationHTML.includes(op('&times;')) || equationHTML.includes(op('+'))) && equationHTML !== '0') {
                 equationHTML = group(equationHTML);
             }
             if (equationHTML === '0') equationHTML = ''; // Avoid 0 + (...)
            // Group all energy terms together
            equationHTML += (equationHTML ? op('+') : '') + group(energyTerms.join(op('+')));
        }

        // --- 5. Dynamic Additive Modifiers ---
        let additiveTerms = [];
         dynamicModifiersContainer?.querySelectorAll('.dynamic-box').forEach((modifierDiv) => {
            const valueInput = modifierDiv.querySelector('.modifier-value-input');
            const typeOption = modifierDiv.querySelector('.modifier-type-option.active');
            const nameInput = modifierDiv.querySelector('.modifier-name-input');
            const modifierId = valueInput?.id;
            const factorName = nameInput?.value.trim() || 'Unnamed Additive';
            if (valueInput && typeOption?.dataset.value === 'additive' && modifierId) {
                const modifierValue = safeParseFloat(valueInput.value, 0);
                if (modifierValue !== 0 || valueInput.value.trim() !== '0') { // Only include if not default 0
                    additiveTerms.push(num(modifierValue, modifierId, factorName));
                }
            }
        });
        if (additiveTerms.length > 0) {
            // Group previous calculation before adding additive terms
             if ((equationHTML.includes(op('&times;')) || equationHTML.includes(op('+'))) && equationHTML !== '0') {
                 equationHTML = group(equationHTML);
             }
             if (equationHTML === '0') equationHTML = ''; // Avoid 0 + (...)
            // Join additive terms, grouping if more than one
            const addPart = additiveTerms.length > 1 ? group(additiveTerms.join(op('+'))) : additiveTerms[0];
            equationHTML += (equationHTML ? op('+') : '') + addPart;
        }

        // --- 6. Speed Term ---
        const speedSliderEq = document.getElementById('speed-slider'); // Or import if defined
        const baseSpeedEq = safeParseFloat(charSpeedInput?.value, 0);
        if (speedSliderEq && baseSpeedEq > 0) {
            const sliderPercentEq = safeParseFloat(speedSliderEq.value, 0);
            if (sliderPercentEq > 0) {
                const speedUsedEq = baseSpeedEq * (sliderPercentEq / 100);
                const speedDamageEq = speedUsedEq * 1; // 1:1 conversion
                if (speedDamageEq !== 0) {
                    // Group previous calculation before adding speed term
                     if ((equationHTML.includes(op('&times;')) || equationHTML.includes(op('+'))) && equationHTML !== '0') {
                         equationHTML = group(equationHTML);
                     }
                     if (equationHTML === '0') equationHTML = ''; // Avoid 0 + (...)
                    // Use speed-slider as the target ID for linking
                    equationHTML += (equationHTML ? op('+') : '') + num(speedDamageEq, 'speed-slider', `${formatSimpleNumber(speedUsedEq)} Speed Used -> +${formatSimpleNumber(speedDamageEq)} Damage`);
                }
            }
        }

        // Final display assignment
        if (!equationHTML || equationHTML.trim() === '0') {
            equationHTML = '0'; // Display '0' if calculation results in empty string or just '0'
        }
        equationDisplayEl.innerHTML = equationHTML;

    } catch (error) {
        console.error("Error updating equation:", error);
        equationDisplayEl.innerHTML = '<span class="text-error-dark">Could not generate equation.</span>';
    }
}


/**
 * Handles clicks within the equation display area. If a number with a
 * data-target-id is clicked, scrolls to and highlights the corresponding element.
 * @param {Event} event - The click event.
 */
export function handleEquationClick(event) {
    const target = event.target;

    // Check if the clicked element is a number span with a target ID
    if (target.classList.contains('equation-number') && target.dataset.targetId) {
        const targetId = target.dataset.targetId;
        const sourceElement = document.getElementById(targetId); // Find the linked input/slider/etc.

        if (sourceElement) {
            // Scroll the source element into view (centered vertically)
            sourceElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Determine which element to visually pulse (input, parent container, etc.)
            let elementToPulse = sourceElement;
            if (sourceElement.tagName === 'SPAN' && sourceElement.classList.contains('readonly-display')) {
                elementToPulse = sourceElement.closest('.energy-pool') || sourceElement;
            } else if (sourceElement.type === 'range') {
                elementToPulse = sourceElement.closest('.energy-slider-section') || sourceElement;
            } else if (sourceElement.classList.contains('modifier-value-input')) {
                 elementToPulse = sourceElement.closest('.dynamic-box') || sourceElement;
            } else if (targetId === 'speed-slider') {
                 elementToPulse = document.getElementById('speed-slider-section') || sourceElement;
            } else if (targetId === 'form-multiplier') {
                // Pulse the 'Active Forms' section when the combined multiplier is clicked
                elementToPulse = document.getElementById('active-forms-section') || sourceElement;
            }


            // Trigger the pulse animation (using imported function)
            triggerAnimation(elementToPulse, 'pulse-source');

            // Focus the element if it's an editable input (but not range/readonly span)
            if (sourceElement.tagName === 'INPUT' && !sourceElement.readOnly && sourceElement.type !== 'range') {
                 sourceElement.focus();
            }

            // Check if the click corresponds to an energy element that isn't currently focused
            // If so, switch the main energy pool view to that type
            const energyTypeMatch = targetId.match(/^([a-z]+)-(damage-per-power|energy-slider|max-multiplier)/);
            if (energyTypeMatch) {
                const energyType = energyTypeMatch[1];
                if (ALL_ENERGY_TYPES.includes(energyType) && energyTypeSelect?.value !== energyType) {
                    console.log(`Switching view to ${energyType} pool triggered by equation click...`);
                    if(energyTypeSelect) energyTypeSelect.value = energyType;
                    // Trigger the UI update to show the correct pool
                    // This requires importing displayEnergyPool or similar coordination logic
                    displayEnergyPool(energyType); // TODO: Import displayEnergyPool from ui-updater.js
                    // The coordination might also need to update attack buttons, etc.
                    // For now, just switch the pool display.
                }
            }
        } else {
            console.warn(`Equation link target element not found: #${targetId}`);
        }
    }
}