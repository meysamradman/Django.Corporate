import type { RouteRule } from "./types";
import { allRouteRules } from "./routes";

/**
 * Normalize pathname for consistent route matching
 * pathname همیشه از router می‌آید و نیازی به URL parsing نیست
 */
const normalizePathname = (pathname: string): string => {
  if (!pathname) {
    return "/";
  }

  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
};

/**
 * Find route rule by pathname
 */
export const findRouteRule = (pathname: string): RouteRule | undefined => {
  const normalizedPath = normalizePathname(pathname);
  return allRouteRules.find((rule) => rule.pattern.test(normalizedPath));
};

/**
 * Export all route rules
 */
export const routeRules = allRouteRules;

/**
 * Export RouteRule type
 */
export type { RouteRule };

