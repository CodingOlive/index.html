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
    dynamicModifierCount // Import state var directly
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
    if (!energyPoolTemplate || !energySliderTemplate || !energyPoolsContainer || !slidersGrid) {
        console.error("DOM GEN: Required templates or containers not found!");
        return;
    }
    energyPoolsContainer.innerHTML = '';
    slidersGrid.innerHTML = '';

    console.log(`DOM GEN: Starting generateEnergySections for ${mergedEnergyTypes?.length ?? 0} merged types.`);

    if (!Array.isArray(mergedEnergyTypes)) {
        console.error("DOM GEN: mergedEnergyTypes is not an array!", mergedEnergyTypes);
        return;
    }

    mergedEnergyTypes.forEach((energyType, index) => {
        // console.log(`DOM GEN: Processing index ${index}...`); // Optional log
        if (!energyType || typeof energyType.id === 'undefined') {
             console.error(`DOM GEN: Skipping invalid energy type at index ${index}:`, energyType);
             return;
        }
        const typeId = energyType.id;
        // console.log(`DOM GEN: Processing typeId: ${typeId}`); // Optional log

        const isStandard = energyType.isStandard;
        const details = energyType.details;
        const customColor = !isStandard ? energyType.color : null;

        // Generate Energy Pool Section
        try {
            const poolClone = energyPoolTemplate.content.cloneNode(true);
            const poolDiv = poolClone.querySelector('.energy-pool');
            if (!poolDiv) throw new Error('Could not find .energy-pool in template clone');
            poolDiv.id = `${typeId}-pool`;
            poolDiv.style.display = 'none';
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
            // console.log(`DOM GEN: Appended pool for ${typeId}`); // Optional log
        } catch (error) { console.error(`DOM GEN: Error generating energy pool section for ${typeId}:`, error); }

        // Generate Slider Section
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
            // console.log(`DOM GEN: Appended slider for ${typeId}`); // Optional log
        } catch (error) { console.error(`DOM GEN: Error generating energy slider section for ${typeId}:`, error); }
    }); // End of mergedEnergyTypes.forEach
    console.log("DOM GEN: Finished generateEnergySections loop.");
} // End of generateEnergySections function


/**
 * Populates the Energy Type Focus dropdown based on the mergedEnergyTypes state array.
 */
export function populateEnergyTypeDropdown() {
    if (!energyTypeSelect) { console.error("DOM GEN: Dropdown not found."); return; }
    const currentFocus = energyTypeSelect.value;
    energyTypeSelect.innerHTML = '';
    console.log(`DOM GEN: Starting populateEnergyTypeDropdown for ${mergedEnergyTypes?.length ?? 0} merged types.`);
    if (!Array.isArray(mergedEnergyTypes) || mergedEnergyTypes.length === 0) {
        console.warn("DOM GEN: No merged energy types available for dropdown.");
        const option = document.createElement('option');
        option.value = ''; option.textContent = 'No energy types defined'; option.disabled = true;
        energyTypeSelect.appendChild(option);
        return;
    }
    mergedEnergyTypes.forEach((et, index) => {
        // console.log(`DOM GEN: Adding dropdown option index ${index}...`); // Optional log
         if (!et || typeof et.id === 'undefined' || typeof et.name === 'undefined') {
             console.error(`DOM GEN: Skipping invalid energy type for dropdown at index ${index}:`, et);
             return;
         }
         // console.log(`DOM GEN: Adding option: ID=${et.id}, Name=${et.name}`); // Optional log
        const option = document.createElement('option');
        option.value = et.id;
        option.textContent = et.name;
        energyTypeSelect.appendChild(option);
    }); // End of mergedEnergyTypes.forEach
    // Restore focus or default
    if (mergedEnergyTypes.some(et => et && et.id === currentFocus)) { energyTypeSelect.value = currentFocus; }
    else if (mergedEnergyTypes.length > 0 && mergedEnergyTypes[0] && mergedEnergyTypes[0].id) { energyTypeSelect.value = mergedEnergyTypes[0].id; }
    else { console.warn("DOM GEN: Could not set default dropdown value."); }
    console.log("DOM GEN: Energy type dropdown populated. Current focus:", energyTypeSelect.value);
} // End of populateEnergyTypeDropdown function


// --- Other generator functions ---

export function generateSpeedSlider() {
    if (document.getElementById('speed-slider-section')) return;
    if (!energySliderTemplate || !slidersGrid) { return; }
    console.log("DOM GEN: Attempting to generate speed slider DOM...");
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
        console.log("DOM GEN: Speed slider DOM structure generated.");
    } catch(error) { console.error("DOM GEN: Error generating speed slider:", error); }
}

