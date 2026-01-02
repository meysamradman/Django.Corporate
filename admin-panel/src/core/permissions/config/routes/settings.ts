import type { RouteRule } from "../types";

const createRule = (config: RouteRule): RouteRule => config;

export const settingsRoutes: RouteRule[] = [
  createRule({
    id: "settings-panel",
    pattern: /^\/panel\/?$/,
    module: 'panel',
    action: "manage",
    description: "تنظیمات پنل",
    requireSuperAdmin: true,  // فقط Super Admin - IP Management حساس است
  }),
  createRule({
    id: "settings-general",
    pattern: /^\/settings\/?$/,
    module: 'settings',
    action: "manage",
    description: "تنظیمات عمومی",
    requireSuperAdmin: true,  // فقط Super Admin - تنظیمات سیستم حساس است
  }),
];

export const miscRoutes: RouteRule[] = [
  createRule({
    id: "badges-lab",
    pattern: /^\/badges\/?$/,
    module: 'panel',
    action: "read",
    description: "آزمایش طراحی",
    requireSuperAdmin: true,
  }),
  createRule({
    id: "test-button",
    pattern: /^\/test-button\/?$/,
    module: 'panel',
    action: "read",
    description: "صفحه تست",
    requireSuperAdmin: true,
  }),
  createRule({
    id: "test-toast",
    pattern: /^\/test-toast\/?$/,
    module: 'panel',
    action: "read",
    description: "صفحه تست توست",
    requireSuperAdmin: true,
  }),
];

export const corporateSettingsRoutes: RouteRule[] = [
  createRule({
    id: "settings-ai",
    pattern: /^\/ai\/settings\/?$/,
    module: 'ai',
    action: "manage",
    description: "تنظیمات هوش مصنوعی (API مشترک و شخصی)",
  }),
  createRule({
    id: "ai-models",
    pattern: /^\/ai\/models\/?$/,
    module: 'ai',
    action: "manage",
    description: "انتخاب مدل‌های AI",
  }),
  createRule({
    id: "settings-form",
    pattern: /^\/form-builder\/?$/,
    module: 'forms',
    action: "manage",
    description: "فرم‌ها",
  }),
  createRule({
    id: "settings-chatbot",
    pattern: /^\/chatbot\/?$/,
    module: 'chatbot',
    action: "manage",
    description: "چت‌بات",
  }),
  createRule({
    id: "settings-page-about",
    pattern: /^\/page\/about\/?$/,
    module: 'pages',
    action: "manage",
    description: "صفحه درباره ما",
  }),
  createRule({
    id: "settings-page-terms",
    pattern: /^\/page\/terms\/?$/,
    module: 'pages',
    action: "manage",
    description: "صفحه قوانین",
  }),
];
