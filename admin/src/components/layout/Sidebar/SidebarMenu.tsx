import {
    Home,
    BookOpen,
    Layers,
    ShieldUser,
    Users,
    Settings,
    Shield,
    Images,
    Sparkles,
    Mail,
    Ticket,
    List,
    type LucideIcon
} from "lucide-react"
import { useMemo, useCallback } from "react"
import { useUserPermissions, ModuleAction } from "@/core/permissions/hooks/useUserPermissions"

type BadgeTone = "info" | "warning" | "muted"

export interface MenuBadge {
    label: string;
    tone: BadgeTone;
}

export interface MenuAccessConfig {
    module?: string;
    actions?: ModuleAction[];
    fallbackModules?: string[];
    hideIfNoAccess?: boolean;
    allowReadOnly?: boolean;
    readOnlyLabel?: string;
    limitedLabel?: string;
    requireSuperAdmin?: boolean;
    hideForSuperAdmin?: boolean; // Hide this menu item for super admins
    roles?: string[];
}

export interface MenuItem {
    title: string;
    url?: string;
    icon?: LucideIcon;
    items?: MenuItem[];
    isTitle?: boolean;
    disabled?: boolean;
    access?: MenuAccessConfig;
    badge?: MenuBadge;
    state?: "full" | "readOnly" | "limited" | "locked";
    tooltip?: string;
}

export type MenuGroup = {
    title: string;
    items: MenuItem[];
};

type MenuItemConfig = Omit<MenuItem, "items"> & {
    items?: MenuItemConfig[];
};

type MenuGroupConfig = {
    title: string;
    items: MenuItemConfig[];
};

