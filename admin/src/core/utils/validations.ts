import { getValidation } from '@/core/messages';

export interface ValidationResult {
    isValid: boolean;
    error?: string;
}

export const validateMobile = (mobile: string): ValidationResult => {
    if (!mobile) {
        return {
            isValid: false,
            error: getValidation('mobileRequired')
        };
    }
    
    if (!/^09[0-9]{9}$/.test(mobile)) {
        return {
            isValid: false,
            error: getValidation('mobileInvalid')
        };
    }
    
    return { isValid: true };
};

export const validateEmail = (email: string, required: boolean = false): ValidationResult => {
    if (!email) {
        if (required) {
            return {
                isValid: false,
                error: getValidation('emailRequired')
            };
        }
        return { isValid: true };
    }
    
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
        return {
            isValid: false,
            error: getValidation('emailInvalid')
        };
    }
    
    return { isValid: true };
};

export const validatePassword = (password: string): ValidationResult => {
    if (!password) {
        return {
            isValid: false,
            error: getValidation('passwordRequired')
        };
    }
    
    if (password.length < 8) {
        return {
            isValid: false,
            error: getValidation('passwordMinLength')
        };
    }
    
    if (!/[A-Z]/.test(password)) {
        return {
            isValid: false,
            error: getValidation('passwordComplexity')
        };
    }
    
    if (!/[a-z]/.test(password)) {
        return {
            isValid: false,
            error: getValidation('passwordComplexity')
        };
    }
    
    if (!/[0-9]/.test(password)) {
        return {
            isValid: false,
            error: getValidation('passwordComplexity')
        };
    }
    
    if (!/[!@#$%^&*]/.test(password)) {
        return {
            isValid: false,
            error: getValidation('passwordComplexity')
        };
    }
    
    return { isValid: true };
};

export const validateNationalId = (nationalId: string, required: boolean = false): ValidationResult => {
    if (!nationalId) {
        if (required) {
            return {
                isValid: false,
                error: getValidation('nationalIdRequired')
            };
        }
        return { isValid: true };
    }
    
    const cleanId = nationalId.replace(/\D/g, '');
    
    if (cleanId.length !== 10) {
        return {
            isValid: false,
            error: getValidation('nationalIdLength')
        };
    }
    
    if (/^(\d)\1{9}$/.test(cleanId)) {
        return {
            isValid: false,
            error: getValidation('nationalIdInvalid')
        };
    }
    
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
            error: getValidation('nationalIdInvalid')
        };
    }
    
    return { isValid: true };
};

export const filterNumericOnly = (value: string): string => {
    return value.replace(/[^0-9]/g, '');
};

export const filterAlphabeticOnly = (value: string): string => {
    return value.replace(/[^a-zA-Zآ-ی\s]/g, '');
};

export const validateRequired = (value: string, fieldName: string): ValidationResult => {
    if (!value || value.trim() === '') {
        return {
            isValid: false,
            error: getValidation('required', { field: fieldName })
        };
    }
    
    return { isValid: true };
};

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