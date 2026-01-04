import type { RouteRule } from "../types";

const ID_SEGMENT = "[0-9a-zA-Z-]+";
const createRule = (config: RouteRule): RouteRule => config;

export const adminManagementRoutes: RouteRule[] = [
  createRule({
    id: "admins-self-edit",
    pattern: /^\/admins\/me\/edit\/?$/,
    module: 'admin',
    action: "update",
    description: "ویرایش پروفایل من",
    // همه ادمین‌ها می‌توانند پروفایل خودشون رو ویرایش کنند
  }),
  createRule({
    id: "admins-list",
    pattern: /^\/admins\/?$/,
    module: 'admin',
    action: "read",
    description: "Admin List",
    requireSuperAdmin: true,  // فقط Super Admin
  }),
  createRule({
    id: "admins-create",
    pattern: /^\/admins\/create\/?$/,
    module: 'admin',
    action: "create",
    description: "Create Admin",
    requireSuperAdmin: true,  // فقط Super Admin
  }),
  createRule({
    id: "admins-edit",
    pattern: new RegExp(`^/admins/${ID_SEGMENT}/edit/?$`),
    module: 'admin',
    action: "update",
    description: "Edit Admin",
    requireSuperAdmin: true,  // فقط Super Admin
  }),
  createRule({
    id: "admins-permissions",
    pattern: /^\/admins\/permissions\/?$/,
    module: 'admin',
    action: "manage",
    description: "مدیریت دسترسی ادمین",
    requireSuperAdmin: true,  // فقط Super Admin
  }),
];

export const roleRoutes: RouteRule[] = [
  createRule({
    id: "roles-list",
    pattern: /^\/roles\/?$/,
    module: 'admin',
    action: "read",
    description: "لیست نقش‌ها",
    requireSuperAdmin: true,  // فقط Super Admin
  }),
  createRule({
    id: "roles-create",
    pattern: /^\/roles\/create\/?$/,
    module: 'admin',
    action: "create",
    description: "ایجاد نقش",
    requireSuperAdmin: true,  // فقط Super Admin
  }),
  createRule({
    id: "roles-detail",
    pattern: new RegExp(`^/roles/${ID_SEGMENT}/?$`),
    module: 'admin',
    action: "read",
    description: "جزئیات نقش",
    requireSuperAdmin: true,  // فقط Super Admin
  }),
  createRule({
    id: "roles-edit",
    pattern: new RegExp(`^/roles/${ID_SEGMENT}/edit/?$`),
    module: 'admin',
    action: "update",
    description: "ویرایش نقش",
    requireSuperAdmin: true,  // فقط Super Admin
  }),
];
