import type { RealEstateListParams } from "@/types/real-estate/realEstateListParams";
import type { PropertySearchFilters } from "@/types/real-estate/searchFilters";

export const PROPERTY_PAGE_SIZE = 9;
const DEFAULT_SORT_VALUE = "created_desc";

const toSingle = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
};

const toOptionalNumber = (value: string | string[] | undefined): number | null => {
  const single = toSingle(value).trim().replace(/,/g, "");
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

const normalizeSegment = (value: string): string =>
  value.trim().replace(/\s+/g, "-").toLowerCase();

const denormalizeSegment = (value: string): string =>
  value.trim().replace(/-/g, " ");

export const toSeoLocationSegment = (value: string): string => normalizeSegment(value);

const looksPercentEncoded = (value: string): boolean => /%[0-9A-Fa-f]{2}/.test(value);

const safeDecodeURIComponent = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

export const normalizeTaxonomySlug = (value: string | null | undefined): string => {
  const trimmed = (value || "").trim();
  if (!trimmed) return "";
  if (!looksPercentEncoded(trimmed)) return trimmed;
  return safeDecodeURIComponent(trimmed).trim();
};

export const toSortValue = (filters: PropertySearchFilters): string => {
  if (filters.order_by === "published_at" && filters.order_desc) return "latest";
  if (filters.order_by === "created_at" && filters.order_desc) return "created_desc";
  if (filters.order_by === "price" && filters.order_desc) return "price_desc";
  if (filters.order_by === "price" && !filters.order_desc) return "price_asc";
  if (filters.order_by === "built_area" && filters.order_desc) return "area_desc";
  if (filters.order_by === "views_count" && filters.order_desc) return "views_desc";
  if (filters.order_by === "favorites_count" && filters.order_desc) return "favorites_desc";
  if (filters.order_by === "updated_at" && filters.order_desc) return "updated_desc";
  return DEFAULT_SORT_VALUE;
};

export const fromSortValue = (sortValue: string): { order_by: string; order_desc: boolean } => {
  const map: Record<string, { order_by: string; order_desc: boolean }> = {
    latest: { order_by: "published_at", order_desc: true },
    created_desc: { order_by: "created_at", order_desc: true },
    price_desc: { order_by: "price", order_desc: true },
    price_asc: { order_by: "price", order_desc: false },
    area_desc: { order_by: "built_area", order_desc: true },
    views_desc: { order_by: "views_count", order_desc: true },
    favorites_desc: { order_by: "favorites_count", order_desc: true },
    updated_desc: { order_by: "updated_at", order_desc: true },
  };

  return map[sortValue] || map.created_desc;
};

const resolveSort = (searchParams: Record<string, string | string[] | undefined>) => {
  const sort = toSingle(searchParams.sort).trim();
  if (sort) {
    return fromSortValue(sort);
  }

  return {
    order_by: toOrderBy(searchParams.order_by),
    order_desc: toOrderDesc(searchParams.order_desc),
  };
};

export const filtersFromSeoSegments = (
  dealType?: string,
  location?: string,
  type?: string
): Partial<PropertySearchFilters> => {
  const normalizedDealType = normalizeTaxonomySlug(dealType);
  const normalizedLocation = (location || "").trim();
  const normalizedType = normalizeTaxonomySlug(type);

  const result: Partial<PropertySearchFilters> = {};

  if (normalizedDealType) {
    result.state_slug = normalizedDealType;
  }

  if (normalizedLocation) {
    const decoded = denormalizeSegment(safeDecodeURIComponent(normalizedLocation));
    result.city_slug = toSeoLocationSegment(decoded);
  }

  if (normalizedType) {
    result.type_slug = normalizedType;
  }

  return result;
};

const resolveSeoPathMode = (
  filters: PropertySearchFilters
):
  | "properties"
  | "status"
  | "status-type"
  | "status-location"
  | "status-location-type"
  | "location"
  | "location-type"
  | "type" => {
  const stateSlug = normalizeTaxonomySlug(filters.state_slug);
  const typeSlug = normalizeTaxonomySlug(filters.type_slug);
  const locationSlug = normalizeTaxonomySlug(filters.city_slug) || normalizeTaxonomySlug(filters.province_slug);

  if (stateSlug && locationSlug && typeSlug) {
    return "status-location-type";
  }

  if (stateSlug && locationSlug) {
    return "status-location";
  }

  if (stateSlug && typeSlug) {
    return "status-type";
  }

  if (stateSlug && !typeSlug) {
    return "status";
  }

  if (locationSlug && typeSlug) {
    return "location-type";
  }

  if (locationSlug && !typeSlug) {
    return "location";
  }

  if (!locationSlug && typeSlug) {
    return "type";
  }

  return "properties";
};

export const resolvePropertySearchPath = (filters: PropertySearchFilters): string => {
  const stateSlug = normalizeTaxonomySlug(filters.state_slug);
  const typeSlug = normalizeTaxonomySlug(filters.type_slug);
  const locationSegment = normalizeTaxonomySlug(filters.city_slug) || normalizeTaxonomySlug(filters.province_slug);

  const mode = resolveSeoPathMode(filters);

  if (mode === "status") {
    return `/properties/${encodeURIComponent(stateSlug)}`;
  }

  if (mode === "status-location") {
    return `/properties/${encodeURIComponent(stateSlug)}/${encodeURIComponent(locationSegment)}`;
  }

  if (mode === "status-type") {
    return `/properties/${encodeURIComponent(stateSlug)}/${encodeURIComponent(typeSlug)}`;
  }

  if (mode === "status-location-type") {
    return `/properties/${encodeURIComponent(stateSlug)}/${encodeURIComponent(locationSegment)}/${encodeURIComponent(typeSlug)}`;
  }

  if (mode === "location") {
    return `/properties/${encodeURIComponent(locationSegment)}`;
  }

  if (mode === "location-type") {
    return `/properties/${encodeURIComponent(locationSegment)}/${encodeURIComponent(typeSlug)}`;
  }

  if (mode === "type") {
    return `/properties/${encodeURIComponent(typeSlug)}`;
  }

  return "/properties";
};

export const resolvePropertySearchFilters = (
  searchParams: Record<string, string | string[] | undefined>
): PropertySearchFilters => {
  const sortConfig = resolveSort(searchParams);
  const resolvedTypeSlug = normalizeTaxonomySlug(toSingle(searchParams.type_slug || searchParams.type));
  const resolvedStateSlug = normalizeTaxonomySlug(toSingle(searchParams.state_slug));
  const resolvedPropertyType = toOptionalNumber(searchParams.property_type);
  const resolvedState = toOptionalNumber(searchParams.state);

  return {
    search: toSingle(searchParams.search).trim(),
    status: toSingle(searchParams.status).trim(),
    is_featured: toOptionalBoolean(searchParams.is_featured),
    is_public: toOptionalBoolean(searchParams.is_public),
    is_active: toOptionalBoolean(searchParams.is_active),
    property_type: resolvedTypeSlug ? null : resolvedPropertyType,
    state: resolvedStateSlug ? null : resolvedState,
    city: toOptionalNumber(searchParams.city),
    province: toOptionalNumber(searchParams.province),
    city_slug: normalizeTaxonomySlug(toSingle(searchParams.city_slug)),
    province_slug: normalizeTaxonomySlug(toSingle(searchParams.province_slug)),
    region: toOptionalNumber(searchParams.region),
    min_price: toOptionalNumber(searchParams.min_price),
    max_price: toOptionalNumber(searchParams.max_price),
    min_area: toOptionalNumber(searchParams.min_area),
    max_area: toOptionalNumber(searchParams.max_area),
    bedrooms: toOptionalNumber(searchParams.rooms ?? searchParams.bedrooms),
    bathrooms: toOptionalNumber(searchParams.bathrooms),
    kitchens: toOptionalNumber(searchParams.kitchens ?? searchParams.kitchen),
    living_rooms: toOptionalNumber(searchParams.living_rooms ?? searchParams.living),
    year_built: toOptionalNumber(searchParams.year_built ?? searchParams.build_year),
    parking_spaces: toOptionalNumber(searchParams.parking_spaces ?? searchParams.parking),
    storage_rooms: toOptionalNumber(searchParams.storage_rooms ?? searchParams.storage),
    created_after: toSingle(searchParams.created_after).trim(),
    created_before: toSingle(searchParams.created_before).trim(),
    type_slug: resolvedTypeSlug,
    state_slug: resolvedStateSlug,
    tag_slug: normalizeTaxonomySlug(toSingle(searchParams.tag ?? searchParams.tag_slug)),
    label_slug: normalizeTaxonomySlug(toSingle(searchParams.label_slug)),
    label_public_id: normalizeTaxonomySlug(toSingle(searchParams.label_public_id)),
    feature_public_id: normalizeTaxonomySlug(toSingle(searchParams.feature_public_id)),
    order_by: sortConfig.order_by,
    order_desc: sortConfig.order_desc,
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
  property_type: filters.type_slug ? undefined : filters.property_type || undefined,
  state: filters.state_slug ? undefined : filters.state || undefined,
  city: filters.city || undefined,
  province: filters.province || undefined,
  region: filters.region || undefined,
  min_price: filters.min_price || undefined,
  max_price: filters.max_price || undefined,
  min_area: filters.min_area || undefined,
  max_area: filters.max_area || undefined,
  bedrooms: filters.bedrooms ?? undefined,
  bathrooms: filters.bathrooms ?? undefined,
  kitchens: filters.kitchens ?? undefined,
  living_rooms: filters.living_rooms ?? undefined,
  year_built: filters.year_built ?? undefined,
  parking_spaces: filters.parking_spaces ?? undefined,
  storage_rooms: filters.storage_rooms ?? undefined,
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
  const mode = resolveSeoPathMode(next);

  const isStateEncoded = mode === "status" || mode.startsWith("status-");
  const isTypeEncoded = mode === "type" || mode.endsWith("type");
  const isLocationEncoded = mode === "location" || mode === "location-type" || mode === "status-location" || mode === "status-location-type";

  if (next.search) params.set("search", next.search);
  if (next.status) params.set("status", next.status);
  if (next.is_featured !== null) params.set("is_featured", next.is_featured ? "true" : "false");
  if (next.is_public !== null) params.set("is_public", next.is_public ? "true" : "false");
  if (next.is_active !== null) params.set("is_active", next.is_active ? "true" : "false");
  if (next.property_type && !isTypeEncoded && !next.type_slug) params.set("property_type", String(next.property_type));
  if (next.state && !isStateEncoded && !next.state_slug) params.set("state", String(next.state));
  if (next.city && !isLocationEncoded) params.set("city", String(next.city));
  if (next.province && !isLocationEncoded) params.set("province", String(next.province));
  if (next.region) params.set("region", String(next.region));
  if (next.min_price) params.set("min_price", String(next.min_price));
  if (next.max_price) params.set("max_price", String(next.max_price));
  if (next.min_area) params.set("min_area", String(next.min_area));
  if (next.max_area) params.set("max_area", String(next.max_area));
  if (next.bedrooms !== null) params.set("rooms", String(next.bedrooms));
  if (next.bathrooms !== null) params.set("bathrooms", String(next.bathrooms));
  if (next.kitchens !== null) params.set("kitchens", String(next.kitchens));
  if (next.living_rooms !== null) params.set("living_rooms", String(next.living_rooms));
  if (next.year_built !== null) params.set("year_built", String(next.year_built));
  if (next.parking_spaces !== null) params.set("parking_spaces", String(next.parking_spaces));
  if (next.storage_rooms !== null) params.set("storage_rooms", String(next.storage_rooms));
  if (next.created_after) params.set("created_after", next.created_after);
  if (next.created_before) params.set("created_before", next.created_before);
  if (next.type_slug && !isTypeEncoded) params.set("type", next.type_slug);
  if (next.state_slug && !isStateEncoded) params.set("state_slug", next.state_slug);
  if (next.tag_slug) params.set("tag", next.tag_slug);
  if (next.label_slug) params.set("label_slug", next.label_slug);
  if (next.label_public_id) params.set("label_public_id", next.label_public_id);
  if (next.feature_public_id) params.set("feature_public_id", next.feature_public_id);
  const sortValue = toSortValue(next);
  if (sortValue !== DEFAULT_SORT_VALUE) params.set("sort", sortValue);
  if (next.page > 1) params.set("page", String(next.page));

  return params;
};

export const filtersToHref = (
  filters: PropertySearchFilters,
  overrides?: Partial<PropertySearchFilters>
): string => {
  const next = { ...filters, ...(overrides || {}) };
  const path = resolvePropertySearchPath(next);
  const params = filtersToSearchParams(next);
  const query = params.toString();
  return query ? `${path}?${query}` : path;
};
