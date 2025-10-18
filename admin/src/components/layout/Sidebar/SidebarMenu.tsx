import {
    Home,
    FileText,
    LayoutList,
    ShieldUser,
    Users,
    Settings,
    Shield,
    Images,
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
                        icon: FileText,
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
                        icon: LayoutList,
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
                title: "تنظیمات",
                items: [
                    {
                        title: "تنظیمات سیستم",
                        icon: Settings,
                        url: "/settings",
                    },
                ]
            },
        ]
    }), []);
};

export default function SidebarMenu() {
    return null; // This is handled by the Sidebar component
}