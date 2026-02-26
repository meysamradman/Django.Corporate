"use client";

import React from "react";
import dynamic from "next/dynamic";

import PropertySearchResults from "@/components/real-estate/search/PropertySearchResults";
import type { SidebarOption } from "@/components/real-estate/search/PropertySearchSidebar";
import {
  resolvePropertySearchFilters,
} from "@/components/real-estate/search/filters";
import { usePropertySearch } from "@/components/real-estate/search/usePropertySearch";
import type { Property } from "@/types/real-estate/property";
import type { PropertySearchFilters } from "@/types/real-estate/searchFilters";

const PropertySearchSidebar = dynamic(
  () => import("@/components/real-estate/search/PropertySearchSidebar"),
  { ssr: false }
);

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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:h-[calc(100vh-8.5rem)] lg:overflow-hidden">
        <div className="lg:col-span-3 xl:col-span-3 lg:self-start lg:sticky lg:top-24 h-fit">
          <PropertySearchSidebar
            filters={filters}
            isLoading={isLoading}
            typeOptions={typeOptions}
            stateOptions={stateOptions}
            provinceOptions={provinceOptions}
            cityOptions={cityOptions}
            regionOptions={regionOptions}
            tagOptions={tagOptions}
            featureOptions={featureOptions}
            statusOptions={statusOptions}
            onFiltersChange={onFiltersChange}
            onReset={() => onReset(resetFilters)}
          />
        </div>

        <div className="lg:col-span-9 xl:col-span-9 lg:overflow-y-auto lg:pl-1 scrollbar-hidden">
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
