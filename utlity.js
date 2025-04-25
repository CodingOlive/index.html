/**
 * Safely parses a string or number into a float, returning a default value if parsing fails or input is invalid.
 * Handles commas as thousands separators.
 * @param {*} value - The value to parse.
 * @param {number} [defaultValue=0] - The value to return if parsing fails.
 * @returns {number} The parsed float or the default value.
 */
function safeParseFloat(value, defaultValue = 0) {
    if (typeof value !== 'string' && typeof value !== 'number') return defaultValue;
    // Remove commas before parsing
    const num = parseFloat(String(value).replace(/,/g, ''));
    return isNaN(num) ? defaultValue : num;
}

/**
 * Escapes HTML special characters in a string to prevent XSS.
 * @param {string} unsafe - The potentially unsafe string.
 * @returns {string} The escaped string.
 */
function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return '';
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
 }

 /**
 * Triggers a CSS animation using Animate.css conventions.
 * @param {HTMLElement} element - The DOM element to animate.
 * @param {string} animationName - The name of the animation (e.g., 'fadeIn', 'pulse', 'animate__bounceIn').
 * @param {number} [duration=800] - Optional duration (primarily for potential future use, Animate.css duration is usually set in CSS).
 */
 function triggerAnimation(element, animationName, duration = 800) {
    if (!element || !animationName) return;

    const animateCSSBase = 'animate__animated';
    // Ensure the class starts with animate__ if it doesn't already
    const animationClass = animationName.startsWith('animate__') ? animationName : `animate__${animationName}`;

    const classesToAdd = [animateCSSBase, animationClass];

    // Remove potentially lingering animation classes
    element.classList.remove(...classesToAdd);

    // Reflow to ensure the animation restarts if triggered again quickly
    void element.offsetWidth;

    // Add classes to trigger animation
    element.classList.add(...classesToAdd);

    // Remove classes after animation ends to clean up and allow re-triggering
    element.addEventListener('animationend', () => {
        element.classList.remove(...classesToAdd);
    }, { once: true });
}


// Export the functions to make them available to other modules
export {
    safeParseFloat,
    escapeHtml,
    triggerAnimation
};