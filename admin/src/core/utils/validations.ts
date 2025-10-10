import { getValidationMessage } from '@/core/messages/message';

export interface ValidationResult {
    isValid: boolean;
    error?: string;
}

export const validateMobile = (mobile: string): ValidationResult => {
    if (!mobile) {
        return {
            isValid: false,
            error: getValidationMessage('mobileRequired')
        };
    }
    
    if (!/^09[0-9]{9}$/.test(mobile)) {
        return {
            isValid: false,
            error: getValidationMessage('mobileInvalid')
        };
    }
    
    return { isValid: true };
};

/**
 * Validate email address format
 * @param email - Email string (can be empty for optional fields)
 * @param required - Whether email is required
 * @returns ValidationResult object
 */
export const validateEmail = (email: string, required: boolean = false): ValidationResult => {
    if (!email) {
        if (required) {
            return {
                isValid: false,
                error: getValidationMessage('emailRequired')
            };
        }
        return { isValid: true };
    }
    
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
        return {
            isValid: false,
            error: getValidationMessage('emailInvalid')
        };
    }
    
    return { isValid: true };
};

/**
 * Validate password strength
 * @param password - Password string
 * @returns ValidationResult object
 */
export const validatePassword = (password: string): ValidationResult => {
    if (!password) {
        return {
            isValid: false,
            error: getValidationMessage('passwordRequired')
        };
    }
    
    if (password.length < 8) {
        return {
            isValid: false,
            error: getValidationMessage('passwordMinLength')
        };
    }
    
    if (!/[A-Z]/.test(password)) {
        return {
            isValid: false,
            error: getValidationMessage('passwordUppercase')
        };
    }
    
    if (!/[a-z]/.test(password)) {
        return {
            isValid: false,
            error: getValidationMessage('passwordLowercase')
        };
    }
    
    if (!/[0-9]/.test(password)) {
        return {
            isValid: false,
            error: getValidationMessage('passwordNumber')
        };
    }
    
    if (!/[!@#$%^&*]/.test(password)) {
        return {
            isValid: false,
            error: getValidationMessage('passwordSpecial')
        };
    }
    
    return { isValid: true };
};

/**
 * Validate Iranian national ID
 * @param nationalId - National ID string
 * @param required - Whether national ID is required
 * @returns ValidationResult object
 */
export const validateNationalId = (nationalId: string, required: boolean = false): ValidationResult => {
    if (!nationalId) {
        if (required) {
            return {
                isValid: false,
                error: getValidationMessage('nationalIdRequired')
            };
        }
        return { isValid: true };
    }
    
    // Remove any non-digit characters
    const cleanId = nationalId.replace(/\D/g, '');
    
    if (cleanId.length !== 10) {
        return {
            isValid: false,
            error: getValidationMessage('nationalIdLength')
        };
    }
    
    // Check for repeated digits
    if (/^(\d)\1{9}$/.test(cleanId)) {
        return {
            isValid: false,
            error: getValidationMessage('nationalIdInvalid')
        };
    }
    
    // Calculate checksum
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cleanId[i]) * (10 - i);
    }
    
    const remainder = sum % 11;
    const checkDigit = parseInt(cleanId[9]);
    
    const isValid = remainder < 2 ? checkDigit === remainder : checkDigit === 11 - remainder;
    
    if (!isValid) {
        return {
            isValid: false,
            error: getValidationMessage('nationalIdInvalid')
        };
    }
    
    return { isValid: true };
};

/**
 * Filter input to allow only numeric characters
 * @param value - Input value
 * @returns Filtered numeric string
 */
export const filterNumericOnly = (value: string): string => {
    return value.replace(/[^0-9]/g, '');
};

/**
 * Filter input to allow only alphabetic characters (Persian/English)
 * @param value - Input value
 * @returns Filtered alphabetic string
 */
export const filterAlphabeticOnly = (value: string): string => {
    return value.replace(/[^a-zA-Zآ-ی\s]/g, '');
};

/**
 * Validate required field
 * @param value - Field value
 * @param fieldName - Name of the field for error message
 * @returns ValidationResult object
 */
export const validateRequired = (value: string, fieldName: string): ValidationResult => {
    if (!value || value.trim() === '') {
        return {
            isValid: false,
            error: getValidationMessage('required', { field: fieldName })
        };
    }
    
    return { isValid: true };
};

// Legacy functions for backward compatibility (returning string | null)
export const validateMobileLegacy = (mobile: string): string | null => {
    const result = validateMobile(mobile);
    return result.isValid ? null : result.error!;
};

export const validateEmailLegacy = (email: string): string | null => {
    const result = validateEmail(email, false);
    return result.isValid ? null : result.error!;
};

export const validatePasswordLegacy = (password: string): string | null => {
    const result = validatePassword(password);
    return result.isValid ? null : result.error!;
};