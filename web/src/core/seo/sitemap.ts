import type { MetadataRoute } from "next";

import { realEstateApi } from "@/api/real-estate/route";
import { toAbsoluteUrl } from "@/core/seo/site";

const uniquePaths = (paths: string[]): string[] =>
  Array.from(new Set(paths.filter(Boolean)));

export const buildSitemapEntries = async (): Promise<MetadataRoute.Sitemap> => {
  const now = new Date();

  const staticPaths = [
    "/",
    "/properties",
    "/blogs",
    "/portfolios",
    "/agents",
    "/agencies",
    "/contact",
  ];

  let propertyPaths: string[] = [];

  try {
    const [statesResponse, provincesResponse] = await Promise.all([
      realEstateApi.getStates({ page: 1, size: 200 }),
      realEstateApi.getProvinces({ page: 1, size: 200, min_property_count: 1 }),
    ]);

    const states = (statesResponse?.data || [])
      .map((item) => String(item.slug || "").trim())
      .filter(Boolean);

    const provinces = (provincesResponse?.data || [])
      .map((item) => String(item.slug || "").trim())
      .filter(Boolean);

    const statePaths = states.map((stateSlug) => `/properties/${encodeURIComponent(stateSlug)}`);
    const provincePaths = provinces.map((provinceSlug) => `/properties/${encodeURIComponent(provinceSlug)}`);

    const stateProvincePaths: string[] = [];
    states.forEach((stateSlug) => {
      provinces.forEach((provinceSlug) => {
        stateProvincePaths.push(`/properties/${encodeURIComponent(stateSlug)}/${encodeURIComponent(provinceSlug)}`);
      });
    });

    propertyPaths = uniquePaths([...statePaths, ...provincePaths, ...stateProvincePaths]);
  } catch {
    propertyPaths = [];
  }

  const allPaths = uniquePaths([...staticPaths, ...propertyPaths]);

  return allPaths.map((path) => ({
    url: toAbsoluteUrl(path),
    lastModified: now,
    changeFrequency: path.startsWith("/properties") ? "daily" : "weekly",
    priority: path === "/" ? 1 : path.startsWith("/properties") ? 0.9 : 0.7,
  }));
};
