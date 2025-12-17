import type { ValidationResult } from './types';

export const validateMobile = (mobile: string): ValidationResult => {
  if (!mobile) {
    return {
      isValid: false,
      error: 'شماره موبایل الزامی است'
    };
  }
  
  if (!/^09[0-9]{9}$/.test(mobile)) {
    return {
      isValid: false,
      error: 'شماره موبایل معتبر نیست'
    };
  }
  
  return { isValid: true };
};

