/**
 * Keyboard Shortcuts System
 * Provides global keyboard shortcuts for power users
 */

const shortcuts = new Map();
let enabled = true;

export const keyboardShortcuts = {
    /**
     * Register a keyboard shortcut
     * @param {string} key - Key combination (e.g., 'ctrl+k', 'alt+n', '/')
     * @param {Function} handler - Handler function
     * @param {Object} options - Options (description, preventDefault, etc.)
     */
    register(key, handler, options = {}) {
        const normalized = this.normalizeKey(key);
        shortcuts.set(normalized, {
            handler,
            key: normalized,
            description: options.description || '',
            preventDefault: options.preventDefault !== false,
            ...options
        });
    },

    /**
     * Unregister a keyboard shortcut
     */
    unregister(key) {
        const normalized = this.normalizeKey(key);
        shortcuts.delete(normalized);
    },

    /**
     * Enable/disable shortcuts
     */
    setEnabled(value) {
        enabled = value;
    },

    /**
     * Normalize key combination
     */
    normalizeKey(key) {
        return key.toLowerCase()
            .replace(/\s+/g, '')
            .replace(/command/g, 'meta')
            .replace(/cmd/g, 'meta');
    },

    /**
     * Get all registered shortcuts
     */
    getAll() {
        return Array.from(shortcuts.values());
    }
};

// Global keyboard event handler
if (typeof window !== 'undefined') {
    window.addEventListener('keydown', (e) => {
        if (!enabled) return;

        // Don't trigger shortcuts when typing in inputs
        const target = e.target;
        if (
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable
        ) {
            // Allow some shortcuts even in inputs (like escape)
            if (e.key !== 'Escape' && !e.ctrlKey && !e.metaKey) {
                return;
            }
        }

        const parts = [];
        if (e.ctrlKey || e.metaKey) parts.push('ctrl');
        if (e.altKey) parts.push('alt');
        if (e.shiftKey) parts.push('shift');
        parts.push(e.key.toLowerCase());

        const key = parts.join('+');
        const shortcut = shortcuts.get(key);

        if (shortcut) {
            if (shortcut.preventDefault) {
                e.preventDefault();
            }
            shortcut.handler(e);
        }
    });
}

// Default shortcuts
keyboardShortcuts.register('ctrl+k', () => {
    // Quick search - can be implemented later
    console.log('Quick search (Ctrl+K)');
}, { description: 'Open quick search' });

keyboardShortcuts.register('escape', () => {
    // Close modals/dropdowns
    const event = new CustomEvent('closeModals');
    window.dispatchEvent(event);
}, { description: 'Close modals/dropdowns' });

keyboardShortcuts.register('ctrl+/', () => {
    // Show shortcuts help
    const event = new CustomEvent('showShortcutsHelp');
    window.dispatchEvent(event);
}, { description: 'Show keyboard shortcuts' });

export default keyboardShortcuts;

