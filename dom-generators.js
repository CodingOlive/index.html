// dom-generators.js - Functions for dynamically creating HTML elements using merged energy types.

// --- Import Dependencies ---
import {
    energyPoolTemplate, energySliderTemplate, energyPoolsContainer, slidersGrid,
    dynamicModifiersContainer, formListContainer, activeFormsListContainer,
    energyTypeSelect // Added dropdown element
} from './dom-elements.js';

// Import Config data (only needed for standard type fallback/details)
import { ENERGY_TYPE_DETAILS, SPEED_DETAILS } from './config.js';

// Import State variables (READ access needed)
import {
    characterForms, calculatorState, mergedEnergyTypes,
    dynamicModifierCount as _dynamicModifierCount // Import state var
} from './state.js';


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
    if (!energyPoolTemplate || !energySliderTemplate || !energyPoolsContainer || !slidersGrid) {
        console.error("DOM GEN: Required templates or containers not found!");
        return;
    }
    energyPoolsContainer.innerHTML = ''; // Clear existing pools
    slidersGrid.innerHTML = ''; // Clear existing sliders in the grid

    console.log(`DOM GEN: Generating sections for ${mergedEnergyTypes.length} merged types.`); // Log count

    // --- Loop over MERGED types ---
    mergedEnergyTypes.forEach((energyType, index) => { // Added index for logging
        // Check if energyType itself is valid before proceeding
        if (!energyType || typeof energyType.id === 'undefined') {
             console.error(`DOM GEN: Skipping invalid energy type at index ${index}:`, energyType);
             return; // Skip this iteration if the item is invalid
        }

        const typeId = energyType.id;
        const isStandard = energyType.isStandard;
        const details = energyType.details;
        const customColor = !isStandard ? energyType.color : null;
        // console.log(`DOM GEN: Processing type ${index + 1}: ${typeId} (Standard: ${isStandard})`); // Verbose log

        // --- Generate Energy Pool Section ---
        try {
            const poolClone = energyPoolTemplate.content.cloneNode(true);
            const poolDiv = poolClone.querySelector('.energy-pool');
            if (!poolDiv) throw new Error('Could not find .energy-pool in template clone');

            poolDiv.id = `${typeId}-pool`;
            poolDiv.style.display = 'none'; // Start hidden

            // Styling
            if (isStandard && details) {
                if (details.border) poolDiv.classList.add(details.border);
                if (details.gradientTo) poolDiv.classList.add(details.gradientTo);
            } else if (!isStandard && customColor) {
                poolDiv.style.borderLeftWidth = '4px';
                poolDiv.style.borderLeftColor = customColor;
                 poolDiv.style.background = `linear-gradient(to bottom right, white, ${customColor}1A)`;
            } else { poolDiv.classList.add('border-l-gray-400'); }

            const titleEl = poolDiv.querySelector('.pool-title');
            if (titleEl) {
                titleEl.textContent = `${energyType.name} Energy Pool`;
                if (!isStandard && customColor) { titleEl.style.color = customColor; }
            }

            // Setup inputs/spans
            const setupElement = (selectorSuffix, isInput = true, focusRingClass = '') => {
                const el = poolDiv.querySelector(`.${selectorSuffix}`);
                const labelEl = poolDiv.querySelector(`.${selectorSuffix}-label`);
                if (el) {
                    el.id = `${typeId}-${selectorSuffix}`;
                    if (labelEl) { if (isInput) { labelEl.htmlFor = el.id; } else { labelEl.removeAttribute('for'); } }
                    if (isStandard && isInput && focusRingClass) { el.classList.add(focusRingClass); }
                }
            };
            const standardFocusRing = isStandard && details ? details.focusRing : '';
            setupElement('base-max-energy', false);
            setupElement('max-multiplier', true, standardFocusRing);
            setupElement('total-energy', false);
            setupElement('current-energy', false);
            setupElement('damage-per-power', true, standardFocusRing);
            setupElement('regen-percent', true, standardFocusRing);

            const regenBtn = poolDiv.querySelector('.regen-btn');
            if (regenBtn) {
                regenBtn.dataset.type = typeId;
                 if (!isStandard && customColor) { regenBtn.style.backgroundColor = customColor; }
            }
            energyPoolsContainer.appendChild(poolClone);

        } catch (error) { console.error(`DOM GEN: Error generating energy pool section for ${typeId}:`, error); }


        // --- Generate Slider Section ---
        try {
            const sliderClone = energySliderTemplate.content.cloneNode(true);
            const sliderSection = sliderClone.querySelector('.energy-slider-section');
             if (!sliderSection) throw new Error('Could not find .energy-slider-section');
            sliderSection.id = `${typeId}-slider-section`;
            sliderSection.dataset.type = typeId;

            const sliderLabel = sliderSection.querySelector('.slider-label');
            const energySlider = sliderSection.querySelector('.energy-slider');
            const valueDisplay = sliderSection.querySelector('.energy-slider-value-display');

            if (sliderLabel && energySlider) {
                 sliderLabel.htmlFor = `${typeId}-energy-slider`;
                 sliderLabel.textContent = `${energyType.name} Energy Used (%):`;
            }
            if (energySlider) {
                energySlider.id = `${typeId}-energy-slider`;
                energySlider.dataset.type = typeId;
                if (isStandard && details?.focusRing) { energySlider.classList.add(details.focusRing); }
                if (!isStandard && customColor) { energySlider.style.setProperty('--slider-thumb-color', customColor); }
            }
            if (valueDisplay) { valueDisplay.id = `${typeId}-slider-value-display`; }

            slidersGrid.appendChild(sliderClone);

        } catch (error) { console.error(`DOM GEN: Error generating energy slider section for ${typeId}:`, error); }
    });
    console.log("DOM GEN: Finished generating energy sections.");
}


