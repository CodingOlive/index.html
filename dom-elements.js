// Inside dom-elements.js, add these:
export const speedSlider = document.getElementById('speed-slider');
export const speedSliderValueDisplay = document.getElementById('speed-slider-value-display');
// --- DOM Element References ---


// Main Containers / Screens
export const mainCalculatorContent = document.getElementById('main-calculator-content');
export const characterStatsScreen = document.getElementById('character-stats-screen');
export const mainTitle = document.querySelector('h1.text-3xl'); // Using querySelector for the h1

// Top Buttons & User Info
export const googleSignInBtn = document.getElementById('google-signin-btn');
export const signOutBtn = document.getElementById('sign-out-btn');
export const userInfoSpan = document.getElementById('user-info');
export const saveBtn = document.getElementById('save-state-btn');
export const loadBtn = document.getElementById('load-state-btn');
export const clearBtn = document.getElementById('clear-state-btn');
export const showCharacterStatsBtn = document.getElementById('show-character-stats-btn');

// Message Area
export const messageArea = document.getElementById('message-area');

// Damage Modifiers Section
export const baseDamageInput = document.getElementById('base-damage');
export const attackCompressionPointsInput = document.getElementById('attack-compression-points');
export const baseMultiplierInput = document.getElementById('base-multiplier');
export const formMultiplierInput = document.getElementById('form-multiplier'); // Read-only display for combined form multiplier
export const dynamicModifiersContainer = document.getElementById('dynamic-modifiers-container');
export const addDynamicBoxBtn = document.getElementById('add-dynamic-box');

// Active Forms Section (Main Area)
export const activeFormsSection = document.getElementById('active-forms-section');
export const activeFormsListContainer = document.getElementById('active-forms-list');

// Energy Focus Dropdown
export const energyTypeSelect = document.getElementById('energy-type');

// Containers for Dynamic Elements
export const energyPoolsContainer = document.getElementById('energy-pools-container');
export const slidersGrid = document.getElementById('all-sliders-container'); // Corrected ID if needed, or use 'sliders-grid' if that's the direct parent
export const allSlidersContainer = document.getElementById('all-sliders-container'); // Container for the sliders grid title + grid

// Attack Buttons
export const attacksSection = document.getElementById('attacks-section');
export const superAttackBtn = document.getElementById('super-attack-btn');
export const ultimateAttackBtn = document.getElementById('ultimate-attack-btn');
export const attackStatusMessage = document.getElementById('attack-status-message');

// Calculation & Result Area
export const calculateBtn = document.getElementById('calculate-btn');
export const loadingDiv = document.getElementById('loading');
export const resultDiv = document.getElementById('result');
export const resultValueEl = document.getElementById('result-value');
export const resultTotalEnergyUsedEl = document.getElementById('result-total-energy-used');
export const resultTotalExtraDamageEl = document.getElementById('result-total-extra-damage');
export const resultScientificEl = document.getElementById('result-scientific');
export const resultWordsEl = document.getElementById('result-words');
export const equationDisplayEl = document.getElementById('equation-display');

// Stats Panel
export const statsPanel = document.getElementById('stats-panel');
export const statsPanelHeader = document.getElementById('stats-panel-header');
export const statCurrentEnergyEl = document.getElementById('stat-current-energy');
export const statTotalDamageEl = document.getElementById('stat-total-damage');
export const statTotalEnergySpentEl = document.getElementById('stat-total-energy-spent');
export const statAttackCountEl = document.getElementById('stat-attack-count');
export const statHighestDamageEl = document.getElementById('stat-highest-damage');
export const resetAttackCountBtn = document.getElementById('reset-attack-count-btn');
export const statFormAcBonusEl = document.getElementById('stat-form-ac-bonus');
export const statFormTrBonusEl = document.getElementById('stat-form-tr-bonus');
export const statTotalAcEl = document.getElementById('stat-total-ac');
export const statTotalTrEl = document.getElementById('stat-total-tr');
export const statSpeedEl = document.getElementById('stat-speed');
export const formListContainer = document.getElementById('formListContainer'); // Saved forms list in stats panel

