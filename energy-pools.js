// energy-pools.js - Logic specific to energy pool calculations and actions, using merged types.

// --- Import Dependencies ---
import {
    // Character Stat Inputs needed for base calculations
    charBaseHealthInput, charVitalityInput, charSoulPowerInput,
    charSoulHpInput, charBaseMultiplierInput // Base multiplier for character
} from './dom-elements.js';

// Import State (READ access needed for merged types)
import { mergedEnergyTypes } from './state.js'; // Use the merged list

// Import Utilities & Formatters
import { safeParseFloat } from './utils.js';
import { formatStatNumber, parseFormattedNumber } from './formatters.js';

// Import UI/Feedback/Other Functions
import { showMessage } from './ui-feedback.js';
import { triggerAnimation } from './utils.js';
import {
    updateSliderVisibility, updateStatsDisplay // Keep these UI updaters
} from './ui-updater.js';
// Import function from calculation.js needed here
import { updateSingleSliderDisplay } from './calculation.js'; // <-- Ensure this is imported


// --- Energy Pool Functions ---

/**
 * Gets references to all DOM elements associated with a specific energy type's pool and slider.
 * Uses the type ID (standard key or custom Firebase ID).
 * @param {string} typeId - The energy type ID.
 * @returns {object|null} An object containing element references, or null if the main pool div isn't found.
 */
export function getEnergyElements(typeId) {
    // Don't check mergedEnergyTypes here, as elements might exist before merge completes
    const poolDiv = document.getElementById(`${typeId}-pool`);
    if (!poolDiv) {
        // console.warn(`Pool div not found for type ID: ${typeId}`); // Can be noisy
        return null;
    }
    // Find sub-elements within the poolDiv or associated slider section using specific IDs
    return {
        poolDiv: poolDiv,
        baseMaxEnergyEl: document.getElementById(`${typeId}-base-max-energy`),
        maxMultiplierEl: document.getElementById(`${typeId}-max-multiplier`), // Input for pool multiplier
        totalEnergyEl: document.getElementById(`${typeId}-total-energy`),
        currentEnergyEl: document.getElementById(`${typeId}-current-energy`),
        damagePerPowerEl: document.getElementById(`${typeId}-damage-per-power`),
        regenPercentEl: document.getElementById(`${typeId}-regen-percent`),
        regenBtn: poolDiv.querySelector(`button[data-type="${typeId}"]`), // Find button by data attribute within pool
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
        // This might happen if called before merge completes or with an invalid ID
        // console.warn(`calculateBaseMaxEnergy: Energy type definition not found for ID: ${typeId}`);
        return 0;
    }

    // Read required character stats
    const stats = {
        // Provide default 0 if element is missing or value is invalid
        baseHp: safeParseFloat(charBaseHealthInput?.value, 0),
        vitality: safeParseFloat(charVitalityInput?.value, 0),
        soulPower: safeParseFloat(charSoulPowerInput?.value, 0),
        soulHp: safeParseFloat(charSoulHpInput?.value, 0)
        // Ensure these keys EXACTLY match variable names used in custom formulas
    };

    let baseMax = 0;

    if (energyType.isStandard) {
        // --- Standard Type Calculation ---
        // console.log(`Calculating standard base max for: ${typeId}`); // Reduce logging noise
        switch (typeId) {
            // Formulas based on original logic inferred
            case 'nen': baseMax = stats.vitality * stats.soulHp; break;
            case 'chakra': baseMax = stats.vitality * (0.5 * stats.soulHp + 0.5 * stats.soulPower); break;
            case 'reiatsu': baseMax = stats.soulHp * stats.vitality * stats.soulPower; break; // Triple product? Check formula
            case 'cursed': baseMax = stats.soulPower * stats.soulHp; break;
            case 'ki': baseMax = stats.vitality * (stats.soulPower + stats.soulHp); break;
            case 'haki': baseMax = stats.vitality * (stats.soulPower + stats.soulHp); break; // Same as Ki? Verify
            case 'alchemy': baseMax = stats.soulPower * stats.baseHp; break;
            case 'nature': baseMax = stats.vitality * (stats.soulHp + stats.baseHp + stats.soulPower); break;
            case 'magic': baseMax = stats.soulPower * (stats.soulHp + stats.baseHp + stats.vitality); break;
            case 'force': baseMax = stats.soulHp + stats.vitality; break; // Simple sum? Verify
            case 'origin': baseMax = stats.vitality * stats.soulPower * stats.soulHp; break; // Same as Reiatsu? Verify
            case 'fundamental': baseMax = stats.vitality * (stats.soulPower + stats.soulHp); break; // Same as Ki/Haki? Verify
            case 'other': baseMax = stats.vitality + stats.soulPower + stats.soulHp; break; // Simple sum? Verify
            default:
                console.warn(`Unknown standard energy type ID in switch: ${typeId}`);
                baseMax = 0;
        }
    } else if (energyType.formula) {
        // --- Custom Type Calculation ---
        const formulaString = energyType.formula;
        // console.log(`Calculating custom base max for: ${energyType.name} using formula: ${formulaString}`); // Reduce noise
        try {
            // Ensure MathJS is loaded (via CDN in HTML)
            if (typeof math === 'undefined' || !math?.evaluate) {
                throw new Error("MathJS library (math.evaluate) not available.");
            }
            const compiledFormula = math.compile(formulaString);
            // Evaluate the formula with the current stats as the scope
            baseMax = compiledFormula.evaluate(stats);

            // Validate result
            if (typeof baseMax !== 'number' || !isFinite(baseMax)) {
                console.error(`Custom formula for "${energyType.name}" [${formulaString}] evaluated to non-finite value:`, baseMax);
                showMessage(`Error in formula for ${energyType.name}: Invalid result (${baseMax}). Check console.`, 'error');
                baseMax = 0;
            }
        } catch (error) {
            console.error(`Error evaluating custom formula "${formulaString}" for "${energyType.name}":`, error);
            // Provide user feedback with the specific error
            showMessage(`Formula Error (${energyType.name}): ${error.message || 'Unknown error'}`, 'error');
            baseMax = 0; // Default to 0 on error
        }
    } else {
        // Custom type exists but has no formula
        console.warn(`Custom energy type "${energyType.name}" (ID: ${typeId}) has no formula defined.`);
        baseMax = 0;
    }

    // Ensure base max is not negative
    return Math.max(0, baseMax);
}

