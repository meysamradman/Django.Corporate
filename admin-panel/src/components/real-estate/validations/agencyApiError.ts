import { extractFieldErrors } from '@/core/toast';

export const AGENCY_FIELD_MAP = {
  name: 'name',
  slug: 'slug',
  phone: 'phone',
  email: 'email',
  website: 'website',
  license_number: 'license_number',
  license_expire_date: 'license_expire_date',
  city: 'city',
  city_id: 'city',
  province: 'province',
  province_id: 'province',
  description: 'description',
  address: 'address',
  is_active: 'is_active',
  rating: 'rating',
  total_reviews: 'total_reviews',
  meta_title: 'meta_title',
  meta_description: 'meta_description',
  og_title: 'og_title',
  og_description: 'og_description',
  canonical_url: 'canonical_url',
  robots_meta: 'robots_meta',
  profile_picture: 'profile_picture',
  social_media: 'social_media',
} as const;

export function normalizeAgencyErrorKey(key: string): string {
  if (key.startsWith('agency.')) return key.replace('agency.', '');
  return key;
}

export function mapAgencyFieldErrorKey(
  key: string,
  fieldMap: Record<string, string>
): string {
  const normalizedKey = normalizeAgencyErrorKey(key);
  return fieldMap[key] || fieldMap[normalizedKey] || normalizedKey;
}

export function extractMappedAgencyFieldErrors(
  error: unknown,
  fieldMap: Record<string, string>
): { fieldErrors: Record<string, string>; nonFieldError?: string } {
  const extracted = extractFieldErrors(error);
  const nonFieldError = extracted.non_field_errors;

  const mapped: Record<string, string> = {};
  Object.entries(extracted).forEach(([key, message]) => {
    if (key === 'non_field_errors') return;
    mapped[mapAgencyFieldErrorKey(key, fieldMap)] = message;
  });

  return {
    fieldErrors: mapped,
    nonFieldError,
  };
}
