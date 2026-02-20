"use client";

import React from "react";

import PropertySearchResults from "@/components/real-estate/search/PropertySearchResults";
import PropertySearchSidebar, {
  type SidebarOption,
} from "@/components/real-estate/search/PropertySearchSidebar";
import {
  resolvePropertySearchFilters,
} from "@/components/real-estate/search/filters";
import { usePropertySearch } from "@/components/real-estate/search/usePropertySearch";
import type { Property } from "@/types/real-estate/property";
import type { PropertySearchFilters } from "@/types/real-estate/searchFilters";

type PropertySearchClientProps = {
  initialFilters: PropertySearchFilters;
  initialProperties: Property[];
  initialTotalCount: number;
  initialTotalPages: number;
  initialCurrentPage: number;
  typeOptions: SidebarOption[];
  stateOptions: SidebarOption[];
  provinceOptions: SidebarOption[];
  cityOptions: SidebarOption[];
  regionOptions: SidebarOption[];
  labelOptions: SidebarOption[];
  tagOptions: SidebarOption[];
  featureOptions: SidebarOption[];
  statusOptions: SidebarOption[];
};

const buildResetFilters = (_source: PropertySearchFilters): PropertySearchFilters => ({
  ...resolvePropertySearchFilters({}),
});

export default function PropertySearchClient({
  initialFilters,
  initialProperties,
  initialTotalCount,
  initialTotalPages,
  initialCurrentPage,
  typeOptions,
  stateOptions,
  provinceOptions,
  cityOptions,
  regionOptions,
  labelOptions,
  tagOptions,
  featureOptions,
  statusOptions,
}: PropertySearchClientProps) {
  const {
    filters,
    properties,
    totalCount,
    totalPages,
    currentPage,
    isLoading,
    onFiltersChange,
    onReset,
    onPageChange,
  } = usePropertySearch({
    initialFilters,
    initialProperties,
    initialTotalCount,
    initialTotalPages,
    initialCurrentPage,
  });

  const resetFilters = React.useMemo(() => buildResetFilters(initialFilters), [initialFilters]);

  return (
    <main className="container mr-auto ml-auto py-10 md:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-4 xl:col-span-3">
          <div className="lg:sticky lg:top-24">
            <PropertySearchSidebar
              filters={filters}
              isLoading={isLoading}
              typeOptions={typeOptions}
              stateOptions={stateOptions}
              provinceOptions={provinceOptions}
              cityOptions={cityOptions}
              regionOptions={regionOptions}
              labelOptions={labelOptions}
              tagOptions={tagOptions}
              featureOptions={featureOptions}
              statusOptions={statusOptions}
              onFiltersChange={onFiltersChange}
              onReset={() => onReset(resetFilters)}
            />
          </div>
        </div>

        <div className="lg:col-span-8 xl:col-span-9">
          <PropertySearchResults
            properties={properties}
            totalCount={totalCount}
            totalPages={totalPages}
            currentPage={currentPage}
            filters={filters}
            isLoading={isLoading}
            onPageChange={onPageChange}
          />
        </div>
      </div>
    </main>
  );
}
