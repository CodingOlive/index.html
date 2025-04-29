// dom-generators.js - Functions for dynamically creating HTML elements using merged energy types.

// --- Import Dependencies ---
import {
    energyPoolTemplate, energySliderTemplate, energyPoolsContainer, slidersGrid,
    dynamicModifiersContainer, formListContainer, activeFormsListContainer,
    energyTypeSelect, // Added dropdown element
    formEnergyTypeSelect // For populating form creator dropdown
} from './dom-elements.js';

// Import Config data (only needed for standard type fallback/details)
import { ENERGY_TYPE_DETAILS, SPEED_DETAILS, ALL_ENERGY_TYPES, ALL_FORM_ENERGY_TYPES } from './config.js'; // Added ALL_ENERGY_TYPES, ALL_FORM_ENERGY_TYPES

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
import { handleActiveFormChange, handleDeleteFormClick } from './forms.js'; // Keep form handlers


// --- Generator Functions ---

/**
 * Generates the energy pool sections and their corresponding slider sections
 * based on the mergedEnergyTypes state array. Appends them to containers.
 */
export function generateEnergySections() {
    // Uses imported elements and mergedEnergyTypes state
    if (!energyPoolTemplate || !energySliderTemplate || !energyPoolsContainer || !slidersGrid) {
        console.error("DOM_GENERATOR_ERROR: Required templates or containers not found! Cannot generate energy sections.");
        return;
    }
    energyPoolsContainer.innerHTML = ''; // Clear existing pools
    slidersGrid.innerHTML = ''; // Clear existing sliders in the grid
    console.log("DOM_GENERATOR: Generating energy sections. Processing merged types:", JSON.stringify(mergedEnergyTypes));

    // --- Loop over MERGED types ---
    mergedEnergyTypes.forEach((energyType, index) => {
        console.log(`DOM_GENERATOR: Processing index ${index}, type:`, energyType);

        // Add check for invalid energyType object
        if (!energyType || typeof energyType !== 'object' || !energyType.id) {
            console.error(`DOM_GENERATOR_ERROR: Skipping invalid energy type at index ${index}:`, energyType);
            return; // Skip this iteration
        }

        const typeId = energyType.id; // Standard ID or custom ID
        const isStandard = energyType.isStandard;
        const details = energyType.details; // Contains config for standard types (borders, glows etc)
        const customColor = !isStandard ? energyType.hexColor : null; // Use hexColor for custom types

        // --- Generate Energy Pool Section ---
        try {
            const poolClone = energyPoolTemplate.content.cloneNode(true);
            const poolDiv = poolClone.querySelector('.energy-pool');
            if (!poolDiv) throw new Error('Could not find .energy-pool in template clone');

             // *** IMPORTANT: Setting the ID correctly ***
            poolDiv.id = `${typeId}-pool`;
            // *** ------------------------------------ ***

            poolDiv.style.display = 'none'; // Start hidden
            poolDiv.classList.add('hidden'); // Add hidden class as well

            // --- Styling ---
            if (isStandard && details) {
                // Apply Tailwind classes from config
                if (details.border) poolDiv.classList.add(details.border);
                 // Add gradient using Tailwind class if defined
                if (details.gradientTo) {
                    poolDiv.classList.add('bg-gradient-to-br', 'from-white', details.gradientTo);
                } else {
                    poolDiv.classList.add('bg-white'); // Default background if no gradient
                }
            } else if (!isStandard && customColor) {
                // Apply inline styles for custom colors
                poolDiv.style.borderLeftWidth = '4px';
                poolDiv.style.borderLeftStyle = 'solid';
                poolDiv.style.borderLeftColor = customColor;
                // Subtle gradient background using the custom color (adjust alpha as needed)
                poolDiv.style.background = `linear-gradient(to bottom right, white, ${customColor}20)`; // Use hex with alpha
            } else {
                 // Fallback border/bg if something is wrong
                poolDiv.classList.add('border-l-gray-400', 'bg-gray-50');
            }

            // Set Pool Title
            const titleEl = poolDiv.querySelector('.pool-title');
            if (titleEl) {
                titleEl.textContent = `${energyType.name} Energy Pool`;
                if (!isStandard && customColor) {
                     // Apply custom color to title if desired, or use Tailwind classes if possible
                     // titleEl.style.color = customColor; // Example: Direct style
                     // Or add a class if you have utility classes for text colors based on variables
                } else if (isStandard && details?.colorDark) {
                     // Optionally apply dark color variant class to title for standard types
                     // titleEl.classList.add(`text-${details.colorDark}`); // Requires text-color classes in Tailwind config
                }
            }

            // Setup inputs/spans IDs and labels
            const setupElement = (selectorSuffix, isInput = true, focusRingClass = '') => {
                const el = poolDiv.querySelector(`.${selectorSuffix}`); // Find by class
                const labelEl = poolDiv.querySelector(`label[for="${typeId}-${selectorSuffix}"], .${selectorSuffix}-label`); // Find label more flexibly
                if (el) {
                    el.id = `${typeId}-${selectorSuffix}`; // Set unique ID
                    if (labelEl) {
                        labelEl.htmlFor = el.id; // Link label to input
                    }
                     // Apply focus ring style
                     if (isInput) { // Only apply focus styles to actual input elements
                         el.classList.add('focus:ring-2', 'focus:outline-none'); // Basic focus styles
                         if (isStandard && focusRingClass) {
                             el.classList.add(focusRingClass); // Add specific color focus ring
                         } else if (!isStandard && customColor) {
                              // Use inline style for custom focus ring color
                              el.style.setProperty('--tw-ring-color', customColor);
                              el.classList.add('focus:ring-custom'); // Use a generic class activated by focus
                         } else {
                              el.classList.add('focus:ring-indigo-500'); // Default focus ring
                         }
                     }
                } else {
                    console.warn(`DOM_GENERATOR: Element with class '${selectorSuffix}' not found in pool template for type ${typeId}.`);
                }
            };

            const standardFocusRing = isStandard && details ? details.focusRing : '';
            setupElement('base-max-energy', false); // Readonly span
            setupElement('max-multiplier', true, standardFocusRing);
            setupElement('total-energy', false); // Readonly span
            setupElement('current-energy', false); // Readonly span
            setupElement('damage-per-power', true, standardFocusRing);
            setupElement('regen-percent', true, standardFocusRing);

            // Setup Regen Button
            const regenBtn = poolDiv.querySelector('.regen-btn');
            if (regenBtn) {
                regenBtn.dataset.type = typeId; // Store type ID for event listener
                 if (!isStandard && customColor) {
                    // Apply custom color style to button background
                     regenBtn.style.backgroundColor = customColor;
                     // Adjust hover/focus styles if needed via classes or more inline styles
                 } else if (isStandard && details?.color) {
                     // Apply standard color using Tailwind classes if available
                     // regenBtn.classList.add(`bg-${details.color}`, `hover:bg-${details.colorDark || details.color}`, `focus:ring-${details.focusRing || details.color}`);
                     // Using success colors as a fallback if specific colors aren't set up:
                     regenBtn.classList.add('bg-success', 'hover:bg-success-dark', 'focus:ring-success');
                 }
            }

            energyPoolsContainer.appendChild(poolClone);

        } catch (error) {
            console.error(`DOM_GENERATOR_ERROR: Error generating energy pool section for ${typeId}:`, error);
        }


        // --- Generate Slider Section ---
        try {
            const sliderClone = energySliderTemplate.content.cloneNode(true);
            const sliderSection = sliderClone.querySelector('.energy-slider-section');
            if (!sliderSection) throw new Error('Could not find .energy-slider-section in template');

            sliderSection.id = `${typeId}-slider-section`;
            sliderSection.dataset.type = typeId; // Store type ID for event listeners
            sliderSection.classList.add('hidden'); // Start hidden

            const sliderLabel = sliderSection.querySelector('.slider-label');
            const energySlider = sliderSection.querySelector('.energy-slider');
            const valueDisplay = sliderSection.querySelector('.energy-slider-value-display');

            if (sliderLabel && energySlider) {
                sliderLabel.htmlFor = `${typeId}-energy-slider`;
                sliderLabel.textContent = `${energyType.name} Usage (%):`;
            }
            if (energySlider) {
                energySlider.id = `${typeId}-energy-slider`;
                energySlider.dataset.type = typeId; // Also add to slider itself

                 // Apply focus ring style
                 energySlider.classList.add('focus:ring-2', 'focus:outline-none'); // Basic focus styles
                 if (isStandard && details?.focusRing) {
                      energySlider.classList.add(details.focusRing);
                 } else if (!isStandard && customColor) {
                     energySlider.style.setProperty('--slider-thumb-color', customColor); // For custom thumb color via CSS variable
                     energySlider.style.setProperty('--tw-ring-color', customColor); // For focus ring
                      energySlider.classList.add('focus:ring-custom'); // Use a generic class
                 } else {
                      energySlider.classList.add('focus:ring-indigo-500'); // Default focus
                 }
                 // Apply track/thumb colors later in ui-updater based on attack state
            }
            if (valueDisplay) {
                valueDisplay.id = `${typeId}-slider-value-display`;
            }

            slidersGrid.appendChild(sliderClone);

        } catch (error) {
            console.error(`DOM_GENERATOR_ERROR: Error generating energy slider section for ${typeId}:`, error);
        }
    });
    console.log("DOM_GENERATOR: Energy sections generation complete.");

     // Also generate the speed slider if it doesn't exist yet
     generateSpeedSlider();
     // Populate the Form Creator energy type dropdown
     populateFormEnergyDropdown();
}


