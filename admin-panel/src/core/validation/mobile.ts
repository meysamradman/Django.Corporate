import type { ValidationResult } from './types';
import { getValidation } from '@/core/messages/validation';

export const validateMobile = (mobile: string, required: boolean = true): ValidationResult => {
  if (!mobile) {
    if (!required) {
      return { isValid: true };
    }
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
  const result = validateMobile(mobile, true);
  return result.isValid ? null : result.error!;
};

