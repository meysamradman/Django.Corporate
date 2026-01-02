import type { RouteRule } from "../types";

const createRule = (config: RouteRule): RouteRule => config;

export const analyticsRoutes: RouteRule[] = [
  createRule({
    id: "analytics-page-views",
    pattern: /^\/analytics\/?$/,
    module: 'analytics',
    action: "manage",
    description: "آمار بازدید وب‌سایت و اپلیکیشن",
  }),
  createRule({
    id: "analytics-stats",
    pattern: /^\/analytics\/stats\/?$/,
    module: 'analytics',
    action: "manage",
    description: "آمار سیستم و اپلیکیشن‌ها",
  }),
];
