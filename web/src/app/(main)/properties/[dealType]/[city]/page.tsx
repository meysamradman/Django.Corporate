import { notFound } from "next/navigation";
import { Suspense } from "react";

import PropertySearchPageServer from "@/components/real-estate/search/PropertySearchPageServer";
import PropertySearchPageFallback from "@/components/real-estate/search/PropertySearchPageFallback";
import { filtersFromSeoSegments, resolvePropertySearchFilters } from "@/components/real-estate/search/filters";

type PageProps = {
  params: Promise<{ dealType: string; city: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function PropertiesDealTypeCityPageBody({ params, searchParams }: PageProps) {
  const routeParams = await params;
  const query = await searchParams;

  const pathFilters = filtersFromSeoSegments(routeParams.dealType, routeParams.city);
  if (!pathFilters.state_slug || !pathFilters.type_slug || !pathFilters.search) {
    notFound();
  }

  const filters = {
    ...resolvePropertySearchFilters(query),
    ...pathFilters,
  };

  return <PropertySearchPageServer filters={filters} />;
}

export default function PropertiesDealTypeCityPage({ params, searchParams }: PageProps) {
  return (
    <Suspense fallback={<PropertySearchPageFallback />}>
      <PropertiesDealTypeCityPageBody params={params} searchParams={searchParams} />
    </Suspense>
  );
}
