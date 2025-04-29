// state.js - Manages the application's state variables and save/load logic.

// --- Import Dependencies ---
import {
    // DOM Elements needed for gatherState and applyState
    baseDamageInput, baseMultiplierInput, attackCompressionPointsInput,
    energyTypeSelect, characterNameInput, charBaseHealthInput,
    charBaseMultiplierInput, charVitalityInput, charSoulPowerInput,
    charSoulHpInput, charBaseAcInput, charBaseTrInput, charSpeedInput,
    ryokoCheckbox, ryokoEquationInput, kaiokenCheckbox, maxHealthInput,
    kaiokenStrainInput, currentHealthEl, dynamicModifiersContainer,
    formMultiplierInput, // Added missing import
    // Import ALL_ENERGY_TYPES and details for looping/defaults
    ALL_ENERGY_TYPES, ENERGY_TYPE_DETAILS
} from './config.js'; // Assuming config is in the same directory
import { parseFormattedNumber, formatStatNumber, formatSimpleNumber } from './formatters.js';
import { safeParseFloat } from './utils.js';
// Import functions needed by applyState (dynamically loaded/called)
// Defer direct import if circular dependency occurs, call via a function map if needed
import { addDynamicModifier, renderFormList, renderActiveFormsSection, populateEnergyTypeDropdown, generateEnergySections } from './dom-generators.js'; // Added dropdown/section generators
import { applyActiveFormEffects } from './forms.js';
import { handleRyokoCheckboxChange } from './character-stats.js';
import { getEnergyElements, calculateAndResetEnergy } from './energy-pools.js'; // Added calculateAndResetEnergy
import { updateSingleSliderDisplay } from './calculation.js';
import { updateSpeedSliderDisplay } from './speed-slider.js';
import {
    updateSliderVisibility, updateSpeedSliderVisibility,
    applyKaiokenStyle, removeKaiokenStyle,
    showCharacterStatsView, showCalculatorView, // Added view switchers
    updateStatsDisplay, updateCurrentHealthDisplay, // Added health display
    updateAttackButtonStates, updateSliderLimitAndStyle // Added attack/slider updaters
} from './ui-updater.js';
import { updateEquationDisplay } from './equation.js';
import { loadCustomEnergyTypes } from './database.js';


// --- State Variables ---
export let currentUser = null;
export let isAdmin = false;
export let totalDamageDealt = 0;
export let totalEnergySpent = 0;
export let attackCount = 0;
export let highestDamage = 0;
export let dynamicModifierCount = 0; // Counter for generating unique modifier IDs
export let characterForms = []; // Array of form objects {id, name, formMultiplier, poolMaxMultiplier, energyType, affectsResistances, acBonus, trueResistanceBonus, enableFormBuff, formBuffValue, formBuffType, enablePoolBuff, poolBuffValue, poolBuffType}
export let calculatorState = {
    activeFormIds: [],          // Array of IDs for currently active forms
    appliedAcBonus: 0,          // Combined AC from active forms affecting resistances
    appliedTrueResistanceBonus: 0,// Combined TR from active forms affecting resistances
    activeView: 'calculator',   // Tracks current view ('calculator' or 'characterStats')
    // Add other calculator-specific state flags if needed
};
// Holds the active attack state ('super', 'ultimate', or null) for each energy type ID
export let activeAttacks = {}; // Example: { ki: 'super', nen: null, ... }
// Holds the merged list of standard and custom energy types after initialization
export let mergedEnergyTypes = []; // Format: [{ id, name, colorName, hexColor, formula, isStandard, details }, ...]


// --- State Setter Functions ---
export function setCurrentUser(user) {
    console.log("Setting currentUser state:", user ? user.uid : null);
    currentUser = user;
}

export function setIsAdmin(status) {
    console.log("Setting isAdmin state:", status);
    isAdmin = !!status; // Ensure boolean
}

export function incrementAndGetModifierCount() {
    dynamicModifierCount++;
    console.log("DEBUG: Incremented dynamicModifierCount to:", dynamicModifierCount);
    return dynamicModifierCount;
}

