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

const buildStatePath = (slug: string): string => `/properties/state/${encodeURIComponent(slug)}`;

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

async function PropertiesStatePageBody({ params, searchParams }: PageProps) {
  const routeParams = await params;
  const query = await searchParams;

  const normalizedSlug = normalizeTaxonomySlug(routeParams.slug);
  if (!normalizedSlug) {
    permanentRedirect("/properties");
  }

  if (normalizedSlug !== routeParams.slug) {
    permanentRedirect(`${buildStatePath(normalizedSlug)}${searchParamsToQueryString(query)}`);
  }

  const hasRedundantStateFilters = query.state !== undefined || query.state_slug !== undefined;
  if (hasRedundantStateFilters) {
    permanentRedirect(
      `${buildStatePath(normalizedSlug)}${searchParamsToQueryString(query, new Set(["state", "state_slug"]))}`
    );
  }

  const filters = {
    ...resolvePropertySearchFilters(query),
    state_slug: normalizedSlug,
    state: null,
  };

  return <PropertySearchPageServer filters={filters} />;
}

export default function PropertiesStatePage({ params, searchParams }: PageProps) {
  return (
    <Suspense fallback={<PropertySearchPageFallback />}>
      <PropertiesStatePageBody params={params} searchParams={searchParams} />
    </Suspense>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const normalizedSlug = normalizeTaxonomySlug(slug);

  const state = normalizedSlug
    ? await realEstateApi.getStateBySlug(normalizedSlug).catch(() => null)
    : null;

  const stateTitle = state?.name || state?.title || normalizedSlug || slug;

  return {
    title: `املاک | وضعیت ${stateTitle}`,
    description: `لیست املاک بر اساس وضعیت ${stateTitle}.`,
  };
}
