import { permanentRedirect } from "next/navigation";

import type { PropertySearchFilters } from "@/types/real-estate/searchFilters";
import { filtersToSearchParams, resolvePropertySearchPath } from "@/components/real-estate/search/filters";
import { toAbsoluteUrl } from "@/core/seo/site";

const buildQueryStringFromRawParams = (params: Record<string, string | string[] | undefined>): string => {
  const currentParams = new URLSearchParams();

  for (const [key, rawValue] of Object.entries(params)) {
    const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
    if (value !== undefined && value !== "") {
      currentParams.set(key, value);
    }
  }

  return currentParams.toString();
};

export const buildCanonicalPropertySearchUrl = (filters: PropertySearchFilters): string => {
  const canonicalPath = resolvePropertySearchPath(filters);
  const canonicalQuery = filtersToSearchParams(filters).toString();

  return canonicalQuery ? `${canonicalPath}?${canonicalQuery}` : canonicalPath;
};

export const toAbsoluteCanonicalUrl = (path: string): string => toAbsoluteUrl(path);

export const buildCanonicalPropertySearchAbsoluteUrl = (filters: PropertySearchFilters): string =>
  toAbsoluteCanonicalUrl(buildCanonicalPropertySearchUrl(filters));

export const buildCurrentUrl = ({
  path,
  searchParams,
}: {
  path: string;
  searchParams: Record<string, string | string[] | undefined>;
}): string => {
  const currentQuery = buildQueryStringFromRawParams(searchParams);
  return currentQuery ? `${path}?${currentQuery}` : path;
};

export const ensureCanonicalPropertySearchRedirect = ({
  filters,
  path,
  searchParams,
}: {
  filters: PropertySearchFilters;
  path: string;
  searchParams: Record<string, string | string[] | undefined>;
}): void => {
  const canonicalUrl = buildCanonicalPropertySearchUrl(filters);
  const currentUrl = buildCurrentUrl({ path, searchParams });

  if (canonicalUrl !== currentUrl) {
    permanentRedirect(canonicalUrl);
  }
};
