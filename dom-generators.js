// dom-generators.js - Functions for dynamically creating HTML elements using merged energy types.

// --- Import Dependencies ---
import {
    energyPoolTemplate, energySliderTemplate, energyPoolsContainer, slidersGrid,
    dynamicModifiersContainer, formListContainer, activeFormsListContainer,
    energyTypeSelect
} from './dom-elements.js';
import { ENERGY_TYPE_DETAILS, SPEED_DETAILS } from './config.js';
import {
    characterForms, calculatorState, mergedEnergyTypes,
    dynamicModifierCount // Import state var directly
} from './state.js';
import { escapeHtml, safeParseFloat } from './utils.js';
import { formatSimpleNumber } from './formatters.js';
import { addListenersToModifierBox } from './modifiers.js';
import { handleActiveFormChange, handleDeleteFormClick } from './forms.js';


// --- Generator Functions ---

/**
 * Generates the energy pool sections and their corresponding slider sections
 * based on the mergedEnergyTypes state array. Appends them to containers.
 */
export function generateEnergySections() {
    if (!energyPoolTemplate || !energySliderTemplate || !energyPoolsContainer || !slidersGrid) {
        console.error("DOM GEN: Required templates or containers not found!");
        return;
    }
    energyPoolsContainer.innerHTML = '';
    slidersGrid.innerHTML = '';

    console.log(`DOM GEN: Starting generateEnergySections for ${mergedEnergyTypes?.length ?? 0} merged types.`); // Log count

    // --- Loop over MERGED types ---
    if (!Array.isArray(mergedEnergyTypes)) {
        console.error("DOM GEN: mergedEnergyTypes is not an array!", mergedEnergyTypes);
        return;
    }

    mergedEnergyTypes.forEach((energyType, index) => {
        console.log(`DOM GEN: Processing index ${index}...`); // Log each iteration start
        if (!energyType || typeof energyType.id === 'undefined') {
             console.error(`DOM GEN: Skipping invalid energy type at index ${index}:`, energyType);
             return; // Skip this iteration
        }
        const typeId = energyType.id;
        console.log(`DOM GEN: Processing typeId: ${typeId}`); // Log the ID being processed

        const isStandard = energyType.isStandard;
        const details = energyType.details;
        const customColor = !isStandard ? energyType.color : null;

        // --- Generate Energy Pool Section ---
        try {
            // ... (rest of pool generation logic remains the same) ...
             const poolClone = energyPoolTemplate.content.cloneNode(true);
             const poolDiv = poolClone.querySelector('.energy-pool');
             if (!poolDiv) throw new Error('Could not find .energy-pool');
             poolDiv.id = `${typeId}-pool`;
             poolDiv.style.display = 'none';
             // Styling...
             if (isStandard && details) { /* ... */ } else if (!isStandard && customColor) { /* ... */ } else { /* ... */ }
             const titleEl = poolDiv.querySelector('.pool-title');
             if (titleEl) { /* ... */ }
             // Setup inputs/spans
             const setupElement = (selectorSuffix, isInput = true, focusRingClass = '') => { /* ... */ };
             const standardFocusRing = isStandard && details ? details.focusRing : '';
             setupElement('base-max-energy', false);
             setupElement('max-multiplier', true, standardFocusRing);
             setupElement('total-energy', false);
             setupElement('current-energy', false);
             setupElement('damage-per-power', true, standardFocusRing);
             setupElement('regen-percent', true, standardFocusRing);
             const regenBtn = poolDiv.querySelector('.regen-btn');
             if (regenBtn) { regenBtn.dataset.type = typeId; /* ... style ... */ }
             energyPoolsContainer.appendChild(poolClone);
             console.log(`DOM GEN: Appended pool for ${typeId}`); // Log success for pool

        } catch (error) { console.error(`DOM GEN: Error generating energy pool section for ${typeId}:`, error); }


        // --- Generate Slider Section ---
        try {
            // ... (rest of slider generation logic remains the same) ...
             const sliderClone = energySliderTemplate.content.cloneNode(true);
             const sliderSection = sliderClone.querySelector('.energy-slider-section');
             if (!sliderSection) throw new Error('Could not find .energy-slider-section');
             sliderSection.id = `${typeId}-slider-section`;
             sliderSection.dataset.type = typeId;
             // ... setup slider label, input, value display ...
             const energySlider = sliderSection.querySelector('.energy-slider');
             if (energySlider) { /* ... set IDs, dataset, styles ... */ }
             slidersGrid.appendChild(sliderClone);
             console.log(`DOM GEN: Appended slider for ${typeId}`); // Log success for slider

        } catch (error) { console.error(`DOM GEN: Error generating energy slider section for ${typeId}:`, error); }
    });
    console.log("DOM GEN: Finished generateEnergySections loop.");
}


/**
 * Populates the Energy Type Focus dropdown based on the mergedEnergyTypes state array.
 */
export function populateEnergyTypeDropdown() {
    if (!energyTypeSelect) { console.error("DOM GEN: Dropdown not found."); return; }
    const currentFocus = energyTypeSelect.value;
    energyTypeSelect.innerHTML = '';

    console.log(`DOM GEN: Starting populateEnergyTypeDropdown for ${mergedEnergyTypes?.length ?? 0} merged types.`); // Log count

    if (!Array.isArray(mergedEnergyTypes) || mergedEnergyTypes.length === 0) {
        console.warn("DOM GEN: No merged energy types available for dropdown.");
        const option = document.createElement('option');
        option.value = ''; option.textContent = 'No energy types defined'; option.disabled = tr
