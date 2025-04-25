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
    characterForms, calculatorState, mergedEnergyTypes, dynamicModifierCount as _dynamicModifierCount // Import state var
} from './state.js';
// Use local variable for mutable count state if needed, though direct modification of imported let works
let dynamicModifierCount = _dynamicModifierCount;


// Import Utilities and Formatters
import { escapeHtml } from './utils.js';
import { formatSimpleNumber, safeParseFloat } from './formatters.js'; // Added safeParseFloat

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
    energyPoolsContainer.innerHTML = ''; // Clear existing pools
    slidersGrid.innerHTML = ''; // Clear existing sliders in the grid

    // --- Loop over MERGED types ---
    mergedEnergyTypes.forEach(energyType => {
        const typeId = energyType.id; // Standard ID or custom ID
        const isStandard = energyType.isStandard;
        const details = energyType.details; // Contains config for standard types (borders, glows etc)
        const customColor = !isStandard ? energyType.color : null; // Hex color for custom types

        // --- Generate Energy Pool Section ---
        try {
            const poolClone = energyPoolTemplate.content.cloneNode(true);
            const poolDiv = poolClone.querySelector('.energy-pool');
            if (!poolDiv) throw new Error('Could not find .energy-pool in template clone');

            poolDiv.id = `${typeId}-pool`;
            poolDiv.style.display = 'none'; // Start hidden

            // --- Styling ---
            if (isStandard && details) {
                if (details.border) poolDiv.classList.add(details.border);
                if (details.gradientTo) poolDiv.classList.add(details.gradientTo);
            } else if (!isStandard && customColor) {
                poolDiv.style.borderLeftWidth = '4px';
                poolDiv.style.borderLeftColor = customColor;
                 poolDiv.style.background = `linear-gradient(to bottom right, white, ${customColor}1A)`;
            } else {
                 poolDiv.classList.add('border-l-gray-400');
            }

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
                    if (labelEl) {
                        if (isInput) { labelEl.htmlFor = el.id; } else { labelEl.removeAttribute('for'); }
                    }
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

        } catch (error) { console.error(`Error generating energy pool section for ${typeId}:`, error); }


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

        } catch (error) { console.error(`Error generating energy slider section for ${typeId}:`, error); }
    });
    console.log("Energy sections generated using merged types.");
}


/**
 * Populates the Energy Type Focus dropdown based on the mergedEnergyTypes state array.
 */
export function populateEnergyTypeDropdown() {
    // Uses imported element and state
    if (!energyTypeSelect) { console.error("Dropdown not found."); return; }
    const currentFocus = energyTypeSelect.value;
    energyTypeSelect.innerHTML = '';

    if (!mergedEnergyTypes || mergedEnergyTypes.length === 0) {
        // ... (handle empty list) ...
        console.warn("No merged energy types available to populate dropdown.");
        const option = document.createElement('option');
        option.value = ''; option.textContent = 'No types defined'; option.disabled = true;
        energyTypeSelect.appendChild(option);
        return;
    }

    mergedEnergyTypes.forEach(et => {
        const option = document.createElement('option');
        option.value = et.id;
        option.textContent = et.name;
        energyTypeSelect.appendChild(option);
    });

    // Restore focus or default
    if (mergedEnergyTypes.some(et => et.id === currentFocus)) {
        energyTypeSelect.value = currentFocus;
    } else if (mergedEnergyTypes.length > 0) {
        energyTypeSelect.value = mergedEnergyTypes[0].id;
    }
    console.log("Energy type dropdown populated. Current focus:", energyTypeSelect.value);
}


// --- Other generator functions ---

