import { Suspense } from "react";

import PropertySearchPageServer from "@/components/real-estate/search/PropertySearchPageServer";
import PropertySearchPageFallback from "@/components/real-estate/search/PropertySearchPageFallback";
import { resolvePropertySearchFilters } from "@/components/real-estate/search/filters";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function PropertiesPageBody({ searchParams }: PageProps) {
  const params = await searchParams;
  const filters = resolvePropertySearchFilters(params);

  return <PropertySearchPageServer filters={filters} />;
}

export default function PropertiesPage({ searchParams }: PageProps) {
  return (
    <Suspense fallback={<PropertySearchPageFallback />}>
      <PropertiesPageBody searchParams={searchParams} />
    </Suspense>
  );
}

export async function generateMetadata() {
  return {
    title: "لیست املاک",
    description: "جستجو و مشاهده لیست املاک با مسیرهای سئو و فیلترهای قابل اشتراک‌گذاری.",
  };
}