// --- Setters for Attack Stats ---
export function resetAttackStats() {
    console.log("Resetting attack stats: Damage, Energy, Count, Highest.");
    totalDamageDealt = 0;
    totalEnergySpent = 0;
    attackCount = 0;
    highestDamage = 0;
    // Note: Doesn't reset dynamicModifierCount as those are independent UI elements
}

export function addAttackResult(damage, energyUsed) {
    // Ensure inputs are numbers
    const validDamage = typeof damage === 'number' && isFinite(damage) ? damage : 0;
    const validEnergyUsed = typeof energyUsed === 'number' && isFinite(energyUsed) ? energyUsed : 0;

    attackCount++;
    totalDamageDealt += validDamage;
    totalEnergySpent += validEnergyUsed;
    if (validDamage > highestDamage) {
        highestDamage = validDamage;
    }
    console.log(`State updated after attack #${attackCount}: Damage=${validDamage}, EnergyUsed=${validEnergyUsed}`);
}

// --- Setters for Forms ---
export function setCharacterForms(formsArray) {
    if (!Array.isArray(formsArray)) {
        console.error("setCharacterForms: Input must be an array.");
        formsArray = []; // Default to empty array on error
    }
    characterForms = formsArray;
    console.log("State updated: characterForms set.");
}

export function addCharacterForm(form) {
    if (!form || typeof form !== 'object' || !form.id) {
         console.error("addCharacterForm: Invalid form object provided:", form);
        return false; // Indicate failure
    }
    // Optional: Check for duplicate ID or name before adding
    if (characterForms.some(f => f.id === form.id)) {
        console.warn("addCharacterForm: Form with this ID already exists:", form.id);
        return false; // Indicate failure
    }
    characterForms.push(form);
     console.log("State updated: characterForm added:", form.id);
     return true; // Indicate success
}

export function removeCharacterForm(formId) {
     const index = characterForms.findIndex(f => f.id === formId);
     if (index > -1) {
         const removedForm = characterForms.splice(index, 1);
         console.log("State updated: characterForm removed:", formId);
         return removedForm[0]; // Return the removed form if needed
     }
     console.warn("removeCharacterForm: Form ID not found:", formId);
     return null;
}

export function setActiveFormIds(formIdArray) {
     if (!Array.isArray(formIdArray)) {
          console.error("setActiveFormIds: Input must be an array.");
         // Default to empty array or keep current state? Let's default.
         calculatorState.activeFormIds = [];
         return;
     }
     // Optional: Filter out IDs that don't correspond to existing forms
     const existingFormIds = characterForms.map(f => f.id);
     calculatorState.activeFormIds = formIdArray.filter(id => existingFormIds.includes(id));
     console.log("State updated: activeFormIds set:", calculatorState.activeFormIds);
}

export function setCalculatorStateValue(key, value) {
    if (key in calculatorState) {
        calculatorState[key] = value;
        console.log(`State updated: calculatorState.${key} set to:`, value);
    } else {
        console.warn(`setCalculatorStateValue: Invalid key "${key}" for calculatorState.`);
    }
}

// --- Setter for Active Attacks ---
export function setActiveAttack(energyType, attackType) {
    // Allow null to clear the attack state
    if (attackType !== null && typeof attackType !== 'string') {
        console.error("setActiveAttack: Invalid attackType provided:", attackType);
        return;
    }
     if (typeof energyType !== 'string' || !energyType) {
         console.error("setActiveAttack: Invalid energyType provided:", energyType);
         return;
     }
    activeAttacks[energyType] = attackType;
    console.log(`State updated: activeAttack for ${energyType} set to:`, attackType);
}

// --- Core State Functions ---

/**
 * Resets all core state variables to their initial default values.
 * IMPORTANT: Should ideally use the setters defined above for consistency.
 */
