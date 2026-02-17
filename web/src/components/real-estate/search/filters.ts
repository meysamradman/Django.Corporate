import type { RealEstateListParams } from "@/types/real-estate/realEstateListParams";
import type { PropertySearchFilters } from "@/types/real-estate/searchFilters";

export const PROPERTY_PAGE_SIZE = 9;

const toSingle = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
};

const toOptionalNumber = (value: string | string[] | undefined): number | null => {
  const single = toSingle(value).trim();
  if (!single) return null;
  const parsed = Number(single);
  if (Number.isNaN(parsed) || parsed < 0) return null;
  return parsed;
};

const toPage = (value: string | string[] | undefined): number => {
  const parsed = Number(toSingle(value));
  if (Number.isNaN(parsed) || parsed < 1) return 1;
  return Math.floor(parsed);
};

const toOptionalBoolean = (value: string | string[] | undefined): boolean | null => {
  const raw = toSingle(value).trim().toLowerCase();
  if (!raw) return null;
  if (["true", "1", "yes", "on"].includes(raw)) return true;
  if (["false", "0", "no", "off"].includes(raw)) return false;
  return null;
};

const toOrderBy = (value: string | string[] | undefined): string => {
  const orderBy = toSingle(value).trim();
  if (!orderBy) return "created_at";
  return orderBy;
};

const toOrderDesc = (value: string | string[] | undefined): boolean => {
  const raw = toSingle(value).trim().toLowerCase();
  if (!raw) return true;
  return raw !== "false" && raw !== "0";
};

export const resolvePropertySearchFilters = (
  searchParams: Record<string, string | string[] | undefined>
): PropertySearchFilters => {
  return {
    search: toSingle(searchParams.search).trim(),
    status: toSingle(searchParams.status).trim(),
    is_featured: toOptionalBoolean(searchParams.is_featured),
    is_public: toOptionalBoolean(searchParams.is_public),
    is_active: toOptionalBoolean(searchParams.is_active),
    property_type: toOptionalNumber(searchParams.property_type),
    state: toOptionalNumber(searchParams.state),
    city: toOptionalNumber(searchParams.city),
    province: toOptionalNumber(searchParams.province),
    region: toOptionalNumber(searchParams.region),
    min_price: toOptionalNumber(searchParams.min_price),
    max_price: toOptionalNumber(searchParams.max_price),
    min_area: toOptionalNumber(searchParams.min_area),
    max_area: toOptionalNumber(searchParams.max_area),
    bedrooms: toOptionalNumber(searchParams.bedrooms),
    bathrooms: toOptionalNumber(searchParams.bathrooms),
    created_after: toSingle(searchParams.created_after).trim(),
    created_before: toSingle(searchParams.created_before).trim(),
    type_slug: toSingle(searchParams.type_slug).trim(),
    state_slug: toSingle(searchParams.state_slug).trim(),
    tag_slug: toSingle(searchParams.tag_slug).trim(),
    label_slug: toSingle(searchParams.label_slug).trim(),
    label_public_id: toSingle(searchParams.label_public_id).trim(),
    feature_public_id: toSingle(searchParams.feature_public_id).trim(),
    order_by: toOrderBy(searchParams.order_by),
    order_desc: toOrderDesc(searchParams.order_desc),
    page: toPage(searchParams.page),
  };
};

export const toPropertyListApiParams = (
  filters: PropertySearchFilters
): RealEstateListParams => ({
  search: filters.search || undefined,
  status: filters.status || undefined,
  is_featured: filters.is_featured ?? undefined,
  is_public: filters.is_public ?? undefined,
  is_active: filters.is_active ?? undefined,
  property_type: filters.property_type || undefined,
  state: filters.state || undefined,
  city: filters.city || undefined,
  province: filters.province || undefined,
  region: filters.region || undefined,
  min_price: filters.min_price || undefined,
  max_price: filters.max_price || undefined,
  min_area: filters.min_area || undefined,
  max_area: filters.max_area || undefined,
  bedrooms: filters.bedrooms || undefined,
  bathrooms: filters.bathrooms || undefined,
  created_after: filters.created_after || undefined,
  created_before: filters.created_before || undefined,
  type_slug: filters.type_slug || undefined,
  state_slug: filters.state_slug || undefined,
  tag_slug: filters.tag_slug || undefined,
  label_slug: filters.label_slug || undefined,
  label_public_id: filters.label_public_id || undefined,
  feature_public_id: filters.feature_public_id || undefined,
  order_by: filters.order_by || undefined,
  order_desc: filters.order_desc,
  page: filters.page,
  size: PROPERTY_PAGE_SIZE,
});

export const filtersToSearchParams = (
  filters: PropertySearchFilters,
  overrides?: Partial<PropertySearchFilters>
): URLSearchParams => {
  const next = { ...filters, ...(overrides || {}) };
  const params = new URLSearchParams();

  if (next.search) params.set("search", next.search);
  if (next.status) params.set("status", next.status);
  if (next.is_featured !== null) params.set("is_featured", next.is_featured ? "true" : "false");
  if (next.is_public !== null) params.set("is_public", next.is_public ? "true" : "false");
  if (next.is_active !== null) params.set("is_active", next.is_active ? "true" : "false");
  if (next.property_type) params.set("property_type", String(next.property_type));
  if (next.state) params.set("state", String(next.state));
  if (next.city) params.set("city", String(next.city));
  if (next.province) params.set("province", String(next.province));
  if (next.region) params.set("region", String(next.region));
  if (next.min_price) params.set("min_price", String(next.min_price));
  if (next.max_price) params.set("max_price", String(next.max_price));
  if (next.min_area) params.set("min_area", String(next.min_area));
  if (next.max_area) params.set("max_area", String(next.max_area));
  if (next.bedrooms) params.set("bedrooms", String(next.bedrooms));
  if (next.bathrooms) params.set("bathrooms", String(next.bathrooms));
  if (next.created_after) params.set("created_after", next.created_after);
  if (next.created_before) params.set("created_before", next.created_before);
  if (next.type_slug) params.set("type_slug", next.type_slug);
  if (next.state_slug) params.set("state_slug", next.state_slug);
  if (next.tag_slug) params.set("tag_slug", next.tag_slug);
  if (next.label_slug) params.set("label_slug", next.label_slug);
  if (next.label_public_id) params.set("label_public_id", next.label_public_id);
  if (next.feature_public_id) params.set("feature_public_id", next.feature_public_id);
  if (next.order_by) params.set("order_by", next.order_by);
  params.set("order_desc", next.order_desc ? "true" : "false");
  if (next.page > 1) params.set("page", String(next.page));

  return params;
};