/**
 * Calculates total energy for a pool, updates its display elements,
 * and sets the current energy to the new total.
 * @param {string} typeId - The energy type ID (standard or custom).
 * @returns {number} The calculated total energy for the pool.
 */
export function calculateAndResetEnergy(typeId) {
    const els = getEnergyElements(typeId);
    // Ensure all necessary elements exist before proceeding
    if (!els?.baseMaxEnergyEl || !els?.maxMultiplierEl || !els?.totalEnergyEl || !els?.currentEnergyEl) {
        // console.warn(`Elements missing for energy calc/reset: ${typeId}`); // Reduce noise
        return 0; // Return 0 if elements are missing
    }

    // 1. Calculate and display Base Max Energy
    const baseMaxEnergy = calculateBaseMaxEnergy(typeId);
    els.baseMaxEnergyEl.textContent = formatStatNumber(baseMaxEnergy);

    // 2. Get multipliers
    const characterBaseMultiplier = safeParseFloat(charBaseMultiplierInput?.value, 1); // Use character's base multiplier
    const poolMaxMultiplier = safeParseFloat(els.maxMultiplierEl.value, 1); // Use pool's specific multiplier

    // 3. Calculate and display Total Energy
    const totalEnergy = baseMaxEnergy * characterBaseMultiplier * poolMaxMultiplier;
    const newTotal = Math.max(0, totalEnergy); // Ensure total isn't negative
    els.totalEnergyEl.textContent = formatStatNumber(newTotal);

    // 4. Set Current Energy to New Total Energy
    // const currentEnergy = parseFormattedNumber(els.currentEnergyEl.textContent); // Don't need old value anymore
    // *** THIS IS THE CHANGED LINE ***
    els.currentEnergyEl.textContent = formatStatNumber(newTotal); // Set current = new total
    // *** -------------------------- ***


    // 5. Update associated UI elements
    updateSliderVisibility(typeId); // Show/hide slider based on new total
    // Check if slider exists before updating display (it might be hidden)
    if (els.energySlider) {
        updateSingleSliderDisplay(typeId); // Update slider text (E: xxx, D: xxx)
    }


    return newTotal; // Return the calculated total energy
}

/**
 * Regenerates energy for a specific pool based on its regen rate.
 * (No changes needed here based on the user request)
 * @param {string} typeId - The energy type ID (standard or custom).
 */
export function regenerateEnergy(typeId) {
    const els = getEnergyElements(typeId);
    if (!els?.totalEnergyEl || !els?.currentEnergyEl || !els?.regenPercentEl) {
        console.error(`Elements missing for energy regeneration: ${typeId}`);
        return;
    }

    const totalEnergy = parseFormattedNumber(els.totalEnergyEl.textContent);
    let currentEnergy = parseFormattedNumber(els.currentEnergyEl.textContent);
    const regenPercent = safeParseFloat(els.regenPercentEl.value, 0);

    if (totalEnergy <= 0) {
        showMessage(`Cannot regenerate ${typeId}: Total Energy is zero or negative.`, 'info');
        return;
    }
    if (regenPercent <= 0) {
        showMessage(`Cannot regenerate ${typeId}: Regen Rate must be positive.`, 'error');
        els.regenPercentEl.focus();
        return;
    }
    // Prevent regenerating if already full
    if (currentEnergy >= totalEnergy) {
        showMessage(`${typeId} is already full.`, 'info');
        return;
    }

    const regenAmount = totalEnergy * (regenPercent / 100);
    let newEnergy = Math.min(currentEnergy + regenAmount, totalEnergy); // Cap at total energy

    els.currentEnergyEl.textContent = formatStatNumber(newEnergy);
    showMessage(`${formatStatNumber(regenAmount)} ${typeId} regenerated. Current: ${formatStatNumber(newEnergy)}`, 'success');
    triggerAnimation(els.currentEnergyEl, 'flash-green'); // Animate the updated display

    // Update the slider text display after regeneration
    if (els.energySlider) {
        updateSingleSliderDisplay(typeId);
    }
    // Update the stats panel if it shows the current energy for this type
    if (energyTypeSelect?.value === typeId) {
        updateStatsDisplay();
    }
}
