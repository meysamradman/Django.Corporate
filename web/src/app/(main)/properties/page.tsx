import { Suspense } from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";

import { realEstateApi } from "@/api/real-estate/route";
import PropertySearchPageServer from "@/components/real-estate/search/PropertySearchPageServer";
import PropertySearchPageFallback from "@/components/real-estate/search/PropertySearchPageFallback";
import { buildCanonicalPropertySearchAbsoluteUrl, ensureCanonicalPropertySearchRedirect } from "@/core/seo/canonical/propertySearch";
import { resolvePropertySearchFilters, toSeoLocationSegment } from "@/components/real-estate/search/filters";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function PropertiesPageBody({ searchParams }: PageProps) {
  const params = await searchParams;
  const filters = resolvePropertySearchFilters(params);
  const cookieStore = await cookies();

  if (
    filters.city === null &&
    filters.province === null &&
    !filters.city_slug &&
    !filters.province_slug
  ) {
    const preferredProvinceRaw = cookieStore.get("preferred_province_id")?.value || "";
    const preferredProvinceId = Number(preferredProvinceRaw);
    if (!Number.isNaN(preferredProvinceId) && preferredProvinceId > 0) {
      filters.province = preferredProvinceId;
    }
  }

  const toSeoSegment = (value: string): string => toSeoLocationSegment(value);

  if (filters.city !== null) {
    const cityById = await realEstateApi.getCityById(filters.city).catch(() => null);
    if (cityById?.name) {
      filters.city_slug = String(cityById.slug || toSeoSegment(cityById.name)).trim();
      if (typeof cityById.province_id === "number") {
        filters.province = cityById.province_id;
      }
      if (cityById.province_name) {
        filters.province_slug = String(cityById.province_slug || toSeoSegment(cityById.province_name)).trim();
      }
    }
  }

  if (filters.city === null && filters.province !== null) {
    const provinceById = await realEstateApi.getProvinceById(filters.province).catch(() => null);
    if (provinceById?.name) {
      filters.province_slug = String(provinceById.slug || toSeoSegment(provinceById.name)).trim();
    }
  }

  if (!filters.state_slug && filters.state !== null) {
    const resolvedById = await realEstateApi
      .getListingTypes({ page: 1, size: 200 })
      .then((response) => (response?.data || []).find((item) => item.id === filters.state))
      .catch(() => null);

    if (resolvedById?.slug) {
      filters.state_slug = String(resolvedById.slug).trim();
      filters.state = null;
    }
  }

  if (!filters.type_slug && filters.property_type !== null) {
    const resolvedById = await realEstateApi
      .getTypes({ page: 1, size: 300 })
      .then((response) => (response?.data || []).find((item) => item.id === filters.property_type))
      .catch(() => null);

    if (resolvedById?.slug) {
      filters.type_slug = String(resolvedById.slug).trim();
      filters.property_type = null;
    }
  }

  ensureCanonicalPropertySearchRedirect({
    filters,
    path: "/properties",
    searchParams: params,
  });

  return <PropertySearchPageServer filters={filters} />;
}

export default function PropertiesPage({ searchParams }: PageProps) {
  return (
    <Suspense fallback={<PropertySearchPageFallback />}>
      <PropertiesPageBody searchParams={searchParams} />
    </Suspense>
  );
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const filters = resolvePropertySearchFilters(params);

  return {
    title: "لیست املاک",
    description: "جستجو و مشاهده لیست املاک با مسیرهای سئو و فیلترهای قابل اشتراک‌گذاری.",
    alternates: {
      canonical: buildCanonicalPropertySearchAbsoluteUrl(filters),
    },
  };
}
