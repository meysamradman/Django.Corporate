export const AUTH_MESSAGES = {
  loginSuccess: 'ورود با موفقیت انجام شد',
  invalidCredentials: 'شماره موبایل یا رمز عبور اشتباه است',
  otpSent: 'کد یکبار مصرف ارسال شد',
  otpSendFailed: 'ارسال کد یکبار مصرف با خطا مواجه شد',
} as const;

export const getAuth = (key: keyof typeof AUTH_MESSAGES): string => {
  return AUTH_MESSAGES[key] || key;
};

