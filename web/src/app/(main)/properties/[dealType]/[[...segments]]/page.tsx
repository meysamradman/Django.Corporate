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

  const normalizedDealType = normalizeTaxonomySlug(routeParams.dealType);
  const normalizedDealTypeKey = normalizedDealType.toLowerCase();
  if (!normalizedDealType) {
    notFound();
  }

  const availableStatuses = await realEstateApi
    .getStates({ page: 1, size: 200 })
    .then((response) => new Set((response?.data || []).map((item) => normalizeTaxonomySlug(item.slug || "").toLowerCase()).filter(Boolean)))
    .catch(() => new Set<string>());

  const availableTypes = await realEstateApi
    .getTypes({ page: 1, size: 300 })
    .then((response) => new Set((response?.data || []).map((item) => normalizeTaxonomySlug(item.slug || "").toLowerCase()).filter(Boolean)))
    .catch(() => new Set<string>());

  if (!availableStatuses.has(normalizedDealTypeKey)) {
    notFound();
  }

  const segments = routeParams.segments || [];
  if (segments.length > 2) {
    notFound();
  }

  let citySegment = "";
  let typeSegment = "";

  if (segments.length === 1) {
    const singleSegment = normalizeTaxonomySlug(segments[0]);
    if (availableTypes.has(singleSegment.toLowerCase())) {
      typeSegment = singleSegment;
    } else {
      citySegment = segments[0];
    }
  } else {
    citySegment = segments[0] || "";
    typeSegment = segments[1] || "";
  }

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
