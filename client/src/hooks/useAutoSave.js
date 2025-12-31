import { useEffect, useRef } from 'react';

/**
 * Auto-save hook for forms
 * Saves form data to localStorage and restores on mount
 * 
 * @param {string} formId - Unique identifier for the form
 * @param {object} formData - Current form data
 * @param {object} options - Configuration options
 * @returns {object} - { hasDraft, clearDraft, restoreDraft }
 */
export const useAutoSave = (formId, formData, options = {}) => {
    const {
        enabled = true,
        debounceMs = 1000,
        excludeKeys = [],
        onSave = null
    } = options;

    const storageKey = `form_draft_${formId}`;
    const timeoutRef = useRef(null);
    const isInitialMount = useRef(true);

    // Save draft to localStorage
    const saveDraft = (data) => {
        if (!enabled) return;

        try {
            // Filter out excluded keys
            const filteredData = Object.keys(data).reduce((acc, key) => {
                if (!excludeKeys.includes(key) && data[key] !== undefined && data[key] !== null && data[key] !== '') {
                    acc[key] = data[key];
                }
                return acc;
            }, {});

            if (Object.keys(filteredData).length > 0) {
                const draft = {
                    data: filteredData,
                    timestamp: Date.now()
                };
                localStorage.setItem(storageKey, JSON.stringify(draft));
                
                if (onSave) {
                    onSave(draft);
                }
            }
        } catch (err) {
            console.warn('Failed to save form draft:', err);
        }
    };

    // Auto-save with debounce
    useEffect(() => {
        // Don't save on initial mount
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            saveDraft(formData);
        }, debounceMs);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [formData, debounceMs, enabled]);

    // Restore draft from localStorage
    const restoreDraft = () => {
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                const draft = JSON.parse(saved);
                // Check if draft is not too old (optional: 7 days)
                const maxAge = 7 * 24 * 60 * 60 * 1000;
                if (Date.now() - draft.timestamp < maxAge) {
                    return draft.data;
                } else {
                    localStorage.removeItem(storageKey);
                }
            }
        } catch (err) {
            console.warn('Failed to restore form draft:', err);
        }
        return null;
    };

    // Check if draft exists
    const hasDraft = () => {
        try {
            return localStorage.getItem(storageKey) !== null;
        } catch {
            return false;
        }
    };

    // Clear draft
    const clearDraft = () => {
        try {
            localStorage.removeItem(storageKey);
        } catch (err) {
            console.warn('Failed to clear form draft:', err);
        }
    };

    return {
        hasDraft: hasDraft(),
        restoreDraft,
        clearDraft
    };
};

export default useAutoSave;