/**
 * Populates the Energy Type Focus dropdown based on the mergedEnergyTypes state array.
 */
export function populateEnergyTypeDropdown() {
    if (!energyTypeSelect) { console.error("DOM_GENERATOR_ERROR: Focus Dropdown (#energy-type) not found."); return; }
    console.log("DOM_GENERATOR: Populating focus dropdown. Processing merged types:", JSON.stringify(mergedEnergyTypes));
    const currentFocus = energyTypeSelect.value; // Remember current selection
    energyTypeSelect.innerHTML = ''; // Clear existing options

    if (!mergedEnergyTypes || mergedEnergyTypes.length === 0) {
        console.warn("DOM_GENERATOR: No merged energy types available to populate focus dropdown.");
        const option = document.createElement('option');
        option.value = ''; option.textContent = 'No types defined'; option.disabled = true;
        energyTypeSelect.appendChild(option);
        return;
    }

    mergedEnergyTypes.forEach(et => {
       if (!et || !et.id || !et.name) {
           console.error("DOM_GENERATOR_ERROR: Skipping invalid energy type during focus dropdown population:", et);
           return;
       }
        const option = document.createElement('option');
        option.value = et.id; // Use the unique ID (standard key or custom ID)
        option.textContent = et.name; // Use the display name
        // Optionally add styling based on color? Might make dropdown messy.
        // if (et.hexColor) { option.style.color = et.hexColor; }
        energyTypeSelect.appendChild(option);
    });

    // Try to restore previous focus or default to the first valid type
    if (mergedEnergyTypes.some(et => et && et.id === currentFocus)) {
        energyTypeSelect.value = currentFocus;
    } else if (mergedEnergyTypes.length > 0 && mergedEnergyTypes[0] && mergedEnergyTypes[0].id) {
        // Default to the first type in the merged list if previous focus is invalid
        energyTypeSelect.value = mergedEnergyTypes[0].id;
    } else {
         console.warn("DOM_GENERATOR: Could not set a default value for energy type focus dropdown.");
         // Perhaps add a disabled "Select Type" option if needed
    }
    console.log("DOM_GENERATOR: Energy type focus dropdown populated. Current value:", energyTypeSelect.value);
     // Trigger change event manually IF the value actually changed OR if it's the initial load
     // This ensures the correct pool is displayed right after population/merge.
     energyTypeSelect.dispatchEvent(new Event('change'));
}


