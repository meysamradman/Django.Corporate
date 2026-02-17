"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { realEstateApi } from "@/api/real-estate/route";
import {
  filtersToSearchParams,
  toPropertyListApiParams,
} from "@/components/real-estate/search/filters";
import type { Property } from "@/types/real-estate/property";
import type { PropertySearchFilters } from "@/types/real-estate/searchFilters";

type UsePropertySearchParams = {
  initialFilters: PropertySearchFilters;
  initialProperties: Property[];
  initialTotalCount: number;
  initialTotalPages: number;
  initialCurrentPage: number;
};

export function usePropertySearch({
  initialFilters,
  initialProperties,
  initialTotalCount,
  initialTotalPages,
  initialCurrentPage,
}: UsePropertySearchParams) {
  const router = useRouter();

  const [filters, setFilters] = React.useState<PropertySearchFilters>(initialFilters);
  const [properties, setProperties] = React.useState<Property[]>(initialProperties);
  const [totalCount, setTotalCount] = React.useState(initialTotalCount);
  const [totalPages, setTotalPages] = React.useState(initialTotalPages);
  const [currentPage, setCurrentPage] = React.useState(initialCurrentPage);
  const [isLoading, setIsLoading] = React.useState(false);

  const requestIdRef = React.useRef(0);
  const initializedRef = React.useRef(false);

  const onFiltersChange = React.useCallback((updates: Partial<PropertySearchFilters>) => {
    setFilters((previous) => ({ ...previous, ...updates }));
  }, []);

  const onReset = React.useCallback((resetFilters: PropertySearchFilters) => {
    setFilters(resetFilters);
  }, []);

  const onPageChange = React.useCallback((page: number) => {
    setFilters((previous) => ({ ...previous, page }));
  }, []);

  React.useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      return;
    }

    const timer = setTimeout(async () => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      setIsLoading(true);

      const params = filtersToSearchParams(filters);
      const query = params.toString();
      router.replace(query ? `/real-estate?${query}` : "/real-estate", { scroll: false });

      try {
        const response = await realEstateApi.getProperties(toPropertyListApiParams(filters));
        if (requestId !== requestIdRef.current) return;

        setProperties(response.data ?? []);
        setTotalCount(response.pagination?.count ?? 0);
        setTotalPages(response.pagination?.total_pages ?? 1);
        setCurrentPage(response.pagination?.current_page ?? filters.page);
      } catch {
        if (requestId !== requestIdRef.current) return;
        setProperties([]);
        setTotalCount(0);
        setTotalPages(1);
        setCurrentPage(1);
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [filters, router]);

  return {
    filters,
    properties,
    totalCount,
    totalPages,
    currentPage,
    isLoading,
    onFiltersChange,
    onReset,
    onPageChange,
  };
}
