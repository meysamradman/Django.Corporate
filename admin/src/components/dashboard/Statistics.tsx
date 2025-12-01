"use client";

import {
  Users,
  LayoutList,
  ShieldUser,
  Image,
  FileText,
} from "lucide-react";
import { useStatistics } from "@/components/dashboard/hooks/useStatistics";
import { StatCard } from "@/components/dashboard/StatCard";
import React, { useMemo } from "react";
import { usePermission } from "@/core/permissions/context/PermissionContext";
import { AccessDenied } from "@/core/permissions/components/AccessDenied";
import { PermissionLocked } from "@/core/permissions/components/PermissionLocked";

interface StatCardConfig {
  id: string;
  icon: React.ElementType;
  title: string;
  statKey: keyof { total_users: number; total_admins: number; total_portfolios: number; total_posts: number; total_media: number };
  permission: string | string[];
  requireAll?: boolean;
  lockedMessage: string;
  iconColorClass: string;
  bgColorClass: string;
  borderColorClass: string;
}

const STAT_CARDS_CONFIG: StatCardConfig[] = [
  {
    id: 'users',
    icon: Users,
    title: 'کل کاربران',
    statKey: 'total_users',
    permission: 'statistics.users.read',
    lockedMessage: 'دسترسی به آمار کاربران',
    iconColorClass: 'text-blue-1',
    bgColorClass: 'bg-blue',
    borderColorClass: 'border-b-blue-1',
  },
  {
    id: 'admins',
    icon: ShieldUser,
    title: 'کل ادمین‌ها',
    statKey: 'total_admins',
    permission: 'statistics.admins.read',
    lockedMessage: 'دسترسی به آمار ادمین‌ها',
    iconColorClass: 'text-emerald-1',
    bgColorClass: 'bg-emerald',
    borderColorClass: 'border-b-emerald-1',
  },
  {
    id: 'portfolios',
    icon: LayoutList,
    title: 'کل نمونه کارها',
    statKey: 'total_portfolios',
    permission: ['statistics.content.read', 'portfolio.read'],
    requireAll: true,
    lockedMessage: 'دسترسی به آمار نمونه کارها',
    iconColorClass: 'text-amber-1',
    bgColorClass: 'bg-amber',
    borderColorClass: 'border-b-amber-1',
  },
  {
    id: 'blogs',
    icon: FileText,
    title: 'کل بلاگ‌ها',
    statKey: 'total_posts',
    permission: ['statistics.content.read', 'blog.read'],
    requireAll: true,
    lockedMessage: 'دسترسی به آمار بلاگ‌ها',
    iconColorClass: 'text-indigo-1',
    bgColorClass: 'bg-indigo',
    borderColorClass: 'border-b-indigo-1',
  },
  {
    id: 'media',
    icon: Image,
    title: 'کل رسانه‌ها',
    statKey: 'total_media',
    permission: ['statistics.content.read', 'media.read'],
    requireAll: true,
    lockedMessage: 'دسترسی به آمار رسانه‌ها',
    iconColorClass: 'text-purple-1',
    bgColorClass: 'bg-purple',
    borderColorClass: 'border-b-purple-1',
  },
];

export const Statistics: React.FC = () => {
  const { hasPermission, isLoading: permissionLoading } = usePermission();
  const { data: stats, isLoading, error } = useStatistics();

  // ✅ چک کردن دسترسی به داشبورد
  const hasAnyStatisticsPermission = useMemo(() => 
    hasPermission('statistics.users.read') ||
    hasPermission('statistics.admins.read') ||
    hasPermission('statistics.content.read') ||
    hasPermission('statistics.dashboard.read'),
    [hasPermission]
  );

  // Render loading cards
  const renderLoadingCards = () => (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {STAT_CARDS_CONFIG.map((config) => (
        <StatCard
          key={config.id}
          icon={config.icon}
          title={config.title}
          value={0}
          iconColorClass={config.iconColorClass}
          bgColorClass={config.bgColorClass}
          borderColorClass={config.borderColorClass}
          loading={true}
        />
      ))}
    </div>
  );

  // اگر در حال بارگذاری permissions است، loading نمایش بده
  if (permissionLoading) {
    return renderLoadingCards();
  }

  // ✅ اگر دسترسی به آمار ندارد، AccessDenied نمایش بده
  if (!hasAnyStatisticsPermission) {
    return (
      <AccessDenied
        permission="statistics.dashboard.read"
        module="statistics"
        action="read"
        description="برای مشاهده آمار داشبورد نیاز به دسترسی آمار دارید."
        showBackButton={false}
        showDashboardButton={true}
      />
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive mb-4">خطا در بارگذاری آمار</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-static-w rounded hover:bg-primary/90"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return renderLoadingCards();
  }

  const defaultStats = {
    total_portfolios: 0,
    total_admins: 0,
    total_users: 0,
    total_media: 0,
    total_posts: 0,
  };

  const currentStats = stats || defaultStats;

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {STAT_CARDS_CONFIG.map((config) => (
        <PermissionLocked
          key={config.id}
          permission={config.permission}
          requireAll={config.requireAll}
          lockedMessage={config.lockedMessage}
          borderColorClass={config.borderColorClass}
          iconBgColorClass={config.bgColorClass}
          iconColorClass={config.iconColorClass}
        >
          <StatCard
            icon={config.icon}
            title={config.title}
            value={currentStats[config.statKey]}
            iconColorClass={config.iconColorClass}
            bgColorClass={config.bgColorClass}
            borderColorClass={config.borderColorClass}
            loading={false}
          />
        </PermissionLocked>
      ))}
    </div>
  );
};