/**
 * Populates the Energy Type dropdown within the Form Creator section.
 */
export function populateFormEnergyDropdown() {
     if (!formEnergyTypeSelect) { console.warn("DOM_GENERATOR: Form Creator dropdown (#formEnergyTypeSelect) not found."); return; }
     const currentFormType = formEnergyTypeSelect.value; // Remember selection
     formEnergyTypeSelect.innerHTML = ''; // Clear

     // Add the "None" option first
     const noneOption = document.createElement('option');
     noneOption.value = 'None';
     noneOption.textContent = 'None (Applies to All Pools)';
     formEnergyTypeSelect.appendChild(noneOption);

     // Add options based on merged types
     mergedEnergyTypes.forEach(et => {
        if (!et || !et.id || !et.name) return; // Skip invalid
        const option = document.createElement('option');
        option.value = et.id;
        option.textContent = et.name;
        formEnergyTypeSelect.appendChild(option);
     });

     // Restore selection or default to "None"
     if (formEnergyTypeSelect.querySelector(`option[value="${currentFormType}"]`)) {
         formEnergyTypeSelect.value = currentFormType;
     } else {
          formEnergyTypeSelect.value = 'None'; // Default
     }
     console.log("DOM_GENERATOR: Form energy type dropdown populated.");
}


