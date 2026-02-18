import PropertySearchPageServer from "@/components/real-estate/search/PropertySearchPageServer";
import { resolvePropertySearchFilters } from "@/components/real-estate/search/filters";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PropertiesRentPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filters = {
    ...resolvePropertySearchFilters(params),
    state_slug: "rent",
  };

  return <PropertySearchPageServer filters={filters} />;
}
