import type { RouteRule } from "../types";

const ID_SEGMENT = "[0-9a-zA-Z-]+";
const createRule = (config: RouteRule): RouteRule => config;

export const blogRoutes: RouteRule[] = [
  createRule({
    id: "blog-list",
    pattern: /^\/blogs\/?$/,
    module: 'blog',
    action: "read",
    description: "لیست وبلاگ‌ها",
  }),
  createRule({
    id: "blog-create",
    pattern: /^\/blogs\/create\/?$/,
    module: 'blog',
    action: "create",
    description: "ایجاد وبلاگ",
  }),
  createRule({
    id: "blog-edit",
    pattern: new RegExp(`^/blogs/${ID_SEGMENT}/edit/?$`),
    module: 'blog',
    action: "update",
    description: "ویرایش وبلاگ",
  }),
  createRule({
    id: "blog-view",
    pattern: new RegExp(`^/blogs/${ID_SEGMENT}/view/?$`),
    module: 'blog',
    action: "read",
    description: "مشاهده وبلاگ",
  }),
  createRule({
    id: "blog-categories",
    pattern: /^\/blogs\/categories\/?$/,
    module: 'blog.category',
    action: "read",
    description: "لیست دسته‌های وبلاگ",
  }),
  createRule({
    id: "blog-category-create",
    pattern: /^\/blogs\/categories\/create\/?$/,
    module: 'blog.category',
    action: "create",
    description: "ایجاد دسته وبلاگ",
  }),
  createRule({
    id: "blog-category-edit",
    pattern: new RegExp(`^/blogs/categories/${ID_SEGMENT}/edit/?$`),
    module: 'blog.category',
    action: "update",
    description: "ویرایش دسته وبلاگ",
  }),
  createRule({
    id: "blog-tags",
    pattern: /^\/blogs\/tags\/?$/,
    module: 'blog.tag',
    action: "read",
    description: "لیست برچسب‌های وبلاگ",
  }),
  createRule({
    id: "blog-tag-create",
    pattern: /^\/blogs\/tags\/create\/?$/,
    module: 'blog.tag',
    action: "create",
    description: "ایجاد برچسب وبلاگ",
  }),
  createRule({
    id: "blog-tag-edit",
    pattern: new RegExp(`^/blogs/tags/${ID_SEGMENT}/edit/?$`),
    module: 'blog.tag',
    action: "update",
    description: "ویرایش برچسب وبلاگ",
  }),
];
