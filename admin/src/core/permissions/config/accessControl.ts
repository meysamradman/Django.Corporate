import type { ModuleAction } from "../hooks/useUserPermissions";

export interface RouteRule {
  id: string;
  pattern: RegExp;
  module?: string;
  action?: ModuleAction;
  description?: string;
  requireSuperAdmin?: boolean;
}

const ID_SEGMENT = "[0-9a-zA-Z-]+";

const createRule = (config: RouteRule): RouteRule => config;

const dashboardRoutes: RouteRule[] = [
  createRule({
    id: "dashboard-home",
    pattern: /^\/$/,
    description: "داشبورد",
  }),
];

const mediaRoutes: RouteRule[] = [
  createRule({
    id: "media-list",
    pattern: /^\/media\/?$/,
    module: "media",
    action: "read",
    description: "Media library - requires media.read permission",
  }),
  createRule({
    id: "media-detail",
    pattern: new RegExp(`^/media/${ID_SEGMENT}/?$`),
    module: "media",
    action: "update",
    description: "Media details - requires media.update permission",
  }),
];

const blogRoutes: RouteRule[] = [
  createRule({
    id: "blog-list",
    pattern: /^\/blogs\/?$/,
    module: "blog",
    action: "read",
    description: "لیست وبلاگ‌ها",
  }),
  createRule({
    id: "blog-create",
    pattern: /^\/blogs\/create\/?$/,
    module: "blog",
    action: "create",
    description: "ایجاد وبلاگ",
  }),
  createRule({
    id: "blog-edit",
    pattern: new RegExp(`^/blogs/${ID_SEGMENT}/edit/?$`),
    module: "blog",
    action: "update",
    description: "ویرایش وبلاگ",
  }),
  createRule({
    id: "blog-view",
    pattern: new RegExp(`^/blogs/${ID_SEGMENT}/view/?$`),
    module: "blog",
    action: "read",
    description: "مشاهده وبلاگ",
  }),
  createRule({
    id: "blog-categories",
    pattern: /^\/blogs\/categories\/?$/,
    module: "blog_categories",
    action: "read",
    description: "لیست دسته‌های وبلاگ",
  }),
  createRule({
    id: "blog-category-create",
    pattern: /^\/blogs\/categories\/create\/?$/,
    module: "blog_categories",
    action: "create",
    description: "ایجاد دسته وبلاگ",
  }),
  createRule({
    id: "blog-category-edit",
    pattern: new RegExp(`^/blogs/categories/${ID_SEGMENT}/edit/?$`),
    module: "blog_categories",
    action: "update",
    description: "ویرایش دسته وبلاگ",
  }),
  createRule({
    id: "blog-tags",
    pattern: /^\/blogs\/tags\/?$/,
    module: "blog_tags",
    action: "read",
    description: "لیست برچسب‌های وبلاگ",
  }),
  createRule({
    id: "blog-tag-create",
    pattern: /^\/blogs\/tags\/create\/?$/,
    module: "blog_tags",
    action: "create",
    description: "ایجاد برچسب وبلاگ",
  }),
  createRule({
    id: "blog-tag-edit",
    pattern: new RegExp(`^/blogs/tags/${ID_SEGMENT}/edit/?$`),
    module: "blog_tags",
    action: "update",
    description: "ویرایش برچسب وبلاگ",
  }),
];

