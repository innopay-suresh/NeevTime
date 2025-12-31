/**
 * Form Validation Hook
 * 
 * Provides comprehensive form validation with:
 * - Real-time validation feedback
 * - Common validation patterns
 * - Inline error messages
 * - Submit blocking until valid
 * 
 * @author DevTeam
 * @version 1.0.0
 */

import { useState, useCallback, useMemo } from 'react';

// Common validation patterns
export const PATTERNS = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,
    employeeCode: /^[A-Za-z0-9_-]{2,20}$/,
    alphanumeric: /^[A-Za-z0-9]+$/,
    numeric: /^[0-9]+$/,
    aadhaar: /^\d{12}$/,
    pincode: /^\d{6}$/,
    pan: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
    passport: /^[A-Z]{1}[0-9]{7}$/,
    url: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/
};

// Validation rule creators
export const validators = {
    required: (message = 'This field is required') => (value) => {
        if (value === null || value === undefined || value === '' ||
            (Array.isArray(value) && value.length === 0)) {
            return message;
        }
        return null;
    },

    minLength: (min, message) => (value) => {
        if (value && value.length < min) {
            return message || `Minimum ${min} characters required`;
        }
        return null;
    },

    maxLength: (max, message) => (value) => {
        if (value && value.length > max) {
            return message || `Maximum ${max} characters allowed`;
        }
        return null;
    },

    pattern: (regex, message = 'Invalid format') => (value) => {
        if (value && !regex.test(value)) {
            return message;
        }
        return null;
    },

    email: (message = 'Please enter a valid email address') => (value) => {
        if (value && !PATTERNS.email.test(value)) {
            return message;
        }
        return null;
    },

    phone: (message = 'Please enter a valid phone number') => (value) => {
        if (value && !PATTERNS.phone.test(value)) {
            return message;
        }
        return null;
    },

    employeeCode: (message = 'Employee code must be 2-20 alphanumeric characters') => (value) => {
        if (value && !PATTERNS.employeeCode.test(value)) {
            return message;
        }
        return null;
    },

    numeric: (message = 'Only numbers allowed') => (value) => {
        if (value && !PATTERNS.numeric.test(value)) {
            return message;
        }
        return null;
    },

    min: (minValue, message) => (value) => {
        if (value !== '' && Number(value) < minValue) {
            return message || `Value must be at least ${minValue}`;
        }
        return null;
    },

    max: (maxValue, message) => (value) => {
        if (value !== '' && Number(value) > maxValue) {
            return message || `Value must be at most ${maxValue}`;
        }
        return null;
    },

    match: (fieldName, message) => (value, formValues) => {
        if (value !== formValues[fieldName]) {
            return message || `Must match ${fieldName}`;
        }
        return null;
    },

    custom: (validatorFn, message = 'Invalid value') => (value, formValues) => {
        if (!validatorFn(value, formValues)) {
            return message;
        }
        return null;
    }
};

/**
 * Form validation hook
 * 
 * @param {Object} initialValues - Initial form values
 * @param {Object} validationRules - Validation rules per field
 * @returns {Object} Form state and utilities
 */
export function useFormValidation(initialValues = {}, validationRules = {}) {
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Validate single field
    const validateField = useCallback((name, value, allValues = values) => {
        const rules = validationRules[name];
        if (!rules) return null;

        const ruleList = Array.isArray(rules) ? rules : [rules];

        for (const rule of ruleList) {
            const error = rule(value, allValues);
            if (error) return error;
        }

        return null;
    }, [validationRules, values]);

    // Validate all fields
    const validateAll = useCallback(() => {
        const newErrors = {};
        let isValid = true;

        Object.keys(validationRules).forEach(name => {
            const error = validateField(name, values[name], values);
            if (error) {
                newErrors[name] = error;
                isValid = false;
            }
        });

        setErrors(newErrors);
        return isValid;
    }, [validationRules, values, validateField]);

    // Handle field change
    const handleChange = useCallback((name, value) => {
        setValues(prev => {
            const newValues = { ...prev, [name]: value };

            // Validate on change if field was touched
            if (touched[name]) {
                const error = validateField(name, value, newValues);
                setErrors(prev => ({ ...prev, [name]: error }));
            }

            return newValues;
        });
    }, [touched, validateField]);

    // Handle field blur (mark as touched and validate)
    const handleBlur = useCallback((name) => {
        setTouched(prev => ({ ...prev, [name]: true }));
        const error = validateField(name, values[name]);
        setErrors(prev => ({ ...prev, [name]: error }));
    }, [values, validateField]);

    // Handle form submission
    const handleSubmit = useCallback((onSubmit) => async (e) => {
        e?.preventDefault();

        // Mark all fields as touched
        const allTouched = {};
        Object.keys(validationRules).forEach(name => {
            allTouched[name] = true;
        });
        setTouched(allTouched);

        // Validate all
        if (!validateAll()) {
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit(values);
        } finally {
            setIsSubmitting(false);
        }
    }, [validationRules, validateAll, values]);

    // Reset form
    const reset = useCallback((newValues = initialValues) => {
        setValues(newValues);
        setErrors({});
        setTouched({});
        setIsSubmitting(false);
    }, [initialValues]);

    // Set field value programmatically
    const setValue = useCallback((name, value) => {
        handleChange(name, value);
    }, [handleChange]);

    // Set multiple values at once
    const setMultipleValues = useCallback((newValues) => {
        setValues(prev => ({ ...prev, ...newValues }));
    }, []);

    // Check if form is valid
    const isValid = useMemo(() => {
        return Object.keys(validationRules).every(name => {
            const error = validateField(name, values[name], values);
            return !error;
        });
    }, [validationRules, values, validateField]);

    // Get field props for easy binding
    const getFieldProps = useCallback((name) => ({
        value: values[name] ?? '',
        onChange: (e) => handleChange(name, e?.target?.value ?? e),
        onBlur: () => handleBlur(name),
        error: touched[name] ? errors[name] : null,
        touched: touched[name],
        name
    }), [values, errors, touched, handleChange, handleBlur]);

    return {
        values,
        errors,
        touched,
        isSubmitting,
        isValid,
        handleChange,
        handleBlur,
        handleSubmit,
        validateField,
        validateAll,
        reset,
        setValue,
        setMultipleValues,
        getFieldProps,
        setValues,
        setErrors
    };
}

export default useFormValidation;
