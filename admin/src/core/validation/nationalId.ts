import { getValidation } from '@/core/messages';
import type { ValidationResult } from './types';

export const validateNationalId = (nationalId: string, required: boolean = false, strict: boolean = false): ValidationResult => {
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
    
    if (!/^\d{10}$/.test(cleanId)) {
        return {
            isValid: false,
            error: getValidation('nationalIdInvalid')
        };
    }
    
    // If strict mode is enabled, also validate checksum (like original validation.ts)
    // Otherwise, just check length and format (like original schema)
    if (strict) {
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
    }
    
    return { isValid: true };
};
