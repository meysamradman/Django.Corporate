import { notFound } from "next/navigation";
import { Suspense } from "react";

import PropertySearchPageServer from "@/components/real-estate/search/PropertySearchPageServer";
import PropertySearchPageFallback from "@/components/real-estate/search/PropertySearchPageFallback";
import { filtersFromSeoSegments, resolvePropertySearchFilters } from "@/components/real-estate/search/filters";

type PageProps = {
  params: Promise<{ dealType: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function PropertiesDealTypePageBody({ params, searchParams }: PageProps) {
  const routeParams = await params;
  const query = await searchParams;

  const pathFilters = filtersFromSeoSegments(routeParams.dealType);
  if (!pathFilters.state_slug) {
    notFound();
  }

  const filters = {
    ...resolvePropertySearchFilters(query),
    ...pathFilters,
  };

  return <PropertySearchPageServer filters={filters} />;
}

export default function PropertiesDealTypePage({ params, searchParams }: PageProps) {
  return (
    <Suspense fallback={<PropertySearchPageFallback />}>
      <PropertiesDealTypePageBody params={params} searchParams={searchParams} />
    </Suspense>
  );
}
