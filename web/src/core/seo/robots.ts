import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/core/seo/site";

export const buildRobotsMetadata = (): MetadataRoute.Robots => {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/private/"],
      },
    ],
    sitemap: [`${siteUrl}/sitemap.xml`],
    host: siteUrl,
  };
};
