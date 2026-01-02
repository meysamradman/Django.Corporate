import type { RouteRule } from "../types";

const ID_SEGMENT = "[0-9a-zA-Z-]+";
const createRule = (config: RouteRule): RouteRule => config;

export const userManagementRoutes: RouteRule[] = [
  createRule({
    id: "users-list",
    pattern: /^\/users\/?$/,
    module: 'users',
    action: "read",
    description: "لیست کاربران",
  }),
  createRule({
    id: "users-create",
    pattern: /^\/users\/create\/?$/,
    module: 'users',
    action: "create",
    description: "ایجاد کاربر",
  }),
  createRule({
    id: "users-edit",
    pattern: new RegExp(`^/users/${ID_SEGMENT}/edit/?$`),
    module: 'users',
    action: "update",
    description: "ویرایش کاربر",
  }),
];
