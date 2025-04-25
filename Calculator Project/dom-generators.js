// dom-generators.js - Functions for dynamically creating HTML elements.

// --- Import Dependencies ---
// Import DOM elements (templates and containers)
import {
    energyPoolTemplate, energySliderTemplate, energyPoolsContainer, slidersGrid,
    dynamicModifiersContainer, formListContainer, activeFormsListContainer
} from './dom-elements.js';

// Import Config data
import {
    ALL_ENERGY_TYPES, ENERGY_TYPE_DETAILS, SPEED_DETAILS
} from './config.js';

// Import State variables (read-only access often sufficient here, except for modifier count)
import {
    characterForms, calculatorState,
    dynamicModifierCount // Need mutable access if we increment it here
    // If state provides getter/setter for dynamicModifierCount, use that instead
} from './state.js';

// Import Utilities and Formatters
import { escapeHtml } from './utils.js';
import { formatSimpleNumber } from './formatters.js';

// Import functions from other modules
import { addListenersToModifierBox } from './modifiers.js'; // Handles modifier box interactivity
import { handleActiveFormChange, handleDeleteFormClick } from './forms.js'; // Event handlers for form lists


// --- Helper Function (REMOVED - Moved to modifiers.js) ---
// addListenersToModifierBox is now imported from modifiers.js


// --- Generator Functions ---

/**
 * Generates the energy pool sections and their corresponding slider sections
 * based on ALL_ENERGY_TYPES and templates. Appends them to containers.
 */
export function generateEnergySections() {
    // Uses imported elements and config
    if (!energyPoolTemplate || !energySliderTemplate || !energyPoolsContainer || !slidersGrid) {
        console.error("Required templates or containers not found! Cannot generate energy sections.");
        return;
    }
    energyPoolsContainer.innerHTML = '';
    slidersGrid.innerHTML = '';

    ALL_ENERGY_TYPES.forEach(type => {
        const details = ENERGY_TYPE_DETAILS[type];
        if (!details) return;

        // --- Generate Energy Pool Section ---
        try {
            const poolClone = energyPoolTemplate.content.cloneNode(true);
            const poolDiv = poolClone.querySelector('.energy-pool');
            if (!poolDiv) throw new Error('Could not find .energy-pool in template clone');

            poolDiv.id = `${type}-pool`;
            poolDiv.style.display = 'none';
            poolDiv.classList.add(details.border, details.gradientTo);

            const titleEl = poolDiv.querySelector('.pool-title');
            if (titleEl) titleEl.textContent = `${details.name} Energy Pool`;

            const setupElement = (selectorSuffix, isInput = true, focusRingClass = '') => {
                const el = poolDiv.querySelector(`.${selectorSuffix}`);
                const labelEl = poolDiv.querySelector(`.${selectorSuffix}-label`);
                if (el) {
                    el.id = `${type}-${selectorSuffix}`;
                    if (labelEl) {
                        if (isInput) { labelEl.htmlFor = el.id; }
                        else { labelEl.removeAttribute('for'); }
                    }
                    if (isInput && focusRingClass) el.classList.add(focusRingClass); // Use class directly
                } else { /* console.warn(...) */ }
            };
            setupElement('base-max-energy', false);
            setupElement('max-multiplier', true, details.focusRing);
            setupElement('total-energy', false);
            setupElement('current-energy', false);
            setupElement('damage-per-power', true, details.focusRing);
            setupElement('regen-percent', true, details.focusRing);

            const regenBtn = poolDiv.querySelector('.regen-btn');
            if (regenBtn) {
                regenBtn.dataset.type = type;
                 // Listener attached via delegation in event-listeners.js
            }

            energyPoolsContainer.appendChild(poolClone);

        } catch (error) { console.error(`Error generating energy pool section for ${type}:`, error); }

        // --- Generate Slider Section ---
        try {
            const sliderClone = energySliderTemplate.content.cloneNode(true);
            const sliderSection = sliderClone.querySelector('.energy-slider-section');
             if (!sliderSection) throw new Error('Could not find .energy-slider-section in template clone');

            sliderSection.id = `${type}-slider-section`;
            sliderSection.dataset.type = type;

            const sliderLabel = sliderSection.querySelector('.slider-label');
            const energySlider = sliderSection.querySelector('.energy-slider');
            const valueDisplay = sliderSection.querySelector('.energy-slider-value-display');

            if (sliderLabel && energySlider) {
                 sliderLabel.htmlFor = `${type}-energy-slider`;
                 sliderLabel.textContent = `${details.name} Energy Used (%):`;
            }
            if (energySlider) {
                energySlider.id = `${type}-energy-slider`;
                energySlider.dataset.type = type;
                 // Apply focus ring style if defined in details
                if(details.focusRing) energySlider.classList.add(details.focusRing);
            }
            if (valueDisplay) { valueDisplay.id = `${type}-slider-value-display`; }

            slidersGrid.appendChild(sliderClone);

        } catch (error) { console.error(`Error generating energy slider section for ${type}:`, error); }
    });
    console.log("Energy sections generated from templates.");
}

