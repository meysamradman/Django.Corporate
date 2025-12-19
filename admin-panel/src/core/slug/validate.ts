import { getValidation } from '@/core/messages';
import type { ValidationResult } from '../validation/types';

export const validateSlug = (slug: string, required: boolean = true): ValidationResult => {
    if (!slug) {
        if (required) {
            return {
                isValid: false,
                error: getValidation('slugRequired')
            };
        }
        return { isValid: true };
    }
    
    if (slug.length < 1) {
        return {
            isValid: false,
            error: getValidation('slugRequired')
        };
    }
    
    if (slug.length > 60) {
        return {
            isValid: false,
            error: getValidation('slugMaxLength')
        };
    }
    
    if (!/^[\u0600-\u06FFa-z0-9_]+(?:-[\u0600-\u06FFa-z0-9_]+)*$/.test(slug)) {
        return {
            isValid: false,
            error: getValidation('slugInvalid')
        };
    }
    
    return { isValid: true };
};
