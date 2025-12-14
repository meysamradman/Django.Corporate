"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/core/utils/cn";
import { 
    Home, 
    Images, 
    Mail, 
    Ticket, 
    BarChart3,
    FileText,
    Plus,
    List,
    Filter,
    TrendingUp,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle
} from "lucide-react";
import { MenuItem } from "./SidebarMenu";
import { useUserPermissions } from "@/core/permissions/hooks/useUserPermissions";

interface MenuQuickLinksProps {
    item: MenuItem;
}

export function MenuQuickLinks({ item }: MenuQuickLinksProps) {
    const pathname = usePathname();
    const { hasModuleAction, isSuperAdmin } = useUserPermissions();

    // داشبورد
    if (item.url === "/") {
        const canViewBlogs = hasModuleAction("blog", "read");
        const canViewPortfolios = hasModuleAction("portfolio", "read");
        const canViewUsers = hasModuleAction("users", "read");
        const canViewAnalytics = hasModuleAction("analytics", "read");

        const quickLinks = [
            canViewBlogs && { title: "بلاگ‌ها", url: "/blogs", icon: FileText },
            canViewPortfolios && { title: "نمونه کارها", url: "/portfolios", icon: List },
            canViewUsers && { title: "کاربران", url: "/users", icon: List },
            canViewAnalytics && { title: "آمار و گزارش‌ها", url: "/analytics", icon: BarChart3 },
        ].filter(Boolean);

        return (
            <div className="space-y-4">
                <div>
                    <h3 className="text-sm font-semibold text-sdb-menu-ttl mb-3">دسترسی سریع</h3>
                    <div className="space-y-1">
                        {quickLinks.map((link: any) => (
                            <Link
                                key={link.url}
                                href={link.url}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
                                    "text-sdb-menu-txt hover:bg-sdb-hv hover:text-primary"
                                )}
                            >
                                <link.icon className="h-4 w-4" />
                                <span>{link.title}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // رسانه‌ها
    if (item.url === "/media") {
        const canManage = hasModuleAction("media", "manage");

        return (
            <div className="space-y-4">
                <div>
                    <h3 className="text-sm font-semibold text-sdb-menu-ttl mb-3">دسترسی سریع</h3>
                    <div className="space-y-1">
                        <Link
                            href="/media"
                            className={cn(
                                "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
                                pathname === "/media"
                                    ? "bg-sdb-hv text-primary"
                                    : "text-sdb-menu-txt hover:bg-sdb-hv hover:text-primary"
                            )}
                        >
                            <List className="h-4 w-4" />
                            <span>همه رسانه‌ها</span>
                        </Link>
                        {canManage && (
                            <Link
                                href="/media?action=upload"
                                className={cn(
                                    "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
                                    "text-sdb-menu-txt hover:bg-sdb-hv hover:text-primary"
                                )}
                            >
                                <Plus className="h-4 w-4" />
                                <span>آپلود جدید</span>
                            </Link>
                        )}
                    </div>
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-sdb-menu-ttl mb-3">فیلترها</h3>
                    <div className="space-y-1">
                        <Link
                            href="/media?type=image"
                            className={cn(
                                "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
                                "text-sdb-menu-txt hover:bg-sdb-hv hover:text-primary"
                            )}
                        >
                            <Images className="h-4 w-4" />
                            <span>تصاویر</span>
                        </Link>
                        <Link
                            href="/media?type=video"
                            className={cn(
                                "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
                                "text-sdb-menu-txt hover:bg-sdb-hv hover:text-primary"
                            )}
                        >
                            <FileText className="h-4 w-4" />
                            <span>ویدیوها</span>
                        </Link>
                        <Link
                            href="/media?type=document"
                            className={cn(
                                "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
                                "text-sdb-menu-txt hover:bg-sdb-hv hover:text-primary"
                            )}
                        >
                            <FileText className="h-4 w-4" />
                            <span>اسناد</span>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // ایمیل
    if (item.url === "/email") {
        const canRead = hasModuleAction("email", "read");

        if (!canRead) return null;

        return (
            <div className="space-y-4">
                <div>
                    <h3 className="text-sm font-semibold text-sdb-menu-ttl mb-3">فیلترها</h3>
                    <div className="space-y-1">
                        <Link
                            href="/email?status=sent"
                            className={cn(
                                "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
                                "text-sdb-menu-txt hover:bg-sdb-hv hover:text-primary"
                            )}
                        >
                            <CheckCircle2 className="h-4 w-4" />
                            <span>ارسال شده</span>
                        </Link>
                        <Link
                            href="/email?status=pending"
                            className={cn(
                                "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
                                "text-sdb-menu-txt hover:bg-sdb-hv hover:text-primary"
                            )}
                        >
                            <Clock className="h-4 w-4" />
                            <span>در انتظار</span>
                        </Link>
                        <Link
                            href="/email?status=failed"
                            className={cn(
                                "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
                                "text-sdb-menu-txt hover:bg-sdb-hv hover:text-primary"
                            )}
                        >
                            <XCircle className="h-4 w-4" />
                            <span>ناموفق</span>
                        </Link>
                    </div>
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-sdb-menu-ttl mb-3">دسترسی سریع</h3>
                    <div className="space-y-1">
                        <Link
                            href="/email"
                            className={cn(
                                "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
                                pathname === "/email"
                                    ? "bg-sdb-hv text-primary"
                                    : "text-sdb-menu-txt hover:bg-sdb-hv hover:text-primary"
                            )}
                        >
                            <List className="h-4 w-4" />
                            <span>همه ایمیل‌ها</span>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // تیکت
    if (item.url === "/ticket") {
        const canRead = hasModuleAction("ticket", "read");

        if (!canRead) return null;

        return (
            <div className="space-y-4">
                <div>
                    <h3 className="text-sm font-semibold text-sdb-menu-ttl mb-3">وضعیت‌ها</h3>
                    <div className="space-y-1">
                        <Link
                            href="/ticket?status=open"
                            className={cn(
                                "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
                                "text-sdb-menu-txt hover:bg-sdb-hv hover:text-primary"
                            )}
                        >
                            <AlertCircle className="h-4 w-4" />
                            <span>باز</span>
                        </Link>
                        <Link
                            href="/ticket?status=in_progress"
                            className={cn(
                                "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
                                "text-sdb-menu-txt hover:bg-sdb-hv hover:text-primary"
                            )}
                        >
                            <Clock className="h-4 w-4" />
                            <span>در حال بررسی</span>
                        </Link>
                        <Link
                            href="/ticket?status=closed"
                            className={cn(
                                "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
                                "text-sdb-menu-txt hover:bg-sdb-hv hover:text-primary"
                            )}
                        >
                            <CheckCircle2 className="h-4 w-4" />
                            <span>بسته شده</span>
                        </Link>
                    </div>
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-sdb-menu-ttl mb-3">دسترسی سریع</h3>
                    <div className="space-y-1">
                        <Link
                            href="/ticket"
                            className={cn(
                                "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
                                pathname === "/ticket"
                                    ? "bg-sdb-hv text-primary"
                                    : "text-sdb-menu-txt hover:bg-sdb-hv hover:text-primary"
                            )}
                        >
                            <List className="h-4 w-4" />
                            <span>همه تیکت‌ها</span>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // آمار بازدید
    if (item.url === "/analytics") {
        const canManage = hasModuleAction("analytics", "manage");

        if (!canManage) return null;

        return (
            <div className="space-y-4">
                <div>
                    <h3 className="text-sm font-semibold text-sdb-menu-ttl mb-3">گزارش‌ها</h3>
                    <div className="space-y-1">
                        <Link
                            href="/analytics"
                            className={cn(
                                "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
                                pathname === "/analytics"
                                    ? "bg-sdb-hv text-primary"
                                    : "text-sdb-menu-txt hover:bg-sdb-hv hover:text-primary"
                            )}
                        >
                            <BarChart3 className="h-4 w-4" />
                            <span>گزارش کلی</span>
                        </Link>
                        <Link
                            href="/analytics?view=daily"
                            className={cn(
                                "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
                                "text-sdb-menu-txt hover:bg-sdb-hv hover:text-primary"
                            )}
                        >
                            <TrendingUp className="h-4 w-4" />
                            <span>گزارش روزانه</span>
                        </Link>
                        <Link
                            href="/analytics?view=monthly"
                            className={cn(
                                "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
                                "text-sdb-menu-txt hover:bg-sdb-hv hover:text-primary"
                            )}
                        >
                            <TrendingUp className="h-4 w-4" />
                            <span>گزارش ماهانه</span>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
