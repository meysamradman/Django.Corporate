import { getValidation } from '@/core/messages';
import type { ValidationResult } from '../validation/types';

/**
 * Validate slug format and length
 * Same logic as generateSlug - ensures consistency
 */
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
    
    // Same logic as generateSlug
    // generateSlug uses: .replace(/[^\w\u0600-\u06FF\s-]/g, '') which includes \w (a-z, A-Z, 0-9, _)
    // Then converts spaces to hyphens, removes consecutive hyphens, and trims leading/trailing hyphens
    // Final result: Persian chars (\u0600-\u06FF), English letters (a-z), numbers (0-9), underscore (_), and hyphens (-)
    // Must start and end with alphanumeric/Persian/underscore, can have hyphens in between
    // No consecutive hyphens allowed
    if (!/^[\u0600-\u06FFa-z0-9_]+(?:-[\u0600-\u06FFa-z0-9_]+)*$/.test(slug)) {
        return {
            isValid: false,
            error: getValidation('slugInvalid')
        };
    }
    
    return { isValid: true };
};