/**
 * Generates the speed slider section if it doesn't exist.
 */
export function generateSpeedSlider() {
    if (document.getElementById('speed-slider-section')) return;
    // Uses imported elements and config
    if (!energySliderTemplate || !slidersGrid) { /* ... error ... */ return; }
    console.log("Attempting to generate speed slider DOM...");

    try {
        const sliderClone = energySliderTemplate.content.cloneNode(true);
        const sliderSection = sliderClone.querySelector('.energy-slider-section');
        if (!sliderSection) throw new Error('Could not find .energy-slider-section in template clone');

        sliderSection.id = `speed-slider-section`;
        sliderSection.dataset.type = 'speed';

        const sliderLabel = sliderSection.querySelector('.slider-label');
        const energySlider = sliderSection.querySelector('.energy-slider');
        const valueDisplay = sliderSection.querySelector('.energy-slider-value-display');

        if (sliderLabel && energySlider) {
            sliderLabel.htmlFor = `speed-slider`;
            sliderLabel.textContent = `${SPEED_DETAILS.name} Usage (%):`; // Use imported config
        }
        if (energySlider) {
            energySlider.id = `speed-slider`;
            energySlider.dataset.type = 'speed';
            if (SPEED_DETAILS.focusRing) energySlider.classList.add(SPEED_DETAILS.focusRing); // Use imported config
        }
        if (valueDisplay) {
            valueDisplay.id = `speed-slider-value-display`;
            const detailsSpan = valueDisplay.querySelector('.slider-details-value');
            if (detailsSpan) detailsSpan.textContent = '(S: 0, D: 0.00)';
        }

        slidersGrid.appendChild(sliderClone);
        console.log("Speed slider DOM structure generated (initially hidden).");

    } catch(error) { console.error("Error generating speed slider:", error); }
}


/**
 * Adds a new dynamic modifier box to the UI.
 * @param {object|null} [modifierData=null] - Optional data to pre-fill the box.
 */
export function addDynamicModifier(modifierData = null) {
    // Uses imported container element
    if (!dynamicModifiersContainer) { /* ... error ... */ return; }

    // Increment modifier count (assuming mutable export from state.js)
    // Note: Modifying imported 'let' directly isn't always ideal,
    // a setter function in state.js might be better (e.g., incrementModifierCount()).
    // For now, we directly increment the imported variable.
     let currentCount = dynamicModifierCount;
     currentCount++;
     dynamicModifierCount = currentCount; // Update the exported variable

    const modifierId = `dynamic-modifier-${dynamicModifierCount}`; // Use updated count
    const newModifierDiv = document.createElement('div');

    const initialType = modifierData?.type || 'additive';
    const initialValue = modifierData?.value || '0';
    const initialName = modifierData?.name || '';
    const isActiveAdditive = initialType === 'additive';
    const boxClasses = `dynamic-box p-4 mt-3 border rounded-md border-l-4 relative transition-all duration-300 ease-in-out animate__animated animate__bounceIn ${isActiveAdditive ? 'additive bg-success-light border-success' : 'multiplicative bg-ki/10 border-ki'}`;

    newModifierDiv.className = boxClasses;
    newModifierDiv.id = modifierId;
    // Uses imported escapeHtml util
    newModifierDiv.innerHTML = `<div class="absolute top-2 right-2"> ... </div>
        <div class="modifier-type-selector ..."> ... </div>
        <div class="grid ...">
             <div>
                 <label for="modifier-name-${modifierId}" class="lbl">Modifier Name:</label>
                 <input type="text" id="modifier-name-${modifierId}" placeholder="e.g., Buff" value="${escapeHtml(initialName)}" class="modifier-name-input ...">
             </div>
             <div>
                 <label for="modifier-value-${modifierId}" class="lbl">Value:</label>
                 <input type="text" id="modifier-value-${modifierId}" placeholder="e.g., 50 or 1.2" value="${escapeHtml(initialValue)}" class="modifier-value-input ...">
             </div>
        </div>`;

    dynamicModifiersContainer.appendChild(newModifierDiv);
    // Call the imported function to attach listeners AFTER appending
    addListenersToModifierBox(newModifierDiv);

    newModifierDiv.addEventListener('animationend', () => {
        newModifierDiv.classList.remove('animate__animated', 'animate__bounceIn');
    }, { once: true });
}