// Kaioken Section (within Stats Panel)
export const kaiokenSection = document.getElementById('kaioken-section');
export const kaiokenCheckbox = document.getElementById('kaioken-checkbox');
export const kaiokenDetails = document.getElementById('kaioken-details');
export const maxHealthInput = document.getElementById('max-health');
export const kaiokenStrainInput = document.getElementById('kaioken-strain');
export const currentHealthEl = document.getElementById('current-health');
export const regenHealthBtn = document.getElementById('regen-health-btn');

// Character Stats Screen Elements
export const characterNameInput = document.getElementById('character-name');
export const charBaseHealthInput = document.getElementById('char-base-health');
export const charBaseMultiplierInput = document.getElementById('char-base-multiplier');
export const charVitalityInput = document.getElementById('char-vitality');
export const charSoulPowerInput = document.getElementById('char-soul-power');
export const charSoulHpInput = document.getElementById('char-soul-hp');
export const charBaseAcInput = document.getElementById('char-base-ac');
export const charBaseTrInput = document.getElementById('char-base-tr');
export const charSpeedInput = document.getElementById('char-speed');

// Ryoko Mode Elements (within Character Stats)
export const ryokoCheckbox = document.getElementById('ryoko-checkbox');
export const ryokoEquationContainer = document.getElementById('ryoko-equation-input-container');
export const ryokoEquationInput = document.getElementById('ryoko-equation-input');

// Form Creator Elements (within Character Stats)
export const formCreatorSection = document.getElementById('formCreatorSection');
export const formNameInput = document.getElementById('formNameInput');
export const formEnergyTypeSelect = document.getElementById('formEnergyTypeSelect');
export const formFormMultiplierInput = document.getElementById('formFormMultiplierInput');
export const formPoolMaxMultiplierInput = document.getElementById('formPoolMaxMultiplierInput');
export const formAffectsResistancesCheckbox = document.getElementById('formAffectsResistancesCheckbox');
export const formResistanceBonusInputsDiv = document.getElementById('formResistanceBonusInputs');
export const formAcBonusInput = document.getElementById('formAcBonusInput');
export const formTrueResistanceBonusInput = document.getElementById('formTrueResistanceBonusInput');
export const addFormButton = document.getElementById('addFormButton');
// Form Buff Inputs (within Form Creator)
export const formEnableFormBuffCheckbox = document.getElementById('formEnableFormBuff');
export const formFormBuffValueInput = document.getElementById('formFormBuffValue');
export const formFormBuffTypeSelect = document.getElementById('formFormBuffType');
export const formEnablePoolBuffCheckbox = document.getElementById('formEnablePoolBuff');
export const formPoolBuffValueInput = document.getElementById('formPoolBuffValue');
export const formPoolBuffTypeSelect = document.getElementById('formPoolBuffType');

// Templates
export const energyPoolTemplate = document.getElementById('energy-pool-template');
export const energySliderTemplate = document.getElementById('energy-slider-template');


// Admin Panel Elements
export const adminPanelToggleBtn = document.getElementById('admin-panel-toggle-btn');
export const adminPanelSection = document.getElementById('adminPanelSection');
export const adminEditEnergyTypeId = document.getElementById('adminEditEnergyTypeId');
export const adminEnergyName = document.getElementById('adminEnergyName');
export const adminEnergyColor = document.getElementById('adminEnergyColor');
export const adminEnergyFormula = document.getElementById('adminEnergyFormula');
export const adminSaveEnergyTypeBtn = document.getElementById('adminSaveEnergyTypeBtn');
export const adminClearEnergyFormBtn = document.getElementById('adminClearEnergyFormBtn');
export const adminFormMessage = document.getElementById('adminFormMessage');
export const adminCustomEnergyList = document.getElementById('adminCustomEnergyList');
export const adminColorPreview = document.getElementById('adminColorPreview');