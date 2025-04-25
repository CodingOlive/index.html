// ui-feedback.js - Functions for displaying messages and loading indicators.

// ui-feedback.js - Functions for displaying messages and loading indicators.

// --- Import Dependencies ---
import { messageArea, loadingDiv, calculateBtn, resultDiv } from './dom-elements.js';
// We don't strictly need triggerAnimation here if we rely on Animate.css classes directly

// --- UI Feedback Functions ---

// ... (keep the rest of the code, including showMessage and showLoading functions, exactly as it was) ...

/**
 * Displays a temporary message to the user.
 * @param {string} text - The message text.
 * @param {'info' | 'success' | 'error'} [type='info'] - The type of message (affects styling).
 */
export function showMessage(text, type = 'info') {
    if (!messageArea) {
        console.warn("Message area element not found. Cannot show message:", text);
        return;
    }
    // ... rest of showMessage function ...
}

/**
 * Shows or hides the loading indicator and disables/enables the calculate button.
 * @param {boolean} isLoading - True to show loading, false to hide.
 */
export function showLoading(isLoading) {
    if (!loadingDiv || !calculateBtn) {
        console.warn("Loading indicator or calculate button element not found.");
        return;
    }

    loadingDiv.classList.toggle('hidden', !isLoading);

    // Hide result area when loading starts
    // Use the imported resultDiv
    if (isLoading && resultDiv) {
         resultDiv.classList.add('hidden');
    }

    // Disable/enable calculate button
    calculateBtn.disabled = isLoading;
    calculateBtn.classList.toggle('opacity-50', isLoading);
    calculateBtn.classList.toggle('cursor-not-allowed', isLoading);
}
// --- Import Dependencies ---
// TODO: Add import later when dom-elements.js is finalized
import { messageArea, loadingDiv, calculateBtn } from './dom-elements.js';

// We might need triggerAnimation if we keep that logic separate
// import { triggerAnimation } from './utils.js'; // Or './ui-manager.js'

// --- UI Feedback Functions ---

/**
 * Displays a temporary message to the user.
 * @param {string} text - The message text.
 * @param {'info' | 'success' | 'error'} [type='info'] - The type of message (affects styling).
 */
export function showMessage(text, type = 'info') {
    if (!messageArea) {
        console.warn("Message area element not found. Cannot show message:", text);
        return;
    }

    messageArea.textContent = text;
    // Base classes including animate.css integration
    messageArea.className = 'mb-4 p-3 rounded-md text-sm border animate__animated';
    // Clear previous state/animations first
    messageArea.classList.remove('hidden', 'animate__fadeIn', 'animate__shakeX');

    let animationClass = 'animate__fadeIn'; // Default animation

    // Apply type-specific styles and animation
    switch (type) {
        case 'error':
            messageArea.classList.add('bg-error-light', 'text-error-dark', 'border-error');
            animationClass = 'animate__shakeX'; // Use shake for errors
            break;
        case 'success':
            messageArea.classList.add('bg-success-light', 'text-success-dark', 'border-success');
            break;
        case 'info': // Default case
        default:
            messageArea.classList.add('bg-blue-100', 'text-blue-800', 'border-blue-300');
            break;
    }

    // Trigger the animation
    messageArea.classList.add(animationClass);

    // Clean up animation classes after animation ends
    messageArea.addEventListener('animationend', () => {
        messageArea.classList.remove('animate__animated', animationClass);
    }, { once: true });

    // Automatically hide the message after a delay
    // Consider clearing previous timeouts if messages can overlap quickly
    setTimeout(() => {
        // Use a fade-out animation or simply hide
        messageArea.classList.add('hidden');
    }, 5000); // Hide after 5 seconds
}

/**
 * Shows or hides the loading indicator and disables/enables the calculate button.
 * @param {boolean} isLoading - True to show loading, false to hide.
 */
export function showLoading(isLoading) {
    if (!loadingDiv || !calculateBtn) {
        console.warn("Loading indicator or calculate button element not found.");
        return;
    }

    loadingDiv.classList.toggle('hidden', !isLoading);

    // Hide result area when loading starts
    // TODO: Import resultDiv from dom-elements.js later
    // const { resultDiv } = await import('./dom-elements.js'); // Placeholder
    const resultDiv = document.getElementById('result'); // Temporary lookup
    if (isLoading && resultDiv) {
         resultDiv.classList.add('hidden');
    }

    // Disable/enable calculate button
    calculateBtn.disabled = isLoading;
    calculateBtn.classList.toggle('opacity-50', isLoading);
    calculateBtn.classList.toggle('cursor-not-allowed', isLoading);
}