import type { SortingState } from "@tanstack/react-table";
import type { TablePaginationState } from "@/types/shared/pagination";
import type React from "react";

export function getDefaultSortingState(
  defaultSortField: string = 'created_at',
  defaultSortDesc: boolean = true
): SortingState {
  if (typeof window === 'undefined') {
    return [{ id: defaultSortField, desc: defaultSortDesc }];
  }

  const urlParams = new URLSearchParams(window.location.search);
  const orderBy = urlParams.get('order_by');
  const orderDesc = urlParams.get('order_desc');

  if (orderBy && orderDesc !== null) {
    return [{
      id: orderBy,
      desc: orderDesc === 'true',
    }];
  }

  return [{ id: defaultSortField, desc: defaultSortDesc }];
}

export function initSortingFromURL(
  defaultSortField: string = 'created_at',
  defaultSortDesc: boolean = true
): SortingState {
  return getDefaultSortingState(defaultSortField, defaultSortDesc);
}

/**
 * Clean up date_range from URL if it exists
 * This should be called in useEffect on component mount
 */
export function cleanupDateRangeFromURL() {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('date_range')) {
      const url = new URL(window.location.href);
      url.searchParams.delete('date_range');
      window.history.replaceState({}, '', url.toString());
    }
  }
}

/**
 * Creates a handleFilterChange function that properly handles date_range filters
 * @param setClientFilters - Function to update client filters state
 * @param setSearchValue - Function to update search value state
 * @param setPagination - Function to update pagination state
 * @param customHandlers - Optional custom handlers for specific filter types
 */
export function createFilterChangeHandler<TFilters extends Record<string, unknown>>(
  setClientFilters: React.Dispatch<React.SetStateAction<TFilters>>,
  setSearchValue: React.Dispatch<React.SetStateAction<string>>,
  setPagination: React.Dispatch<React.SetStateAction<TablePaginationState>>,
  customHandlers?: {
    [key: string]: (value: unknown, updateUrl: (url: URL) => void) => void;
  }
) {
  return (filterId: string | number, value: unknown) => {
    const filterKey = filterId as string;

    if (customHandlers && customHandlers[filterKey]) {
      const updateUrl = (url: URL) => {
        url.searchParams.set('page', '1');
        window.history.replaceState({}, '', url.toString());
      };
      customHandlers[filterKey](value, updateUrl);
      return;
    }

    if (filterKey === "search") {
      setSearchValue(typeof value === 'string' ? value : '');
      setPagination(prev => ({ ...prev, pageIndex: 0 }));

      const url = new URL(window.location.href);
      if (value && typeof value === 'string') {
        url.searchParams.set('search', value);
      } else {
        url.searchParams.delete('search');
      }
      url.searchParams.set('page', '1');
      window.history.replaceState({}, '', url.toString());
    } else if (filterKey === "date_range") {
      const range = value as { from?: string; to?: string } | undefined;
      
      setClientFilters(prev => ({
        ...prev,
        date_range: range,
        date_from: range?.from,
        date_to: range?.to
      } as TFilters));
      setPagination(prev => ({ ...prev, pageIndex: 0 }));

      const url = new URL(window.location.href);
      url.searchParams.delete('date_range');
      
      if (range?.from) {
        url.searchParams.set('date_from', range.from);
      } else {
        url.searchParams.delete('date_from');
      }
      
      if (range?.to) {
        url.searchParams.set('date_to', range.to);
      } else {
        url.searchParams.delete('date_to');
      }
      
      url.searchParams.set('page', '1');
      window.history.replaceState({}, '', url.toString());
    } else {
      setClientFilters(prev => ({
        ...prev,
        [filterKey]: value
      } as TFilters));
      setPagination(prev => ({ ...prev, pageIndex: 0 }));

      const url = new URL(window.location.href);
      if (value !== undefined && value !== null) {
        if (typeof value === 'boolean') {
          url.searchParams.set(filterKey, value.toString());
        } else if (filterKey === 'categories' && value !== undefined) {
          if (value === 'all' || value === '') {
            url.searchParams.delete('categories');
          } else {
            url.searchParams.set(filterKey, String(value));
          }
        } else {
          url.searchParams.set(filterKey, String(value));
        }
      } else {
        url.searchParams.delete(filterKey);
      }
      url.searchParams.set('page', '1');
      window.history.replaceState({}, '', url.toString());
    }
  };
}

