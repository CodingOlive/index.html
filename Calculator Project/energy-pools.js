// energy-pools.js - Logic specific to energy pool calculations and actions.

// --- Import Dependencies ---
import {
    // Character Stat Inputs needed for base calculations
    charBaseHealthInput, charVitalityInput, charSoulPowerInput,
    charSoulHpInput, charBaseMultiplierInput // Base multiplier affects total energy
} from './dom-elements.js';

import { ALL_ENERGY_TYPES } from './config.js'; // Needed for validation and looping

import { safeParseFloat } from './utils.js';
import { formatStatNumber, parseFormattedNumber } from './formatters.js';

// Import UI/Feedback/Other Functions
import { showMessage } from './ui-feedback.js';
import { triggerAnimation } from './utils.js';
import {
    updateSliderVisibility, // To show/hide slider based on total energy
    updateStatsDisplay    // To update stats panel after regeneration
} from './ui-updater.js';
// Import the function that updates the slider's text display (E:..., D:...)
import { updateSingleSliderDisplay } from './calculation.js'; // Assumes it's defined in calculation.js


// --- Energy Pool Functions ---

/**
 * Gets references to all DOM elements associated with a specific energy type's pool and slider.
 * Uses getElementById internally to find sub-elements based on naming convention.
 * @param {string} type - The energy type (e.g., 'ki', 'nen').
 * @returns {object|null} An object containing element references, or null if the main pool div isn't found or type is invalid.
 */
export function getEnergyElements(type) {
    // Uses imported ALL_ENERGY_TYPES for validation
    if (!ALL_ENERGY_TYPES.includes(type)) {
        return null;
    }
    const poolDiv = document.getElementById(`${type}-pool`);
    if (!poolDiv) {
        return null;
    }
    // Uses getElementById/querySelector directly, no further imports needed inside here
    return {
        poolDiv: poolDiv,
        baseMaxEnergyEl: poolDiv.querySelector(`#${type}-base-max-energy`),
        maxMultiplierEl: poolDiv.querySelector(`#${type}-max-multiplier`),
        totalEnergyEl: poolDiv.querySelector(`#${type}-total-energy`),
        currentEnergyEl: poolDiv.querySelector(`#${type}-current-energy`),
        damagePerPowerEl: poolDiv.querySelector(`#${type}-damage-per-power`),
        regenPercentEl: poolDiv.querySelector(`#${type}-regen-percent`),
        regenBtn: poolDiv.querySelector(`button[data-type="${type}"]`),
        sliderSection: document.getElementById(`${type}-slider-section`),
        energySlider: document.getElementById(`${type}-energy-slider`),
        sliderValueDisplay: document.getElementById(`${type}-slider-value-display`),
    };
}

/**
 * Calculates the base maximum energy for a given type based on character stats.
 * Does not include multipliers.
 * @param {string} type - The energy type.
 * @returns {number} The calculated base maximum energy.
 */
export function calculateBaseMaxEnergy(type) {
    // Uses imported DOM elements and safeParseFloat util
    const baseHp = safeParseFloat(charBaseHealthInput?.value, 0);
    const vitality = safeParseFloat(charVitalityInput?.value, 0);
    const soulPower = safeParseFloat(charSoulPowerInput?.value, 0);
    const soulHp = safeParseFloat(charSoulHpInput?.value, 0);

    let baseMax = 0;
    // ... (switch statement remains the same) ...
     switch (type) {
        case 'nen': baseMax = vitality * soulHp; break;
        case 'chakra': baseMax = vitality * (0.5 * soulHp + 0.5 * soulPower); break;
        case 'reiatsu': baseMax = soulHp * vitality * soulPower; break;
        case 'cursed': baseMax = soulPower * soulHp; break;
        case 'ki': baseMax = vitality * (soulPower + soulHp); break; // Ki
        case 'haki': baseMax = vitality * (soulPower + soulHp); break; // Haki (same as Ki)
        case 'alchemy': baseMax = soulPower * baseHp; break;
        case 'nature': baseMax = vitality * (soulHp + baseHp + soulPower); break;
        case 'magic': baseMax = soulPower * (soulHp + baseHp + vitality); break;
        case 'force': baseMax = soulHp + vitality; break;
        case 'origin': baseMax = vitality * soulPower * soulHp; break; // Origin (same as Reiatsu?)
        case 'fundamental': baseMax = vitality * (soulPower + soulHp); break; // Fundamental (same as Ki/Haki)
        case 'other': baseMax = vitality + soulPower + soulHp; break;
        default:
            console.warn(`Unknown energy type for base max calculation: ${type}`);
            baseMax = 0;
    }
    return Math.max(0, baseMax);
}

