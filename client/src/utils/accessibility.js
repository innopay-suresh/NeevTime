/**
 * Accessibility Utilities
 * Helper functions for accessibility features
 */

/**
 * Announce message to screen readers
 * @param {string} message - Message to announce
 * @param {string} priority - 'polite' or 'assertive'
 */
export const announceToScreenReader = (message, priority = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
        document.body.removeChild(announcement);
    }, 1000);
};

/**
 * Move focus to element
 * @param {HTMLElement|string} element - Element or selector
 */
export const focusElement = (element) => {
    const el = typeof element === 'string' 
        ? document.querySelector(element) 
        : element;
    
    if (el && typeof el.focus === 'function') {
        el.focus();
    }
};

/**
 * Trap focus within container (for modals)
 * @param {HTMLElement} container - Container element
 * @param {HTMLElement} previousActiveElement - Element to return focus to
 */
export const trapFocus = (container, previousActiveElement) => {
    const focusableElements = container.querySelectorAll(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
            if (document.activeElement === firstElement) {
                lastElement.focus();
                e.preventDefault();
            }
        } else {
            if (document.activeElement === lastElement) {
                firstElement.focus();
                e.preventDefault();
            }
        }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    // Return cleanup function
    return () => {
        container.removeEventListener('keydown', handleTabKey);
        previousActiveElement?.focus();
    };
};

/**
 * Generate unique ID for ARIA associations
 */
export const generateId = (prefix = 'id') => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
};

export default {
    announceToScreenReader,
    focusElement,
    trapFocus,
    generateId
};

