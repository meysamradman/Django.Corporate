import { Suspense } from "react";

import PropertySearchPageServer from "@/components/real-estate/search/PropertySearchPageServer";
import PropertySearchPageFallback from "@/components/real-estate/search/PropertySearchPageFallback";
import { resolvePropertySearchFilters } from "@/components/real-estate/search/filters";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function PropertiesRentPageBody({ searchParams }: PageProps) {
  const params = await searchParams;
  const filters = {
    ...resolvePropertySearchFilters(params),
    state_slug: "rent",
  };

  return <PropertySearchPageServer filters={filters} />;
}

export default function PropertiesRentPage({ searchParams }: PageProps) {
  return (
    <Suspense fallback={<PropertySearchPageFallback />}>
      <PropertiesRentPageBody searchParams={searchParams} />
    </Suspense>
  );
}