/**
 * Renders the list of saved forms in the Stats Panel.
 */
export function renderFormList() {
    // Uses imported container element and state variable
    if (!formListContainer) { /* ... error ... */ return; }
    formListContainer.innerHTML = '';

    // Uses imported state variable
    if (!characterForms || characterForms.length === 0) { /* ... render 'No forms' message ... */ return; }

    // Uses imported state variable, config, utils, formatters
    const formsByEnergyType = characterForms.reduce(/* ... */);
    const sortedEnergyTypes = Object.keys(formsByEnergyType).sort(/* ... */);

    for (const type of sortedEnergyTypes) {
        const groupDiv = document.createElement('div');
        // ... (set up groupDiv) ...
        formListContainer.appendChild(groupDiv);
        const listDiv = document.createElement('div');
        // ... (set up listDiv) ...

        formsByEnergyType[type].forEach(form => {
            const formItemContainer = document.createElement('div');
            // ... (set up formItemContainer) ...
            const formElement = document.createElement('span');
            // ... (set up formElement, text, title using formatters/utils) ...
            const deleteButton = document.createElement('button');
            // ... (set up deleteButton) ...

            // Attach the imported event handler directly
            deleteButton.addEventListener('click', handleDeleteFormClick); // Use imported handler

            formItemContainer.appendChild(formElement);
            formItemContainer.appendChild(deleteButton);
            listDiv.appendChild(formItemContainer);
        });
        formListContainer.appendChild(listDiv);
    }
}


/**
 * Renders the checkboxes in the main "Active Forms" section based on saved forms.
 */
export function renderActiveFormsSection() {
    // Uses imported container element and state variables
    if (!activeFormsListContainer) { /* ... error ... */ return; }
    activeFormsListContainer.innerHTML = '';

    // Uses imported state variable
    if (!characterForms || characterForms.length === 0) { /* ... render 'No forms' message ... */ return; }

    // Uses imported state variable
    const activeIds = Array.isArray(calculatorState.activeFormIds) ? calculatorState.activeFormIds : [];

    // Uses imported state variable
    characterForms.forEach(form => {
        const isChecked = activeIds.includes(form.id);
        const div = document.createElement('div');
        // ... (set up div) ...
        const checkbox = document.createElement('input');
        // ... (set up checkbox) ...

        // Attach the imported event handler directly
        checkbox.addEventListener('change', handleActiveFormChange); // Use imported handler

        const label = document.createElement('label');
        // ... (set up label, text, title using formatters/utils) ...

        div.appendChild(checkbox);
        div.appendChild(label);
        activeFormsListContainer.appendChild(div);
    });
}
import {
    energyPoolTemplate, energySliderTemplate, energyPoolsContainer, slidersGrid,
    dynamicModifiersContainer, formListContainer, activeFormsListContainer
    // Potentially other container or template elements if needed
} from './dom-elements.js';

import {
    ALL_ENERGY_TYPES, ENERGY_TYPE_DETAILS, SPEED_DETAILS
    // Potentially ALL_FORM_ENERGY_TYPES if needed elsewhere in generation
} from './config.js';

import { characterForms, calculatorState } from './state.js'; // Read-only access needed here

import { escapeHtml } from './utils.js';
import { formatSimpleNumber } from './formatters.js';

// TODO: Import event handlers that might be attached during generation
// import { handleActiveFormChange, handleDeleteFormClick } from './forms.js'; // Or wherever these handlers live
// import { updateEquationDisplay } from './equation.js'; // For modifier box listeners


// --- Helper Function (for Dynamic Modifiers) ---

/**
 * Attaches necessary event listeners to a newly created dynamic modifier box.
 * @param {HTMLElement} modifierDiv - The modifier box element.
 */
