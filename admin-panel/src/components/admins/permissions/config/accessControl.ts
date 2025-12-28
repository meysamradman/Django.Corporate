import type { ModuleAction } from "@/types/auth/permission";

const MODULES = {
  AI: 'ai',
  BLOG: 'blog',
  BLOG_CATEGORIES: 'blog.category',
  BLOG_TAGS: 'blog.tag',
  PORTFOLIO: 'portfolio',
  PORTFOLIO_CATEGORIES: 'portfolio.category',
  PORTFOLIO_TAGS: 'portfolio.tag',
  PORTFOLIO_OPTIONS: 'portfolio.option',
  REAL_ESTATE: 'real_estate',
  REAL_ESTATE_PROPERTY: 'real_estate.property',
  REAL_ESTATE_TYPE: 'real_estate.type',
  REAL_ESTATE_STATE: 'real_estate.state',
  REAL_ESTATE_LABEL: 'real_estate.label',
  REAL_ESTATE_FEATURE: 'real_estate.feature',
  REAL_ESTATE_TAG: 'real_estate.tag',
  REAL_ESTATE_AGENT: 'real_estate.agent',
  REAL_ESTATE_AGENCY: 'real_estate.agency',
  MEDIA: 'media',
  ADMIN: 'admin',
  USERS: 'users',
  ANALYTICS: 'analytics',
  EMAIL: 'email',
  TICKET: 'ticket',
  SETTINGS: 'settings',
  PANEL: 'panel',
  FORMS: 'forms',
  PAGES: 'pages',
  CHATBOT: 'chatbot',
} as const;

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
    module: MODULES.MEDIA,
    action: "read",
    description: "Media library - requires media.read or media.manage permission",
  }),
  createRule({
    id: "media-detail",
    pattern: new RegExp(`^/media/${ID_SEGMENT}/?$`),
    module: MODULES.MEDIA,
    action: "update",
    description: "Media details - requires media.update permission",
  }),
];

const adminManagementRoutes: RouteRule[] = [
  createRule({
    id: "admins-list",
    pattern: /^\/admins\/?$/,
    module: MODULES.ADMIN,
    action: "read",
    description: "Admin List",
    requireSuperAdmin: true,
  }),
  createRule({
    id: "admins-create",
    pattern: /^\/admins\/create\/?$/,
    module: MODULES.ADMIN,
    action: "create",
    description: "Create Admin",
    requireSuperAdmin: true,
  }),
  createRule({
    id: "admins-edit",
    pattern: new RegExp(`^/admins/${ID_SEGMENT}/edit/?$`),
    module: MODULES.ADMIN,
    action: "update",
    description: "Edit Admin",
    requireSuperAdmin: true,
  }),
  createRule({
    id: "admins-permissions",
    pattern: /^\/admins\/permissions\/?$/,
    module: MODULES.ADMIN,
    action: "manage",
    description: "مدیریت دسترسی ادمین",
    requireSuperAdmin: true,
  }),
  createRule({
    id: "admins-self-edit",
    pattern: /^\/admins\/me\/edit\/?$/,
    module: MODULES.ADMIN,
    action: "update",
    description: "ویرایش پروفایل من",
  }),
];

const userManagementRoutes: RouteRule[] = [
  createRule({
    id: "users-list",
    pattern: /^\/users\/?$/,
    module: MODULES.USERS,
    action: "read",
    description: "لیست کاربران",
  }),
  createRule({
    id: "users-create",
    pattern: /^\/users\/create\/?$/,
    module: MODULES.USERS,
    action: "create",
    description: "ایجاد کاربر",
  }),
  createRule({
    id: "users-edit",
    pattern: new RegExp(`^/users/${ID_SEGMENT}/edit/?$`),
    module: MODULES.USERS,
    action: "update",
    description: "ویرایش کاربر",
  }),
];

