import { getValidation } from '@/core/messages';
import type { ValidationResult } from './types';

export const validatePhone = (phone: string, required: boolean = false): ValidationResult => {
    if (!phone) {
        if (required) {
            return {
                isValid: false,
                error: getValidation('required', { field: 'تلفن' })
            };
        }
        return { isValid: true };
    }
    
    if (phone.length > 15) {
        return {
            isValid: false,
            error: getValidation('phoneMaxLength')
        };
    }
    
    if (!/^\d+$/.test(phone)) {
        return {
            isValid: false,
            error: getValidation('phoneInvalid')
        };
    }
    
    return { isValid: true };
};