// --- Other generator functions ---

/**
 * Generates the speed slider section if it doesn't already exist.
 */
export function generateSpeedSlider() {
    // Check if speed slider section already exists
    if (document.getElementById('speed-slider-section')) {
        // console.log("DOM_GENERATOR: Speed slider already exists.");
        return;
    }
    if (!energySliderTemplate || !slidersGrid) {
         console.error("DOM_GENERATOR_ERROR: Required template or container for speed slider not found.");
        return;
    }
    console.log("DOM_GENERATOR: Attempting to generate speed slider DOM...");
    try {
        const sliderClone = energySliderTemplate.content.cloneNode(true);
        const sliderSection = sliderClone.querySelector('.energy-slider-section');
        if (!sliderSection) throw new Error('Could not find .energy-slider-section in template');

        sliderSection.id = `speed-slider-section`;
        sliderSection.dataset.type = 'speed'; // Set type for event handling
         sliderSection.classList.remove('hidden'); // Ensure it's potentially visible

        const sliderLabel = sliderSection.querySelector('.slider-label');
        const energySlider = sliderSection.querySelector('.energy-slider');
        const valueDisplay = sliderSection.querySelector('.energy-slider-value-display');

        if (sliderLabel && energySlider) {
            sliderLabel.htmlFor = `speed-slider`;
            sliderLabel.textContent = `${SPEED_DETAILS.name || 'Speed'} Usage (%):`; // Use name from config
        }
        if (energySlider) {
            energySlider.id = `speed-slider`;
            energySlider.dataset.type = 'speed'; // Also add to slider itself
            // Apply speed-specific focus styles
            energySlider.classList.add('focus:ring-2', 'focus:outline-none');
            if (SPEED_DETAILS.focusRing) {
                energySlider.classList.add(SPEED_DETAILS.focusRing);
            } else {
                 energySlider.classList.add('focus:ring-sky-500'); // Default sky color
            }
            // Apply speed-specific thumb color via CSS variable (if your CSS uses it)
            if(SPEED_DETAILS.color) {
                 energySlider.style.setProperty('--slider-thumb-color', `theme('colors.${SPEED_DETAILS.color}')`); // Use Tailwind theme function if possible or direct color value
            }
        }
        if (valueDisplay) {
            valueDisplay.id = `speed-slider-value-display`;
            const detailsSpan = valueDisplay.querySelector('.slider-details-value');
            if (detailsSpan) detailsSpan.textContent = '(S: 0, D: 0.00)'; // Initial text
        }

        slidersGrid.appendChild(sliderClone); // Append to the main grid
        console.log("DOM_GENERATOR: Speed slider DOM structure generated.");
    } catch(error) {
        console.error("DOM_GENERATOR_ERROR: Error generating speed slider:", error);
    }
}

