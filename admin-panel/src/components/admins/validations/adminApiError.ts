import { extractFieldErrors } from '@/core/toast';

export const ADMIN_CREATE_FIELD_MAP = {
  identifier: 'mobile',
  mobile: 'mobile',
  email: 'email',
  password: 'password',
  full_name: 'full_name',
  role_id: 'role_id',
  admin_role_type: 'admin_role_type',
  is_superuser: 'is_superuser',
  is_active: 'is_active',
  first_name: 'profile_first_name',
  last_name: 'profile_last_name',
  birth_date: 'profile_birth_date',
  national_id: 'profile_national_id',
  phone: 'profile_phone',
  province: 'profile_province_id',
  province_id: 'profile_province_id',
  city: 'profile_city_id',
  city_id: 'profile_city_id',
  address: 'profile_address',
  department: 'profile_department',
  position: 'profile_position',
  notes: 'profile_notes',
  bio: 'profile_bio',
  profile_picture: 'profile_picture',
  license_number: 'license_number',
  license_expire_date: 'license_expire_date',
  specialization: 'specialization',
  agency_id: 'agency_id',
  is_verified: 'is_verified',
  meta_title: 'meta_title',
  meta_description: 'meta_description',
  meta_keywords: 'meta_keywords',
  og_title: 'og_title',
  og_description: 'og_description',
  og_image_id: 'og_image_id',
  'profile.bio': 'profile_bio',
  'agent_profile.bio': 'bio',
  'profile.social_media': 'profile.social_media',
  'agent_profile.social_media': 'agent_profile.social_media',
} as const;

export const ADMIN_EDIT_FIELD_MAP = {
  mobile: 'mobile',
  email: 'email',
  first_name: 'firstName',
  last_name: 'lastName',
  birth_date: 'birthDate',
  national_id: 'nationalId',
  phone: 'phone',
  province: 'province',
  province_id: 'province',
  city: 'city',
  city_id: 'city',
  address: 'address',
  bio: 'bio',
  profile_picture: 'profileImage',
  license_number: 'license_number',
  license_expire_date: 'license_expire_date',
  specialization: 'specialization',
  agency_id: 'agency_id',
  is_verified: 'is_verified',
  meta_title: 'meta_title',
  meta_description: 'meta_description',
  meta_keywords: 'meta_keywords',
  og_title: 'og_title',
  og_description: 'og_description',
  og_image_id: 'og_image_id',
  'profile.bio': 'bio',
  'agent_profile.bio': 'agent_bio',
  'profile.social_media': 'profile.social_media',
  'agent_profile.social_media': 'agent_profile.social_media',
} as const;

export function normalizeAdminErrorKey(key: string): string {
  if (key.startsWith('profile.')) return key.replace('profile.', '');
  if (key.startsWith('agent_profile.')) return key.replace('agent_profile.', '');
  return key;
}

export function mapAdminFieldErrorKey(
  key: string,
  fieldMap: Record<string, string>
): string {
  const normalizedKey = normalizeAdminErrorKey(key);
  return fieldMap[key] || fieldMap[normalizedKey] || normalizedKey;
}

export function extractMappedAdminFieldErrors(
  error: unknown,
  fieldMap: Record<string, string>
): { fieldErrors: Record<string, string>; nonFieldError?: string } {
  const extracted = extractFieldErrors(error);
  const nonFieldError = extracted.non_field_errors;

  const mapped: Record<string, string> = {};
  Object.entries(extracted).forEach(([key, message]) => {
    if (key === 'non_field_errors') return;
    mapped[mapAdminFieldErrorKey(key, fieldMap)] = message;
  });

  return {
    fieldErrors: mapped,
    nonFieldError,
  };
}