const BASE_MENU_GROUPS: MenuGroupConfig[] = [
    {
        title: "داشبورد",
        items: [
            {
                title: "داشبورد",
                icon: Home,
                url: "/",
                tooltip: "خانه و گزارش‌های کلی"
            },
        ]
    },
    {
        title: "مدیریت محتوا",
        items: [
            {
                title: "بلاگ",
                icon: BookOpen,
                access: {
                    module: "blog",
                    fallbackModules: ["blog_categories", "blog_tags"],
                    allowReadOnly: true,
                    limitedLabel: "محدود",
                    readOnlyLabel: "فقط مشاهده",
                    roles: ["blog_manager", "content_manager", "super_admin"]
                },
                items: [
                    { title: "لیست بلاگ‌ها", url: "/blogs", access: { module: "blog", allowReadOnly: true } },
                    { title: "ایجاد بلاگ", url: "/blogs/create", access: { module: "blog", actions: ["create"] } },
                    { title: "دسته‌بندی‌های بلاگ", isTitle: true },
                    { title: "لیست دسته‌بندی‌ها", url: "/blogs/categories", access: { module: "blog_categories", allowReadOnly: true } },
                    { title: "ایجاد دسته‌بندی", url: "/blogs/categories/create", access: { module: "blog_categories", actions: ["create"] } },
                    { title: "تگ‌های بلاگ", isTitle: true },
                    { title: "لیست تگ‌ها", url: "/blogs/tags", access: { module: "blog_tags", allowReadOnly: true } },
                    { title: "ایجاد تگ", url: "/blogs/tags/create", access: { module: "blog_tags", actions: ["create"] } },
                ],
            },
            {
                title: "نمونه کار",
                icon: Layers,
                access: {
                    module: "portfolio",
                    fallbackModules: ["portfolio_categories", "portfolio_tags", "portfolio_options", "portfolio_option_values"],
                    allowReadOnly: true,
                    limitedLabel: "محدود",
                    readOnlyLabel: "فقط مشاهده"
                },
                items: [
                    { title: "لیست نمونه کارها", url: "/portfolios", access: { module: "portfolio", allowReadOnly: true } },
                    { title: "ایجاد نمونه کار", url: "/portfolios/create", access: { module: "portfolio", actions: ["create"] } },
                    { title: "دسته‌بندی‌های نمونه کار", isTitle: true },
                    { title: "لیست دسته‌بندی‌ها", url: "/portfolios/categories", access: { module: "portfolio_categories", allowReadOnly: true } },
                    { title: "ایجاد دسته‌بندی", url: "/portfolios/categories/create", access: { module: "portfolio_categories", actions: ["create"] } },
                    { title: "تگ‌های نمونه کار", isTitle: true },
                    { title: "لیست تگ‌ها", url: "/portfolios/tags", access: { module: "portfolio_tags", allowReadOnly: true } },
                    { title: "ایجاد تگ", url: "/portfolios/tags/create", access: { module: "portfolio_tags", actions: ["create"] } },
                    { title: "گزینه‌های نمونه کار", isTitle: true },
                    { title: "لیست گزینه‌ها", url: "/portfolios/options", access: { module: "portfolio_options", allowReadOnly: true } },
                    { title: "ایجاد گزینه", url: "/portfolios/options/create", access: { module: "portfolio_options", actions: ["create"] } },
                ],
            },
            {
                title: "رسانه‌ها",
                icon: Images,
                url: "/media",
                access: { 
                    module: "media", 
                    actions: ["read"],
                    allowReadOnly: true,
                    readOnlyLabel: "فقط مشاهده"
                }
            },
        ]
    },
    {
        title: "مدیریت کاربران",
        items: [
            {
                title: "مدیریت ادمین‌ها",
                icon: ShieldUser,
                access: { 
                    module: "admin", 
                    actions: ["read", "view"], 
                    requireSuperAdmin: true,  // ✅ Admin management requires super admin
                    allowReadOnly: true 
                },
                items: [
                    { 
                        title: "لیست ادمین‌ها", 
                        url: "/admins", 
                        access: { 
                            module: "admin", 
                            actions: ["read", "view"], 
                            requireSuperAdmin: true,  // ✅ Admin management requires super admin
                            allowReadOnly: true 
                        } 
                    },
                    { 
                        title: "ایجاد ادمین", 
                        url: "/admins/create", 
                        access: { 
                            module: "admin", 
                            actions: ["create"], 
                            requireSuperAdmin: true 
                        } 
                    },
                ],
            },
            {
                title: "کاربران",
                icon: Users,
                access: { module: "users", allowReadOnly: true, readOnlyLabel: "فقط مشاهده" },
                items: [
                    { title: "لیست کاربران", url: "/users", access: { module: "users", allowReadOnly: true } },
                    { title: "ایجاد کاربر", url: "/users/create", access: { module: "users", actions: ["create"] } },
                ],
            },
        ]
    },
    {
        title: "نقش‌ها و دسترسی‌ها",
        items: [
            {
                title: "نقش‌ها",
                icon: Shield,
                access: { module: "admin", requireSuperAdmin: true },
                items: [
                    { title: "لیست نقش‌ها", url: "/roles", access: { module: "admin", requireSuperAdmin: true } },
                    { title: "ایجاد نقش", url: "/roles/create", access: { module: "admin", requireSuperAdmin: true } },
                ],
            },
        ]
    },
    {
        title: "هوش مصنوعی",
        items: [
            {
                title: "هوش مصنوعی",
                icon: Sparkles,
                access: { module: "ai", allowReadOnly: true },
                items: [
                    { title: "چت با AI", url: "/ai/chat", access: { module: "ai", allowReadOnly: true } },
                    { title: "تولید محتوا با AI", url: "/ai/content", access: { module: "ai", allowReadOnly: true } },
                    { title: "تولید تصویر با AI", url: "/ai/image", access: { module: "ai", allowReadOnly: true } },
                    { title: "تولید پادکست با AI", url: "/ai/audio", access: { module: "ai", allowReadOnly: true } },
                ],
            },
        ]
    },
    {
        title: "ارتباطات",
        items: [
            {
                title: "ایمیل",
                icon: Mail,
                url: "/email",
                access: { 
                    module: "email", 
                    actions: ["read"],
                    allowReadOnly: true,
                    readOnlyLabel: "فقط مشاهده"
                }
            },
            {
                title: "تیکت",
                icon: Ticket,
                url: "/ticket",
                access: { 
                    module: "ticket", 
                    actions: ["read"],
                    allowReadOnly: true,
                    readOnlyLabel: "فقط مشاهده"
                }
            },
        ]
    },
    {
        title: "تنظیمات",
        items: [
            {
                title: "تنظیمات",
                icon: Settings,
                items: [
                    { title: "تنظیمات پنل ادمین", isTitle: true },
                    { title: "تنظیمات پنل", url: "/settings/panel", access: { module: "panel", actions: ["manage"] } },
                    { title: "تنظیمات هوش مصنوعی", isTitle: true },
                    { title: "مدیریت Provider ها", url: "/settings/ai", access: { module: "ai", actions: ["manage"] } },
                    { title: "انتخاب مدل‌ها", url: "/settings/ai/models", icon: List, access: { module: "ai", actions: ["manage"], requireSuperAdmin: true } },
                    { title: "تنظیمات وب‌سایت و اپلیکیشن", isTitle: true },
                    { title: "تنظیمات عمومی", url: "/settings/general", access: { module: "settings", actions: ["manage"] } },
                    { title: "چت‌بات", url: "/settings/chatbot", access: { module: "chatbot", actions: ["manage"] } },
                    { title: "فرم‌ها", url: "/settings/form", access: { module: "forms", allowReadOnly: true } },
                    { title: "درباره ما", url: "/settings/page/about", access: { module: "pages", actions: ["manage"] } },
                    { title: "قوانین و مقررات", url: "/settings/page/terms", access: { module: "pages", actions: ["manage"] } },
                ],
            },
        ]
    },
];

export const MENU_BADGE_TONES: Record<BadgeTone, string> = {
    info: "bg-sky-500/15 text-sky-400 border border-sky-500/30",
    warning: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
    muted: "bg-slate-500/15 text-slate-400 border border-slate-500/30",
};