const portfolioRoutes: RouteRule[] = [
  createRule({
    id: "portfolio-list",
    pattern: /^\/portfolios\/?$/,
    module: "portfolio",
    action: "read",
    description: "لیست نمونه‌کارها",
  }),
  createRule({
    id: "portfolio-create",
    pattern: /^\/portfolios\/create\/?$/,
    module: "portfolio",
    action: "create",
    description: "ایجاد نمونه‌کار",
  }),
  createRule({
    id: "portfolio-edit",
    pattern: new RegExp(`^/portfolios/${ID_SEGMENT}/edit/?$`),
    module: "portfolio",
    action: "update",
    description: "ویرایش نمونه‌کار",
  }),
  createRule({
    id: "portfolio-view",
    pattern: new RegExp(`^/portfolios/${ID_SEGMENT}/view/?$`),
    module: "portfolio",
    action: "read",
    description: "مشاهده نمونه‌کار",
  }),
  createRule({
    id: "portfolio-categories",
    pattern: /^\/portfolios\/categories\/?$/,
    module: "portfolio_categories",
    action: "read",
    description: "لیست دسته‌های نمونه‌کار",
  }),
  createRule({
    id: "portfolio-category-create",
    pattern: /^\/portfolios\/categories\/create\/?$/,
    module: "portfolio_categories",
    action: "create",
    description: "ایجاد دسته نمونه‌کار",
  }),
  createRule({
    id: "portfolio-category-edit",
    pattern: new RegExp(`^/portfolios/categories/${ID_SEGMENT}/edit/?$`),
    module: "portfolio_categories",
    action: "update",
    description: "ویرایش دسته نمونه‌کار",
  }),
  createRule({
    id: "portfolio-tags",
    pattern: /^\/portfolios\/tags\/?$/,
    module: "portfolio_tags",
    action: "read",
    description: "لیست تگ‌های نمونه‌کار",
  }),
  createRule({
    id: "portfolio-tag-create",
    pattern: /^\/portfolios\/tags\/create\/?$/,
    module: "portfolio_tags",
    action: "create",
    description: "ایجاد تگ نمونه‌کار",
  }),
  createRule({
    id: "portfolio-tag-edit",
    pattern: new RegExp(`^/portfolios/tags/${ID_SEGMENT}/edit/?$`),
    module: "portfolio_tags",
    action: "update",
    description: "ویرایش تگ نمونه‌کار",
  }),
  createRule({
    id: "portfolio-options",
    pattern: /^\/portfolios\/options\/?$/,
    module: "portfolio_options",
    action: "read",
    description: "لیست گزینه‌ها",
  }),
  createRule({
    id: "portfolio-option-create",
    pattern: /^\/portfolios\/options\/create\/?$/,
    module: "portfolio_options",
    action: "create",
    description: "ایجاد گزینه",
  }),
  createRule({
    id: "portfolio-option-edit",
    pattern: new RegExp(`^/portfolios/options/${ID_SEGMENT}/edit/?$`),
    module: "portfolio_options",
    action: "update",
    description: "ویرایش گزینه",
  }),
  createRule({
    id: "portfolio-option-view",
    pattern: new RegExp(`^/portfolios/options/${ID_SEGMENT}/?$`),
    module: "portfolio_options",
    action: "read",
    description: "مشاهده گزینه",
  }),
];

const adminManagementRoutes: RouteRule[] = [
  createRule({
    id: "admins-list",
    pattern: /^\/admins\/?$/,
    module: "admin",
    action: "read",
    description: "Admin List",
    requireSuperAdmin: true,
  }),
  createRule({
    id: "admins-create",
    pattern: /^\/admins\/create\/?$/,
    module: "admin",
    action: "create",
    description: "Create Admin",
    requireSuperAdmin: true,
  }),
  createRule({
    id: "admins-edit",
    pattern: new RegExp(`^/admins/${ID_SEGMENT}/edit/?$`),
    module: "admin",
    action: "update",
    description: "Edit Admin",
    requireSuperAdmin: true,
  }),
  createRule({
    id: "admins-permissions",
    pattern: /^\/admins\/permissions\/?$/,
    module: "admin",
    action: "manage",
    description: "مدیریت دسترسی ادمین",
    requireSuperAdmin: true,
  }),
  createRule({
    id: "admins-self-edit",
    pattern: /^\/admins\/me\/edit\/?$/,
    module: "admin",
    action: "update",
    description: "ویرایش پروفایل من",
  }),
];

const userManagementRoutes: RouteRule[] = [
  createRule({
    id: "users-list",
    pattern: /^\/users\/?$/,
    module: "users",
    action: "read",
    description: "لیست کاربران",
  }),
  createRule({
    id: "users-create",
    pattern: /^\/users\/create\/?$/,
    module: "users",
    action: "create",
    description: "ایجاد کاربر",
  }),
  createRule({
    id: "users-edit",
    pattern: new RegExp(`^/users/${ID_SEGMENT}/edit/?$`),
    module: "users",
    action: "update",
    description: "ویرایش کاربر",
  }),
];

const roleRoutes: RouteRule[] = [
  createRule({
    id: "roles-list",
    pattern: /^\/roles\/?$/,
    module: "admin",
    action: "read",
    description: "لیست نقش‌ها",
    requireSuperAdmin: true,
  }),
  createRule({
    id: "roles-create",
    pattern: /^\/roles\/create\/?$/,
    module: "admin",
    action: "create",
    description: "ایجاد نقش",
    requireSuperAdmin: true,
  }),
  createRule({
    id: "roles-detail",
    pattern: new RegExp(`^/roles/${ID_SEGMENT}/?$`),
    module: "admin",
    action: "read",
    description: "جزئیات نقش",
    requireSuperAdmin: true,
  }),
  createRule({
    id: "roles-edit",
    pattern: new RegExp(`^/roles/${ID_SEGMENT}/edit/?$`),
    module: "admin",
    action: "update",
    description: "ویرایش نقش",
    requireSuperAdmin: true,
  }),
];

