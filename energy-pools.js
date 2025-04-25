// energy-pools.js - Logic specific to energy pool calculations and actions, using merged types.

// --- Import Dependencies ---
import {
    // Character Stat Inputs needed for base calculations
    charBaseHealthInput, charVitalityInput, charSoulPowerInput,
    charSoulHpInput, charBaseMultiplierInput
} from './dom-elements.js';

// Import State (READ access needed)
import { mergedEnergyTypes } from './state.js'; // Use the merged list

// Import Utilities & Formatters
import { safeParseFloat } from './utils.js';
import { formatStatNumber, parseFormattedNumber } from './formatters.js';

// Import UI/Feedback/Other Functions
import { showMessage } from './ui-feedback.js';
import { triggerAnimation } from './utils.js';
import {
    updateSliderVisibility, updateStatsDisplay
} from './ui-updater.js';
import { updateSingleSliderDisplay } from './calculation.js';


// --- Energy Pool Functions ---

/**
 * Gets references to all DOM elements associated with a specific energy type's pool and slider.
 * Uses the type ID (standard key or custom Firebase ID).
 * @param {string} typeId - The energy type ID.
 * @returns {object|null} An object containing element references, or null if the main pool div isn't found.
 */
export function getEnergyElements(typeId) {
    // Validation might now rely on checking if typeId exists in mergedEnergyTypes if needed
    // Example: if (!mergedEnergyTypes.some(et => et.id === typeId)) return null;

    const poolDiv = document.getElementById(`${typeId}-pool`);
    if (!poolDiv) {
        // console.warn(`Pool div not found for type ID: ${typeId}`); // Reduce noise
        return null;
    }
    // Find sub-elements within the poolDiv or associated slider section
    return {
        poolDiv: poolDiv,
        baseMaxEnergyEl: poolDiv.querySelector(`#${typeId}-base-max-energy`),
        maxMultiplierEl: poolDiv.querySelector(`#${typeId}-max-multiplier`),
        totalEnergyEl: poolDiv.querySelector(`#${typeId}-total-energy`),
        currentEnergyEl: poolDiv.querySelector(`#${typeId}-current-energy`),
        damagePerPowerEl: poolDiv.querySelector(`#${typeId}-damage-per-power`),
        regenPercentEl: poolDiv.querySelector(`#${typeId}-regen-percent`),
        regenBtn: poolDiv.querySelector(`button[data-type="${typeId}"]`), // Find button by data attribute
        sliderSection: document.getElementById(`${typeId}-slider-section`),
        energySlider: document.getElementById(`${typeId}-energy-slider`),
        sliderValueDisplay: document.getElementById(`${typeId}-slider-value-display`),
    };
}

/**
 * Calculates the base maximum energy for a given type based on character stats
 * and the type's definition (standard switch or custom formula).
 * @param {string} typeId - The ID of the energy type (standard or custom).
 * @returns {number} The calculated base maximum energy.
 */
export function calculateBaseMaxEnergy(typeId) {
    // Find the energy type definition in the merged list
    const energyType = mergedEnergyTypes.find(et => et.id === typeId);

    if (!energyType) {
        console.warn(`Energy type definition not found for ID: ${typeId}`);
        return 0;
    }

    // Read required character stats using imported elements and util
    const stats = {
        baseHp: safeParseFloat(charBaseHealthInput?.value, 0),
        vitality: safeParseFloat(charVitalityInput?.value, 0),
        soulPower: safeParseFloat(charSoulPowerInput?.value, 0),
        soulHp: safeParseFloat(charSoulHpInput?.value, 0)
        // Ensure variable names here EXACTLY match those expected in formula strings
    };

    let baseMax = 0;

    if (energyType.isStandard) {
        // --- Standard Type Calculation (using switch statement) ---
        console.log(`Calculating standard base max for: ${typeId}`);
        switch (typeId) {
            // Ensure cases match the exact IDs used in config.js/ALL_ENERGY_TYPES
            case 'nen': baseMax = stats.vitality * stats.soulHp; break;
            case 'chakra': baseMax = stats.vitality * (0.5 * stats.soulHp + 0.5 * stats.soulPower); break;
            case 'reiatsu': baseMax = stats.soulHp * stats.vitality * stats.soulPower; break;
            case 'cursed': baseMax = stats.soulPower * stats.soulHp; break;
            case 'ki': baseMax = stats.vitality * (stats.soulPower + stats.soulHp); break;
            case 'haki': baseMax = stats.vitality * (stats.soulPower + stats.soulHp); break;
            case 'alchemy': baseMax = stats.soulPower * stats.baseHp; break;
            case 'nature': baseMax = stats.vitality * (stats.soulHp + stats.baseHp + stats.soulPower); break;
            case 'magic': baseMax = stats.soulPower * (stats.soulHp + stats.baseHp + stats.vitality); break;
            case 'force': baseMax = stats.soulHp + stats.vitality; break;
            case 'origin': baseMax = stats.vitality * stats.soulPower * stats.soulHp; break;
            case 'fundamental': baseMax = stats.vitality * (stats.soulPower + stats.soulHp); break;
            case 'other': baseMax = stats.vitality + stats.soulPower + stats.soulHp; break;
            default:
                console.warn(`Unknown standard energy type ID in switch: ${typeId}`);
                baseMax = 0;
        }
    } else if (energyType.formula) {
        // --- Custom Type Calculation (using MathJS evaluation) ---
        const formulaString = energyType.formula;
        console.log(`Calculating custom base max for: ${energyType.name} using formula: ${formulaString}`);
        try {
            // Ensure MathJS is loaded (it's included via CDN in index.html)
            if (typeof math === 'undefined' || !math?.evaluate) {
                throw new Error("MathJS library (math.evaluate) not available.");
            }
            // Compile and evaluate the formula string with the current stats as the scope
            const compiledFormula = math.compile(formulaString);
            baseMax = compiledFormula.evaluate(stats); // Pass stats object

            // Ensure the result is a valid number
            if (typeof baseMax !== 'number' || !isFinite(baseMax)) {
                console.error(`Custom formula for "${energyType.name}" [${formulaString}] evaluated to non-finite value:`, baseMax);
                showMessage(`Error in formula for ${energyType.name}: Invalid result. Check console.`, 'error'); // Use imported function
                baseMax = 0;
            } else {
                 console.log(`Custom formula result for ${energyType.name}: ${baseMax}`);
            }
        } catch (error) {
            console.error(`Error evaluating custom formula "${formulaString}" for "${energyType.name}":`, error);
            // Provide more specific error feedback if possible
            let errorMsg = error.message || 'Unknown error during evaluation.';
            if (error.message?.includes('Undefined symbol')) {
                errorMsg = `Formula contains an unknown stat name (e.g., ${error.message.split(' ').pop()}). Check formula and available stats.`;
            }
            showMessage(`Formula Error (${energyType.name}): ${errorMsg}`, 'error'); // Use imported function
            baseMax = 0; // Default to 0 on error
        }
    } else {
        // Custom type exists but has no formula? Default to 0.
        console.warn(`Custom energy type "${energyType.name}" (ID: ${typeId}) has no formula defined.`);
        baseMax = 0;
    }

    // Ensure base max is not negative
    return Math.max(0, baseMax);
}

