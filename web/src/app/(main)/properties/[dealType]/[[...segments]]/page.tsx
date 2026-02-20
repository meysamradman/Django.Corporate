import { notFound } from "next/navigation";
import { Suspense } from "react";

import { realEstateApi } from "@/api/real-estate/route";
import PropertySearchPageServer from "@/components/real-estate/search/PropertySearchPageServer";
import PropertySearchPageFallback from "@/components/real-estate/search/PropertySearchPageFallback";
import { filtersFromSeoSegments, normalizeTaxonomySlug, resolvePropertySearchFilters } from "@/components/real-estate/search/filters";

type PageProps = {
  params: Promise<{ dealType: string; segments?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function PropertiesDealTypeSegmentsPageBody({ params, searchParams }: PageProps) {
  const routeParams = await params;
  const query = await searchParams;

  const toDealSegment = (value: string): string => {
    const normalized = value.trim().toLowerCase().replace(/[_\s]+/g, "-");
    if (normalized === "presale") return "pre-sale";
    return normalized;
  };

  const normalizedDealType = toDealSegment(normalizeTaxonomySlug(routeParams.dealType));
  if (!normalizedDealType) {
    notFound();
  }

  const availableStatuses = await realEstateApi
    .getListingTypes()
    .then((items) => new Set((items || []).map((item) => toDealSegment(item.value || "")).filter(Boolean)))
    .catch(() => new Set<string>());

  if (!availableStatuses.has(normalizedDealType)) {
    notFound();
  }

  const segments = routeParams.segments || [];
  if (segments.length > 2) {
    notFound();
  }

  const citySegment = segments[0] || "";
  const typeSegment = segments[1] || "";

  const pathFilters = filtersFromSeoSegments(normalizedDealType, citySegment, typeSegment);
  if (!pathFilters.state_slug) {
    notFound();
  }

  const filters = {
    ...resolvePropertySearchFilters(query),
    ...pathFilters,
  };

  return <PropertySearchPageServer filters={filters} />;
}

export default function PropertiesDealTypeSegmentsPage({ params, searchParams }: PageProps) {
  return (
    <Suspense fallback={<PropertySearchPageFallback />}>
      <PropertiesDealTypeSegmentsPageBody params={params} searchParams={searchParams} />
    </Suspense>
  );
}