const roleRoutes: RouteRule[] = [
  createRule({
    id: "roles-list",
    pattern: /^\/roles\/?$/,
    module: MODULES.ADMIN,
    action: "read",
    description: "لیست نقش‌ها",
    requireSuperAdmin: true,
  }),
  createRule({
    id: "roles-create",
    pattern: /^\/roles\/create\/?$/,
    module: MODULES.ADMIN,
    action: "create",
    description: "ایجاد نقش",
    requireSuperAdmin: true,
  }),
  createRule({
    id: "roles-detail",
    pattern: new RegExp(`^/roles/${ID_SEGMENT}/?$`),
    module: MODULES.ADMIN,
    action: "read",
    description: "جزئیات نقش",
    requireSuperAdmin: true,
  }),
  createRule({
    id: "roles-edit",
    pattern: new RegExp(`^/roles/${ID_SEGMENT}/edit/?$`),
    module: MODULES.ADMIN,
    action: "update",
    description: "ویرایش نقش",
    requireSuperAdmin: true,
  }),
];

const analyticsRoutes: RouteRule[] = [
  createRule({
    id: "analytics-page-views",
    pattern: /^\/analytics\/?$/,
    module: MODULES.ANALYTICS,
    action: "manage",
    description: "آمار بازدید وب‌سایت و اپلیکیشن",
  }),
  createRule({
    id: "analytics-stats",
    pattern: /^\/analytics\/stats\/?$/,
    module: MODULES.ANALYTICS,
    action: "manage",
    description: "آمار سیستم و اپلیکیشن‌ها",
  }),
];

const settingsRoutes: RouteRule[] = [
  createRule({
    id: "settings-panel",
    pattern: /^\/panel\/?$/,
    module: MODULES.PANEL,
    action: "manage",
    description: "تنظیمات پنل",
    requireSuperAdmin: true,  // IP Management حساس است، فقط Super Admin
  }),
  createRule({
    id: "settings-general",
    pattern: /^\/settings\/?$/,
    module: MODULES.SETTINGS,
    action: "manage",
    description: "تنظیمات عمومی",
  }),
];

const miscRoutes: RouteRule[] = [
  createRule({
    id: "badges-lab",
    pattern: /^\/badges\/?$/,
    module: MODULES.PANEL,
    action: "read",
    description: "آزمایش طراحی",
    requireSuperAdmin: true,
  }),
  createRule({
    id: "test-button",
    pattern: /^\/test-button\/?$/,
    module: MODULES.PANEL,
    action: "read",
    description: "صفحه تست",
    requireSuperAdmin: true,
  }),
  createRule({
    id: "test-toast",
    pattern: /^\/test-toast\/?$/,
    module: MODULES.PANEL,
    action: "read",
    description: "صفحه تست توست",
    requireSuperAdmin: true,
  }),
];

const blogRoutes: RouteRule[] = [
  createRule({
    id: "blog-list",
    pattern: /^\/blogs\/?$/,
    module: MODULES.BLOG,
    action: "read",
    description: "لیست وبلاگ‌ها",
  }),
  createRule({
    id: "blog-create",
    pattern: /^\/blogs\/create\/?$/,
    module: MODULES.BLOG,
    action: "create",
    description: "ایجاد وبلاگ",
  }),
  createRule({
    id: "blog-edit",
    pattern: new RegExp(`^/blogs/${ID_SEGMENT}/edit/?$`),
    module: MODULES.BLOG,
    action: "update",
    description: "ویرایش وبلاگ",
  }),
  createRule({
    id: "blog-view",
    pattern: new RegExp(`^/blogs/${ID_SEGMENT}/view/?$`),
    module: MODULES.BLOG,
    action: "read",
    description: "مشاهده وبلاگ",
  }),
  createRule({
    id: "blog-categories",
    pattern: /^\/blogs\/categories\/?$/,
    module: MODULES.BLOG_CATEGORIES,
    action: "read",
    description: "لیست دسته‌های وبلاگ",
  }),
  createRule({
    id: "blog-category-create",
    pattern: /^\/blogs\/categories\/create\/?$/,
    module: MODULES.BLOG_CATEGORIES,
    action: "create",
    description: "ایجاد دسته وبلاگ",
  }),
  createRule({
    id: "blog-category-edit",
    pattern: new RegExp(`^/blogs/categories/${ID_SEGMENT}/edit/?$`),
    module: MODULES.BLOG_CATEGORIES,
    action: "update",
    description: "ویرایش دسته وبلاگ",
  }),
  createRule({
    id: "blog-tags",
    pattern: /^\/blogs\/tags\/?$/,
    module: MODULES.BLOG_TAGS,
    action: "read",
    description: "لیست برچسب‌های وبلاگ",
  }),
  createRule({
    id: "blog-tag-create",
    pattern: /^\/blogs\/tags\/create\/?$/,
    module: MODULES.BLOG_TAGS,
    action: "create",
    description: "ایجاد برچسب وبلاگ",
  }),
  createRule({
    id: "blog-tag-edit",
    pattern: new RegExp(`^/blogs/tags/${ID_SEGMENT}/edit/?$`),
    module: MODULES.BLOG_TAGS,
    action: "update",
    description: "ویرایش برچسب وبلاگ",
  }),
];