function addListenersToModifierBox(modifierDiv) {
    // TODO: Import updateEquationDisplay when equation.js exists
    const updateEquationDisplay = () => { console.warn('updateEquationDisplay not imported yet'); }; // Placeholder

    // Remove Button Listener
    modifierDiv.querySelector('.remove-dynamic-box')?.addEventListener('click', function() {
        const targetBox = document.getElementById(this.dataset.target);
        if (targetBox) {
            // TODO: Import triggerAnimation when utils.js exists/is imported
            // triggerAnimation(targetBox, 'bounceOut'); // Use imported function
             targetBox.classList.add('animate__animated', 'animate__bounceOut'); // Manual classes for now
             targetBox.addEventListener('animationend', () => {
                targetBox.remove();
                updateEquationDisplay(); // Update equation after removal
            }, { once: true });
        } else {
             updateEquationDisplay(); // Update equation even if box was already gone somehow
        }
    });

    // Type Selector (Additive/Multiplicative) Listener
    modifierDiv.querySelectorAll('.modifier-type-option').forEach(option => {
        option.addEventListener('click', function() {
            const box = this.closest('.dynamic-box');
            const value = this.dataset.value;
            // Update radio buttons (for accessibility)
            box.querySelectorAll('input[type="radio"]').forEach(radio => radio.checked = (radio.value === value));
            // Update visual active state
            box.querySelectorAll('.modifier-type-option').forEach(opt => {
                const isActive = opt.dataset.value === value;
                opt.classList.toggle('active', isActive);
                opt.setAttribute('aria-checked', isActive);
            });
            // Update box styling
            box.classList.remove('additive', 'multiplicative', 'bg-success-light', 'border-success', 'bg-ki/10', 'border-ki');
            box.classList.add(value === 'additive' ? 'additive' : 'multiplicative');
            box.classList.add(value === 'additive' ? 'bg-success-light' : 'bg-ki/10'); // Tailwind color classes
            box.classList.add(value === 'additive' ? 'border-success' : 'border-ki'); // Tailwind color classes
             updateEquationDisplay(); // Update equation on type change
        });
         // Keyboard accessibility for type options
        option.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    });

    // Input listeners (Value and Name) -> Update Equation
    const valueInput = modifierDiv.querySelector('.modifier-value-input');
    if (valueInput) {
        valueInput.addEventListener('input', updateEquationDisplay);
        valueInput.addEventListener('change', updateEquationDisplay); // Also trigger on change (e.g., paste)
    }
    const nameInput = modifierDiv.querySelector('.modifier-name-input');
    if (nameInput) {
        nameInput.addEventListener('input', updateEquationDisplay);
        nameInput.addEventListener('change', updateEquationDisplay);
    }
}


// --- Generator Functions ---

/**
 * Generates the energy pool sections and their corresponding slider sections
 * based on ALL_ENERGY_TYPES and templates. Appends them to containers.
 */
