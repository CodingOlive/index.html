// dom-generators.js - Functions for dynamically creating HTML elements using merged energy types.

// --- Import Dependencies ---
// Import DOM Elements
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
    dynamicModifierCount as _dynamicModifierCount // Import state var
} from './state.js';
let dynamicModifierCount = _dynamicModifierCount; // Local variable linked to state

// Import Utilities and Formatters
import { escapeHtml, safeParseFloat } from './utils.js'; // Import safeParseFloat from utils
import { formatSimpleNumber } from './formatters.js'; // Import only formatters here

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
    if (!energyPoolTemplate || !energySliderTemplate || !energyPoolsContainer || !slidersGrid) {
        console.error("Required templates or containers not found! Cannot generate energy sections.");
        return;
    }
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
            // Styling logic... (using details or customColor)
            if (isStandard && details) { /* ... apply standard styles ... */ }
            else if (!isStandard && customColor) { /* ... apply custom styles ... */ }
            else { poolDiv.classList.add('border-l-gray-400'); }

            const titleEl = poolDiv.querySelector('.pool-title');
            if (titleEl) { /* ... set title and color ... */ }

            // Setup inputs/spans
            const setupElement = (selectorSuffix, isInput = true, focusRingClass = '') => { /* ... setup IDs, labels, focus rings ... */ };
            const standardFocusRing = isStandard && details ? details.focusRing : '';
            setupElement('base-max-energy', false);
            setupElement('max-multiplier', true, standardFocusRing);
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
    // Uses imported elements and config
    if (document.getElementById('speed-slider-section')) return;
    if (!energySliderTemplate || !slidersGrid) { return; }
    console.log("Attempting to generate speed slider DOM...");
    try { /* ... create elements using template ... */ }
    catch(error) { console.error("Error generating speed slider:", error); }
}

export function addDynamicModifier(modifierData = null) {
    // Uses imported container, state, utils, and listener function
     if (!dynamicModifiersContainer) { return; }
     // Increment state counter
     dynamicModifierCount++;
     const modifierId = `dynamic-modifier-${dynamicModifierCount}`;
     const newModifierDiv = document.createElement('div');
     // ... (set up innerHTML using escapeHtml) ...
     dynamicModifiersContainer.appendChild(newModifierDiv);
     addListenersToModifierBox(newModifierDiv); // Use imported listener setup
     // ... (animation cleanup) ...
}

export function renderFormList() {
    // Uses imported container, state, utils, formatters, handler
     if (!formListContainer) { return; }
     formListContainer.innerHTML = '';
     if (!characterForms || characterForms.length === 0) { /* ... render 'No forms' ... */ return; }
     const formsByEnergyType = characterForms.reduce((acc, form) => { /* ... group ... */ return acc; }, {});
     const sortedEnergyTypes = Object.keys(formsByEnergyType).sort(/* ... */);
     for (const type of sortedEnergyTypes) { /* ... create group ... */
         formsByEnergyType[type].forEach(form => { /* ... create item, button ... */
             const deleteButton = document.createElement('button');
             // ... setup delete button ...
             deleteButton.addEventListener('click', handleDeleteFormClick); // Use imported handler
             // ... append elements ...
         });
     }
}

export function renderActiveFormsSection() {
    // Uses imported container, state, handler
    if (!activeFormsListContainer) { return; }
    activeFormsListContainer.innerHTML = '';
    if (!characterForms || characterForms.length === 0) { /* ... render 'No forms' ... */ return; }
    const activeIds = Array.isArray(calculatorState.activeFormIds) ? calculatorState.activeFormIds : [];
    characterForms.forEach(form => { /* ... create checkbox, label ... */
        const checkbox = document.createElement('input');
        // ... setup checkbox ...
        checkbox.addEventListener('change', handleActiveFormChange); // Use imported handler
        // ... append elements ...
    });
}