export function initializeCoreState() {
    console.log("Initializing core state variables...");

    // --- Use Setters (Recommended way) ---
    setCurrentUser(null);
    setIsAdmin(false);
    resetAttackStats(); // Resets damage, energy, count, highest
    setCharacterForms([]); // Use setter
    setActiveFormIds([]); // Use setter
    setCalculatorStateValue('appliedAcBonus', 0);
    setCalculatorStateValue('appliedTrueResistanceBonus', 0);
    setCalculatorStateValue('activeView', 'calculator');
    // Reset other calculatorState properties if added

    // Clear active attacks for all known types (or just reset the object)
    activeAttacks = {}; // Simple reset

    dynamicModifierCount = 0; // Reset counter

    // Reset merged types - this will be repopulated by initializeAndMergeEnergyTypes
    mergedEnergyTypes = [];
    console.log("Core state initialized.");

    // --- Direct Mutation (Old way - less maintainable) ---
    /*
    currentUser = null;
    isAdmin = false;
    totalDamageDealt = 0;
    totalEnergySpent = 0;
    attackCount = 0;
    highestDamage = 0;
    dynamicModifierCount = 0;
    characterForms = [];
    calculatorState = {
        activeFormIds: [],
        appliedAcBonus: 0,
        appliedTrueResistanceBonus: 0,
        activeView: 'calculator'
    };
    activeAttacks = {};
    mergedEnergyTypes = [];
    */
}

/**
 * Gathers the current state from UI elements and state variables into an object.
 * @returns {object | null} The application state object, or null if required elements are missing.
 */
export function gatherState() {
    console.log("Gathering state...");
    if (!characterNameInput || !baseDamageInput /* ... add checks for all essential inputs */) {
        console.error("Cannot gather state: Essential DOM elements are missing.");
        return null;
    }

    const state = {
        version: 1.0, // Add a version number for future compatibility checks
        characterName: characterNameInput.value,
        baseDamage: baseDamageInput.value,
        attackCompressionPoints: attackCompressionPointsInput?.value || '0',
        baseMultiplier: baseMultiplierInput?.value || '1', // Use charBaseMultiplierInput if Ryoko is off? Check logic.
        charBaseHealth: charBaseHealthInput?.value || '0',
        charVitality: charVitalityInput?.value || '0',
        charSoulPower: charSoulPowerInput?.value || '0',
        charSoulHp: charSoulHpInput?.value || '0',
        charBaseAc: charBaseAcInput?.value || '10',
        charBaseTr: charBaseTrInput?.value || '5',
        charSpeed: charSpeedInput?.value || '0',
        ryokoMode: {
            enabled: ryokoCheckbox?.checked || false,
            equation: ryokoEquationInput?.value || ''
        },
        kaioken: {
            enabled: kaiokenCheckbox?.checked || false,
            maxHealth: maxHealthInput?.value || '1000',
            strainPercent: kaiokenStrainInput?.value || '10',
            currentHealth: currentHealthEl?.textContent || '1000' // Save displayed current health
        },
        dynamicModifiers: [], // Array to hold modifier data
        energyPools: {}, // Object to hold state for each energy pool
        stats: { // Save cumulative stats
            totalDamageDealt: totalDamageDealt,
            totalEnergySpent: totalEnergySpent,
            attackCount: attackCount,
            highestDamage: highestDamage
        },
        forms: characterForms, // Save the created forms array directly
        calculatorState: calculatorState, // Save the calculator state object
        activeAttacks: activeAttacks, // Save the active attack states
        // dynamicModifierCount is implicitly saved by the length/IDs of dynamicModifiers
    };

    // Gather dynamic modifier data
    dynamicModifiersContainer?.querySelectorAll('.dynamic-box').forEach(box => {
        const nameInput = box.querySelector('.modifier-name-input');
        const valueInput = box.querySelector('.modifier-value-input');
        const typeOption = box.querySelector('.modifier-type-option.active');
        if (nameInput && valueInput && typeOption) {
            state.dynamicModifiers.push({
                id: box.id, // Save the ID to potentially restore it later
                name: nameInput.value,
                value: valueInput.value,
                type: typeOption.dataset.value
            });
        }
    });
     // Reset dynamicModifierCount before applying state to ensure new IDs don't overlap if state is partial
    dynamicModifierCount = state.dynamicModifiers.length > 0
        ? Math.max(...state.dynamicModifiers.map(mod => parseInt(mod.id.split('-').pop()) || 0))
        : 0;


    // Gather energy pool data (Iterate through MERGED types)
    mergedEnergyTypes.forEach(type => {
         if (!type || !type.id) return; // Skip invalid types
        const typeId = type.id;
        const els = getEnergyElements(typeId);
        if (els) {
            state.energyPools[typeId] = {
                // Don't save baseMax or total, they are calculated
                currentEnergy: els.currentEnergyEl?.textContent || '0',
                maxMultiplier: els.maxMultiplierEl?.value || '1',
                damagePerPower: els.damagePerPowerEl?.value || '1',
                regenPercent: els.regenPercentEl?.value || '0',
                sliderValue: els.energySlider?.value || '0'
            };
        }
    });

     // Gather Speed Slider value if it exists
     const speedSliderEl = document.getElementById('speed-slider');
     if (speedSliderEl) {
         state.speedSliderValue = speedSliderEl.value || '0';
     }


    console.log("State gathered:", state);
    return state;
}

