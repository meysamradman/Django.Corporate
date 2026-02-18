import { notFound } from "next/navigation";

import PropertySearchPageServer from "@/components/real-estate/search/PropertySearchPageServer";
import { filtersFromSeoSegments, resolvePropertySearchFilters } from "@/components/real-estate/search/filters";

type PageProps = {
  params: Promise<{ dealType: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PropertiesDealTypePage({ params, searchParams }: PageProps) {
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
