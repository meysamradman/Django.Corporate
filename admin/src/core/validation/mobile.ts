import { getValidation } from '@/core/messages';
import type { ValidationResult } from './types';

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

export const validateMobileLegacy = (mobile: string): string | null => {
    const result = validateMobile(mobile);
    return result.isValid ? null : result.error!;
};
