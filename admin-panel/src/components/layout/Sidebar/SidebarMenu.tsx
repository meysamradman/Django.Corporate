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
} from "lucide-react"
import type { MenuItem, MenuGroup } from '@/types/shared/menu';

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
        items: [
          { title: "صفحه اصلی", url: "/" },
          { title: "صفحه تست", url: "/test" },
          { title: "گزارش‌ها", isTitle: true },
          { title: "گزارش کلی", url: "/analytics" },
          { title: "گزارش روزانه", url: "/analytics?view=daily" },
          { title: "گزارش ماهانه", url: "/analytics?view=monthly" },
        ],
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
        items: [
          { title: "لیست بلاگ‌ها", url: "/blogs" },
          { title: "ایجاد بلاگ", url: "/blogs/create" },
          { title: "دسته‌بندی‌های بلاگ", isTitle: true },
          { title: "لیست دسته‌بندی‌ها", url: "/blogs/categories" },
          { title: "ایجاد دسته‌بندی", url: "/blogs/categories/create" },
          { title: "تگ‌های بلاگ", isTitle: true },
          { title: "لیست تگ‌ها", url: "/blogs/tags" },
          { title: "ایجاد تگ", url: "/blogs/tags/create" },
        ],
      },
      {
        title: "نمونه کار",
        icon: Layers,
        items: [
          { title: "لیست نمونه کارها", url: "/portfolios" },
          { title: "ایجاد نمونه کار", url: "/portfolios/create" },
          { title: "دسته‌بندی‌های نمونه کار", isTitle: true },
          { title: "لیست دسته‌بندی‌ها", url: "/portfolios/categories" },
          { title: "ایجاد دسته‌بندی", url: "/portfolios/categories/create" },
          { title: "تگ‌های نمونه کار", isTitle: true },
          { title: "لیست تگ‌ها", url: "/portfolios/tags" },
          { title: "ایجاد تگ", url: "/portfolios/tags/create" },
        ],
      },
      {
        title: "رسانه‌ها",
        icon: Images,
        items: [
          { title: "دسترسی سریع", isTitle: true },
          { title: "همه رسانه‌ها", url: "/media" },
          { title: "آپلود جدید", url: "/media?action=upload" },
          { title: "فیلترها", isTitle: true },
          { title: "تصاویر", url: "/media?type=image" },
          { title: "ویدیوها", url: "/media?type=video" },
          { title: "اسناد", url: "/media?type=document" },
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
        items: [
          { title: "لیست ادمین‌ها", url: "/admins" },
          { title: "ایجاد ادمین", url: "/admins/create" },
        ],
      },
      {
        title: "کاربران",
        icon: Users,
        items: [
          { title: "لیست کاربران", url: "/users" },
          { title: "ایجاد کاربر", url: "/users/create" },
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
        items: [
          { title: "لیست نقش‌ها", url: "/roles" },
          { title: "ایجاد نقش", url: "/roles/create" },
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
        items: [
          { title: "چت با AI", url: "/ai/chat" },
          { title: "تولید محتوا با AI", url: "/ai/content" },
          { title: "تولید تصویر با AI", url: "/ai/image" },
          { title: "تولید پادکست با AI", url: "/ai/audio" },
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
        items: [
          { title: "فیلترها", isTitle: true },
          { title: "ارسال شده", url: "/email?status=sent" },
          { title: "در انتظار", url: "/email?status=pending" },
          { title: "ناموفق", url: "/email?status=failed" },
          { title: "دسترسی سریع", isTitle: true },
          { title: "همه ایمیل‌ها", url: "/email" },
        ]
      },
      {
        title: "تیکت",
        icon: Ticket,
        items: [
          { title: "وضعیت‌ها", isTitle: true },
          { title: "باز", url: "/ticket?status=open" },
          { title: "در حال بررسی", url: "/ticket?status=in_progress" },
          { title: "بسته شده", url: "/ticket?status=closed" },
          { title: "دسترسی سریع", isTitle: true },
          { title: "همه تیکت‌ها", url: "/ticket" },
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
        items: [
          { title: "گزارش‌ها", isTitle: true },
          { title: "گزارش کلی", url: "/analytics" },
          { title: "گزارش روزانه", url: "/analytics?view=daily" },
          { title: "گزارش ماهانه", url: "/analytics?view=monthly" },
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
          { title: "تنظیمات پنل", url: "/panel" },
          { title: "تنظیمات هوش مصنوعی", isTitle: true },
          { title: "مدیریت Provider ها", url: "/ai/settings" },
          { title: "انتخاب مدل‌ها", url: "/ai/models", icon: List },
          { title: "تنظیمات وب‌سایت و اپلیکیشن", isTitle: true },
          { title: "تنظیمات عمومی", url: "/settings" },
          { title: "چت‌بات", url: "/chatbot" },
          { title: "فرم‌ها", url: "/form-builder" },
          { title: "درباره ما", url: "/page/about" },
          { title: "قوانین و مقررات", url: "/page/terms" },
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

import { useMemo } from "react";

export const useMenuData = () => {
  return useMemo(() => {
    const processItem = (item: MenuItemConfig): MenuItem | null => {
      if (item.isTitle) {
        return {
          ...item,
          items: undefined
        };
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

      if (!item.url) {
        if (!filteredChildItems || filteredChildItems.length === 0) {
          return {
            ...item,
            items: undefined,
          };
        }
        if (!hasActionableChild) {
          return null;
        }
      }

      return {
        ...item,
        items: filteredChildItems,
      };
    };

    const groups = BASE_MENU_GROUPS.map(group => ({
      title: group.title,
      items: group.items
        .map(processItem)
        .filter(Boolean) as MenuItem[],
    })).filter(group => group.items.length > 0);

    return { groups, badgeColors: MENU_BADGE_TONES };
  }, []);
};

export default function SidebarMenu() {
  return null;
}

