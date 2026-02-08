import { useEffect } from "react";
import type { TablePaginationState } from "@/types/shared/pagination";
import { cleanupDateRangeFromURL, createFilterChangeHandler } from "./tableSorting";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

  useEffect(() => {
    cleanupDateRangeFromURL(navigate);
  }, [navigate]);

  const handleFilterChange = createFilterChangeHandler(
    setClientFilters,
    setSearchValue,
    setPagination,
    navigate,
    customHandlers
  );

  return {
    handleFilterChange,
  };
}

