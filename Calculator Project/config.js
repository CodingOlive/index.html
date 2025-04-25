// --- Global State & Constants --- // Keep the comment for context if you like
const FIREBASE_SAVE_PATH_BASE = 'calculatorStates';
// let currentUser = null; // State - will move to state.js
// let totalDamageDealt = 0, totalEnergySpent = 0, attackCount = 0, highestDamage = 0; // State - will move to state.js
const LOCAL_STORAGE_KEY = 'energyCalculatorState_v12.0_multiform'; // Incremented version
// let poolAnimationTimeoutId = null; // Runtime state/UI related - likely stays in relevant UI module or main.js
const ALL_ENERGY_TYPES = ['ki', 'nen', 'chakra', 'magic', 'cursed', 'reiatsu', 'haki', 'alchemy', 'nature', 'force', 'origin', 'fundamental', 'other'];
const ALL_FORM_ENERGY_TYPES = ["None", ...ALL_ENERGY_TYPES];
// let dynamicModifierCount = 0; // Runtime state - will move to state.js or modifiers.js
// let activeAttacks = {}; // State - will move to state.js
const ATTACK_RESERVE_COLOR = '#fed7aa';
const SLIDER_TRACK_COLOR = '#e5e7eb';
const DEFAULT_RYOKO_EQUATION = '((11250000 * 19 * 10 * 25 * 5 * 10 * 5 * 470) / 2) * 110';

// Holds all defined form objects: { id, name, formMultiplier, poolMaxMultiplier, energyType, affectsResistances, acBonus, trBonus, enableFormBuff, formBuffValue, formBuffType, enablePoolBuff, poolBuffValue, poolBuffType }
// let characterForms = []; // State - will move to state.js

// State for active forms and combined bonuses derived from them
// let calculatorState = { ... }; // State - will move to state.js

const ENERGY_TYPE_DETAILS = {
    ki:{ name: 'Ki',color: 'ki',colorDark: 'ki-dark',gradientTo: 'to-orange-100',focusRing: 'focus:ring-ki-focus',staticGlow: 'static-glow-ki',pulseGlow: 'animate-pulse-glow-ki',border: 'border-l-ki' },
    nen:{ name: 'Nen',color: 'nen',colorDark: 'nen-dark',gradientTo: 'to-blue-100',focusRing: 'focus:ring-nen-focus',staticGlow: 'static-glow-nen',pulseGlow: 'animate-pulse-glow-nen',border: 'border-l-nen' },
    chakra:{ name: 'Chakra',color: 'chakra',colorDark: 'chakra-dark',gradientTo: 'to-purple-100',focusRing: 'focus:ring-chakra-focus',staticGlow: 'static-glow-chakra',pulseGlow: 'animate-pulse-glow-chakra',border: 'border-l-chakra' },
    magic:{ name: 'Magic',color: 'magic',colorDark: 'magic-dark',gradientTo: 'to-teal-100',focusRing: 'focus:ring-magic-focus',staticGlow: 'static-glow-magic',pulseGlow: 'animate-pulse-glow-magic',border: 'border-l-magic' },
    cursed:{ name: 'Cursed',color: 'cursed',colorDark: 'cursed-dark',gradientTo: 'to-red-100',focusRing: 'focus:ring-cursed-focus',staticGlow: 'static-glow-cursed',pulseGlow: 'animate-pulse-glow-cursed',border: 'border-l-cursed' },
    reiatsu:{ name: 'Reiatsu',color: 'reiatsu',colorDark: 'reiatsu-dark',gradientTo: 'to-slate-100',focusRing: 'focus:ring-reiatsu-focus',staticGlow: 'static-glow-reiatsu',pulseGlow: 'animate-pulse-glow-reiatsu',border: 'border-l-reiatsu' },
    haki:{ name: 'Haki',color: 'haki',colorDark: 'haki-dark',gradientTo: 'to-gray-100',focusRing: 'focus:ring-haki-focus',staticGlow: 'static-glow-haki',pulseGlow: 'animate-pulse-glow-haki',border: 'border-l-haki' },
    alchemy:{ name: 'Alchemy',color: 'alchemy',colorDark: 'alchemy-dark',gradientTo: 'to-amber-100',focusRing: 'focus:ring-alchemy-focus',staticGlow: 'static-glow-alchemy',pulseGlow: 'animate-pulse-glow-alchemy',border: 'border-l-alchemy' },
    nature:{ name: 'Nature',color: 'nature',colorDark: 'nature-dark',gradientTo: 'to-lime-100',focusRing: 'focus:ring-nature-focus',staticGlow: 'static-glow-nature',pulseGlow: 'animate-pulse-glow-nature',border: 'border-l-nature' },
    force:{ name: 'Force',color: 'force',colorDark: 'force-dark',gradientTo: 'to-fuchsia-100',focusRing: 'focus:ring-force-focus',staticGlow: 'static-glow-force',pulseGlow: 'animate-pulse-glow-force',border: 'border-l-force' },
    origin:{ name: 'Origin',color: 'origin',colorDark: 'origin-dark',gradientTo: 'to-indigo-100',focusRing: 'focus:ring-origin-focus',staticGlow: 'static-glow-origin',pulseGlow: 'animate-pulse-glow-origin',border: 'border-l-origin' },
    fundamental:{ name: 'Fundamental',color: 'fundamental',colorDark: 'fundamental-dark',gradientTo: 'to-gray-100',focusRing: 'focus:ring-fundamental-focus',staticGlow: 'static-glow-fundamental',pulseGlow: 'animate-pulse-glow-fundamental',border: 'border-l-fundamental' },
    other:{ name: 'Other',color: 'other',colorDark: 'other-dark',gradientTo: 'to-amber-100',focusRing: 'focus:ring-other-focus',staticGlow: 'static-glow-other',pulseGlow: 'animate-pulse-glow-other',border: 'border-l-other' },
};

const SPEED_DETAILS = {
    name: 'Speed',
    color: 'sky-500',
    colorDark: 'sky-600',
    focusRing: 'focus:ring-speed-focus',
};
export {
    FIREBASE_SAVE_PATH_BASE,
    LOCAL_STORAGE_KEY,
    ALL_ENERGY_TYPES,
    ALL_FORM_ENERGY_TYPES,
    ATTACK_RESERVE_COLOR,
    SLIDER_TRACK_COLOR,
    DEFAULT_RYOKO_EQUATION,
    ENERGY_TYPE_DETAILS,
    SPEED_DETAILS
};