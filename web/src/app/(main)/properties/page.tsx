import { Suspense } from "react";
import { redirect } from "next/navigation";

import PropertySearchPageServer from "@/components/real-estate/search/PropertySearchPageServer";
import PropertySearchPageFallback from "@/components/real-estate/search/PropertySearchPageFallback";
import { filtersToSearchParams, resolvePropertySearchFilters, resolvePropertySearchPath } from "@/components/real-estate/search/filters";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function PropertiesPageBody({ searchParams }: PageProps) {
  const params = await searchParams;
  const filters = resolvePropertySearchFilters(params);
  const canonicalPath = resolvePropertySearchPath(filters);
  const canonicalQuery = filtersToSearchParams(filters).toString();
  const canonicalUrl = canonicalQuery ? `${canonicalPath}?${canonicalQuery}` : canonicalPath;

  const currentParams = new URLSearchParams();
  for (const [key, rawValue] of Object.entries(params)) {
    const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
    if (value !== undefined && value !== "") {
      currentParams.set(key, value);
    }
  }
  const currentQuery = currentParams.toString();
  const currentUrl = currentQuery ? `/properties?${currentQuery}` : "/properties";

  if (canonicalUrl !== currentUrl) {
    redirect(canonicalUrl);
  }

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
