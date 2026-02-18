import PropertySearchPageServer from "@/components/real-estate/search/PropertySearchPageServer";
import { resolvePropertySearchFilters } from "@/components/real-estate/search/filters";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PropertiesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filters = resolvePropertySearchFilters(params);

  return <PropertySearchPageServer filters={filters} />;
}

export async function generateMetadata() {
  return {
    title: "لیست املاک",
    description: "جستجو و مشاهده لیست املاک با مسیرهای سئو و فیلترهای قابل اشتراک‌گذاری.",
  };
}