const aiRoutes: RouteRule[] = [
  createRule({
    id: "ai-chat",
    pattern: /^\/ai\/chat\/?$/,
    module: "ai",
    action: "manage",
    description: "چت هوشمند",
  }),
  createRule({
    id: "ai-content",
    pattern: /^\/ai\/content\/?$/,
    module: "ai",
    action: "manage",
    description: "تولید محتوا",
  }),
  createRule({
    id: "ai-image",
    pattern: /^\/ai\/image\/?$/,
    module: "ai",
    action: "manage",
    description: "تولید تصویر",
  }),
  createRule({
    id: "ai-audio",
    pattern: /^\/ai\/audio\/?$/,
    module: "ai",
    action: "manage",
    description: "تولید پادکست",
  }),
];

const communicationRoutes: RouteRule[] = [
  createRule({
    id: "email-list",
    pattern: /^\/email\/?$/,
    module: "email",
    action: "read",
    description: "لیست ایمیل‌ها",
  }),
  createRule({
    id: "email-view",
    pattern: new RegExp(`^/email/${ID_SEGMENT}/?$`),
    module: "email",
    action: "read",
    description: "مشاهده ایمیل",
  }),
  createRule({
    id: "ticket-list",
    pattern: /^\/ticket\/?$/,
    module: "ticket",
    action: "read",
    description: "لیست تیکت‌ها",
  }),
  createRule({
    id: "ticket-create",
    pattern: /^\/ticket\/create\/?$/,
    module: "ticket",
    action: "create",
    description: "ایجاد تیکت",
  }),
  createRule({
    id: "ticket-view",
    pattern: new RegExp(`^/ticket/${ID_SEGMENT}/?$`),
    module: "ticket",
    action: "read",
    description: "مشاهده تیکت",
  }),
  createRule({
    id: "ticket-edit",
    pattern: new RegExp(`^/ticket/${ID_SEGMENT}/edit/?$`),
    module: "ticket",
    action: "update",
    description: "ویرایش تیکت",
  }),
];

const settingsRoutes: RouteRule[] = [
  createRule({
    id: "settings-panel",
    pattern: /^\/settings\/panel\/?$/,
    module: "panel",
    action: "manage",
    description: "تنظیمات پنل",
    // ✅ ادمین عادی با permission می‌تواند
  }),
  createRule({
    id: "settings-ai",
    pattern: /^\/settings\/ai\/?$/,
    module: "ai",
    action: "manage",
    description: "تنظیمات هوش مصنوعی (API مشترک و شخصی)",
  }),
  createRule({
    id: "settings-general",
    pattern: /^\/settings\/general\/?$/,
    module: "settings",
    action: "manage",
    description: "تنظیمات عمومی",
  }),
  createRule({
    id: "settings-form",
    pattern: /^\/settings\/form\/?$/,
    module: "forms",
    action: "manage",
    description: "فرم‌ها",
  }),
  createRule({
    id: "settings-chatbot",
    pattern: /^\/settings\/chatbot\/?$/,
    module: "chatbot",
    action: "manage",
    description: "چت‌بات",
  }),
  createRule({
    id: "settings-page-about",
    pattern: /^\/settings\/page\/about\/?$/,
    module: "pages",
    action: "manage",
    description: "صفحه درباره ما",
  }),
  createRule({
    id: "settings-page-terms",
    pattern: /^\/settings\/page\/terms\/?$/,
    module: "pages",
    action: "manage",
    description: "صفحه قوانین",
  }),
];

const miscRoutes: RouteRule[] = [
  createRule({
    id: "badges-lab",
    pattern: /^\/badges\/?$/,
    module: "panel",
    action: "read",
    description: "آزمایش طراحی",
    requireSuperAdmin: true,
  }),
  createRule({
    id: "test-button",
    pattern: /^\/test-button\/?$/,
    module: "panel",
    action: "read",
    description: "صفحه تست",
    requireSuperAdmin: true,
  }),
  createRule({
    id: "test-toast",
    pattern: /^\/test-toast\/?$/,
    module: "panel",
    action: "read",
    description: "صفحه تست توست",
    requireSuperAdmin: true,
  }),
];

const routeRules: RouteRule[] = [
  ...dashboardRoutes,
  ...mediaRoutes,
  ...blogRoutes,
  ...portfolioRoutes,
  ...adminManagementRoutes,
  ...userManagementRoutes,
  ...roleRoutes,
  ...aiRoutes,
  ...communicationRoutes,
  ...settingsRoutes,
  ...miscRoutes,
];

const normalizePathname = (pathname: string): string => {
  if (!pathname) {
    return "/";
  }

  try {
    const url = new URL(pathname, "http://localhost");
    pathname = url.pathname;
  } catch {
  }

  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
};

export const findRouteRule = (pathname: string): RouteRule | undefined => {
  const normalizedPath = normalizePathname(pathname);
  return routeRules.find((rule) => rule.pattern.test(normalizedPath));
};

export { routeRules };