/**
 * Calculates total energy for a pool and updates its display elements.
 * Uses the updated calculateBaseMaxEnergy function.
 * @param {string} typeId - The energy type ID (standard or custom).
 * @returns {number} The calculated total energy for the pool.
 */
export function calculateAndResetEnergy(typeId) {
    // Uses imported helper and elements
    const els = getEnergyElements(typeId);
    if (!els?.baseMaxEnergyEl || !els?.maxMultiplierEl || !els?.totalEnergyEl || !els?.currentEnergyEl) {
        // console.warn(`Elements missing for energy calc/reset: ${typeId}`);
        return 0;
    }

    // 1. Calculate and display Base Max Energy (uses the updated function above)
    const baseMaxEnergy = calculateBaseMaxEnergy(typeId);
    els.baseMaxEnergyEl.textContent = formatStatNumber(baseMaxEnergy); // Use imported formatter

    // 2. Get multipliers (uses imported element and util)
    const characterBaseMultiplier = safeParseFloat(charBaseMultiplierInput?.value, 1);
    const poolMaxMultiplier = safeParseFloat(els.maxMultiplierEl.value, 1);

    // 3. Calculate and display Total Energy
    const totalEnergy = baseMaxEnergy * characterBaseMultiplier * poolMaxMultiplier;
    els.totalEnergyEl.textContent = formatStatNumber(totalEnergy); // Use imported formatter

    // 4. Adjust and display Current Energy (uses imported formatters/parsers)
    const currentEnergy = parseFormattedNumber(els.currentEnergyEl.textContent);
    const newTotal = totalEnergy;
    els.currentEnergyEl.textContent = formatStatNumber(Math.max(0, Math.min(currentEnergy, newTotal)));

    // 5. Update associated UI elements (uses imported functions)
    updateSliderVisibility(typeId);
    updateSingleSliderDisplay(typeId);

    return totalEnergy;
}

/**
 * Regenerates energy for a specific pool based on its regen rate.
 * (No changes needed here, it works with the calculated Total Energy)
 * @param {string} typeId - The energy type ID (standard or custom).
 */
export function regenerateEnergy(typeId) {
    // Uses imported helper, formatters, utils, UI functions
    const els = getEnergyElements(typeId);
    if (!els?.totalEnergyEl || !els?.currentEnergyEl || !els?.regenPercentEl) {
        console.error(`Elements missing for energy regeneration: ${typeId}`);
        return;
    }
    const totalEnergy = parseFormattedNumber(els.totalEnergyEl.textContent);
    let currentEnergy = parseFormattedNumber(els.currentEnergyEl.textContent);
    const regenPercent = safeParseFloat(els.regenPercentEl.value, 0);
    if (totalEnergy <= 0) { showMessage(`Total Energy for ${typeId} must be positive...`, 'error'); return; }
    if (regenPercent <= 0) { showMessage('Regen Rate must be positive.', 'error'); return; }
    const regenAmount = totalEnergy * (regenPercent / 100);
    let newEnergy = Math.min(currentEnergy + regenAmount, totalEnergy);
    els.currentEnergyEl.textContent = formatStatNumber(newEnergy);
    showMessage(`${formatStatNumber(regenAmount)} ${typeId} regenerated. Current: ${formatStatNumber(newEnergy)}`, 'success');
    triggerAnimation(els.currentEnergyEl, 'flash-green');
    updateSingleSliderDisplay(typeId);
    updateStatsDisplay();
}