const portfolioRoutes: RouteRule[] = [
  createRule({
    id: "portfolio-list",
    pattern: /^\/portfolios\/?$/,
    module: MODULES.PORTFOLIO,
    action: "read",
    description: "لیست نمونه‌کارها",
  }),
  createRule({
    id: "portfolio-create",
    pattern: /^\/portfolios\/create\/?$/,
    module: MODULES.PORTFOLIO,
    action: "create",
    description: "ایجاد نمونه‌کار",
  }),
  createRule({
    id: "portfolio-edit",
    pattern: new RegExp(`^/portfolios/${ID_SEGMENT}/edit/?$`),
    module: MODULES.PORTFOLIO,
    action: "update",
    description: "ویرایش نمونه‌کار",
  }),
  createRule({
    id: "portfolio-view",
    pattern: new RegExp(`^/portfolios/${ID_SEGMENT}/view/?$`),
    module: MODULES.PORTFOLIO,
    action: "read",
    description: "مشاهده نمونه‌کار",
  }),
  createRule({
    id: "portfolio-categories",
    pattern: /^\/portfolios\/categories\/?$/,
    module: MODULES.PORTFOLIO_CATEGORIES,
    action: "read",
    description: "لیست دسته‌های نمونه‌کار",
  }),
  createRule({
    id: "portfolio-category-create",
    pattern: /^\/portfolios\/categories\/create\/?$/,
    module: MODULES.PORTFOLIO_CATEGORIES,
    action: "create",
    description: "ایجاد دسته نمونه‌کار",
  }),
  createRule({
    id: "portfolio-category-edit",
    pattern: new RegExp(`^/portfolios/categories/${ID_SEGMENT}/edit/?$`),
    module: MODULES.PORTFOLIO_CATEGORIES,
    action: "update",
    description: "ویرایش دسته نمونه‌کار",
  }),
  createRule({
    id: "portfolio-tags",
    pattern: /^\/portfolios\/tags\/?$/,
    module: MODULES.PORTFOLIO_TAGS,
    action: "read",
    description: "لیست تگ‌های نمونه‌کار",
  }),
  createRule({
    id: "portfolio-tag-create",
    pattern: /^\/portfolios\/tags\/create\/?$/,
    module: MODULES.PORTFOLIO_TAGS,
    action: "create",
    description: "ایجاد تگ نمونه‌کار",
  }),
  createRule({
    id: "portfolio-tag-edit",
    pattern: new RegExp(`^/portfolios/tags/${ID_SEGMENT}/edit/?$`),
    module: MODULES.PORTFOLIO_TAGS,
    action: "update",
    description: "ویرایش تگ نمونه‌کار",
  }),
  createRule({
    id: "portfolio-options",
    pattern: /^\/portfolios\/options\/?$/,
    module: MODULES.PORTFOLIO_OPTIONS,
    action: "read",
    description: "لیست گزینه‌ها",
  }),
  createRule({
    id: "portfolio-option-create",
    pattern: /^\/portfolios\/options\/create\/?$/,
    module: MODULES.PORTFOLIO_OPTIONS,
    action: "create",
    description: "ایجاد گزینه",
  }),
  createRule({
    id: "portfolio-option-edit",
    pattern: new RegExp(`^/portfolios/options/${ID_SEGMENT}/edit/?$`),
    module: MODULES.PORTFOLIO_OPTIONS,
    action: "update",
    description: "ویرایش گزینه",
  }),
  createRule({
    id: "portfolio-option-view",
    pattern: new RegExp(`^/portfolios/options/${ID_SEGMENT}/?$`),
    module: MODULES.PORTFOLIO_OPTIONS,
    action: "read",
    description: "مشاهده گزینه",
  }),
];

