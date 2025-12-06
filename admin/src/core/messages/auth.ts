import { createMessageGetter } from './utils';

export const AUTH_MESSAGES = {
  loginSuccess: 'ورود موفقیت‌آمیز',
  logoutSuccess: 'خروج موفقیت‌آمیز',
  loginFailed: 'ورود ناموفق',
  invalidCredentials: 'نام کاربری یا رمز عبور اشتباه است',
  sessionExpired: 'جلسه کاری منقضی شده است',
  accessDenied: 'دسترسی غیر مجاز',
  otpSent: 'کد یکبار مصرف ارسال شد',
  otpSendFailed: 'خطا در ارسال کد یکبار مصرف',
} as const;

export const getAuth = createMessageGetter(AUTH_MESSAGES);
