import { useEffect } from "react";
import type { TablePaginationState } from "@/types/shared/pagination";
import { cleanupDateRangeFromURL, createFilterChangeHandler } from "./tableSorting";

/**
 * Hook for managing table filters with date_range support
 * This hook provides:
 * - cleanupDateRangeFromURL effect
 * - handleFilterChange function
 */
export function useTableFilters<TFilters extends Record<string, unknown>>(
  setClientFilters: React.Dispatch<React.SetStateAction<TFilters>>,
  setSearchValue: React.Dispatch<React.SetStateAction<string>>,
  setPagination: React.Dispatch<React.SetStateAction<TablePaginationState>>,
  customHandlers?: {
    [key: string]: (value: unknown, updateUrl: (url: URL) => void) => void;
  }
) {
  // Clean up date_range from URL on mount
  useEffect(() => {
    cleanupDateRangeFromURL();
  }, []);

  // Create handleFilterChange function
  const handleFilterChange = createFilterChangeHandler(
    setClientFilters,
    setSearchValue,
    setPagination,
    customHandlers
  );

  return {
    handleFilterChange,
  };
}

