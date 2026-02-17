import { extractFieldErrors } from '@/core/toast';

export const USER_CREATE_FIELD_MAP = {
  identifier: 'mobile',
  mobile: 'mobile',
  email: 'email',
  password: 'password',
  full_name: 'full_name',
  first_name: 'profile_first_name',
  last_name: 'profile_last_name',
  national_id: 'profile_national_id',
  phone: 'profile_phone',
  province_id: 'profile_province_id',
  city_id: 'profile_city_id',
} as const;

export const USER_EDIT_FIELD_MAP = {
  mobile: 'mobile',
  email: 'email',
  first_name: 'firstName',
  last_name: 'lastName',
  national_id: 'nationalId',
  phone: 'phone',
  province_id: 'province',
  city_id: 'city',
  address: 'address',
  bio: 'bio',
  birth_date: 'birthDate',
  social_media: 'social',
  'social_media.name': 'social',
  'social_media.url': 'social',
  'social_media.order': 'social',
  'social_media.icon': 'social',
} as const;

export function normalizeUserErrorKey(key: string): string {
  return key.startsWith('profile.') ? key.replace('profile.', '') : key;
}

export function mapUserFieldErrorKey(
  key: string,
  fieldMap: Record<string, string>
): string {
  const normalizedKey = normalizeUserErrorKey(key);
  return fieldMap[normalizedKey] || normalizedKey;
}

export function extractMappedUserFieldErrors(
  error: unknown,
  fieldMap: Record<string, string>
): { fieldErrors: Record<string, string>; nonFieldError?: string } {
  const extracted = extractFieldErrors(error);
  const nonFieldError = extracted.non_field_errors;

  const mapped: Record<string, string> = {};
  Object.entries(extracted).forEach(([key, message]) => {
    if (key === 'non_field_errors') return;
    mapped[mapUserFieldErrorKey(key, fieldMap)] = message;
  });

  return {
    fieldErrors: mapped,
    nonFieldError,
  };
}
