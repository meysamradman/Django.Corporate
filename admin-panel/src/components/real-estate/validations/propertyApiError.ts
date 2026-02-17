import { extractFieldErrors } from '@/core/toast';

export const PROPERTY_FORM_FIELD_MAP: Record<string, string> = {
  labels: 'labels_ids',
  tags: 'tags_ids',
  features: 'features_ids',
  og_image: 'og_image_id',
  main_image: 'main_image_id',
};

export function normalizePropertyErrorKey(key: string): string {
  if (key.endsWith('_id')) return key.replace('_id', '');
  return key;
}

export function mapPropertyFieldErrorKey(
  key: string,
  fieldMap: Record<string, string> = PROPERTY_FORM_FIELD_MAP
): string {
  const normalizedKey = normalizePropertyErrorKey(key);
  return fieldMap[normalizedKey] || normalizedKey;
}

export function extractMappedPropertyFieldErrors(
  error: unknown,
  fieldMap: Record<string, string> = PROPERTY_FORM_FIELD_MAP
): { fieldErrors: Record<string, string>; nonFieldError?: string } {
  const extracted = extractFieldErrors(error);
  const nonFieldError = extracted.non_field_errors;
  const mapped: Record<string, string> = {};
  Object.entries(extracted).forEach(([key, message]) => {
    if (key === 'non_field_errors') return;
    mapped[mapPropertyFieldErrorKey(key, fieldMap)] = message as string;
  });
  return {
    fieldErrors: mapped,
    nonFieldError,
  };
}
