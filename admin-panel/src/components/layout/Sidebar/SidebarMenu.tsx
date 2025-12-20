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
  BarChart3,
  FileText,
  Plus,
  Folder,
  Tag,
  Upload,
  Video,
  File,
  UserPlus,
  Clock,
  Circle,
  CheckCircle,
  XCircle,
  PanelRight,
  Bot,
  Info,
  FileCheck,
  MessageSquare,
  Cpu,
  Image as ImageIcon,
  Music,
} from "lucide-react"
import { useMemo, useCallback } from "react"
import { useUserPermissions } from "@/components/admins/permissions/hooks/useUserPermissions"
import type { ModuleAction } from "@/types/auth/permission"
import { useFeatureFlags } from "@/core/feature-flags/useFeatureFlags"
import { MODULE_TO_FEATURE_FLAG as CONFIG_MODULE_TO_FEATURE_FLAG } from "@/core/feature-flags/featureFlags"
import type { MenuItem, MenuAccessConfig } from '@/types/shared/menu';

const MODULE_TO_FEATURE_FLAG = CONFIG_MODULE_TO_FEATURE_FLAG;

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
        items: [
          { title: "صفحه اصلی", url: "/", icon: Home },
          { title: "آمار بازدید", url: "/analytics", icon: BarChart3 },
          { title: "دسترسی سریع", isTitle: true },
          { title: "بلاگ‌ها", url: "/blogs", icon: BookOpen },
          { title: "نمونه کارها", url: "/portfolios", icon: Layers },
          { title: "رسانه‌ها", url: "/media", icon: Images },
          { title: "کاربران", url: "/users", icon: Users },
        ],
        tooltip: "داشبورد و دسترسی سریع"
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
          { title: "لیست بلاگ‌ها", url: "/blogs", icon: FileText, access: { module: "blog", allowReadOnly: true } },
          { title: "ایجاد بلاگ", url: "/blogs/create", icon: Plus, access: { module: "blog", actions: ["create"] } },
          { title: "دسته‌بندی‌های بلاگ", isTitle: true },
          { title: "لیست دسته‌بندی‌ها", url: "/blogs/categories", icon: Folder, access: { module: "blog_categories", allowReadOnly: true } },
          { title: "ایجاد دسته‌بندی", url: "/blogs/categories/create", icon: Plus, access: { module: "blog_categories", actions: ["create"] } },
          { title: "تگ‌های بلاگ", isTitle: true },
          { title: "لیست تگ‌ها", url: "/blogs/tags", icon: Tag, access: { module: "blog_tags", allowReadOnly: true } },
          { title: "ایجاد تگ", url: "/blogs/tags/create", icon: Plus, access: { module: "blog_tags", actions: ["create"] } },
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
          { title: "لیست نمونه کارها", url: "/portfolios", icon: Layers, access: { module: "portfolio", allowReadOnly: true } },
          { title: "ایجاد نمونه کار", url: "/portfolios/create", icon: Plus, access: { module: "portfolio", actions: ["create"] } },
          { title: "دسته‌بندی‌های نمونه کار", isTitle: true },
          { title: "لیست دسته‌بندی‌ها", url: "/portfolios/categories", icon: Folder, access: { module: "portfolio_categories", allowReadOnly: true } },
          { title: "ایجاد دسته‌بندی", url: "/portfolios/categories/create", icon: Plus, access: { module: "portfolio_categories", actions: ["create"] } },
          { title: "تگ‌های نمونه کار", isTitle: true },
          { title: "لیست تگ‌ها", url: "/portfolios/tags", icon: Tag, access: { module: "portfolio_tags", allowReadOnly: true } },
          { title: "ایجاد تگ", url: "/portfolios/tags/create", icon: Plus, access: { module: "portfolio_tags", actions: ["create"] } },
        ],
      },
      {
        title: "رسانه‌ها",
        icon: Images,
        url: "/media",
        access: {
          module: "media",
          actions: ["manage"],
          allowReadOnly: false
        },
        items: [
          { title: "کتابخانه رسانه", url: "/media", icon: Images },
          { title: "فیلتر بر اساس نوع", isTitle: true },
          { title: "تصاویر", url: "/media?file_type=image", icon: ImageIcon },
          { title: "ویدیوها", url: "/media?file_type=video", icon: Video },
          { title: "فایل‌های صوتی", url: "/media?file_type=audio", icon: Music },
          { title: "اسناد PDF", url: "/media?file_type=pdf", icon: File },
        ]
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
          allowReadOnly: true
        },
        items: [
          {
            title: "لیست ادمین‌ها",
            url: "/admins",
            icon: ShieldUser,
            access: {
              module: "admin",
              actions: ["read", "view"],
              allowReadOnly: true
            }
          },
          {
            title: "ایجاد ادمین",
            url: "/admins/create",
            icon: UserPlus,
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
          { title: "لیست کاربران", url: "/users", icon: Users, access: { module: "users", allowReadOnly: true } },
          { title: "ایجاد کاربر", url: "/users/create", icon: UserPlus, access: { module: "users", actions: ["create"] } },
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
          { title: "لیست نقش‌ها", url: "/roles", icon: Shield, access: { module: "admin", requireSuperAdmin: true } },
          { title: "ایجاد نقش", url: "/roles/create", icon: Plus, access: { module: "admin", requireSuperAdmin: true } },
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
          { title: "چت با AI", url: "/ai/chat", icon: MessageSquare, access: { module: "ai", allowReadOnly: true } },
          { title: "تولید محتوا با AI", url: "/ai/content", icon: FileText, access: { module: "ai", allowReadOnly: true } },
          { title: "تولید تصویر با AI", url: "/ai/image", icon: ImageIcon, access: { module: "ai", allowReadOnly: true } },
          { title: "تولید پادکست با AI", url: "/ai/audio", icon: Music, access: { module: "ai", allowReadOnly: true } },
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
        },
        items: [
          { title: "همه ایمیل‌ها", url: "/email", icon: Mail },
          { title: "صندوق‌ها", isTitle: true },
          { title: "دریافتی", url: "/email?mailbox=inbox", icon: Mail },
          { title: "ارسال شده", url: "/email?mailbox=sent", icon: Upload },
          { title: "پیش‌نویس‌ها", url: "/email?mailbox=draft", icon: FileText },
          { title: "ستاره‌دار", url: "/email?mailbox=starred", icon: Sparkles },
        ]
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
        },
        items: [
          { title: "همه تیکت‌ها", url: "/ticket", icon: Ticket },
          { title: "وضعیت تیکت‌ها", isTitle: true },
          { title: "تیکت‌های باز", url: "/ticket?status=open", icon: Circle },
          { title: "در حال بررسی", url: "/ticket?status=in_progress", icon: Clock },
          { title: "حل شده", url: "/ticket?status=resolved", icon: CheckCircle },
          { title: "بسته شده", url: "/ticket?status=closed", icon: XCircle },
        ]
      },
    ]
  },
  {
    title: "آمار و گزارش‌ها",
    items: [
      {
        title: "آمار بازدید",
        icon: BarChart3,
        url: "/analytics",
        access: {
          module: "analytics",
          actions: ["manage"],
          allowReadOnly: true,
          readOnlyLabel: "فقط مشاهده"
        },
        items: [
          { title: "گزارش آماری", url: "/analytics", icon: BarChart3 },
        ]
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
          { title: "تنظیمات پنل", url: "/panel", icon: PanelRight, access: { module: "panel", actions: ["manage"] } },
          { title: "تنظیمات هوش مصنوعی", isTitle: true },
          { title: "مدیریت Provider ها", url: "/ai/settings", icon: Cpu, access: { module: "ai", actions: ["manage"] } },
          { title: "انتخاب مدل‌ها", url: "/ai/models", icon: List, access: { module: "ai", actions: ["manage"], requireSuperAdmin: true } },
          { title: "تنظیمات وب‌سایت و اپلیکیشن", isTitle: true },
          { title: "تنظیمات عمومی", url: "/settings", icon: Settings, access: { module: "settings", actions: ["manage"] } },
          { title: "چت‌بات", url: "/chatbot", icon: Bot, access: { module: "chatbot", actions: ["manage"] } },
          { title: "فرم‌ها", url: "/form-builder", icon: FileCheck, access: { module: "forms", allowReadOnly: true } },
          { title: "درباره ما", url: "/page/about", icon: Info, access: { module: "pages", actions: ["manage"] } },
          { title: "قوانین و مقررات", url: "/page/terms", icon: FileText, access: { module: "pages", actions: ["manage"] } },
        ],
      },
    ]
  },
];