const realEstateRoutes: RouteRule[] = [
  createRule({
    id: "property-statistics",
    pattern: /^\/real-estate\/statistics\/?$/,
    module: MODULES.REAL_ESTATE_PROPERTY,
    action: "read",
    description: "آمار املاک",
  }),
  createRule({
    id: "property-list",
    pattern: /^\/real-estate\/properties\/?$/,
    module: MODULES.REAL_ESTATE_PROPERTY,
    action: "read",
    description: "لیست املاک",
  }),
  createRule({
    id: "property-create",
    pattern: /^\/real-estate\/properties\/create\/?$/,
    module: MODULES.REAL_ESTATE_PROPERTY,
    action: "create",
    description: "ایجاد ملک",
  }),
  createRule({
    id: "property-edit",
    pattern: new RegExp(`^/real-estate/properties/${ID_SEGMENT}/edit/?$`),
    module: MODULES.REAL_ESTATE_PROPERTY,
    action: "update",
    description: "ویرایش ملک",
  }),
  createRule({
    id: "property-view",
    pattern: new RegExp(`^/real-estate/properties/${ID_SEGMENT}/view/?$`),
    module: MODULES.REAL_ESTATE_PROPERTY,
    action: "read",
    description: "مشاهده ملک",
  }),
  createRule({
    id: "property-types",
    pattern: /^\/real-estate\/types\/?$/,
    module: MODULES.REAL_ESTATE_TYPE,
    action: "read",
    description: "لیست نوع‌های ملک",
  }),
  createRule({
    id: "property-type-create",
    pattern: /^\/real-estate\/types\/create\/?$/,
    module: MODULES.REAL_ESTATE_TYPE,
    action: "create",
    description: "ایجاد نوع ملک",
  }),
  createRule({
    id: "property-type-edit",
    pattern: new RegExp(`^/real-estate/types/${ID_SEGMENT}/edit/?$`),
    module: MODULES.REAL_ESTATE_TYPE,
    action: "update",
    description: "ویرایش نوع ملک",
  }),
  createRule({
    id: "property-states",
    pattern: /^\/real-estate\/states\/?$/,
    module: MODULES.REAL_ESTATE_STATE,
    action: "read",
    description: "لیست وضعیت‌های ملک",
  }),
  createRule({
    id: "property-state-create",
    pattern: /^\/real-estate\/states\/create\/?$/,
    module: MODULES.REAL_ESTATE_STATE,
    action: "create",
    description: "ایجاد وضعیت ملک",
  }),
  createRule({
    id: "property-state-edit",
    pattern: new RegExp(`^/real-estate/states/${ID_SEGMENT}/edit/?$`),
    module: MODULES.REAL_ESTATE_STATE,
    action: "update",
    description: "ویرایش وضعیت ملک",
  }),
  createRule({
    id: "property-labels",
    pattern: /^\/real-estate\/labels\/?$/,
    module: MODULES.REAL_ESTATE_LABEL,
    action: "read",
    description: "لیست برچسب‌های ملک",
  }),
  createRule({
    id: "property-label-create",
    pattern: /^\/real-estate\/labels\/create\/?$/,
    module: MODULES.REAL_ESTATE_LABEL,
    action: "create",
    description: "ایجاد برچسب ملک",
  }),
  createRule({
    id: "property-label-edit",
    pattern: new RegExp(`^/real-estate/labels/${ID_SEGMENT}/edit/?$`),
    module: MODULES.REAL_ESTATE_LABEL,
    action: "update",
    description: "ویرایش برچسب ملک",
  }),
  createRule({
    id: "property-features",
    pattern: /^\/real-estate\/features\/?$/,
    module: MODULES.REAL_ESTATE_FEATURE,
    action: "read",
    description: "لیست ویژگی‌های ملک",
  }),
  createRule({
    id: "property-feature-create",
    pattern: /^\/real-estate\/features\/create\/?$/,
    module: MODULES.REAL_ESTATE_FEATURE,
    action: "create",
    description: "ایجاد ویژگی ملک",
  }),
  createRule({
    id: "property-feature-edit",
    pattern: new RegExp(`^/real-estate/features/${ID_SEGMENT}/edit/?$`),
    module: MODULES.REAL_ESTATE_FEATURE,
    action: "update",
    description: "ویرایش ویژگی ملک",
  }),
  createRule({
    id: "property-tags",
    pattern: /^\/real-estate\/tags\/?$/,
    module: MODULES.REAL_ESTATE_TAG,
    action: "read",
    description: "لیست تگ‌های ملک",
  }),
  createRule({
    id: "property-tag-create",
    pattern: /^\/real-estate\/tags\/create\/?$/,
    module: MODULES.REAL_ESTATE_TAG,
    action: "create",
    description: "ایجاد تگ ملک",
  }),
  createRule({
    id: "property-tag-edit",
    pattern: new RegExp(`^/real-estate/tags/${ID_SEGMENT}/edit/?$`),
    module: MODULES.REAL_ESTATE_TAG,
    action: "update",
    description: "ویرایش تگ ملک",
  }),
  createRule({
    id: "property-agents",
    pattern: /^\/real-estate\/agents\/?$/,
    module: MODULES.REAL_ESTATE_AGENT,
    action: "read",
    description: "لیست نمایندگان",
  }),
  createRule({
    id: "property-agent-create",
    pattern: /^\/real-estate\/agents\/create\/?$/,
    module: MODULES.REAL_ESTATE_AGENT,
    action: "create",
    description: "ایجاد نماینده",
  }),
  createRule({
    id: "property-agent-edit",
    pattern: new RegExp(`^/real-estate/agents/${ID_SEGMENT}/edit/?$`),
    module: MODULES.REAL_ESTATE_AGENT,
    action: "update",
    description: "ویرایش نماینده",
  }),
  createRule({
    id: "real-estate-agencies",
    pattern: /^\/real-estate\/agencies\/?$/,
    module: MODULES.REAL_ESTATE_AGENCY,
    action: "read",
    description: "لیست آژانس‌ها",
  }),
  createRule({
    id: "real-estate-agency-create",
    pattern: /^\/real-estate\/agencies\/create\/?$/,
    module: MODULES.REAL_ESTATE_AGENCY,
    action: "create",
    description: "ایجاد آژانس",
  }),
  createRule({
    id: "real-estate-agency-edit",
    pattern: new RegExp(`^/real-estate/agencies/${ID_SEGMENT}/edit/?$`),
    module: MODULES.REAL_ESTATE_AGENCY,
    action: "update",
    description: "ویرایش آژانس",
  }),
];

