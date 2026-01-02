import type { RouteRule } from "../types";

const ID_SEGMENT = "[0-9a-zA-Z-]+";
const createRule = (config: RouteRule): RouteRule => config;

export const portfolioRoutes: RouteRule[] = [
  createRule({
    id: "portfolio-list",
    pattern: /^\/portfolios\/?$/,
    module: 'portfolio',
    action: "read",
    description: "لیست نمونه‌کارها",
  }),
  createRule({
    id: "portfolio-create",
    pattern: /^\/portfolios\/create\/?$/,
    module: 'portfolio',
    action: "create",
    description: "ایجاد نمونه‌کار",
  }),
  createRule({
    id: "portfolio-edit",
    pattern: new RegExp(`^/portfolios/${ID_SEGMENT}/edit/?$`),
    module: 'portfolio',
    action: "update",
    description: "ویرایش نمونه‌کار",
  }),
  createRule({
    id: "portfolio-view",
    pattern: new RegExp(`^/portfolios/${ID_SEGMENT}/view/?$`),
    module: 'portfolio',
    action: "read",
    description: "مشاهده نمونه‌کار",
  }),
  createRule({
    id: "portfolio-categories",
    pattern: /^\/portfolios\/categories\/?$/,
    module: 'portfolio.category',
    action: "read",
    description: "لیست دسته‌های نمونه‌کار",
  }),
  createRule({
    id: "portfolio-category-create",
    pattern: /^\/portfolios\/categories\/create\/?$/,
    module: 'portfolio.category',
    action: "create",
    description: "ایجاد دسته نمونه‌کار",
  }),
  createRule({
    id: "portfolio-category-edit",
    pattern: new RegExp(`^/portfolios/categories/${ID_SEGMENT}/edit/?$`),
    module: 'portfolio.category',
    action: "update",
    description: "ویرایش دسته نمونه‌کار",
  }),
  createRule({
    id: "portfolio-tags",
    pattern: /^\/portfolios\/tags\/?$/,
    module: 'portfolio.tag',
    action: "read",
    description: "لیست تگ‌های نمونه‌کار",
  }),
  createRule({
    id: "portfolio-tag-create",
    pattern: /^\/portfolios\/tags\/create\/?$/,
    module: 'portfolio.tag',
    action: "create",
    description: "ایجاد تگ نمونه‌کار",
  }),
  createRule({
    id: "portfolio-tag-edit",
    pattern: new RegExp(`^/portfolios/tags/${ID_SEGMENT}/edit/?$`),
    module: 'portfolio.tag',
    action: "update",
    description: "ویرایش تگ نمونه‌کار",
  }),
  createRule({
    id: "portfolio-options",
    pattern: /^\/portfolios\/options\/?$/,
    module: 'portfolio.option',
    action: "read",
    description: "لیست گزینه‌ها",
  }),
  createRule({
    id: "portfolio-option-create",
    pattern: /^\/portfolios\/options\/create\/?$/,
    module: 'portfolio.option',
    action: "create",
    description: "ایجاد گزینه",
  }),
  createRule({
    id: "portfolio-option-edit",
    pattern: new RegExp(`^/portfolios/options/${ID_SEGMENT}/edit/?$`),
    module: 'portfolio.option',
    action: "update",
    description: "ویرایش گزینه",
  }),
  createRule({
    id: "portfolio-option-view",
    pattern: new RegExp(`^/portfolios/options/${ID_SEGMENT}/?$`),
    module: 'portfolio.option',
    action: "read",
    description: "مشاهده گزینه",
  }),
];
