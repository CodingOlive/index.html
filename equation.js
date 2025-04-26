// equation.js - Handles generation and interaction for the calculation equation display.

// --- Import Dependencies ---
// Import DOM Elements
import {
    equationDisplayEl, baseDamageInput, baseMultiplierInput, formMultiplierInput,
    attackCompressionPointsInput, dynamicModifiersContainer, energyTypeSelect,
    charSpeedInput
} from './dom-elements.js';

// Import State
import { activeAttacks } from './state.js';

// Import Config
import { ALL_ENERGY_TYPES, ENERGY_TYPE_DETAILS } from './config.js';

// Import Formatters & Utilities
import { formatSimpleNumber, parseFormattedNumber } from './formatters.js'; // Import formatters
import { safeParseFloat, escapeHtml, triggerAnimation } from './utils.js'; // Import utils (including safeParseFloat)

// Import UI functions
import { displayEnergyPool } from './ui-updater.js';


// --- Equation Functions ---

/**
 * Updates the equation display in the results area based on current inputs and settings.
 * Creates clickable links from numbers in the equation to their source inputs/sliders.
 */
export function updateEquationDisplay() {
    // Use the imported equationDisplayEl directly
    if (!equationDisplayEl) {
        console.warn("Equation display element not found.");
        return;
    }

    // --- Helper functions for building HTML ---
    const op = (operator) => `<span class="equation-operator">${operator}</span>`;
    const group = (content) => `<span class="equation-group">(</span>${content}<span class="equation-group">)</span>`;
    const num = (value, targetId, title = '') => {
        const cleanValue = safeParseFloat(value, 0); // Use imported safeParseFloat from utils.js
        const displayValue = formatSimpleNumber(cleanValue); // Use imported formatSimpleNumber from formatters.js
        const titleAttr = title ? ` title="${escapeHtml(title)}"` : ''; // Use imported escapeHtml from utils.js
        const targetAttr = targetId ? ` data-target-id="${targetId}"` : '';
        return `<span class="equation-number"${targetAttr}${titleAttr}>${displayValue}</span>`;
    };
    // --- End Helpers ---

    let equationHTML = '';

    try {
        // --- Build Equation String using imported elements/state/utils/formatters ---
        // 1. Base Damage, Base Multiplier, Form Multiplier
        const baseDamage = safeParseFloat(baseDamageInput?.value, 0);
        const baseMultiplier = safeParseFloat(baseMultiplierInput?.value, 1);
        const formMultiplierVal = safeParseFloat(formMultiplierInput?.value, 1);
        let basePart = num(baseDamage, 'base-damage', 'Base Damage');
        if (baseMultiplier !== 1 || baseMultiplierInput?.value.trim() !== '1') { basePart += op('&times;') + num(baseMultiplier, 'base-multiplier', 'Base Multiplier'); }
        if (formMultiplierVal !== 1 || formMultiplierInput?.value.trim() !== '1') { basePart += op('&times;') + num(formMultiplierVal, 'form-multiplier', 'Combined Form Multiplier'); }
        let baseCalculationHTML = (basePart.includes(op('&times;'))) ? group(basePart) : basePart;

        // 2. Compression Points
        const compressionPoints = safeParseFloat(attackCompressionPointsInput?.value, 0);
        if (compressionPoints > 0) {
            let compressionMultiplierValue = Math.max(1, (compressionPoints * 1.5) + (Math.floor(compressionPoints / 10) * 3));
            const compTitle = `${compressionPoints} Comp. Points -> &times;${formatSimpleNumber(compressionMultiplierValue)} Multiplier`;
            if (baseCalculationHTML && baseCalculationHTML !== '0') { if(baseCalculationHTML !== num(baseDamage, 'base-damage', 'Base Damage')) { baseCalculationHTML = group(baseCalculationHTML); } }
            else if (!baseCalculationHTML || baseCalculationHTML === '0') { baseCalculationHTML = ''; }
            baseCalculationHTML += (baseCalculationHTML ? op('&times;') : '') + num(compressionMultiplierValue, 'attack-compression-points', compTitle);
        }
        equationHTML = baseCalculationHTML || '0';

        // 3. Dynamic Multiplicative Modifiers
        let multiplicativeTerms = [];
        dynamicModifiersContainer?.querySelectorAll('.dynamic-box').forEach((modifierDiv) => {
             const valueInput = modifierDiv.querySelector('.modifier-value-input');
             const typeOption = modifierDiv.querySelector('.modifier-type-option.active');
             const nameInput = modifierDiv.querySelector('.modifier-name-input');
             const modifierId = valueInput?.id;
             const factorName = nameInput?.value.trim() || 'Unnamed Multiplier';
             if (valueInput && typeOption?.dataset.value === 'multiplicative' && modifierId) {
                 const multiplier = safeParseFloat(valueInput.value, 1);
                 if (multiplier !== 1 || valueInput.value.trim() !== '1') {
                     multiplicativeTerms.push(num(multiplier, modifierId, factorName));
                 }
             }
        });
        if (multiplicativeTerms.length > 0) {
             if ((equationHTML.includes(op('&times;')) || equationHTML.includes(op('+'))) && equationHTML !== '0') { equationHTML = group(equationHTML); }
             if (equationHTML === '0') equationHTML = '';
             const multPart = multiplicativeTerms.length > 1 ? group(multiplicativeTerms.join(op('&times;'))) : multiplicativeTerms[0];
             equationHTML += (equationHTML ? op('&times;') : '') + multPart;
        }

        // 4. Energy Damage Terms
        let energyTerms = [];
        ALL_ENERGY_TYPES.forEach(type => { // Use imported config
            const energySlider = document.getElementById(`${type}-energy-slider`);
            const currentEnergyEl = document.getElementById(`${type}-current-energy`);
            const damagePerPowerEl = document.getElementById(`${type}-damage-per-power`);
            if (energySlider && currentEnergyEl && damagePerPowerEl) {
                const sliderPercent = safeParseFloat(energySlider.value, 0);
                const attackState = activeAttacks[type] || null; // Use imported state
                let limitPercent = 100;
                if (attackState === 'super') limitPercent = 95; else if (attackState === 'ultimate') limitPercent = 90;
                const effectivePercent = Math.min(sliderPercent, limitPercent);
                if (effectivePercent > 0) {
                    const currentEnergy = parseFormattedNumber(currentEnergyEl.textContent); // Use imported formatter
                    if (currentEnergy > 0) {
                        const damagePerPower = safeParseFloat(damagePerPowerEl.value, 1);
                        const energyUsed = Math.max(0, Math.min(currentEnergy * (effectivePercent / 100), currentEnergy));
                        const energyDamage = energyUsed * damagePerPower;
                        if (energyDamage !== 0 || energyUsed !== 0) {
                            const energyTitle = `${ENERGY_TYPE_DETAILS[type]?.name || type} Used (${sliderPercent}%) = ${formatSimpleNumber(energyUsed)}`; // Use imported config + formatter
                            const dppTitle = `${ENERGY_TYPE_DETAILS[type]?.name || type} Damage/Point`;
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
             if ((equationHTML.includes(op('&times;')) || equationHTML.includes(op('+'))) && equationHTML !== '0') { equationHTML = group(equationHTML); }
             if (equationHTML === '0') equationHTML = '';
             equationHTML += (equationHTML ? op('+') : '') + group(energyTerms.join(op('+')));
        }

        // 5. Dynamic Additive Modifiers
        let additiveTerms = [];
        dynamicModifiersContainer?.querySelectorAll('.dynamic-box').forEach((modifierDiv) => {
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
             if ((equationHTML.includes(op('&times;')) || equationHTML.includes(op('+'))) && equationHTML !== '0') { equationHTML = group(equationHTML); }
             if (equationHTML === '0') equationHTML = '';
             const addPart = additiveTerms.length > 1 ? group(additiveTerms.join(op('+'))) : additiveTerms[0];
             equationHTML += (equationHTML ? op('+') : '') + addPart;
        }

        // 6. Speed Term
        const speedSliderEq = document.getElementById('speed-slider');
        const baseSpeedEq = safeParseFloat(charSpeedInput?.value, 0); // Use imported element + util
        if (speedSliderEq && baseSpeedEq > 0) {
             const sliderPercentEq = safeParseFloat(speedSliderEq.value, 0);
             if (sliderPercentEq > 0) {
                 const speedUsedEq = baseSpeedEq * (sliderPercentEq / 100);
                 const speedDamageEq = speedUsedEq * 1;
                 if (speedDamageEq !== 0) {
                     if ((equationHTML.includes(op('&times;')) || equationHTML.includes(op('+'))) && equationHTML !== '0') { equationHTML = group(equationHTML); }
                     if (equationHTML === '0') equationHTML = '';
                     equationHTML += (equationHTML ? op('+') : '') + num(speedDamageEq, 'speed-slider', `${formatSimpleNumber(speedUsedEq)} Speed Used -> +${formatSimpleNumber(speedDamageEq)} Damage`);
                 }
             }
        }

        // Final display assignment
        if (!equationHTML || equationHTML.trim() === '0') { equationHTML = '0'; }
        equationDisplayEl.innerHTML = equationHTML; // Use imported element

    } catch (error) {
        console.error("Error updating equation:", error);
        if(equationDisplayEl) equationDisplayEl.innerHTML = '<span class="text-error-dark">Could not generate equation.</span>'; // Use imported element
    }
}


/**
 * Handles clicks within the equation display area. If a number with a
 * data-target-id is clicked, scrolls to and highlights the corresponding element.
 * @param {Event} event - The click event.
 */
export function handleEquationClick(event) {
    // Uses imported elements, utils, UI functions
    const target = event.target;
    if (target.classList.contains('equation-number') && target.dataset.targetId) {
        const targetId = target.dataset.targetId;
        const sourceElement = document.getElementById(targetId);
        if (sourceElement) {
            sourceElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            let elementToPulse = sourceElement;
            // Determine element to pulse based on type
            if (sourceElement.tagName === 'SPAN' && sourceElement.classList.contains('readonly-display')) { elementToPulse = sourceElement.closest('.energy-pool') || sourceElement; }
            else if (sourceElement.type === 'range') { elementToPulse = sourceElement.closest('.energy-slider-section') || sourceElement; }
            else if (sourceElement.classList.contains('modifier-value-input')) { elementToPulse = sourceElement.closest('.dynamic-box') || sourceElement; }
            else if (targetId === 'speed-slider') { elementToPulse = document.getElementById('speed-slider-section') || sourceElement; }
            else if (targetId === 'form-multiplier') { elementToPulse = document.getElementById('active-forms-section') || sourceElement; }

            triggerAnimation(elementToPulse, 'pulse-source'); // Use imported util
            if (sourceElement.tagName === 'INPUT' && !sourceElement.readOnly && sourceElement.type !== 'range') { sourceElement.focus(); }

            // Energy pool switching logic
            const energyTypeMatch = targetId.match(/^([a-z]+)-(damage-per-power|energy-slider|max-multiplier)/); // Use standard energy type keys for matching
            if (energyTypeMatch) {
                const energyType = energyTypeMatch[1];
                // Check against standard types for switching logic for now
                if (ALL_ENERGY_TYPES.includes(energyType) && energyTypeSelect?.value !== energyType) { // Use imported config and element
                    if(energyTypeSelect) energyTypeSelect.value = energyType;
                    displayEnergyPool(energyType); // Use imported UI function
                }
            }
        } else { console.warn(`Equation link target element not found: #${targetId}`); }
    }
}

