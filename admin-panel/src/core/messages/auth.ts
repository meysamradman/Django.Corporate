export const AUTH_MESSAGES = {
  loginSuccess: 'ورود با موفقیت انجام شد',
  invalidCredentials: 'ورود اعتبارنامه‌های ارائه شده نادرست است',
  invalidPassword: 'رمز عبور اشتباه است',
  invalidOTP: 'کد تأیید نامعتبر است',
  resetOtpSent: 'کد بازیابی رمز عبور ارسال شد',
  passwordResetSuccess: 'رمز عبور با موفقیت تغییر کرد',
  otpSent: 'کد یکبار مصرف ارسال شد',
  otpSendFailed: 'ارسال کد یکبار مصرف با خطا مواجه شد',
} as const;

export const getAuth = (key: keyof typeof AUTH_MESSAGES): string => {
  return AUTH_MESSAGES[key] || key;
};