/**
 * Applies a previously gathered state object to the application UI and internal state.
 * IMPORTANT: Should ideally use the setters defined above for consistency.
 * @param {object} state - The state object to apply.
 */
export function applyState(state) {
    console.log("Applying saved state:", state);
    if (!state || typeof state !== 'object') {
        console.error("ApplyState failed: Invalid state object provided.");
        return;
    }
     // --- Reset current state before applying ---
     // This prevents merging issues if the loaded state is partial
     initializeCoreState(); // Reset core variables first (Uses setters internally now)


    try {
        // --- Apply Character Info & Base Stats ---
        if (characterNameInput && state.characterName) characterNameInput.value = state.characterName;
        if (baseDamageInput && state.baseDamage) baseDamageInput.value = state.baseDamage;
        if (attackCompressionPointsInput && state.attackCompressionPoints) attackCompressionPointsInput.value = state.attackCompressionPoints;
        // Base multiplier needs care due to Ryoko mode potentially overriding it
        if (baseMultiplierInput && state.baseMultiplier && !state.ryokoMode?.enabled) baseMultiplierInput.value = state.baseMultiplier;
        if (charBaseHealthInput && state.charBaseHealth) charBaseHealthInput.value = state.charBaseHealth;
        if (charVitalityInput && state.charVitality) charVitalityInput.value = state.charVitality;
        if (charSoulPowerInput && state.charSoulPower) charSoulPowerInput.value = state.charSoulPower;
        if (charSoulHpInput && state.charSoulHp) charSoulHpInput.value = state.charSoulHp;
        if (charBaseAcInput && state.charBaseAc) charBaseAcInput.value = state.charBaseAc;
        if (charBaseTrInput && state.charBaseTr) charBaseTrInput.value = state.charBaseTr;
        if (charSpeedInput && state.charSpeed) charSpeedInput.value = state.charSpeed;

        // --- Apply Ryoko Mode ---
        if (ryokoCheckbox && state.ryokoMode) {
            ryokoCheckbox.checked = state.ryokoMode.enabled;
            if (ryokoEquationInput) ryokoEquationInput.value = state.ryokoMode.equation || '';
            // IMPORTANT: Trigger the handler to update UI (readonly state, evaluation) AFTER setting checkbox and equation value
             handleRyokoCheckboxChange(); // This will call evaluateRyokoEquation if checked
        }

        // --- Apply Kaioken ---
        if (kaiokenCheckbox && state.kaioken) {
            kaiokenCheckbox.checked = state.kaioken.enabled;
            if (maxHealthInput) maxHealthInput.value = state.kaioken.maxHealth || '1000';
            if (kaiokenStrainInput) kaiokenStrainInput.value = state.kaioken.strainPercent || '10';
            // Apply current health AFTER max health is set
            if (currentHealthEl && state.kaioken.currentHealth) {
                 // Validate current health against the max health just set
                 const maxHp = safeParseFloat(maxHealthInput.value, 0);
                 const currentHp = parseFormattedNumber(state.kaioken.currentHealth); // Use parser
                 currentHealthEl.textContent = formatStatNumber(Math.min(currentHp, maxHp)); // Use formatter
            }
            // Trigger Kaioken UI style update
            if (state.kaioken.enabled) { applyKaiokenStyle(); } else { removeKaiokenStyle(); }
            if (kaiokenDetails) kaiokenDetails.classList.toggle('hidden', !state.kaioken.enabled);
        }

        // --- Apply Cumulative Stats (Use Setters) ---
        if (state.stats) {
            // Temporarily set directly, or create setters if needed for these raw values
            totalDamageDealt = safeParseFloat(state.stats.totalDamageDealt, 0);
            totalEnergySpent = safeParseFloat(state.stats.totalEnergySpent, 0);
            attackCount = parseInt(state.stats.attackCount, 10) || 0;
            highestDamage = safeParseFloat(state.stats.highestDamage, 0);
             console.log("Applied cumulative stats state.");
        }

        // --- Apply Forms (Use Setters) ---
        if (state.forms && Array.isArray(state.forms)) {
             setCharacterForms(state.forms); // Use setter
             // Re-render UI lists
             renderFormList();
             renderActiveFormsSection(); // Ensure this runs AFTER characterForms is set
        }

        // --- Apply Calculator State (Use Setters) ---
        if (state.calculatorState) {
            setActiveFormIds(state.calculatorState.activeFormIds || []); // Use setter
            setCalculatorStateValue('appliedAcBonus', state.calculatorState.appliedAcBonus || 0);
            setCalculatorStateValue('appliedTrueResistanceBonus', state.calculatorState.appliedTrueResistanceBonus || 0);
            setCalculatorStateValue('activeView', state.calculatorState.activeView || 'calculator');
            // Apply other calculatorState properties if they exist
             console.log("Applied calculator state.");
              // Update active form checkboxes based on the now-set activeFormIds
            renderActiveFormsSection(); // Re-render to check the correct boxes

            // Apply the effects of the loaded active forms (crucial!)
            applyActiveFormEffects(); // This recalculates energy pools based on form multipliers
        }


        // --- Apply Active Attacks (Use Setters) ---
        if (state.activeAttacks && typeof state.activeAttacks === 'object') {
            // Clear existing attacks first
            activeAttacks = {};
             // Iterate and use setter
             for (const typeId in state.activeAttacks) {
                // Check if the typeId still exists in the merged list? Optional.
                if (mergedEnergyTypes.some(et => et && et.id === typeId)) {
                     setActiveAttack(typeId, state.activeAttacks[typeId]);
                 } else {
                     console.warn(`ApplyState: Ignoring active attack for non-existent/unmerged energy type "${typeId}"`);
                 }
             }
             console.log("Applied active attacks state.");
              // Update attack button UI for the currently focused energy type
              const selectedType = energyTypeSelect?.value;
              if(selectedType) {
                 updateAttackButtonStates(selectedType);
             }
        }


        // --- Restore Dynamic Modifiers ---
        if (dynamicModifiersContainer) dynamicModifiersContainer.innerHTML = '<h4 class="text-md font-semibold mb-2 text-gray-700">Additional Factors:</h4>'; // Clear existing before adding
        if (state.dynamicModifiers && Array.isArray(state.dynamicModifiers)) {
             // Reset the counter based on loaded modifiers BEFORE adding them
             dynamicModifierCount = state.dynamicModifiers.length > 0
                 ? Math.max(...state.dynamicModifiers.map(mod => parseInt(mod.id?.split('-').pop() || '0', 10) || 0))
                 : 0;
             console.log("Reset dynamicModifierCount based on loaded state to:", dynamicModifierCount);

             state.dynamicModifiers.forEach(modData => {
                addDynamicModifier(modData); // This function creates and adds listeners
            });
            console.log("Restored dynamic modifiers.");
        }


         // --- Apply Energy Pool States ---
         // This MUST run AFTER mergeEnergyTypes has populated mergedEnergyTypes AND after applyActiveFormEffects
         // has potentially updated the maxMultiplier inputs based on active forms.
         console.log("Applying energy pool states...");
         if (state.energyPools && typeof state.energyPools === 'object') {
             mergedEnergyTypes.forEach(type => {
                  if (!type || !type.id) return; // Skip invalid types
                 const typeId = type.id;
                 const poolState = state.energyPools[typeId];
                 const els = getEnergyElements(typeId);

                 if (poolState && els) {
                     // Apply values that were saved
                     if (els.maxMultiplierEl && poolState.maxMultiplier) els.maxMultiplierEl.value = poolState.maxMultiplier;
                     if (els.damagePerPowerEl && poolState.damagePerPower) els.damagePerPowerEl.value = poolState.damagePerPower;
                     if (els.regenPercentEl && poolState.regenPercent) els.regenPercentEl.value = poolState.regenPercent;

                     // Recalculate total based on potentially changed inputs (like character stats or form mults)
                     const totalEnergy = calculateAndResetEnergy(typeId); // Recalculates base, total, adjusts current

                     // Now, specifically apply the SAVED currentEnergy, capped by the NEW total
                     if (els.currentEnergyEl && poolState.currentEnergy) {
                         const savedCurrent = parseFormattedNumber(poolState.currentEnergy);
                         els.currentEnergyEl.textContent = formatStatNumber(Math.min(savedCurrent, totalEnergy));
                     }

                     // Apply slider value and update its display
                     if (els.energySlider && poolState.sliderValue) {
                         els.energySlider.value = poolState.sliderValue;
                     }
                     // Update the display text (e.g., "E: xxx, D: xxx") for the slider
                      updateSingleSliderDisplay(typeId);
                      updateSliderLimitAndStyle(typeId); // Apply attack limits/styles
                      updateSliderVisibility(typeId); // Ensure visibility is correct

                 } else if(poolState && !els) {
                      console.warn(`ApplyState: Found saved state for energy type "${typeId}", but its DOM elements are missing.`);
                 }
             });
             console.log("Applied energy pool states.");
         }


        // --- Apply Speed Slider Value ---
        if (state.speedSliderValue) {
            const speedSliderEl = document.getElementById('speed-slider');
            if (speedSliderEl) {
                speedSliderEl.value = state.speedSliderValue;
                updateSpeedSliderDisplay(); // Update its display text
                updateSpeedSliderVisibility(); // Ensure it's visible if speed > 0
            }
        }


        // --- Final UI Updates ---
        updateStatsDisplay(); // Refresh stats panel with loaded values
        updateEquationDisplay(); // Refresh equation display
        const currentFocus = energyTypeSelect?.value;
        if(currentFocus) displayEnergyPool(currentFocus); // Show the pool for the selected focus


        // --- Restore Active View ---
        if (calculatorState.activeView === 'characterStats') {
            showCharacterStatsView();
        } else {
            showCalculatorView(); // Default
        }

        console.log("State applied successfully.");

    } catch (error) {
        console.error("Error applying state:", error);
        // Optionally, reset to defaults if applying state fails critically
        // initializeCoreState();
        // initializeDefaultUI(); // Assuming you have a function to reset UI inputs
    }
}


