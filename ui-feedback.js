// ui-feedback.js - Functions for displaying messages and loading indicators.

// --- Import Dependencies ---
// Import the specific DOM elements needed by these functions
import { messageArea, loadingDiv, calculateBtn, resultDiv } from './dom-elements.js';
// Import triggerAnimation if used for message animations (optional)
// import { triggerAnimation } from './utils.js';

// --- UI Feedback Functions ---

/**
 * Displays a temporary message to the user.
 * @param {string} text - The message text.
 * @param {'info' | 'success' | 'error'} [type='info'] - The type of message (affects styling).
 */
export function showMessage(text, type = 'info') {
    // Use the imported messageArea directly
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
    // Optional: Use triggerAnimation utility if preferred over manual class add/remove
    // triggerAnimation(messageArea, animationClass);

    // Clean up animation classes after animation ends
    messageArea.addEventListener('animationend', () => {
        messageArea.classList.remove('animate__animated', animationClass);
    }, { once: true });

    // Automatically hide the message after a delay
    setTimeout(() => {
        messageArea.classList.add('hidden');
    }, 5000);
}

/**
 * Shows or hides the loading indicator and disables/enables the calculate button.
 * @param {boolean} isLoading - True to show loading, false to hide.
 */
export function showLoading(isLoading) {
    // Use imported elements directly
    if (!loadingDiv || !calculateBtn || !resultDiv) { // Added resultDiv check
        console.warn("Loading indicator, calculate button, or result div element not found.");
        return;
    }

    loadingDiv.classList.toggle('hidden', !isLoading);

    // Hide result area when loading starts
    if (isLoading) {
         resultDiv.classList.add('hidden');
    }

    // Disable/enable calculate button
    calculateBtn.disabled = isLoading;
    calculateBtn.classList.toggle('opacity-50', isLoading);
    calculateBtn.classList.toggle('cursor-not-allowed', isLoading);
}

// NOTE: Ensure there are no other declarations like 'const messageArea = ...' in this file.