export function generateEnergySections() {
    if (!energyPoolTemplate || !energySliderTemplate || !energyPoolsContainer || !slidersGrid) {
        console.error("Required templates or containers not found! Cannot generate energy sections.");
        return;
    }
    energyPoolsContainer.innerHTML = ''; // Clear existing pools
    slidersGrid.innerHTML = ''; // Clear existing sliders in the grid

    ALL_ENERGY_TYPES.forEach(type => {
        const details = ENERGY_TYPE_DETAILS[type];
        if (!details) return; // Skip if no details defined for this type

        // --- Generate Energy Pool Section ---
        try {
            const poolClone = energyPoolTemplate.content.cloneNode(true);
            const poolDiv = poolClone.querySelector('.energy-pool');
            if (!poolDiv) throw new Error('Could not find .energy-pool in template clone');

            poolDiv.id = `${type}-pool`;
            poolDiv.style.display = 'none'; // Start hidden
            // Apply Tailwind classes for border color and gradient based on details
            poolDiv.classList.add(details.border, details.gradientTo);

            const titleEl = poolDiv.querySelector('.pool-title');
            if (titleEl) titleEl.textContent = `${details.name} Energy Pool`;

            // Setup inputs/spans with unique IDs and labels
            const setupElement = (selectorSuffix, isInput = true, focusRingClass = '') => {
                const el = poolDiv.querySelector(`.${selectorSuffix}`);
                const labelEl = poolDiv.querySelector(`.${selectorSuffix}-label`); // Assumes label has class like 'base-max-energy-label'
                if (el) {
                    el.id = `${type}-${selectorSuffix}`;
                    if (labelEl) {
                         if (isInput) { labelEl.htmlFor = el.id; }
                         else { labelEl.removeAttribute('for'); } // Remove 'for' if linked to a span
                    }
                     // Apply Tailwind focus ring class if provided
                     if (isInput && focusRingClass) el.classList.add(focusRingClass);
                } else {
                     console.warn(`Element with selector '.${selectorSuffix}' not found in pool template for ${type}`);
                }
            };
            setupElement('base-max-energy', false);
            setupElement('max-multiplier', true, details.focusRing);
            setupElement('total-energy', false);
            setupElement('current-energy', false);
            setupElement('damage-per-power', true, details.focusRing);
            setupElement('regen-percent', true, details.focusRing);

            const regenBtn = poolDiv.querySelector('.regen-btn');
            if (regenBtn) {
                regenBtn.dataset.type = type; // Add type identifier for the button handler
            } else {
                console.warn(`Regen button not found in pool template for ${type}`);
            }

            energyPoolsContainer.appendChild(poolClone);

        } catch (error) {
             console.error(`Error generating energy pool section for ${type}:`, error);
        }


        // --- Generate Slider Section ---
        try {
            const sliderClone = energySliderTemplate.content.cloneNode(true);
            const sliderSection = sliderClone.querySelector('.energy-slider-section');
             if (!sliderSection) throw new Error('Could not find .energy-slider-section in template clone');

            sliderSection.id = `${type}-slider-section`;
            sliderSection.dataset.type = type; // Link to energy type

            const sliderLabel = sliderSection.querySelector('.slider-label');
            const energySlider = sliderSection.querySelector('.energy-slider');
            const valueDisplay = sliderSection.querySelector('.energy-slider-value-display');

            if (sliderLabel && energySlider) {
                 sliderLabel.htmlFor = `${type}-energy-slider`;
                 sliderLabel.textContent = `${details.name} Energy Used (%):`;
            } else {
                 console.warn(`Slider label or input not found in slider template for ${type}`);
            }

            if (energySlider) {
                energySlider.id = `${type}-energy-slider`;
                energySlider.dataset.type = type; // Link slider too
                // Note: Specific thumb colors are handled by CSS targeting the ID
            }

            if (valueDisplay) {
                valueDisplay.id = `${type}-slider-value-display`;
            } else {
                 console.warn(`Slider value display not found in slider template for ${type}`);
            }

            slidersGrid.appendChild(sliderClone);

        } catch (error) {
             console.error(`Error generating energy slider section for ${type}:`, error);
        }

    });
    console.log("Energy sections generated from templates.");
}

/**
 * Generates the speed slider section if it doesn't exist.
 */
export function generateSpeedSlider() {
    // Check if speed slider already exists to prevent duplicates
    if (document.getElementById('speed-slider-section')) return;

    if (!energySliderTemplate || !slidersGrid) {
        console.error("Slider template or grid container not found! Cannot generate speed slider.");
        return;
    }
    console.log("Attempting to generate speed slider DOM...");

    try {
        const sliderClone = energySliderTemplate.content.cloneNode(true);
        const sliderSection = sliderClone.querySelector('.energy-slider-section');
        if (!sliderSection) throw new Error('Could not find .energy-slider-section in template clone');

        sliderSection.id = `speed-slider-section`;
        sliderSection.dataset.type = 'speed'; // Identify type

        const sliderLabel = sliderSection.querySelector('.slider-label');
        const energySlider = sliderSection.querySelector('.energy-slider');
        const valueDisplay = sliderSection.querySelector('.energy-slider-value-display');

        if (sliderLabel && energySlider) {
            sliderLabel.htmlFor = `speed-slider`;
            sliderLabel.textContent = `${SPEED_DETAILS.name} Usage (%):`;
        } else {
             console.warn(`Slider label or input not found in template for speed`);
        }

        if (energySlider) {
            energySlider.id = `speed-slider`; // Use specific ID for CSS
            energySlider.dataset.type = 'speed';
            // Apply Tailwind focus ring class
            if (SPEED_DETAILS.focusRing) energySlider.classList.add(SPEED_DETAILS.focusRing);
        }

        if (valueDisplay) {
            valueDisplay.id = `speed-slider-value-display`;
            // Modify the details span label for clarity (S for Speed)
            const detailsSpan = valueDisplay.querySelector('.slider-details-value');
            if (detailsSpan) detailsSpan.textContent = '(S: 0, D: 0.00)'; // Initial text
        } else {
            console.warn(`Slider value display not found in template for speed`);
        }

        slidersGrid.appendChild(sliderClone);
        console.log("Speed slider DOM structure generated (initially hidden).");

    } catch(error) {
        console.error("Error generating speed slider:", error);
    }
}