export const MENU_BADGE_TONES: Record<string, string> = {
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
    isSuperAdmin
  } = useUserPermissions();

  const { data: featureFlagsRaw = {} } = useFeatureFlags();

  const featureFlagsKey = useMemo(() => {
    return JSON.stringify(featureFlagsRaw);
  }, [featureFlagsRaw]);

  const featureFlags = useMemo(() => {
    return featureFlagsRaw;
  }, [featureFlagsKey]);

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
      isSuperAdmin,
      featureFlags: featureFlagsKey
    });
  }, [permissions, permissionProfile, userRoles, isSuperAdmin, featureFlagsKey]);

  const evaluateAccess = useCallback((access?: MenuAccessConfig) => {
    if (!access) {
      return { visible: true } as const;
    }

    const accessModule = access.module;
    if (accessModule) {
      const featureFlagKey = MODULE_TO_FEATURE_FLAG[accessModule];
      if (featureFlagKey) {
        if (featureFlagKey in featureFlags && featureFlags[featureFlagKey] === false) {
          return { visible: false } as const;
        }
      }
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
    const actions: ModuleAction[] = access.actions && access.actions.length > 0
      ? (access.actions.map(a => a as ModuleAction))
      : ["read"];

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
  }, [hasRole, isSuperAdmin, getModuleAccessProfile, hasModuleAction, permissionsKey, featureFlags]);

  const groups = useMemo(() => {
    const processItem = (item: MenuItemConfig): MenuItem | null => {
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

      const filteredChildItems = childItems?.filter((child, index) => {
        if (!child.isTitle) {
          return true;
        }
        const itemsAfter = childItems.slice(index + 1);
        const nextTitleIndex = itemsAfter.findIndex(item => item.isTitle);
        const itemsInSection = nextTitleIndex === -1
          ? itemsAfter
          : itemsAfter.slice(0, nextTitleIndex);
        return itemsInSection.some(item => !item.isTitle && (item.url || (item.items && item.items.length > 0)));
      }) as MenuItem[] | undefined;

      const hasActionableChild = filteredChildItems?.some(child =>
        !child.isTitle && (child.url || (child.items && child.items.length > 0))
      );

      let state = result.state;

      if (!item.url) {
        if (!filteredChildItems || filteredChildItems.length === 0) {
          return {
            ...item,
            items: undefined,
            state,
            disabled: result.disabled ?? item.disabled
          };
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

