import { extractFieldErrors } from '@/core/toast';

export const PORTFOLIO_FORM_FIELD_MAP = {
  title: 'name',
  slug: 'slug',
  short_description: 'short_description',
  description: 'description',
  categories: 'selectedCategories',
  categories_ids: 'selectedCategories',
  tags: 'selectedTags',
  tags_ids: 'selectedTags',
  options: 'selectedOptions',
  options_ids: 'selectedOptions',
  media_ids: 'featuredImage',
  main_image_id: 'featuredImage',
  og_image: 'og_image',
  og_image_id: 'og_image',
  meta_title: 'meta_title',
  meta_description: 'meta_description',
  og_title: 'og_title',
  og_description: 'og_description',
  canonical_url: 'canonical_url',
  robots_meta: 'robots_meta',
  extra_attributes: 'extra_attributes',
  status: 'is_active',
  is_featured: 'is_featured',
  is_public: 'is_public',
  is_active: 'is_active',
} as const;

export function mapPortfolioFieldErrorKey(
  key: string,
  fieldMap: Record<string, string>
): string {
  return fieldMap[key] || key;
}

export function extractMappedPortfolioFieldErrors(
  error: unknown,
  fieldMap: Record<string, string>
): { fieldErrors: Record<string, string>; nonFieldError?: string } {
  const extracted = extractFieldErrors(error);
  const nonFieldError = extracted.non_field_errors;

  const mapped: Record<string, string> = {};
  Object.entries(extracted).forEach(([key, message]) => {
    if (key === 'non_field_errors') return;
    mapped[mapPortfolioFieldErrorKey(key, fieldMap)] = message;
  });

  return {
    fieldErrors: mapped,
    nonFieldError,
  };
}