/**
 * Adds a new dynamic modifier box to the UI.
 * @param {object|null} [modifierData=null] - Optional data to pre-fill the box (e.g., from loaded state).
 * Expected: { name: string, value: string, type: 'additive'|'multiplicative' }
 */
export function addDynamicModifier(modifierData = null) {
    if (!dynamicModifiersContainer) {
         console.error("Dynamic modifiers container not found.");
         return;
    }

    // TODO: Access dynamicModifierCount from state.js (needs import)
    let dynamicModifierCount = window._dynamicModifierCount || 0; // Temporary workaround
    dynamicModifierCount++;
    window._dynamicModifierCount = dynamicModifierCount; // Temporary workaround

    const modifierId = `dynamic-modifier-${dynamicModifierCount}`;
    const newModifierDiv = document.createElement('div');

    // Get initial values from loaded data or defaults
    const initialType = modifierData?.type || 'additive'; // Default to additive
    const initialValue = modifierData?.value || '0';
    const initialName = modifierData?.name || '';
    const isActiveAdditive = initialType === 'additive';

    // Base classes + dynamic ones based on type
    const boxClasses = `dynamic-box p-4 mt-3 border rounded-md border-l-4 relative transition-all duration-300 ease-in-out animate__animated animate__bounceIn ${isActiveAdditive ? 'additive bg-success-light border-success' : 'multiplicative bg-ki/10 border-ki'}`; // Using Tailwind classes

    newModifierDiv.className = boxClasses;
    newModifierDiv.id = modifierId;
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
    addListenersToModifierBox(newModifierDiv); // Attach listeners right after creating

    // Clean up entry animation class
    newModifierDiv.addEventListener('animationend', () => {
        newModifierDiv.classList.remove('animate__animated', 'animate__bounceIn');
    }, { once: true });
}


/**
 * Renders the list of saved forms in the Stats Panel.
 */
export function renderFormList() {
    if (!formListContainer) {
        console.warn("Form list container not found in Stats Panel.");
        return;
    }
    formListContainer.innerHTML = ''; // Clear current list

    if (!characterForms || characterForms.length === 0) {
        formListContainer.innerHTML = '<p class="text-gray-500">No forms created yet.</p>';
        return;
    }

    // Group forms by energy type for better organization
    const formsByEnergyType = characterForms.reduce((acc, form) => {
        const type = form.energyType || 'None'; // Group undefined/null types under 'None'
        if (!acc[type]) acc[type] = [];
        acc[type].push(form);
        return acc;
    }, {});

    // Define sort order: Specific types first, then 'None'
    const sortedEnergyTypes = Object.keys(formsByEnergyType).sort((a, b) => {
        if (a === 'None') return 1; // 'None' goes last
        if (b === 'None') return -1;
        // Sort known types according to config order
        const aIndex = ALL_ENERGY_TYPES.indexOf(a);
        const bIndex = ALL_ENERGY_TYPES.indexOf(b);
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        // Fallback for unknown types (alphabetical)
        return a.localeCompare(b);
    });

    // Render each group
    for (const type of sortedEnergyTypes) {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'form-list-group';
        // Use details from config for name, fallback to the type key itself
        const groupName = (type === 'None') ? 'General' : (ENERGY_TYPE_DETAILS[type]?.name || type);
        groupDiv.innerHTML = `<h4>${escapeHtml(groupName)} Forms</h4>`; // Use h4 like original structure
        formListContainer.appendChild(groupDiv);

        const listDiv = document.createElement('div');
        listDiv.className = 'flex flex-col items-start gap-0.5'; // Vertical list per group

        formsByEnergyType[type].forEach(form => {
            const formItemContainer = document.createElement('div');
            formItemContainer.className = 'flex items-center gap-1 w-full'; // Container for name + delete button

            const formElement = document.createElement('span');
            formElement.className = 'form-list-item flex-grow'; // Uses Tailwind @apply style
            formElement.textContent = form.name;
            formElement.setAttribute('data-form-id', form.id);

            // Generate tooltip text including buff info
            let tooltip = `Form Mult: ${formatSimpleNumber(form.formMultiplier)}, Pool Mult: ${formatSimpleNumber(form.poolMaxMultiplier)}`;
            if (form.energyType !== 'None') tooltip += ` (${form.energyType})`;
            if (form.affectsResistances) tooltip += `, AC: ${formatSimpleNumber(form.acBonus)}, TR: ${formatSimpleNumber(form.trueResistanceBonus)}`;
            if (form.enableFormBuff) tooltip += ` | FM Buff: ${form.formBuffType === 'add' ? '+' : 'x'}${form.formBuffValue}/calc`;
            if (form.enablePoolBuff) tooltip += ` | PM Buff: ${form.poolBuffType === 'add' ? '+' : 'x'}${form.poolBuffValue}/calc`;
            formElement.title = tooltip;

            const deleteButton = document.createElement('button');
            deleteButton.textContent = '×';
            deleteButton.className = 'delete-form-btn text-red-500 hover:text-red-700 focus:outline-none focus:ring-1 focus:ring-red-300 rounded px-1 py-0 text-xs font-bold transition-colors duration-150 active:scale-95 flex-shrink-0';
            deleteButton.title = `Delete form "${escapeHtml(form.name)}"`;
            deleteButton.setAttribute('aria-label', `Delete form ${escapeHtml(form.name)}`);
            deleteButton.dataset.formId = form.id;

            // TODO: Attach event listener - this should call handleDeleteFormClick (imported later)
            // deleteButton.addEventListener('click', handleDeleteFormClick);

            formItemContainer.appendChild(formElement);
            formItemContainer.appendChild(deleteButton);
            listDiv.appendChild(formItemContainer);
        });
        formListContainer.appendChild(listDiv);
    }
}