export const useMenuData = () => {
    const {
        permissions,
        permissionProfile,
        userRoles,
        getModuleAccessProfile,
        hasModuleAction,
        hasRole,
        hasPermission,
        isSuperAdmin
    } = useUserPermissions();

    const permissionsKey = useMemo(() => {
        const permissionSnapshot = [...permissions].sort();
        const moduleSnapshot = permissionProfile?.modules ? [...permissionProfile.modules].sort() : [];
        const actionSnapshot = permissionProfile?.actions ? [...permissionProfile.actions].sort() : [];
        const roleSnapshot = userRoles
            .map(role => role?.name || String(role?.id || ""))
            .sort();

        return JSON.stringify({
            permissions: permissionSnapshot,
            modules: moduleSnapshot,
            actions: actionSnapshot,
            roles: roleSnapshot,
            isSuperAdmin
        });
    }, [permissions, permissionProfile, userRoles, isSuperAdmin]);

    const evaluateAccess = useCallback((access?: MenuAccessConfig) => {
        if (!access) {
            return { visible: true } as const;
        }

        if (access.requireSuperAdmin && !isSuperAdmin) {
            return { visible: false } as const;
        }

        if (access.hideForSuperAdmin && isSuperAdmin) {
            return { visible: false } as const;
        }

        if (access.roles?.length) {
            const matchesRole = access.roles.some(role => hasRole(role));
            if (matchesRole) {
                return { visible: true } as const;
            }
        }

        const hideIfNoAccess = access.hideIfNoAccess ?? true;
        const primaryModule = access.module;
        const fallbackModules = access.fallbackModules || [];
        const actions: ModuleAction[] = access.actions && access.actions.length > 0 ? access.actions : ["read"];

        const primaryProfile = primaryModule ? getModuleAccessProfile(primaryModule) : null;
        const fallbackProfiles = fallbackModules.map(module => getModuleAccessProfile(module));
        const hasFallbackRead = fallbackProfiles.some(profile => profile.canRead);
        const hasPrimaryRead = primaryProfile?.canRead ?? false;
        const hasPrimaryActions = primaryModule
            ? actions.some(action => hasModuleAction(primaryModule, action))
            : false;

        if (!primaryModule) {
            if (hasFallbackRead) {
                return {
                    visible: true,
                    state: "limited" as const,
                };
            }
            return { visible: hideIfNoAccess ? hasFallbackRead : true };
        }

        if (!hasPrimaryRead) {
            if (hasFallbackRead) {
                return {
                    visible: true,
                    state: "limited" as const,
                };
            }
            if (hideIfNoAccess) {
                return { visible: false } as const;
            }
            return {
                visible: true,
                state: "locked" as const,
                disabled: true
            };
        }

        if (!hasPrimaryActions) {
            if (hideIfNoAccess) {
                return { visible: false } as const;
            }
            return {
                visible: true,
                state: "locked" as const,
                disabled: true
            };
        }

        if (!primaryProfile?.hasWrite && (access.allowReadOnly ?? true)) {
            return {
                visible: true,
                state: "readOnly" as const,
            };
        }

        return { visible: true } as const;
    }, [hasRole, isSuperAdmin, getModuleAccessProfile, hasModuleAction, permissionsKey]);

    const groups = useMemo(() => {
        const processItem = (item: MenuItemConfig): MenuItem | null => {
            // Handle isTitle items separately - they don't have access config
            if (item.isTitle) {
                return {
                    ...item,
                    items: undefined
                };
            }

            const result = evaluateAccess(item.access);

            if (!result.visible) {
                return null;
            }

            const childItems = item.items
                ?.map(processItem)
                .filter(Boolean) as MenuItem[] | undefined;

            // Filter out isTitle items that don't have any visible children after them
            const filteredChildItems = childItems?.filter((child, index) => {
                if (!child.isTitle) {
                    return true;
                }
                // Check if there are any visible non-title items after this title
                const itemsAfter = childItems.slice(index + 1);
                return itemsAfter.some(item => !item.isTitle);
            }) as MenuItem[] | undefined;

            const hasActionableChild = filteredChildItems?.some(child => 
                !child.isTitle && (child.url || (child.items && child.items.length > 0))
            );

            if (!item.url) {
                if (!filteredChildItems || filteredChildItems.length === 0) {
                    return null;
                }
                if (!hasActionableChild) {
                    return null;
                }
            }

            const visibleChildCount = filteredChildItems
                ?.filter(child => !child.isTitle)
                .length ?? 0;
            const originalChildCount = item.items
                ?.filter(child => !child.isTitle)
                .length ?? 0;

            let state = result.state;

            if (
                filteredChildItems &&
                visibleChildCount > 0 &&
                visibleChildCount < originalChildCount &&
                !state
            ) {
                state = "limited";
            }

            return {
                ...item,
                items: filteredChildItems,
                state,
                disabled: result.disabled ?? item.disabled
            };
        };


        return BASE_MENU_GROUPS.map(group => ({
            title: group.title,
            items: group.items
                .map(processItem)
                .filter(Boolean) as MenuItem[],
        })).filter(group => group.items.length > 0);
    }, [evaluateAccess, permissions, permissionsKey]);

    return { groups, badgeColors: MENU_BADGE_TONES };
};

export default function SidebarMenu() {
    return null;
}