// dom-generators.js - Functions for dynamically creating HTML elements using merged energy types.

// --- Import Dependencies ---
import {
    energyPoolTemplate, energySliderTemplate, energyPoolsContainer, slidersGrid,
    dynamicModifiersContainer, formListContainer, activeFormsListContainer,
    energyTypeSelect // Added dropdown element
} from './dom-elements.js';

// Import Config data (only needed for standard type fallback/details)
import { ENERGY_TYPE_DETAILS, SPEED_DETAILS } from './config.js';

// Import State variables (READ access needed) and counter function
import {
    characterForms, calculatorState, mergedEnergyTypes,
    incrementAndGetModifierCount // Import the counter function
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
        console.error("Required templates or containers not found! Cannot generate energy sections.");
        return;
    }
    energyPoolsContainer.innerHTML = ''; // Clear existing pools
    slidersGrid.innerHTML = ''; // Clear existing sliders in the grid
    console.log("DEBUG: generateEnergySections called. Processing merged types:", JSON.stringify(mergedEnergyTypes)); // DEBUG

    // --- Loop over MERGED types ---
    mergedEnergyTypes.forEach((energyType, index) => { // Added index for logging
        console.log(`DEBUG: generateEnergySections - Looping index ${index}, type:`, energyType); // DEBUG

        // Add check for invalid energyType object
        if (!energyType || typeof energyType !== 'object' || !energyType.id) {
            console.error(`DEBUG: Skipping invalid energy type at index ${index}:`, energyType);
            return; // Skip this iteration
        }

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
     console.log("DEBUG: populateEnergyTypeDropdown called. Processing merged types:", JSON.stringify(mergedEnergyTypes)); // DEBUG
    const currentFocus = energyTypeSelect.value;
    energyTypeSelect.innerHTML = '';

    if (!mergedEnergyTypes || mergedEnergyTypes.length === 0) {
        console.warn("No merged energy types available to populate dropdown.");
        const option = document.createElement('option');
        option.value = ''; option.textContent = 'No energy types defined'; option.disabled = true;
        energyTypeSelect.appendChild(option);
        return;
    }

    mergedEnergyTypes.forEach(et => {
         if (!et || !et.id) { // Add check for invalid entry
             console.error("DEBUG: Skipping invalid energy type during dropdown population:", et);
             return;
         }
        const option = document.createElement('option');
        option.value = et.id;
        option.textContent = et.name;
        energyTypeSelect.appendChild(option);
    });

    // Restore focus or default
    if (mergedEnergyTypes.some(et => et && et.id === currentFocus)) {
        energyTypeSelect.value = currentFocus;
    } else if (mergedEnergyTypes.length > 0 && mergedEnergyTypes[0] && mergedEnergyTypes[0].id) {
        // Ensure the first element is valid before setting it as default
        energyTypeSelect.value = mergedEnergyTypes[0].id;
    } else {
         console.warn("Could not set a default value for energy type dropdown.");
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

/**
 * Adds a new dynamic modifier box to the UI.
 */
export function addDynamicModifier(modifierData = null) {
     // Uses imported container, state function, utils, and listener function
     if (!dynamicModifiersContainer) { return; }

     // Use setter function from state.js to get unique ID
     const newCount = incrementAndGetModifierCount();
     const modifierId = `dynamic-modifier-${newCount}`;

     const newModifierDiv = document.createElement('div');
     const initialType = modifierData?.type || 'additive';
     const initialValue = modifierData?.value || '0';
     const initialName = modifierData?.name || '';
     const isActiveAdditive = initialType === 'additive';
     const boxClasses = `dynamic-box p-4 mt-3 border rounded-md border-l-4 relative transition-all duration-300 ease-in-out animate__animated animate__bounceIn ${isActiveAdditive ? 'additive bg-success-light border-success' : 'multiplicative bg-ki/10 border-ki'}`; // Using Tailwind classes
     newModifierDiv.className = boxClasses;
     newModifierDiv.id = modifierId;
     // Uses imported escapeHtml util
     newModifierDiv.innerHTML = `
         <div class="absolute top-2 right-2">
             <button class="remove-dynamic-box bg-error text-white rounded-md shadow-sm w-6 h-6 flex items-center justify-center text-xs hover:bg-error-dark focus:outline-none focus:ring-2 focus:ring-error focus:ring-offset-1 transition-transform active:scale-95" aria-label="Remove this modifier" data-target="${modifierId}">×</button>
         </div>
         <div class="modifier-type-selector flex gap-2 mb-3 border-b pb-2">
             <div class="modifier-type-option additive ${isActiveAdditive ? 'active' : ''} flex-1 p-2 text-center border rounded-md cursor-pointer transition-all duration-300 ease-in-out text-sm" data-value="additive" tabindex="0" role="radio" aria-checked="${isActiveAdditive}">
                 <input type="radio" name="modifier-type-${modifierId}" value="additive" class="sr-only" ${isActiveAdditive ? 'checked' : ''}> Additive (+)
             </div>
             <div class="modifier-type-option multiplicative ${!isActiveAdditive ? 'active' : ''} flex-1 p-2 text-center border rounded-md cursor-pointer transition-all duration-300 ease-in-out text-sm" data-value="multiplicative" tabindex="0" role="radio" aria-checked="${!isActiveAdditive}">
                 <input type="radio" name="modifier-type-${modifierId}" value="multiplicative" class="sr-only" ${!isActiveAdditive ? 'checked' : ''}> Multiplier (×)
             </div>
         </div>
         <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
             <div>
                 <label for="modifier-name-${modifierId}" class="lbl">Modifier Name:</label>
                 <input type="text" id="modifier-name-${modifierId}" placeholder="e.g., Buff" value="${escapeHtml(initialName)}" class="modifier-name-input w-full p-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-success focus:border-transparent text-sm">
             </div>
             <div>
                 <label for="modifier-value-${modifierId}" class="lbl">Value:</label>
                 <input type="text" id="modifier-value-${modifierId}" placeholder="e.g., 50 or 1.2" value="${escapeHtml(initialValue)}" class="modifier-value-input w-full p-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-success focus:border-transparent text-sm">
             </div>
         </div>`;
     dynamicModifiersContainer.appendChild(newModifierDiv);
     addListenersToModifierBox(newModifierDiv); // Use imported listener setup
     newModifierDiv.addEventListener('animationend', () => { newModifierDiv.classList.remove('animate__animated', 'animate__bounceIn'); }, { once: true });
}

export function renderFormList() {
    // Uses imported container, state, utils, formatters, handler
     if (!formListContainer) { return; }
     formListContainer.innerHTML = '';
     if (!characterForms || characterForms.length === 0) { formListContainer.innerHTML = '<p class="text-gray-500">No forms created yet.</p>'; return; }
     const formsByEnergyType = characterForms.reduce((acc, form) => { const type = form.energyType || 'None'; if (!acc[type]) acc[type] = []; acc[type].push(form); return acc; }, {});
     const sortedEnergyTypes = Object.keys(formsByEnergyType).sort((a, b) => { if (a === 'None') return 1; if (b === 'None') return -1; const aIndex = ALL_ENERGY_TYPES.indexOf(a); const bIndex = ALL_ENERGY_TYPES.indexOf(b); if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex; return a.localeCompare(b); }); // Needs ALL_ENERGY_TYPES from config
     for (const type of sortedEnergyTypes) {
         const groupDiv = document.createElement('div'); groupDiv.className = 'form-list-group';
         const groupName = (type === 'None') ? 'General' : (ENERGY_TYPE_DETAILS[type]?.name || type); // Needs ENERGY_TYPE_DETAILS from config
         groupDiv.innerHTML = `<h4>${escapeHtml(groupName)} Forms</h4>`;
         const listDiv = document.createElement('div'); listDiv.className = 'flex flex-col items-start gap-0.5';
         formsByEnergyType[type].forEach(form => {
             const formItemContainer = document.createElement('div'); formItemContainer.className = 'flex items-center gap-1 w-full';
             const formElement = document.createElement('span'); formElement.className = 'form-list-item flex-grow'; formElement.textContent = form.name; formElement.setAttribute('data-form-id', form.id);
             let tooltip = `Form Mult: ${formatSimpleNumber(form.formMultiplier)}, Pool Mult: ${formatSimpleNumber(form.poolMaxMultiplier)}`; // Use formatters
             if (form.energyType !== 'None') tooltip += ` (${form.energyType})`;
             if (form.affectsResistances) tooltip += `, AC: ${formatSimpleNumber(form.acBonus)}, TR: ${formatSimpleNumber(form.trueResistanceBonus)}`;
             if (form.enableFormBuff) tooltip += ` | FM Buff: ${form.formBuffType === 'add' ? '+' : 'x'}${form.formBuffValue}/calc`;
             if (form.enablePoolBuff) tooltip += ` | PM Buff: ${form.poolBuffType === 'add' ? '+' : 'x'}${form.poolBuffValue}/calc`;
             formElement.title = tooltip;
             const deleteButton = document.createElement('button'); deleteButton.textContent = '×'; deleteButton.className = 'delete-form-btn ...'; deleteButton.title = `Delete form "${escapeHtml(form.name)}"`; deleteButton.setAttribute('aria-label', `Delete form ${escapeHtml(form.name)}`); deleteButton.dataset.formId = form.id; // Use utils
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
    if (!characterForms || characterForms.length === 0) { activeFormsListContainer.innerHTML = '<p class="text-gray-500 text-sm col-span-full">No forms created yet.</p>'; return; }
    const activeIds = Array.isArray(calculatorState.activeFormIds) ? calculatorState.activeFormIds : [];
    characterForms.forEach(form => {
        const isChecked = activeIds.includes(form.id);
        const div = document.createElement('div'); div.className = 'flex items-center gap-2 min-w-0';
        const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.id = `active-form-${form.id}`; checkbox.value = form.id; checkbox.checked = isChecked; checkbox.className = 'h-4 w-4 ...';
        checkbox.addEventListener('change', handleActiveFormChange); // Use imported handler
        const label = document.createElement('label'); label.htmlFor = checkbox.id; label.textContent = form.name; label.className = 'text-sm ... truncate ...';
        let tooltip = `Form Mult: ${formatSimpleNumber(form.formMultiplier)}, Pool Mult: ${formatSimpleNumber(form.poolMaxMultiplier)}`; // Use formatters
        if (form.energyType !== 'None') tooltip += ` (${form.energyType})`;
        if (form.affectsResistances) tooltip += `, AC: ${formatSimpleNumber(form.acBonus)}, TR: ${formatSimpleNumber(form.trueResistanceBonus)}`;
        if (form.enableFormBuff) tooltip += ` | FM Buff: ${form.formBuffType === 'add' ? '+' : 'x'}${form.formBuffValue}/calc`;
        if (form.enablePoolBuff) tooltip += ` | PM Buff: ${form.poolBuffType === 'add' ? '+' : 'x'}${form.poolBuffValue}/calc`;
        label.title = tooltip;
        div.appendChild(checkbox); div.appendChild(label);
        activeFormsListContainer.appendChild(div);
    });
}