/**
 * Calculates total energy for a pool (Base * Char Base Mult * Pool Max Mult)
 * and updates the pool's display elements (Base Max, Total, Current).
 * Adjusts Current energy to not exceed the new Total.
 * @param {string} type - The energy type.
 * @returns {number} The calculated total energy for the pool.
 */
export function calculateAndResetEnergy(type) {
    const els = getEnergyElements(type); // Uses function defined above
    if (!els?.baseMaxEnergyEl || !els?.maxMultiplierEl || !els?.totalEnergyEl || !els?.currentEnergyEl) {
        return 0;
    }

    // Uses function defined above
    const baseMaxEnergy = calculateBaseMaxEnergy(type);
    els.baseMaxEnergyEl.textContent = formatStatNumber(baseMaxEnergy); // Uses imported formatter

    // Uses imported element and util
    const characterBaseMultiplier = safeParseFloat(charBaseMultiplierInput?.value, 1);
    const poolMaxMultiplier = safeParseFloat(els.maxMultiplierEl.value, 1); // Uses element from els

    const totalEnergy = baseMaxEnergy * characterBaseMultiplier * poolMaxMultiplier;
    els.totalEnergyEl.textContent = formatStatNumber(totalEnergy); // Uses imported formatter

    // Uses imported formatters/parsers
    const currentEnergy = parseFormattedNumber(els.currentEnergyEl.textContent);
    const newTotal = totalEnergy;
    els.currentEnergyEl.textContent = formatStatNumber(Math.max(0, Math.min(currentEnergy, newTotal)));

    // Uses imported UI functions
    updateSliderVisibility(type);
    updateSingleSliderDisplay(type);

    return totalEnergy;
}

/**
 * Regenerates energy for a specific pool based on its regen rate.
 * @param {string} type - The energy type to regenerate.
 */
export function regenerateEnergy(type) {
    const els = getEnergyElements(type); // Uses function defined above
    if (!els?.totalEnergyEl || !els?.currentEnergyEl || !els?.regenPercentEl) {
        console.error(`Elements missing for energy regeneration: ${type}`);
        return;
    }

    // Uses imported formatters/parsers/utils
    const totalEnergy = parseFormattedNumber(els.totalEnergyEl.textContent);
    let currentEnergy = parseFormattedNumber(els.currentEnergyEl.textContent);
    const regenPercent = safeParseFloat(els.regenPercentEl.value, 0);

    if (totalEnergy <= 0) {
        showMessage(`Total Energy for ${type} must be positive to regenerate.`, 'error'); // Uses imported UI function
        return;
    }
    if (regenPercent <= 0) {
        showMessage('Regen Rate must be positive.', 'error'); // Uses imported UI function
        return;
    }

    const regenAmount = totalEnergy * (regenPercent / 100);
    let newEnergy = Math.min(currentEnergy + regenAmount, totalEnergy);

    els.currentEnergyEl.textContent = formatStatNumber(newEnergy); // Uses imported formatter

    // Uses imported UI/Util functions
    showMessage(`${formatStatNumber(regenAmount)} ${type} regenerated. Current: ${formatStatNumber(newEnergy)}`, 'success');
    triggerAnimation(els.currentEnergyEl, 'flash-green');

    // Uses imported UI/Calculation functions
    updateSingleSliderDisplay(type);
    updateStatsDisplay();
}

// ... (Keep exports if using named exports list at bottom, otherwise ensure functions have 'export' keyword)
// Exporting inline as done above is fine.
import {
    // Character Stat Inputs needed for base calculations
    charBaseHealthInput, charVitalityInput, charSoulPowerInput,
    charSoulHpInput, charBaseMultiplierInput // Base multiplier affects total energy
    // May need energyTypeSelect if used directly here, but often passed as argument
} from './dom-elements.js';

import { ALL_ENERGY_TYPES } from './config.js'; // Needed for validation in getEnergyElements

