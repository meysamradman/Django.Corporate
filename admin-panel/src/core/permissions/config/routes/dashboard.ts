import type { RouteRule } from "../types";

const createRule = (config: RouteRule): RouteRule => config;

export const dashboardRoutes: RouteRule[] = [
  createRule({
    id: "dashboard-home",
    pattern: /^\/$/,
    description: "داشبورد",
  }),
];