/**
 * Adds a new dynamic modifier box to the UI.
 */
export function addDynamicModifier(modifierData = null) {
    if (!dynamicModifiersContainer) {
         console.error("DOM_GENERATOR_ERROR: Dynamic modifiers container not found.");
        return;
    }

    // Use getter/incrementer function from state.js to get unique ID
    const newCount = incrementAndGetModifierCount();
    const modifierIdBase = `dynamic-modifier-${newCount}`; // Base ID for elements within this box

    const newModifierDiv = document.createElement('div');
    const initialType = modifierData?.type || 'additive';
    const initialValue = modifierData?.value || '0';
    const initialName = modifierData?.name || '';
    const isActiveAdditive = initialType === 'additive';

    // Define base classes and type-specific classes
    const baseBoxClasses = 'dynamic-box p-4 mt-3 border rounded-md border-l-4 relative transition-all duration-300 ease-in-out animate__animated animate__fadeIn'; // Use consistent fadeIn
    const additiveClasses = 'additive bg-success-light border-success';
    const multiplicativeClasses = 'multiplicative bg-ki/10 border-ki'; // Using Ki color as example for multiplicative

    newModifierDiv.className = `${baseBoxClasses} ${isActiveAdditive ? additiveClasses : multiplicativeClasses}`;
    newModifierDiv.id = modifierIdBase + "-box"; // Unique ID for the box itself

    // Uses imported escapeHtml util
    newModifierDiv.innerHTML = `
        <div class="absolute top-1 right-1">
            <button class="remove-dynamic-box bg-error text-white rounded-md shadow-sm w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-error-dark focus:outline-none focus:ring-2 focus:ring-error focus:ring-offset-1 transition-transform active:scale-90" aria-label="Remove this modifier" data-target="${modifierIdBase}-box">×</button>
        </div>
        <div class="modifier-type-selector flex gap-2 mb-3 border-b pb-2" role="radiogroup" aria-labelledby="${modifierIdBase}-type-label">
            <span id="${modifierIdBase}-type-label" class="sr-only">Modifier Type</span>
            <div class="modifier-type-option additive ${isActiveAdditive ? 'active' : ''} flex-1 p-2 text-center border rounded-md cursor-pointer transition-all duration-150 ease-in-out text-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-success" data-value="additive" tabindex="0" role="radio" aria-checked="${isActiveAdditive}">
                <input type="radio" name="modifier-type-${modifierIdBase}" value="additive" class="sr-only" ${isActiveAdditive ? 'checked' : ''}> Additive (+)
            </div>
            <div class="modifier-type-option multiplicative ${!isActiveAdditive ? 'active' : ''} flex-1 p-2 text-center border rounded-md cursor-pointer transition-all duration-150 ease-in-out text-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-ki" data-value="multiplicative" tabindex="0" role="radio" aria-checked="${!isActiveAdditive}">
                <input type="radio" name="modifier-type-${modifierIdBase}" value="multiplicative" class="sr-only" ${!isActiveAdditive ? 'checked' : ''}> Multiplier (×)
            </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
                <label for="${modifierIdBase}-name" class="lbl">Modifier Name:</label>
                <input type="text" id="${modifierIdBase}-name" placeholder="e.g., Strength Buff" value="${escapeHtml(initialName)}" class="modifier-name-input inpt focus:ring-indigo-500">
            </div>
            <div>
                <label for="${modifierIdBase}-value" class="lbl">Value:</label>
                <input type="text" id="${modifierIdBase}-value" placeholder="${isActiveAdditive ? 'e.g., 50 or -10' : 'e.g., 1.2 or 0.8'}" value="${escapeHtml(initialValue)}" class="modifier-value-input inpt ${isActiveAdditive ? 'focus:ring-success' : 'focus:ring-ki'}">
            </div>
        </div>`;

    dynamicModifiersContainer.appendChild(newModifierDiv);
    addListenersToModifierBox(newModifierDiv); // Use imported listener setup from modifiers.js

    // Clean up animation class after it finishes
    newModifierDiv.addEventListener('animationend', () => {
        newModifierDiv.classList.remove('animate__animated', 'animate__fadeIn');
    }, { once: true });
}