import { safeParseFloat } from './utils.js';
import { formatStatNumber, parseFormattedNumber } from './formatters.js';

// UI/Feedback Functions (Import later)
import { showMessage } from './ui-feedback.js';
import { triggerAnimation } from './utils.js'; // Or ui-updater.js
import {
    updateSliderVisibility, updateStatsDisplay // From ui-updater.js
    // updateSingleSliderDisplay // From calculation.js or ui-updater.js
} from './ui-updater.js';


// --- Energy Pool Functions ---

/**
 * Gets references to all DOM elements associated with a specific energy type's pool and slider.
 * Uses getElementById internally to find sub-elements based on naming convention.
 * @param {string} type - The energy type (e.g., 'ki', 'nen').
 * @returns {object|null} An object containing element references, or null if the main pool div isn't found or type is invalid.
 */
export function getEnergyElements(type) {
    if (!ALL_ENERGY_TYPES.includes(type)) {
        // console.warn("Invalid energy type requested:", type); // Keep console noise low
        return null;
    }
    const poolDiv = document.getElementById(`${type}-pool`);
    if (!poolDiv) {
        // console.warn(`Pool div not found for type: ${type}`); // Keep console noise low
        return null; // Cannot proceed if the main container isn't there
    }

    // Find sub-elements within the poolDiv or associated slider section
    // Note: Assumes consistent naming convention (e.g., {type}-base-max-energy)
    return {
        poolDiv: poolDiv,
        baseMaxEnergyEl: poolDiv.querySelector(`#${type}-base-max-energy`), // Use querySelector for robustness within the poolDiv
        maxMultiplierEl: poolDiv.querySelector(`#${type}-max-multiplier`),   // Input for Pool Max Multiplier
        totalEnergyEl: poolDiv.querySelector(`#${type}-total-energy`),
        currentEnergyEl: poolDiv.querySelector(`#${type}-current-energy`),
        damagePerPowerEl: poolDiv.querySelector(`#${type}-damage-per-power`),
        regenPercentEl: poolDiv.querySelector(`#${type}-regen-percent`),
        regenBtn: poolDiv.querySelector(`button[data-type="${type}"]`), // Find button by data attribute if needed
        // Associated slider elements (may be in a different container)
        sliderSection: document.getElementById(`${type}-slider-section`),
        energySlider: document.getElementById(`${type}-energy-slider`),
        sliderValueDisplay: document.getElementById(`${type}-slider-value-display`),
    };
}

/**
 * Calculates the base maximum energy for a given type based on character stats.
 * Does not include multipliers.
 * @param {string} type - The energy type.
 * @returns {number} The calculated base maximum energy.
 */
export function calculateBaseMaxEnergy(type) {
    // Read required character stats (ensure elements are imported)
    const baseHp = safeParseFloat(charBaseHealthInput?.value, 0);
    const vitality = safeParseFloat(charVitalityInput?.value, 0);
    const soulPower = safeParseFloat(charSoulPowerInput?.value, 0);
    const soulHp = safeParseFloat(charSoulHpInput?.value, 0);

    let baseMax = 0;
    switch (type) {
        case 'nen': baseMax = vitality * soulHp; break;
        case 'chakra': baseMax = vitality * (0.5 * soulHp + 0.5 * soulPower); break;
        case 'reiatsu': baseMax = soulHp * vitality * soulPower; break;
        case 'cursed': baseMax = soulPower * soulHp; break;
        case 'ki': baseMax = vitality * (soulPower + soulHp); break; // Ki
        case 'haki': baseMax = vitality * (soulPower + soulHp); break; // Haki (same as Ki)
        case 'alchemy': baseMax = soulPower * baseHp; break;
        case 'nature': baseMax = vitality * (soulHp + baseHp + soulPower); break;
        case 'magic': baseMax = soulPower * (soulHp + baseHp + vitality); break;
        case 'force': baseMax = soulHp + vitality; break;
        case 'origin': baseMax = vitality * soulPower * soulHp; break; // Origin (same as Reiatsu?)
        case 'fundamental': baseMax = vitality * (soulPower + soulHp); break; // Fundamental (same as Ki/Haki)
        case 'other': baseMax = vitality + soulPower + soulHp; break;
        default:
            console.warn(`Unknown energy type for base max calculation: ${type}`);
            baseMax = 0;
    }
    // Ensure base max is not negative
    return Math.max(0, baseMax);
}

