import { extractFieldErrors } from '@/core/toast';

export const LOGIN_PASSWORD_FIELD_MAP = {
  identifier: 'mobile',
  mobile: 'mobile',
  password: 'password',
  captcha_id: 'captcha_id',
  captcha_answer: 'captcha_answer',
} as const;

export const LOGIN_OTP_FIELD_MAP = {
  identifier: 'mobile',
  mobile: 'mobile',
  otp_code: 'otp',
  otp: 'otp',
  captcha_id: 'captcha_id',
  captcha_answer: 'captcha_answer',
} as const;

function normalizeLoginErrorKey(key: string): string {
  return key.startsWith('profile.') ? key.replace('profile.', '') : key;
}

export function mapLoginFieldErrorKey(
  key: string,
  fieldMap: Record<string, string>
): string {
  const normalizedKey = normalizeLoginErrorKey(key);
  return fieldMap[normalizedKey] || normalizedKey;
}

export function extractMappedLoginFieldErrors(
  error: unknown,
  fieldMap: Record<string, string>
): { fieldErrors: Record<string, string>; nonFieldError?: string } {
  const extracted = extractFieldErrors(error);
  const nonFieldError = extracted.non_field_errors;

  const mapped: Record<string, string> = {};
  Object.entries(extracted).forEach(([key, message]) => {
    if (key === 'non_field_errors') return;
    mapped[mapLoginFieldErrorKey(key, fieldMap)] = message;
  });

  return {
    fieldErrors: mapped,
    nonFieldError,
  };
}