/**
 * Loads custom energy types from DB, merges with standard types, stores in state.
 */
export async function initializeAndMergeEnergyTypes() {
    console.log("DEBUG: Starting initializeAndMergeEnergyTypes...");
    let standardTypes = [];
    let customTypes = [];

    // 1. Format standard types from config
    try {
        console.log("DEBUG: Processing standard types...");
        if (!ALL_ENERGY_TYPES || !Array.isArray(ALL_ENERGY_TYPES)) { throw new Error("ALL_ENERGY_TYPES missing/invalid."); }
        if (!ENERGY_TYPE_DETAILS || typeof ENERGY_TYPE_DETAILS !== 'object') { throw new Error("ENERGY_TYPE_DETAILS missing/invalid."); }
        console.log(`DEBUG: Found ${ALL_ENERGY_TYPES.length} standard type IDs.`);

        standardTypes = ALL_ENERGY_TYPES.map(typeId => {
            if (!typeId || typeof typeId !== 'string') {
                console.error("DEBUG: Skipping invalid standard typeId:", typeId);
                return undefined;
            }
            const details = ENERGY_TYPE_DETAILS[typeId] || {};
            const name = details.name || typeId.charAt(0).toUpperCase() + typeId.slice(1);
            return {
                id: typeId, // Use the type key as the ID
                name: name,
                colorName: details.color || null, // Tailwind class name
                hexColor: null, // Standard types use Tailwind classes
                formula: null, // Standard types use hardcoded switch/logic
                isStandard: true,
                details: details // Keep original details for styling lookups
            };
        }).filter(Boolean); // Remove undefined entries if any invalid IDs were skipped
        console.log(`DEBUG: Successfully processed ${standardTypes.length} standard types.`);
    } catch (error) {
        console.error("DEBUG: CRITICAL Error processing standard energy types:", error);
        standardTypes = []; // Ensure it's an empty array on error
    }

    // 2. Load custom types from database
    try {
        console.log("DEBUG: Loading custom types from database...");
        const loadedCustom = await loadCustomEnergyTypes(); // Assumes this returns array [{id, name, color, formula}, ...]
        console.log("DEBUG: Raw loaded custom types from DB:", JSON.stringify(loadedCustom)); // Log what DB returned

        if (Array.isArray(loadedCustom)) {
            customTypes = loadedCustom.map(ct => {
                // Validate required fields for custom types
                if (!ct || typeof ct !== 'object' || !ct.id || !ct.name || !ct.color || !ct.formula) {
                    console.error("DEBUG: Skipping invalid custom type object from DB:", ct);
                    return undefined;
                }
                return {
                    id: ct.id, // Firebase key is the ID
                    name: ct.name,
                    colorName: null, // Custom types use hex color directly
                    hexColor: ct.color, // Store the hex color value
                    formula: ct.formula,
                    isStandard: false,
                    details: null // No pre-defined Tailwind details
                };
            }).filter(Boolean); // Remove undefined entries
            console.log(`DEBUG: Successfully processed ${customTypes.length} custom types from DB load.`);
        } else {
            console.warn("DEBUG: loadCustomEnergyTypes did not return an array. Assuming no custom types.");
            customTypes = [];
        }
    } catch (error) {
        console.error("DEBUG: CRITICAL Error loading or processing custom energy types:", error);
        customTypes = []; // Ensure it's an empty array on error
    }

    // 3. Merge and store in state
    try {
        // Ensure arrays are valid before spreading
        const finalStandard = Array.isArray(standardTypes) ? standardTypes : [];
        const finalCustom = Array.isArray(customTypes) ? customTypes : [];

        mergedEnergyTypes = [...finalStandard, ...finalCustom]; // Update the exported state variable

        console.log(`DEBUG: Final mergedEnergyTypes array (Count: ${mergedEnergyTypes.length}):`, JSON.stringify(mergedEnergyTypes));

        // Sanity check the merged result
        if (mergedEnergyTypes.length === 0 && (finalStandard.length > 0 || finalCustom.length > 0)) {
            console.error("DEBUG: !!! Merge resulted in empty array despite having standard or custom types !!! Potential issue in finalStandard/finalCustom arrays before merge.");
        }
        if (mergedEnergyTypes.some(et => typeof et === 'undefined' || !et || !et.id)) {
            console.error("DEBUG: !!! Final mergedEnergyTypes array contains invalid elements (undefined/missing id) !!!", mergedEnergyTypes.filter(et => typeof et === 'undefined' || !et || !et.id));
            // Attempt to filter out bad entries as a recovery mechanism
            mergedEnergyTypes = mergedEnergyTypes.filter(et => typeof et !== 'undefined' && et && et.id);
            console.error("DEBUG: Attempted to filter invalid entries. New count:", mergedEnergyTypes.length);
        }
         console.log("DEBUG: state.js finished merging types.");

    } catch (error) {
        console.error("DEBUG: CRITICAL Error during array merge:", error);
        mergedEnergyTypes = []; // Reset to empty on merge error
    }

    // Return status or the merged list if needed elsewhere immediately
    return true; // Indicate completion
}
