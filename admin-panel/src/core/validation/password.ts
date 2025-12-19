import type { ValidationResult } from './types';
import { getValidation } from '@/core/messages/validation';

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

export const validatePasswordLegacy = (password: string): string | null => {
  const result = validatePassword(password);
  return result.isValid ? null : result.error!;
};
