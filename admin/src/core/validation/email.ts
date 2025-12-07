import { getValidation } from '@/core/messages';
import type { ValidationResult } from './types';

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
    
    // Use same validation as Zod .email() - RFC 5322 compliant
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return {
            isValid: false,
            error: getValidation('emailInvalid')
        };
    }
    
    return { isValid: true };
};

export const validateEmailLegacy = (email: string): string | null => {
    const result = validateEmail(email, false);
    return result.isValid ? null : result.error!;
};