/**
 * Renders the list of created forms in the Stats Panel.
 */
export function renderFormList() {
    if (!formListContainer) { return; }
    formListContainer.innerHTML = ''; // Clear previous list

    if (!characterForms || characterForms.length === 0) {
        formListContainer.innerHTML = '<p class="text-gray-500 text-xs px-1">No forms created yet.</p>';
        return;
    }

    // Group forms by energy type for better organization
    const formsByEnergyType = characterForms.reduce((acc, form) => {
        const type = form.energyType || 'None';
        if (!acc[type]) acc[type] = [];
        acc[type].push(form);
        return acc;
    }, {});

    // Define sort order: Standard types first (based on config order), then 'None', then custom types alphabetically
    const standardOrder = ALL_ENERGY_TYPES;
    const sortedEnergyTypes = Object.keys(formsByEnergyType).sort((a, b) => {
        const indexA = standardOrder.indexOf(a);
        const indexB = standardOrder.indexOf(b);

        if (a === 'None') return 1; // 'None' always comes after standard types
        if (b === 'None') return -1;
        if (indexA !== -1 && indexB !== -1) return indexA - indexB; // Sort standard types by config order
        if (indexA !== -1) return -1; // Standard types before custom types
        if (indexB !== -1) return 1; // Custom types after standard types
        // Sort custom types alphabetically if both are custom
         const nameA = mergedEnergyTypes.find(et => et.id === a)?.name || a;
         const nameB = mergedEnergyTypes.find(et => et.id === b)?.name || b;
         return nameA.localeCompare(nameB);
    });

    // Render each group
    for (const type of sortedEnergyTypes) {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'form-list-group mb-2'; // Add margin between groups

        // Get the proper name for the group header
        const typeDetails = mergedEnergyTypes.find(et => et.id === type);
        const groupName = (type === 'None') ? 'General Forms' : (typeDetails?.name || type); // Fallback to ID if name missing

        const header = document.createElement('h5');
         header.className = 'text-xs font-semibold text-gray-600 mb-1 border-b border-gray-200 pb-0.5';
         header.textContent = escapeHtml(groupName);
        groupDiv.appendChild(header);

        const listDiv = document.createElement('div');
        listDiv.className = 'flex flex-col gap-0.5'; // Reduced gap

        formsByEnergyType[type].forEach(form => {
            const formItemContainer = document.createElement('div');
            formItemContainer.className = 'flex items-center justify-between gap-1 w-full group'; // Use justify-between

            const formElement = document.createElement('span');
            formElement.className = 'form-list-item text-xs truncate flex-grow mr-1'; // Allow growth, add margin
            formElement.textContent = form.name;
            formElement.setAttribute('data-form-id', form.id);

            // Build detailed tooltip
            let tooltip = `Form Mult: ${formatSimpleNumber(form.formMultiplier)}, Pool Mult: ${formatSimpleNumber(form.poolMaxMultiplier)}`;
            if (form.energyType !== 'None') tooltip += ` (${form.energyType})`;
            if (form.affectsResistances) tooltip += `, AC: ${formatSimpleNumber(form.acBonus)}, TR: ${formatSimpleNumber(form.trueResistanceBonus)}`;
            if (form.enableFormBuff) tooltip += ` | FM Buff: ${form.formBuffType === 'add' ? '+' : 'x'}${form.formBuffValue}/calc`;
            if (form.enablePoolBuff) tooltip += ` | PM Buff: ${form.poolBuffType === 'add' ? '+' : 'x'}${form.poolBuffValue}/calc`;
            formElement.title = tooltip; // Set tooltip on the text span

            const deleteButton = document.createElement('button');
            deleteButton.textContent = '×';
             // Tailwind classes for a small, subtle delete button, visible on hover/focus within the group
            deleteButton.className = 'delete-form-btn text-xs text-red-400 hover:text-red-600 font-bold px-1 rounded opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-150 ease-in-out focus:outline-none focus:ring-1 focus:ring-red-500';
            deleteButton.title = `Delete form "${escapeHtml(form.name)}"`;
            deleteButton.setAttribute('aria-label', `Delete form ${escapeHtml(form.name)}`);
            deleteButton.dataset.formId = form.id;
            // Event listener is attached directly in event-listeners.js using delegation

            formItemContainer.appendChild(formElement);
            formItemContainer.appendChild(deleteButton);
            listDiv.appendChild(formItemContainer);
        });

        groupDiv.appendChild(listDiv);
        formListContainer.appendChild(groupDiv);
    }
}


