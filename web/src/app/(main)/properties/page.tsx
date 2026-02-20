import { Suspense } from "react";
import { redirect } from "next/navigation";

import { realEstateApi } from "@/api/real-estate/route";
import PropertySearchPageServer from "@/components/real-estate/search/PropertySearchPageServer";
import PropertySearchPageFallback from "@/components/real-estate/search/PropertySearchPageFallback";
import { filtersToSearchParams, resolvePropertySearchFilters, resolvePropertySearchPath, toSeoLocationSegment } from "@/components/real-estate/search/filters";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function PropertiesPageBody({ searchParams }: PageProps) {
  const params = await searchParams;
  const filters = resolvePropertySearchFilters(params);

  const toSeoSegment = (value: string): string => toSeoLocationSegment(value);

  if (filters.city !== null) {
    const cityById = await realEstateApi.getCityById(filters.city).catch(() => null);
    if (cityById?.name) {
      filters.city_slug = toSeoSegment(cityById.name);
      if (typeof cityById.province_id === "number") {
        filters.province = cityById.province_id;
      }
      if (cityById.province_name) {
        filters.province_slug = toSeoSegment(cityById.province_name);
      }
    }
  }

  if (filters.city === null && filters.province !== null) {
    const provinceById = await realEstateApi.getProvinceById(filters.province).catch(() => null);
    if (provinceById?.name) {
      filters.province_slug = toSeoSegment(provinceById.name);
    }
  }

  if (!filters.state_slug && filters.state !== null) {
    const resolvedById = await realEstateApi
      .getStates({ page: 1, size: 200 })
      .then((response) => (response?.data || []).find((item) => item.id === filters.state))
      .catch(() => null);

    if (resolvedById?.slug) {
      filters.state_slug = String(resolvedById.slug).trim();
      filters.state = null;
    }
  }

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