/**
 * Populates the Energy Type Focus dropdown based on the mergedEnergyTypes state array.
 */
export function populateEnergyTypeDropdown() {
    if (!energyTypeSelect) { console.error("DOM GEN: Dropdown not found."); return; }
    const currentFocus = energyTypeSelect.value;
    energyTypeSelect.innerHTML = '';

    console.log(`DOM GEN: Populating dropdown for ${mergedEnergyTypes.length} merged types.`); // Log count

    if (!mergedEnergyTypes || mergedEnergyTypes.length === 0) {
        console.warn("DOM GEN: No merged energy types available for dropdown.");
        const option = document.createElement('option');
        option.value = ''; option.textContent = 'No energy types defined'; option.disabled = true;
        energyTypeSelect.appendChild(option);
        return;
    }

    mergedEnergyTypes.forEach((et, index) => {
         // Check if et itself is valid before proceeding
         if (!et || typeof et.id === 'undefined') {
             console.error(`DOM GEN: Skipping invalid energy type for dropdown at index ${index}:`, et);
             return; // Skip this iteration if the item is invalid
         }
        const option = document.createElement('option');
        option.value = et.id;
        option.textContent = et.name;
        energyTypeSelect.appendChild(option);
    });

    // Restore focus or default
    if (mergedEnergyTypes.some(et => et && et.id === currentFocus)) { // Check et exists
        energyTypeSelect.value = currentFocus;
    } else if (mergedEnergyTypes.length > 0 && mergedEnergyTypes[0] && mergedEnergyTypes[0].id) { // Check first element is valid
        energyTypeSelect.value = mergedEnergyTypes[0].id;
    } else {
        console.warn("DOM GEN: Could not set default dropdown value.");
    }
    console.log("DOM GEN: Energy type dropdown populated. Current focus:", energyTypeSelect.value);
}


// --- Other generator functions ---

export function generateSpeedSlider() { /* ... Keep existing code ... */ }
export function addDynamicModifier(modifierData = null) { /* ... Keep existing code ... */ }
export function renderFormList() { /* ... Keep existing code ... */ }
export function renderActiveFormsSection() { /* ... Keep existing code ... */ }