/**
 * Renders the checkboxes in the main "Active Forms" section based on saved forms.
 */
export function renderActiveFormsSection() {
    if (!activeFormsListContainer) {
        console.error("Active forms container not found (#active-forms-list).");
        return;
    }
    activeFormsListContainer.innerHTML = ''; // Clear previous checkboxes

    if (!characterForms || characterForms.length === 0) {
        activeFormsListContainer.innerHTML = '<p class="text-gray-500 text-sm col-span-full">No forms created yet.</p>';
        return;
    }

    // Ensure activeFormIds exists and is an array in the state
    const activeIds = Array.isArray(calculatorState.activeFormIds) ? calculatorState.activeFormIds : [];

    characterForms.forEach(form => {
        const isChecked = activeIds.includes(form.id);
        const div = document.createElement('div');
        div.className = 'flex items-center gap-2 min-w-0'; // Prevent grid blowout

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `active-form-${form.id}`;
        checkbox.value = form.id;
        checkbox.checked = isChecked;
        checkbox.className = 'h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 flex-shrink-0';

        // TODO: Attach event listener - this should call handleActiveFormChange (imported later)
        // checkbox.addEventListener('change', handleActiveFormChange);

        const label = document.createElement('label');
        label.htmlFor = checkbox.id;
        label.textContent = form.name;
        label.className = 'text-sm text-gray-700 select-none truncate hover:text-purple-700 cursor-pointer';

        // Generate tooltip text including buff info (same as in renderFormList)
         let tooltip = `Form Mult: ${formatSimpleNumber(form.formMultiplier)}, Pool Mult: ${formatSimpleNumber(form.poolMaxMultiplier)}`;
         if (form.energyType !== 'None') tooltip += ` (${form.energyType})`;
         if (form.affectsResistances) tooltip += `, AC: ${formatSimpleNumber(form.acBonus)}, TR: ${formatSimpleNumber(form.trueResistanceBonus)}`;
         if (form.enableFormBuff) tooltip += ` | FM Buff: ${form.formBuffType === 'add' ? '+' : 'x'}${form.formBuffValue}/calc`;
         if (form.enablePoolBuff) tooltip += ` | PM Buff: ${form.poolBuffType === 'add' ? '+' : 'x'}${form.poolBuffValue}/calc`;
         label.title = tooltip;

        div.appendChild(checkbox);
        div.appendChild(label);
        activeFormsListContainer.appendChild(div);
    });
}