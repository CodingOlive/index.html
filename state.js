// state.js - Manages the application's state variables and save/load logic.

// --- Import Dependencies ---

// CORRECTED: Import DOM Elements needed for gatherState and applyState from dom-elements.js
import {
    baseDamageInput, baseMultiplierInput, attackCompressionPointsInput,
    energyTypeSelect, characterNameInput, charBaseHealthInput,
    charBaseMultiplierInput, charVitalityInput, charSoulPowerInput,
    charSoulHpInput, charBaseAcInput, charBaseTrInput, charSpeedInput,
    ryokoCheckbox, ryokoEquationInput, kaiokenCheckbox, maxHealthInput,
    kaiokenStrainInput, currentHealthEl, dynamicModifiersContainer,
    formMultiplierInput
} from './dom-elements.js'; // <<< CORRECT SOURCE for DOM elements

// CORRECTED: Import Config constants from config.js
import {
    ALL_ENERGY_TYPES, ENERGY_TYPE_DETAILS // Add other needed config constants like FIREBASE_SAVE_PATH_BASE if needed directly here
} from './config.js'; // <<< CORRECT SOURCE for Config constants

// --- Other Imports ---
import { parseFormattedNumber, formatStatNumber, formatSimpleNumber } from './formatters.js';
import { safeParseFloat } from './utils.js';
// Import functions needed by applyState (dynamically loaded/called)
// Defer direct import if circular dependency occurs, call via a function map if needed
import { addDynamicModifier, renderFormList, renderActiveFormsSection, populateEnergyTypeDropdown, generateEnergySections } from './dom-generators.js';
import { applyActiveFormEffects } from './forms.js';
import { handleRyokoCheckboxChange } from './character-stats.js';
import { getEnergyElements, calculateAndResetEnergy } from './energy-pools.js';
import { updateSingleSliderDisplay } from './calculation.js';
import { updateSpeedSliderDisplay } from './speed-slider.js';
import {
    updateSliderVisibility, updateSpeedSliderVisibility,
    applyKaiokenStyle, removeKaiokenStyle,
    showCharacterStatsView, showCalculatorView,
    updateStatsDisplay, updateCurrentHealthDisplay,
    updateAttackButtonStates, updateSliderLimitAndStyle
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
 * Uses the setters defined above for consistency.
 */
export function initializeCoreState() {
    console.log("Initializing core state variables...");

    // --- Use Setters ---
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
}

/**
 * Gathers the current state from UI elements and state variables into an object.
 * @returns {object | null} The application state object, or null if required elements are missing.
 */
export function gatherState() {
    console.log("Gathering state...");
    // Add checks for other essential inputs if necessary
    if (!characterNameInput || !baseDamageInput || !charBaseHealthInput /* ... */) {
        console.error("Cannot gather state: Essential DOM elements are missing.");
        // Consider showing a user message here as well
        // showMessage("Error gathering state: Some input fields are missing.", "error");
        return null;
    }

    const state = {
        version: 1.0, // Add a version number for future compatibility checks
        characterName: characterNameInput.value,
        baseDamage: baseDamageInput.value,
        attackCompressionPoints: attackCompressionPointsInput?.value || '0',
        // Determine correct baseMultiplier source based on Ryoko mode
        baseMultiplier: (ryokoCheckbox?.checked ? charBaseMultiplierInput?.value : baseMultiplierInput?.value) || '1',
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
        // dynamicModifierCount is implicitly saved via the IDs of dynamicModifiers
    };

    // Gather dynamic modifier data
    dynamicModifiersContainer?.querySelectorAll('.dynamic-box').forEach(box => {
        const nameInput = box.querySelector('.modifier-name-input');
        const valueInput = box.querySelector('.modifier-value-input');
        const typeOption = box.querySelector('.modifier-type-option.active');
        if (nameInput && valueInput && typeOption) {
            state.dynamicModifiers.push({
                id: box.id, // Save the ID to restore it later
                name: nameInput.value,
                value: valueInput.value,
                type: typeOption.dataset.value
            });
        }
    });


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
        if (characterNameInput && state.characterName !== undefined) characterNameInput.value = state.characterName;
        if (baseDamageInput && state.baseDamage !== undefined) baseDamageInput.value = state.baseDamage;
        if (attackCompressionPointsInput && state.attackCompressionPoints !== undefined) attackCompressionPointsInput.value = state.attackCompressionPoints;
        // Base multiplier is handled below within Ryoko section
        if (charBaseHealthInput && state.charBaseHealth !== undefined) charBaseHealthInput.value = state.charBaseHealth;
        if (charVitalityInput && state.charVitality !== undefined) charVitalityInput.value = state.charVitality;
        if (charSoulPowerInput && state.charSoulPower !== undefined) charSoulPowerInput.value = state.charSoulPower;
        if (charSoulHpInput && state.charSoulHp !== undefined) charSoulHpInput.value = state.charSoulHp;
        if (charBaseAcInput && state.charBaseAc !== undefined) charBaseAcInput.value = state.charBaseAc;
        if (charBaseTrInput && state.charBaseTr !== undefined) charBaseTrInput.value = state.charBaseTr;
        if (charSpeedInput && state.charSpeed !== undefined) charSpeedInput.value = state.charSpeed;

        // --- Apply Ryoko Mode & Base Multiplier ---
        // Apply Ryoko state first as it determines if baseMultiplierInput is read-only
        if (ryokoCheckbox && state.ryokoMode) {
            ryokoCheckbox.checked = state.ryokoMode.enabled;
            if (ryokoEquationInput) ryokoEquationInput.value = state.ryokoMode.equation || '';
            handleRyokoCheckboxChange(); // Update UI (readonly state, etc.) based on checkbox
            // If Ryoko mode is ON, the baseMultiplier field is updated by evaluateRyokoEquation (called by handler)
        }
         // Apply baseMultiplier from state ONLY IF Ryoko mode is OFF
        if (baseMultiplierInput && state.baseMultiplier !== undefined && !ryokoCheckbox?.checked) {
             baseMultiplierInput.value = state.baseMultiplier;
         }


        // --- Apply Kaioken ---
        if (kaiokenCheckbox && state.kaioken) {
            kaiokenCheckbox.checked = state.kaioken.enabled;
            if (maxHealthInput && state.kaioken.maxHealth !== undefined) maxHealthInput.value = state.kaioken.maxHealth;
            if (kaiokenStrainInput && state.kaioken.strainPercent !== undefined) kaiokenStrainInput.value = state.kaioken.strainPercent;
             // Trigger the handler AFTER setting checkbox value
             const event = new Event('change'); // Create a synthetic event if needed, or just call helper funcs
             // kaiokenCheckbox.dispatchEvent(event); // Or manually update UI:
             if(kaiokenDetails) kaiokenDetails.classList.toggle('hidden', !kaiokenCheckbox.checked);
             if(kaiokenCheckbox.checked) applyKaiokenStyle(); else removeKaiokenStyle();

             // Apply current health AFTER max health is set
             if (currentHealthEl && state.kaioken.currentHealth !== undefined) {
                 const maxHp = safeParseFloat(maxHealthInput?.value, 0); // Read max health *now*
                 const currentHp = parseFormattedNumber(state.kaioken.currentHealth);
                 currentHealthEl.textContent = formatStatNumber(Math.max(0, Math.min(currentHp, maxHp))); // Cap at new max, ensure >= 0
             } else if (currentHealthEl) {
                  // If no saved current health, reset based on max health
                  updateCurrentHealthDisplay();
             }
        }

        // --- Apply Cumulative Stats (Use Setters for internal state) ---
        if (state.stats) {
            // Update internal state directly or via more specific setters if created
            totalDamageDealt = safeParseFloat(state.stats.totalDamageDealt, 0);
            totalEnergySpent = safeParseFloat(state.stats.totalEnergySpent, 0);
            attackCount = parseInt(state.stats.attackCount, 10) || 0;
            highestDamage = safeParseFloat(state.stats.highestDamage, 0);
             console.log("Applied cumulative stats state.");
             // UI update for stats panel happens later in updateStatsDisplay()
        }

        // --- Apply Forms (Use Setters) ---
        if (state.forms && Array.isArray(state.forms)) {
             setCharacterForms(state.forms); // Use setter
             // UI list update happens later
        }

        // --- Apply Calculator State (Use Setters) ---
        // Do this BEFORE applying form effects, as activeFormIds are needed
        if (state.calculatorState) {
            setActiveFormIds(state.calculatorState.activeFormIds || []); // Use setter
            // Using direct mutation for sub-properties for now, or use setCalculatorStateValue
            calculatorState.appliedAcBonus = state.calculatorState.appliedAcBonus || 0;
            calculatorState.appliedTrueResistanceBonus = state.calculatorState.appliedTrueResistanceBonus || 0;
            calculatorState.activeView = state.calculatorState.activeView || 'calculator';
            // Apply other calculatorState properties if they exist
             console.log("Applied calculator state.");
        }

        // --- Re-render form lists/checkboxes AFTER forms and active IDs are set ---
        renderFormList();
        renderActiveFormsSection(); // Checks the correct boxes based on loaded activeFormIds

        // --- Apply Active Form Effects ---
        // This is crucial as it updates formMultiplierInput, pool multipliers, and recalculates energy pools
        applyActiveFormEffects();


        // --- Apply Active Attacks (Use Setters) ---
        if (state.activeAttacks && typeof state.activeAttacks === 'object') {
            activeAttacks = {}; // Clear existing
             for (const typeId in state.activeAttacks) {
                // Optionally check if typeId exists in mergedEnergyTypes before setting
                 if (mergedEnergyTypes.some(et => et && et.id === typeId)) {
                     setActiveAttack(typeId, state.activeAttacks[typeId]); // Use setter
                 } else {
                      console.warn(`ApplyState: Ignoring active attack for non-existent energy type "${typeId}"`);
                 }
             }
             console.log("Applied active attacks state.");
             // Attack button UI update happens later
        }


        // --- Restore Dynamic Modifiers ---
        dynamicModifierCount = 0; // Reset counter before adding
        if (dynamicModifiersContainer) dynamicModifiersContainer.innerHTML = '<h4 class="text-md font-semibold mb-2 text-gray-700">Additional Factors:</h4>'; // Clear existing
        if (state.dynamicModifiers && Array.isArray(state.dynamicModifiers)) {
             state.dynamicModifiers.forEach(modData => {
                addDynamicModifier(modData); // Creates and adds listeners
            });
             // Recalculate dynamicModifierCount based on the loaded items' IDs
             dynamicModifierCount = state.dynamicModifiers.length > 0
                 ? Math.max(0, ...state.dynamicModifiers.map(mod => parseInt(mod.id?.split('-').pop() || '0', 10) || 0))
                 : 0;
             console.log("Restored dynamic modifiers. Next ID counter set to:", dynamicModifierCount + 1);
        }


         // --- Apply Energy Pool States ---
         // This MUST run AFTER applyActiveFormEffects (which might change max multipliers)
         console.log("Applying energy pool states (post form effects)...");
         if (state.energyPools && typeof state.energyPools === 'object') {
             mergedEnergyTypes.forEach(type => {
                  if (!type || !type.id) return;
                 const typeId = type.id;
                 const poolState = state.energyPools[typeId];
                 const els = getEnergyElements(typeId);

                 if (poolState && els) {
                     // Apply saved inputs (maxMultiplier already potentially updated by form effects)
                     if (els.damagePerPowerEl && poolState.damagePerPower !== undefined) els.damagePerPowerEl.value = poolState.damagePerPower;
                     if (els.regenPercentEl && poolState.regenPercent !== undefined) els.regenPercentEl.value = poolState.regenPercent;

                     // Recalculate total energy based on current stats and applied multipliers
                     const totalEnergy = calculateAndResetEnergy(typeId);

                     // Apply the SAVED currentEnergy, capped by the NEWLY calculated total
                     if (els.currentEnergyEl && poolState.currentEnergy !== undefined) {
                         const savedCurrent = parseFormattedNumber(poolState.currentEnergy);
                         const cappedCurrent = Math.max(0, Math.min(savedCurrent, totalEnergy)); // Ensure >= 0 and <= total
                         els.currentEnergyEl.textContent = formatStatNumber(cappedCurrent);
                     } else if(els.currentEnergyEl) {
                          // If no saved current energy, calculateAndResetEnergy already reset it to total
                          // We might want to ensure it's formatted correctly here if needed
                         els.currentEnergyEl.textContent = formatStatNumber(totalEnergy);
                     }

                     // Apply slider value and update displays
                     if (els.energySlider && poolState.sliderValue !== undefined) {
                         els.energySlider.value = poolState.sliderValue;
                     }
                      updateSingleSliderDisplay(typeId);
                      updateSliderLimitAndStyle(typeId); // Apply attack limits/styles
                      updateSliderVisibility(typeId); // Ensure visibility

                 } else if(poolState && !els) {
                      console.warn(`ApplyState: Found saved state for energy type "${typeId}", but its DOM elements are missing.`);
                 }
             });
             console.log("Applied energy pool states.");
         }


        // --- Apply Speed Slider Value ---
        if (state.speedSliderValue !== undefined) {
            const speedSliderEl = document.getElementById('speed-slider');
            if (speedSliderEl) {
                speedSliderEl.value = state.speedSliderValue;
                updateSpeedSliderDisplay();
                updateSpeedSliderVisibility();
            }
        }


        // --- Final UI Updates ---
        updateStatsDisplay(); // Refresh stats panel with all loaded/recalculated values
        updateEquationDisplay(); // Refresh equation display based on all inputs
        const currentFocus = energyTypeSelect?.value;
        if(currentFocus && document.getElementById(`${currentFocus}-pool`)) { // Check element exists
             displayEnergyPool(currentFocus); // Show the pool for the selected focus
             updateAttackButtonStates(currentFocus); // Update attack buttons for current focus
         } else if (mergedEnergyTypes.length > 0 && energyTypeSelect) {
             // If focus was invalid, default to first type
             const firstTypeId = mergedEnergyTypes[0].id;
             energyTypeSelect.value = firstTypeId;
              displayEnergyPool(firstTypeId);
              updateAttackButtonStates(firstTypeId);
         }


        // --- Restore Active View ---
        if (calculatorState.activeView === 'characterStats') {
            showCharacterStatsView();
        } else {
            showCalculatorView(); // Default
        }

        console.log("State applied successfully.");

    } catch (error) {
        console.error("Error applying state:", error);
        showMessage("An error occurred while applying the saved state. Some settings may be incorrect.", "error");
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
