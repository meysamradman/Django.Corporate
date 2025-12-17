export const VALIDATION_MESSAGES = {
  mobileRequired: 'شماره موبایل الزامی است',
  mobileInvalid: 'شماره موبایل معتبر نیست',
  passwordRequired: 'رمز عبور الزامی است',
  otpRequired: 'کد یکبار مصرف الزامی است',
  captchaRequired: 'کد کپچا الزامی است',
} as const;

export const getValidation = (key: keyof typeof VALIDATION_MESSAGES): string => {
  return VALIDATION_MESSAGES[key] || key;
};

