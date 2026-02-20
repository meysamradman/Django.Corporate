import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { realEstateApi } from "@/api/real-estate/route";
import PropertySearchPageServer from "@/components/real-estate/search/PropertySearchPageServer";
import PropertySearchPageFallback from "@/components/real-estate/search/PropertySearchPageFallback";
import { filtersFromSeoSegments, filtersToSearchParams, normalizeTaxonomySlug, resolvePropertySearchFilters, resolvePropertySearchPath, toSeoLocationSegment } from "@/components/real-estate/search/filters";

type PageProps = {
  params: Promise<{ dealType: string; segments?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const toSeoSegment = (value: string): string => toSeoLocationSegment(value);

async function PropertiesDealTypeSegmentsPageBody({ params, searchParams }: PageProps) {
  const routeParams = await params;
  const query = await searchParams;

  const firstSegmentRaw = normalizeTaxonomySlug(routeParams.dealType);
  const firstSegmentKey = firstSegmentRaw.toLowerCase();
  if (!firstSegmentRaw) {
    notFound();
  }

  const availableStatuses = await realEstateApi
    .getStates({ page: 1, size: 200 })
    .then((response) => new Set((response?.data || []).map((item) => normalizeTaxonomySlug(item.slug || "").toLowerCase()).filter(Boolean)))
    .catch(() => new Set<string>());

  const availableTypes = await realEstateApi
    .getTypes({ page: 1, size: 300 })
    .then((response) => new Set((response?.data || []).map((item) => normalizeTaxonomySlug(item.slug || "").toLowerCase()).filter(Boolean)))
    .catch(() => new Set<string>());

  const segments = routeParams.segments || [];

  const isStatusRoute = availableStatuses.has(firstSegmentKey);
  const isTypeOnlyRoute = !isStatusRoute && availableTypes.has(firstSegmentKey);

  if (isStatusRoute && segments.length > 2) {
    notFound();
  }
  if (isTypeOnlyRoute && segments.length > 0) {
    notFound();
  }
  if (!isStatusRoute && !isTypeOnlyRoute && segments.length > 1) {
    notFound();
  }

  let dealTypeSegment = "";
  let locationSegment = "";
  let typeSegment = "";

  if (isStatusRoute) {
    dealTypeSegment = firstSegmentRaw;

    if (segments.length === 1) {
      const singleSegment = normalizeTaxonomySlug(segments[0]);
      if (availableTypes.has(singleSegment.toLowerCase())) {
        typeSegment = singleSegment;
      } else {
        locationSegment = segments[0];
      }
    } else {
      locationSegment = segments[0] || "";
      typeSegment = segments[1] || "";
    }
  } else if (isTypeOnlyRoute) {
    typeSegment = firstSegmentRaw;
  } else {
    locationSegment = routeParams.dealType;
    typeSegment = segments[0] || "";
    if (typeSegment) {
      const normalizedType = normalizeTaxonomySlug(typeSegment);
      if (!availableTypes.has(normalizedType.toLowerCase())) {
        notFound();
      }
      typeSegment = normalizedType;
    }
  }

  const pathFilters = filtersFromSeoSegments(dealTypeSegment, locationSegment, typeSegment);

  let resolvedCityId: number | null = null;
  let resolvedProvinceId: number | null = null;
  let resolvedCitySlug = "";
  let resolvedProvinceSlug = "";

  if (locationSegment) {
    const decodedLocation = decodeURIComponent(locationSegment).trim();

    const cityCandidates = await realEstateApi
      .getCities({ search: decodedLocation, page: 1, size: 200 })
      .then((response) => response?.data || [])
      .catch(() => []);

    const cityBySegment = cityCandidates.find((item) => toSeoSegment(item.name || "") === toSeoSegment(decodedLocation));

    if (cityBySegment) {
      resolvedCityId = cityBySegment.id;
      resolvedCitySlug = toSeoSegment(cityBySegment.name || decodedLocation);
      resolvedProvinceId = cityBySegment.province_id ?? null;
      if (cityBySegment.province_name) {
        resolvedProvinceSlug = toSeoSegment(cityBySegment.province_name);
      }
    } else {
      const provinceCandidates = await realEstateApi
        .getProvinces({ search: decodedLocation, page: 1, size: 200 })
        .then((response) => response?.data || [])
        .catch(() => []);

      const provinceBySegment = provinceCandidates.find((item) => toSeoSegment(item.name || "") === toSeoSegment(decodedLocation));

      if (!provinceBySegment) {
        notFound();
      }

      resolvedProvinceId = provinceBySegment.id;
      resolvedProvinceSlug = toSeoSegment(provinceBySegment.name || decodedLocation);
    }
  }

  const filters = {
    ...resolvePropertySearchFilters(query),
    ...pathFilters,
    city: resolvedCityId,
    province: resolvedProvinceId,
    city_slug: resolvedCitySlug,
    province_slug: resolvedProvinceSlug,
  };

  if (!locationSegment && filters.city !== null && !filters.city_slug) {
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

  if (!locationSegment && filters.city === null && filters.province !== null && !filters.province_slug) {
    const provinceById = await realEstateApi.getProvinceById(filters.province).catch(() => null);
    if (provinceById?.name) {
      filters.province_slug = toSeoSegment(provinceById.name);
    }
  }

  const canonicalPath = resolvePropertySearchPath(filters);
  const canonicalQuery = filtersToSearchParams(filters).toString();
  const canonicalUrl = canonicalQuery ? `${canonicalPath}?${canonicalQuery}` : canonicalPath;

  const currentPath = `/properties/${encodeURIComponent(routeParams.dealType)}${segments.length ? `/${segments.map((item) => encodeURIComponent(item)).join("/")}` : ""}`;
  const currentParams = new URLSearchParams();
  for (const [key, rawValue] of Object.entries(query)) {
    const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
    if (value !== undefined && value !== "") {
      currentParams.set(key, value);
    }
  }
  const currentQuery = currentParams.toString();
  const currentUrl = currentQuery ? `${currentPath}?${currentQuery}` : currentPath;

  if (canonicalUrl !== currentUrl) {
    redirect(canonicalUrl);
  }

  return <PropertySearchPageServer filters={filters} />;
}

export default function PropertiesDealTypeSegmentsPage({ params, searchParams }: PageProps) {
  return (
    <Suspense fallback={<PropertySearchPageFallback />}>
      <PropertiesDealTypeSegmentsPageBody params={params} searchParams={searchParams} />
    </Suspense>
  );
}
