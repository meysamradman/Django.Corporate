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
    MessageSquare,
    type LucideIcon
} from "lucide-react"
import { useMemo } from "react"

export interface MenuItem {
    title: string;
    url?: string;
    icon?: LucideIcon;
    items?: MenuItem[];
    isTitle?: boolean;
    disabled?: boolean;
}

export type MenuGroup = {
    title: string;
    items: MenuItem[];
};

export const useMenuData = () => {
    return useMemo(() => ({
        groups: [
            {
                title: "داشبورد",
                items: [
                    {
                        title: "داشبورد",
                        icon: Home,
                        url: "/",
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
                            { title: "گزینه‌های نمونه کار", isTitle: true },
                            { title: "لیست گزینه‌ها", url: "/portfolios/options" },
                            { title: "ایجاد گزینه", url: "/portfolios/options/create" },
                        ],
                    },
                    {
                        title: "رسانه‌ها",
                        icon: Images,
                        url: "/media",
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
                            { title: "چت با AI", url: "/ai-chat" },
                            { title: "تولید محتوا با AI", url: "/ai-content" },
                        ],
                    },
                ]
            },
            {
                title: "تنظیمات",
                items: [
                    {
                        title: "تنظیمات پنل",
                        icon: Settings,
                        items: [
                            { title: "تنظیمات سیستم", url: "/settings" },
                            { title: "تنظیمات مدل‌های AI", url: "/settings/ai" },
                        ],
                    },
                ]
            },
        ]
    }), []);
};

export default function SidebarMenu() {
    return null; // This is handled by the Sidebar component
}