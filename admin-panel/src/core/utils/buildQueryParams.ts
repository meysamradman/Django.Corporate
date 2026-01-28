import type { SortingState } from "@tanstack/react-table";
import type { TablePaginationState } from "@/types/shared/pagination";

/**
 * Helper برای ساخت query parameters از state های مختلف
 * جلوگیری از تکرار کد در component های لیست
 */
export interface BuildQueryParamsOptions {
  searchValue?: string;
  pagination: TablePaginationState;
  sorting: SortingState;
  clientFilters?: Record<string, unknown>;
  defaultOrderBy?: string;
  defaultOrderDesc?: boolean;
}

export function buildQueryParams<T extends Record<string, unknown>>(
  options: BuildQueryParamsOptions
): T {
  const {
    searchValue = "",
    pagination,
    sorting,
    clientFilters = {},
    defaultOrderBy = "created_at",
    defaultOrderDesc = true,
  } = options;

  const params: Record<string, unknown> = {
    search: searchValue || undefined,
    page: pagination.pageIndex + 1,
    size: pagination.pageSize,
    order_by: sorting.length > 0 ? sorting[0].id : defaultOrderBy,
    order_desc: sorting.length > 0 ? sorting[0].desc : defaultOrderDesc,
  };

  Object.entries(clientFilters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params[key] = value;
    }
  });

  Object.keys(params).forEach((key) => {
    if (params[key] === undefined) {
      delete params[key];
    }
  });

  return params as T;
}

/**
 * Helper برای sync کردن URL با filters
 */
export function syncFiltersToURL(
  filters: Record<string, unknown>,
  pagination?: TablePaginationState,
  sorting?: SortingState
): void {
  const url = new URL(window.location.href);

  url.search = "";

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  if (pagination) {
    url.searchParams.set("page", String(pagination.pageIndex + 1));
    url.searchParams.set("size", String(pagination.pageSize));
  }

  if (sorting && sorting.length > 0) {
    url.searchParams.set("order_by", sorting[0].id);
    url.searchParams.set("order_desc", String(sorting[0].desc));
  }

  window.history.replaceState({}, "", url.toString());
}

/**
 * Helper برای خواندن filters از URL
 */
export function readFiltersFromURL(): Record<string, string> {
  if (typeof window === "undefined") return {};

  const urlParams = new URLSearchParams(window.location.search);
  const filters: Record<string, string> = {};

  urlParams.forEach((value, key) => {
    filters[key] = value;
  });

  return filters;
}

/**
 * Helper برای parse کردن boolean values از URL
 */
export function parseBooleanFromURL(value: string | null): boolean | undefined {
  if (value === null) return undefined;
  return value === "true";
}