export function generateSpeedSlider() {
    // Uses imported elements and config
    if (document.getElementById('speed-slider-section')) return;
    if (!energySliderTemplate || !slidersGrid) { return; }
    console.log("Attempting to generate speed slider DOM...");
    try {
        const sliderClone = energySliderTemplate.content.cloneNode(true);
        const sliderSection = sliderClone.querySelector('.energy-slider-section');
        if (!sliderSection) throw new Error('Could not find .energy-slider-section');
        sliderSection.id = `speed-slider-section`;
        sliderSection.dataset.type = 'speed';
        const sliderLabel = sliderSection.querySelector('.slider-label');
        const energySlider = sliderSection.querySelector('.energy-slider');
        const valueDisplay = sliderSection.querySelector('.energy-slider-value-display');
        if (sliderLabel && energySlider) {
            sliderLabel.htmlFor = `speed-slider`;
            sliderLabel.textContent = `${SPEED_DETAILS.name} Usage (%):`;
        }
        if (energySlider) {
            energySlider.id = `speed-slider`; energySlider.dataset.type = 'speed';
            if (SPEED_DETAILS.focusRing) energySlider.classList.add(SPEED_DETAILS.focusRing);
        }
        if (valueDisplay) {
            valueDisplay.id = `speed-slider-value-display`;
            const detailsSpan = valueDisplay.querySelector('.slider-details-value');
            if (detailsSpan) detailsSpan.textContent = '(S: 0, D: 0.00)';
        }
        slidersGrid.appendChild(sliderClone);
        console.log("Speed slider DOM structure generated.");
    } catch(error) { console.error("Error generating speed slider:", error); }
}

export function addDynamicModifier(modifierData = null) {
    // Uses imported container, state, utils, and listener function
     if (!dynamicModifiersContainer) { return; }
     // Increment state counter (direct modification for now)
     dynamicModifierCount++;
     // If state provides setter: dynamicModifierCount = incrementModifierCount();
     const modifierId = `dynamic-modifier-${dynamicModifierCount}`;
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
    // Uses imported container, state, utils, formatters, handler
     if (!formListContainer) { return; }
     formListContainer.innerHTML = '';
     if (!characterForms || characterForms.length === 0) { formListContainer.innerHTML = '<p>No forms created.</p>'; return; }
     const formsByEnergyType = characterForms.reduce((acc, form) => { /* ... group ... */ return acc; }, {});
     const sortedEnergyTypes = Object.keys(formsByEnergyType).sort(/* ... */);
     for (const type of sortedEnergyTypes) {
         const groupDiv = document.createElement('div'); /* ... setup ... */
         const listDiv = document.createElement('div'); /* ... setup ... */
         formsByEnergyType[type].forEach(form => {
             const formItemContainer = document.createElement('div'); /* ... setup ... */
             const formElement = document.createElement('span'); /* ... setup ... */
             const deleteButton = document.createElement('button'); /* ... setup ... */
             deleteButton.addEventListener('click', handleDeleteFormClick); // Use imported handler
             formItemContainer.appendChild(formElement); formItemContainer.appendChild(deleteButton);
             listDiv.appendChild(formItemContainer);
         });
         formListContainer.appendChild(groupDiv); formListContainer.appendChild(listDiv);
     }
}

export function renderActiveFormsSection() {
    // Uses imported container, state, handler
    if (!activeFormsListContainer) { return; }
    activeFormsListContainer.innerHTML = '';
    if (!characterForms || characterForms.length === 0) { activeFormsListContainer.innerHTML = '<p>No forms created.</p>'; return; }
    const activeIds = Array.isArray(calculatorState.activeFormIds) ? calculatorState.activeFormIds : [];
    characterForms.forEach(form => {
        const isChecked = activeIds.includes(form.id);
        const div = document.createElement('div'); /* ... setup ... */
        const checkbox = document.createElement('input'); /* ... setup ... */
        checkbox.addEventListener('change', handleActiveFormChange); // Use imported handler
        const label = document.createElement('label'); /* ... setup ... */
        div.appendChild(checkbox); div.appendChild(label);
        activeFormsListContainer.appendChild(div);
    });
}