export function addDynamicModifier(modifierData = null) {
     if (!dynamicModifiersContainer) { return; }
     // Incrementing counter needs fix in state.js (setter function)
     console.warn("DOM GEN: Using potentially stale dynamicModifierCount for ID. Implement setter in state.js.");
     const currentCountForId = dynamicModifierCount;
     const modifierId = `dynamic-modifier-${currentCountForId + 1}`;

     const newModifierDiv = document.createElement('div');
     const initialType = modifierData?.type || 'additive';
     const initialValue = modifierData?.value || '0';
     const initialName = modifierData?.name || '';
     const isActiveAdditive = initialType === 'additive';
     const boxClasses = `dynamic-box p-4 mt-3 border rounded-md border-l-4 relative transition-all duration-300 ease-in-out animate__animated animate__bounceIn ${isActiveAdditive ? 'additive bg-success-light border-success' : 'multiplicative bg-ki/10 border-ki'}`;
     newModifierDiv.className = boxClasses;
     newModifierDiv.id = modifierId;
     newModifierDiv.innerHTML = `
         <div class="absolute top-2 right-2"><button class="remove-dynamic-box ..." data-target="${modifierId}">×</button></div>
         <div class="modifier-type-selector ...">...</div>
         <div class="grid ...">
             <div><label for="modifier-name-${modifierId}" class="lbl">Name:</label><input type="text" id="modifier-name-${modifierId}" value="${escapeHtml(initialName)}" ...></div>
             <div><label for="modifier-value-${modifierId}" class="lbl">Value:</label><input type="text" id="modifier-value-${modifierId}" value="${escapeHtml(initialValue)}" ...></div>
         </div>`;
     dynamicModifiersContainer.appendChild(newModifierDiv);
     addListenersToModifierBox(newModifierDiv);
     newModifierDiv.addEventListener('animationend', () => { newModifierDiv.classList.remove('animate__animated', 'animate__bounceIn'); }, { once: true });
}

export function renderFormList() {
     if (!formListContainer) { return; }
     formListContainer.innerHTML = '';
     if (!characterForms || characterForms.length === 0) { formListContainer.innerHTML = '<p class="text-gray-500">No forms created yet.</p>'; return; }
     const formsByEnergyType = characterForms.reduce((acc, form) => { const type = form.energyType || 'None'; if (!acc[type]) acc[type] = []; acc[type].push(form); return acc; }, {});
     const sortedEnergyTypes = Object.keys(formsByEnergyType).sort((a, b) => { if (a === 'None') return 1; if (b === 'None') return -1; const aIndex = ALL_ENERGY_TYPES.indexOf(a); const bIndex = ALL_ENERGY_TYPES.indexOf(b); if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex; return a.localeCompare(b); }); // Requires ALL_ENERGY_TYPES import if used
     for (const type of sortedEnergyTypes) {
         const groupDiv = document.createElement('div'); groupDiv.className = 'form-list-group';
         const groupName = (type === 'None') ? 'General' : (ENERGY_TYPE_DETAILS[type]?.name || type); // Requires ENERGY_TYPE_DETAILS import
         groupDiv.innerHTML = `<h4>${escapeHtml(groupName)} Forms</h4>`; formListContainer.appendChild(groupDiv);
         const listDiv = document.createElement('div'); listDiv.className = 'flex flex-col items-start gap-0.5';
         formsByEnergyType[type].forEach(form => {
             const formItemContainer = document.createElement('div'); formItemContainer.className = 'flex items-center gap-1 w-full';
             const formElement = document.createElement('span'); formElement.className = 'form-list-item flex-grow'; formElement.textContent = form.name; formElement.setAttribute('data-form-id', form.id);
             let tooltip = `Form Mult: ${formatSimpleNumber(form.formMultiplier)}, Pool Mult: ${formatSimpleNumber(form.poolMaxMultiplier)}`; /* ... add more tooltip info ... */ formElement.title = tooltip;
             const deleteButton = document.createElement('button'); deleteButton.textContent = '×'; deleteButton.className = 'delete-form-btn ...'; deleteButton.title = `Delete form "${escapeHtml(form.name)}"`; deleteButton.setAttribute('aria-label', `Delete form ${escapeHtml(form.name)}`); deleteButton.dataset.formId = form.id;
             deleteButton.addEventListener('click', handleDeleteFormClick); // Use imported handler
             formItemContainer.appendChild(formElement); formItemContainer.appendChild(deleteButton);
             listDiv.appendChild(formItemContainer);
         });
         formListContainer.appendChild(listDiv);
     }
}

export function renderActiveFormsSection() {
    if (!activeFormsListContainer) { return; }
    activeFormsListContainer.innerHTML = '';
    if (!characterForms || characterForms.length === 0) { activeFormsListContainer.innerHTML = '<p class="text-gray-500 text-sm col-span-full">No forms created yet.</p>'; return; }
    const activeIds = Array.isArray(calculatorState.activeFormIds) ? calculatorState.activeFormIds : [];
    characterForms.forEach(form => {
        const isChecked = activeIds.includes(form.id);
        const div = document.createElement('div'); div.className = 'flex items-center gap-2 min-w-0';
        const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.id = `active-form-${form.id}`; checkbox.value = form.id; checkbox.checked = isChecked; checkbox.className = 'h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 flex-shrink-0';
        checkbox.addEventListener('change', handleActiveFormChange); // Use imported handler
        const label = document.createElement('label'); label.htmlFor = checkbox.id; label.textContent = form.name; label.className = 'text-sm text-gray-700 select-none truncate hover:text-purple-700 cursor-pointer';
        let tooltip = `Form Mult: ${formatSimpleNumber(form.formMultiplier)}, Pool Mult: ${formatSimpleNumber(form.poolMaxMultiplier)}`; /* ... add more tooltip info ... */ label.title = tooltip;
        div.appendChild(checkbox); div.appendChild(label);
        activeFormsListContainer.appendChild(div);
    });
}

