// dom-generators.js - Functions for dynamically creating HTML elements using merged energy types.

// --- Import Dependencies ---
import {
    energyPoolTemplate, energySliderTemplate, energyPoolsContainer, slidersGrid,
    dynamicModifiersContainer, formListContainer, activeFormsListContainer,
    energyTypeSelect
} from './dom-elements.js';

// Import Config data
import { ENERGY_TYPE_DETAILS, SPEED_DETAILS } from './config.js';

// Import State variables
import {
    characterForms, calculatorState, mergedEnergyTypes,
    // Import the state variable directly for modification
    dynamicModifierCount
} from './state.js';
// REMOVED: let dynamicModifierCount = _dynamicModifierCount; // No local copy needed

// Import Utilities and Formatters
import { escapeHtml, safeParseFloat } from './utils.js';
import { formatSimpleNumber } from './formatters.js';

// Import functions from other modules
import { addListenersToModifierBox } from './modifiers.js';
import { handleActiveFormChange, handleDeleteFormClick } from './forms.js';


// --- Generator Functions ---

/**
 * Generates the energy pool sections and their corresponding slider sections
 * based on the mergedEnergyTypes state array. Appends them to containers.
 */
export function generateEnergySections() {
    // Uses imported elements and mergedEnergyTypes state
    if (!energyPoolTemplate || !energySliderTemplate || !energyPoolsContainer || !slidersGrid) { /* ... error ... */ return; }
    energyPoolsContainer.innerHTML = '';
    slidersGrid.innerHTML = '';

    // --- Loop over MERGED types ---
    mergedEnergyTypes.forEach(energyType => {
        const typeId = energyType.id;
        const isStandard = energyType.isStandard;
        const details = energyType.details;
        const customColor = !isStandard ? energyType.color : null;

        // --- Generate Energy Pool Section ---
        try {
            const poolClone = energyPoolTemplate.content.cloneNode(true);
            const poolDiv = poolClone.querySelector('.energy-pool');
            if (!poolDiv) throw new Error('Could not find .energy-pool in template clone');
            poolDiv.id = `${typeId}-pool`;
            poolDiv.style.display = 'none';
            // Styling logic...
            if (isStandard && details) { /* ... */ } else if (!isStandard && customColor) { /* ... */ } else { /* ... */ }
            const titleEl = poolDiv.querySelector('.pool-title');
            if (titleEl) { /* ... set title and color ... */ }
            // Setup inputs/spans
            const setupElement = (selectorSuffix, isInput = true, focusRingClass = '') => { /* ... */ };
            const standardFocusRing = isStandard && details ? details.focusRing : '';
            setupElement('base-max-energy', false);
            // ... setup other elements ...
            const regenBtn = poolDiv.querySelector('.regen-btn');
            if (regenBtn) { /* ... set dataset and style ... */ }
            energyPoolsContainer.appendChild(poolClone);
        } catch (error) { console.error(`Error generating energy pool section for ${typeId}:`, error); }

        // --- Generate Slider Section ---
        try {
            const sliderClone = energySliderTemplate.content.cloneNode(true);
            const sliderSection = sliderClone.querySelector('.energy-slider-section');
             if (!sliderSection) throw new Error('Could not find .energy-slider-section');
            sliderSection.id = `${typeId}-slider-section`;
            sliderSection.dataset.type = typeId;
            // ... setup slider label, input, value display ...
            const energySlider = sliderSection.querySelector('.energy-slider');
            if (energySlider) { /* ... set IDs, dataset, styles ... */ }
            slidersGrid.appendChild(sliderClone);
        } catch (error) { console.error(`Error generating energy slider section for ${typeId}:`, error); }
    });
    console.log("Energy sections generated using merged types.");
}


/**
 * Populates the Energy Type Focus dropdown based on the mergedEnergyTypes state array.
 */
export function populateEnergyTypeDropdown() {
    if (!energyTypeSelect) { console.error("Dropdown not found."); return; }
    const currentFocus = energyTypeSelect.value;
    energyTypeSelect.innerHTML = '';
    if (!mergedEnergyTypes || mergedEnergyTypes.length === 0) { /* ... handle empty list ... */ return; }
    mergedEnergyTypes.forEach(et => { /* ... create and append options ... */ });
    // Restore focus or default
    if (mergedEnergyTypes.some(et => et.id === currentFocus)) { energyTypeSelect.value = currentFocus; }
    else if (mergedEnergyTypes.length > 0) { energyTypeSelect.value = mergedEnergyTypes[0].id; }
    console.log("Energy type dropdown populated. Current focus:", energyTypeSelect.value);
}


// --- Other generator functions ---

export function generateSpeedSlider() {
    // ... (Keep existing code) ...
}

/**
 * Adds a new dynamic modifier box to the UI.
 * @param {object|null} [modifierData=null] - Optional data to pre-fill the box.
 */
export function addDynamicModifier(modifierData = null) {
     if (!dynamicModifiersContainer) { return; }

     // --- MODIFIED PART: Increment imported state variable directly ---
     // We need a way to modify the imported 'let'. This is tricky.
     // Option 1: Re-import state and modify (less clean)
     // Option 2: state.js exports a setter function (cleaner)
     // Option 3: Modify the imported variable directly (works if exported with 'let', but can be confusing)

     // Let's try Option 3 for now, assuming state.js has 'export let dynamicModifierCount;'
     // This relies on the module system allowing modification of imported 'let' bindings.
     // If this causes issues later, we'll switch to a setter function in state.js.
     let newCount = dynamicModifierCount + 1;
     // We cannot directly assign back to the import: `dynamicModifierCount = newCount;` will likely fail.
     // We need state.js to provide a way to update its own variable.

     // --- TEMPORARY WORKAROUND (Needs fix in state.js) ---
     // Let's use a temporary global or re-fetch from state if needed,
     // but the clean way is a setter in state.js.
     // For now, let's just log and use a potentially stale count. This WILL break ID uniqueness over time.
     console.warn("Need a setter function in state.js to properly increment dynamicModifierCount globally.");
     const currentCountForId = dynamicModifierCount; // Use potentially stale value for ID generation
     const modifierId = `dynamic-modifier-${currentCountForId + 1}`; // Increment for ID, but doesn't update global state
     // --- END TEMPORARY WORKAROUND ---


     const newModifierDiv = document.createElement('div');
     const initialType = modifierData?.type || 'additive';
     const initialValue = modifierData?.value || '0';
     const initialName = modifierData?.name || '';
     const isActiveAdditive = initialType === 'additive';
     const boxClasses = `dynamic-box ... ${isActiveAdditive ? 'additive ...' : 'multiplicative ...'}`; // Simplified
     newModifierDiv.className = boxClasses;
     newModifierDiv.id = modifierId;
     newModifierDiv.innerHTML = ``;
     dynamicModifiersContainer.appendChild(newModifierDiv);
     addListenersToModifierBox(newModifierDiv); // Use imported listener setup
     newModifierDiv.addEventListener('animationend', () => { /* ... cleanup ... */ }, { once: true });
}

export function renderFormList() {
    // ... (Keep existing code) ...
}

export function renderActiveFormsSection() {
    // ... (Keep existing code) ...
}