/**
 * Calculates total energy for a pool (Base * Char Base Mult * Pool Max Mult)
 * and updates the pool's display elements (Base Max, Total, Current).
 * Adjusts Current energy to not exceed the new Total.
 * @param {string} type - The energy type.
 * @returns {number} The calculated total energy for the pool.
 */
export function calculateAndResetEnergy(type) {
    const els = getEnergyElements(type);
    if (!els?.baseMaxEnergyEl || !els?.maxMultiplierEl || !els?.totalEnergyEl || !els?.currentEnergyEl) {
        // console.warn(`Elements missing for energy calc/reset: ${type}`); // Reduce noise
        return 0; // Return 0 if elements not ready
    }

    // 1. Calculate and display Base Max Energy
    const baseMaxEnergy = calculateBaseMaxEnergy(type);
    els.baseMaxEnergyEl.textContent = formatStatNumber(baseMaxEnergy);

    // 2. Get multipliers
    // Character Base Multiplier (could be overridden by Ryoko mode)
    const characterBaseMultiplier = safeParseFloat(charBaseMultiplierInput?.value, 1);
    // Pool Max Multiplier (this value is set by form effects or user input)
    const poolMaxMultiplier = safeParseFloat(els.maxMultiplierEl.value, 1);

    // 3. Calculate and display Total Energy
    const totalEnergy = baseMaxEnergy * characterBaseMultiplier * poolMaxMultiplier;
    els.totalEnergyEl.textContent = formatStatNumber(totalEnergy);

    // 4. Adjust and display Current Energy
    // Cap current energy at the new total, or set to 0 if total is 0.
    const currentEnergy = parseFormattedNumber(els.currentEnergyEl.textContent);
    const newTotal = totalEnergy; // Use the calculated total
    // Set current to the minimum of its previous value and the new total, ensuring it's not negative.
    els.currentEnergyEl.textContent = formatStatNumber(Math.max(0, Math.min(currentEnergy, newTotal)));
    // If you always want to reset current to max when recalculating:
    // els.currentEnergyEl.textContent = formatStatNumber(newTotal);

    // 5. Update associated UI elements
    // TODO: Import these UI functions later
    updateSliderVisibility(type); // Show/hide slider based on new total
    // updateSingleSliderDisplay(type); // Update slider text based on potentially changed current energy

    return totalEnergy; // Return the calculated total
}

/**
 * Regenerates energy for a specific pool based on its regen rate.
 * @param {string} type - The energy type to regenerate.
 */
export function regenerateEnergy(type) {
    const els = getEnergyElements(type);
    if (!els?.totalEnergyEl || !els?.currentEnergyEl || !els?.regenPercentEl) {
        console.error(`Elements missing for energy regeneration: ${type}`);
        return;
    }

    const totalEnergy = parseFormattedNumber(els.totalEnergyEl.textContent);
    let currentEnergy = parseFormattedNumber(els.currentEnergyEl.textContent);
    const regenPercent = safeParseFloat(els.regenPercentEl.value, 0);

    if (totalEnergy <= 0) {
        // TODO: Import showMessage
        showMessage(`Total Energy for ${type} must be positive to regenerate.`, 'error');
        return;
    }
    if (regenPercent <= 0) {
        // TODO: Import showMessage
        showMessage('Regen Rate must be positive.', 'error');
        return;
    }

    const regenAmount = totalEnergy * (regenPercent / 100);
    let newEnergy = Math.min(currentEnergy + regenAmount, totalEnergy); // Cap at total

    els.currentEnergyEl.textContent = formatStatNumber(newEnergy);

    // TODO: Import showMessage and triggerAnimation
    showMessage(`${formatStatNumber(regenAmount)} ${type} regenerated. Current: ${formatStatNumber(newEnergy)}`, 'success');
    triggerAnimation(els.currentEnergyEl, 'flash-green'); // Flash the updated value

    // Update other UI that depends on current energy
    // TODO: Import these functions later
    // updateSingleSliderDisplay(type); // Update slider text (E: ..., D: ...)
    updateStatsDisplay(); // Update the general stats panel display
}