import { permanentRedirect } from "next/navigation";
import { Suspense } from "react";

import { realEstateApi } from "@/api/real-estate/route";
import PropertySearchPageServer from "@/components/real-estate/search/PropertySearchPageServer";
import PropertySearchPageFallback from "@/components/real-estate/search/PropertySearchPageFallback";
import { normalizeTaxonomySlug, resolvePropertySearchFilters } from "@/components/real-estate/search/filters";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const buildTypePath = (slug: string): string => `/properties/type/${encodeURIComponent(slug)}`;

const searchParamsToQueryString = (
  params: Record<string, string | string[] | undefined>,
  excludedKeys: Set<string> = new Set()
): string => {
  const urlParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (excludedKeys.has(key)) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (entry !== undefined && entry !== null && entry !== "") {
          urlParams.append(key, String(entry));
        }
      });
      return;
    }

    if (value !== undefined && value !== null && value !== "") {
      urlParams.set(key, String(value));
    }
  });

  const query = urlParams.toString();
  return query ? `?${query}` : "";
};

async function PropertiesTypePageBody({ params, searchParams }: PageProps) {
  const routeParams = await params;
  const query = await searchParams;

  const normalizedSlug = normalizeTaxonomySlug(routeParams.slug);
  if (!normalizedSlug) {
    permanentRedirect("/properties");
  }

  if (normalizedSlug !== routeParams.slug) {
    permanentRedirect(`${buildTypePath(normalizedSlug)}${searchParamsToQueryString(query)}`);
  }

  const hasRedundantTypeFilters = query.property_type !== undefined || query.type_slug !== undefined;
  if (hasRedundantTypeFilters) {
    permanentRedirect(
      `${buildTypePath(normalizedSlug)}${searchParamsToQueryString(query, new Set(["property_type", "type_slug"]))}`
    );
  }

  const filters = {
    ...resolvePropertySearchFilters(query),
    type_slug: normalizedSlug,
    property_type: null,
  };

  return <PropertySearchPageServer filters={filters} />;
}

export default function PropertiesTypePage({ params, searchParams }: PageProps) {
  return (
    <Suspense fallback={<PropertySearchPageFallback />}>
      <PropertiesTypePageBody params={params} searchParams={searchParams} />
    </Suspense>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const normalizedSlug = normalizeTaxonomySlug(slug);

  const type = normalizedSlug
    ? await realEstateApi.getTypeBySlug(normalizedSlug).catch(() => null)
    : null;

  const typeTitle = type?.name || normalizedSlug || slug;

  return {
    title: `املاک | نوع ${typeTitle}`,
    description: `لیست املاک بر اساس نوع ${typeTitle}.`,
  };
}