const aiRoutes: RouteRule[] = [
  createRule({
    id: "ai-chat",
    pattern: /^\/ai\/chat\/?$/,
    module: MODULES.AI,
    action: "manage",
    description: "چت هوشمند",
  }),
  createRule({
    id: "ai-content",
    pattern: /^\/ai\/content\/?$/,
    module: MODULES.AI,
    action: "manage",
    description: "تولید محتوا",
  }),
  createRule({
    id: "ai-image",
    pattern: /^\/ai\/image\/?$/,
    module: MODULES.AI,
    action: "manage",
    description: "تولید تصویر",
  }),
  createRule({
    id: "ai-audio",
    pattern: /^\/ai\/audio\/?$/,
    module: MODULES.AI,
    action: "manage",
    description: "تولید پادکست",
  }),
  createRule({
    id: "ai-models",
    pattern: /^\/ai\/models\/?$/,
    module: MODULES.AI,
    action: "manage",
    description: "انتخاب مدل‌های AI (فقط سوپر ادمین)",
    requireSuperAdmin: true,
  }),
];

const communicationRoutes: RouteRule[] = [
  createRule({
    id: "email-list",
    pattern: /^\/email\/?$/,
    module: MODULES.EMAIL,
    action: "read",
    description: "لیست ایمیل‌ها",
  }),
  createRule({
    id: "email-view",
    pattern: new RegExp(`^/email/${ID_SEGMENT}/?$`),
    module: MODULES.EMAIL,
    action: "read",
    description: "مشاهده ایمیل",
  }),
  createRule({
    id: "ticket-list",
    pattern: /^\/ticket\/?$/,
    module: MODULES.TICKET,
    action: "read",
    description: "لیست تیکت‌ها",
  }),
  createRule({
    id: "ticket-create",
    pattern: /^\/ticket\/create\/?$/,
    module: MODULES.TICKET,
    action: "create",
    description: "ایجاد تیکت",
  }),
  createRule({
    id: "ticket-view",
    pattern: new RegExp(`^/ticket/${ID_SEGMENT}/?$`),
    module: MODULES.TICKET,
    action: "read",
    description: "مشاهده تیکت",
  }),
  createRule({
    id: "ticket-edit",
    pattern: new RegExp(`^/ticket/${ID_SEGMENT}/edit/?$`),
    module: MODULES.TICKET,
    action: "update",
    description: "ویرایش تیکت",
  }),
];

