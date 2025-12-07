import { getValidation } from '@/core/messages';
import type { ValidationResult } from './types';

export const validateRequired = (value: string, fieldName: string): ValidationResult => {
    if (!value || value.trim() === '') {
        return {
            isValid: false,
            error: getValidation('required', { field: fieldName })
        };
    }
    
    return { isValid: true };
};