/**
 * Renders the checkboxes for activating forms in the main calculator area.
 */
export function renderActiveFormsSection() {
    if (!activeFormsListContainer) { return; }
    activeFormsListContainer.innerHTML = ''; // Clear previous checkboxes

    if (!characterForms || characterForms.length === 0) {
        activeFormsListContainer.innerHTML = '<p class="text-gray-500 text-sm col-span-full">No forms defined. Go to Character Stats to create forms.</p>';
        return;
    }

    // Get currently active IDs from state
    const activeIds = Array.isArray(calculatorState.activeFormIds) ? calculatorState.activeFormIds : [];

    characterForms.forEach(form => {
        const isChecked = activeIds.includes(form.id);

        const div = document.createElement('div');
        div.className = 'flex items-center gap-1.5 min-w-0'; // Ensure minimum width is 0 to allow truncation

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `active-form-${form.id}`;
        checkbox.value = form.id;
        checkbox.checked = isChecked;
        // Consistent styling for checkboxes
        checkbox.className = 'h-4 w-4 rounded border-gray-300 text-purple-600 shadow-sm focus:ring-purple-500 focus:ring-offset-1';
        // Event listener attached via delegation in event-listeners.js

        const label = document.createElement('label');
        label.htmlFor = checkbox.id;
        label.textContent = form.name;
         // Allow truncation, basic styling
        label.className = 'text-sm font-medium text-gray-700 select-none cursor-pointer truncate';

        // Build detailed tooltip (same as in renderFormList)
        let tooltip = `Form Mult: ${formatSimpleNumber(form.formMultiplier)}, Pool Mult: ${formatSimpleNumber(form.poolMaxMultiplier)}`;
        const formEnergyTypeName = mergedEnergyTypes.find(et => et.id === form.energyType)?.name || form.energyType;
        if (form.energyType !== 'None') tooltip += ` (${formEnergyTypeName})`;
        if (form.affectsResistances) tooltip += `, AC: ${formatSimpleNumber(form.acBonus)}, TR: ${formatSimpleNumber(form.trueResistanceBonus)}`;
        if (form.enableFormBuff) tooltip += ` | FM Buff: ${form.formBuffType === 'add' ? '+' : 'x'}${formatSimpleNumber(form.formBuffValue)}/calc`;
        if (form.enablePoolBuff) tooltip += ` | PM Buff: ${form.poolBuffType === 'add' ? '+' : 'x'}${formatSimpleNumber(form.poolBuffValue)}/calc`;
        label.title = tooltip;

        div.appendChild(checkbox);
        div.appendChild(label);
        activeFormsListContainer.appendChild(div);
    });
}