const corporateSettingsRoutes: RouteRule[] = [
  createRule({
    id: "settings-ai",
    pattern: /^\/ai\/settings\/?$/,
    module: MODULES.AI,
    action: "manage",
    description: "تنظیمات هوش مصنوعی (API مشترک و شخصی)",
  }),
  createRule({
    id: "ai-models",
    pattern: /^\/ai\/models\/?$/,
    module: MODULES.AI,
    action: "manage",
    description: "انتخاب مدل‌های AI",
  }),
  createRule({
    id: "settings-form",
    pattern: /^\/form-builder\/?$/,
    module: MODULES.FORMS,
    action: "manage",
    description: "فرم‌ها",
  }),
  createRule({
    id: "settings-chatbot",
    pattern: /^\/chatbot\/?$/,
    module: MODULES.CHATBOT,
    action: "manage",
    description: "چت‌بات",
  }),
  createRule({
    id: "settings-page-about",
    pattern: /^\/page\/about\/?$/,
    module: MODULES.PAGES,
    action: "manage",
    description: "صفحه درباره ما",
  }),
  createRule({
    id: "settings-page-terms",
    pattern: /^\/page\/terms\/?$/,
    module: MODULES.PAGES,
    action: "manage",
    description: "صفحه قوانین",
  }),
];

const routeRules: RouteRule[] = [
  ...dashboardRoutes,
  ...mediaRoutes,
  ...adminManagementRoutes,
  ...userManagementRoutes,
  ...roleRoutes,
  ...analyticsRoutes,
  ...settingsRoutes,
  ...miscRoutes,
  ...blogRoutes,
  ...portfolioRoutes,
  ...realEstateRoutes,
  ...aiRoutes,
  ...communicationRoutes,
  ...corporateSettingsRoutes,
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

