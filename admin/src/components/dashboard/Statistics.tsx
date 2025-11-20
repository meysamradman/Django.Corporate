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
import React from "react";
import { usePermission } from "@/core/permissions/context/PermissionContext";
import { AccessDenied } from "@/core/permissions/components/AccessDenied";

export const Statistics: React.FC = () => {
  const { hasPermission, isLoading: permissionLoading } = usePermission();
  const { data: stats, isLoading, error } = useStatistics();

  // ✅ چک کردن دسترسی به داشبورد (dashboard.read یک base permission است)
  // اما اگر کاربر هیچ دسترسی به آمار نداشته باشد، AccessDenied نمایش می‌دهیم
  const hasAnyStatisticsPermission = 
    hasPermission('statistics.users.read') ||
    hasPermission('statistics.admins.read') ||
    hasPermission('statistics.content.read') ||
    hasPermission('statistics.dashboard.read');

  // اگر در حال بارگذاری permissions است، loading نمایش بده
  if (permissionLoading) {
    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        <StatCard
          icon={Users}
          title="کل کاربران"
          value={0}
          iconColor="var(--color-sky-500)"
          bgColor="var(--color-sky-100)"
          borderColor="var(--color-sky-300)"
          loading={true}
        />
        <StatCard
          icon={ShieldUser}
          title="کل ادمین‌ها"
          value={0}
          iconColor="var(--color-emerald-500)"
          bgColor="var(--color-emerald-100)"
          borderColor="var(--color-emerald-300)"
          loading={true}
        />
        <StatCard
          icon={LayoutList}
          title="کل نمونه کارها"
          value={0}
          iconColor="var(--color-amber-500)"
          bgColor="var(--color-amber-100)"
          borderColor="var(--color-amber-300)"
          loading={true}
        />
        <StatCard
          icon={FileText}
          title="کل بلاگ‌ها"
          value={0}
          iconColor="var(--color-indigo-500)"
          bgColor="var(--color-indigo-100)"
          borderColor="var(--color-indigo-300)"
          loading={true}
        />
        <StatCard
          icon={Image}
          title="کل رسانه‌ها"
          value={0}
          iconColor="var(--color-purple-500)"
          bgColor="var(--color-purple-100)"
          borderColor="var(--color-purple-300)"
          loading={true}
        />
      </div>
    );
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
    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        <StatCard
          icon={Users}
          title="کل کاربران"
          value={0}
          iconColor="var(--color-sky-500)"
          bgColor="var(--color-sky-100)"
          borderColor="var(--color-sky-300)"
          loading={true}
        />
        <StatCard
          icon={ShieldUser}
          title="کل ادمین‌ها"
          value={0}
          iconColor="var(--color-emerald-500)"
          bgColor="var(--color-emerald-100)"
          borderColor="var(--color-emerald-300)"
          loading={true}
        />
        <StatCard
          icon={LayoutList}
          title="کل نمونه کارها"
          value={0}
          iconColor="var(--color-amber-500)"
          bgColor="var(--color-amber-100)"
          borderColor="var(--color-amber-300)"
          loading={true}
        />
        <StatCard
          icon={FileText}
          title="کل بلاگ‌ها"
          value={0}
          iconColor="var(--color-indigo-500)"
          bgColor="var(--color-indigo-100)"
          borderColor="var(--color-indigo-300)"
          loading={true}
        />
        <StatCard
          icon={Image}
          title="کل رسانه‌ها"
          value={0}
          iconColor="var(--color-purple-500)"
          bgColor="var(--color-purple-100)"
          borderColor="var(--color-purple-300)"
          loading={true}
        />
      </div>
    );
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
      <StatCard
        icon={Users}
        title="کل کاربران"
        value={currentStats.total_users}
        iconColor="var(--color-sky-500)"
        bgColor="var(--color-sky-100)"
        borderColor="var(--color-sky-300)"
        loading={false}
      />
      <StatCard
        icon={ShieldUser}
        title="کل ادمین‌ها"
        value={currentStats.total_admins}
        iconColor="var(--color-emerald-500)"
        bgColor="var(--color-emerald-100)"
        borderColor="var(--color-emerald-300)"
        loading={false}
      />
      <StatCard
        icon={LayoutList}
        title="کل نمونه کارها"
        value={currentStats.total_portfolios}
        iconColor="var(--color-amber-500)"
        bgColor="var(--color-amber-100)"
        borderColor="var(--color-amber-300)"
        loading={false}
      />
      <StatCard
        icon={FileText}
        title="کل بلاگ‌ها"
        value={currentStats.total_posts}
        iconColor="var(--color-indigo-500)"
        bgColor="var(--color-indigo-100)"
        borderColor="var(--color-indigo-300)"
        loading={false}
      />
      <StatCard
        icon={Image}
        title="کل رسانه‌ها"
        value={currentStats.total_media}
        iconColor="var(--color-purple-500)"
        bgColor="var(--color-purple-100)"
        borderColor="var(--color-purple-300)"
        loading={false}
      />
    </div>
  );
};
