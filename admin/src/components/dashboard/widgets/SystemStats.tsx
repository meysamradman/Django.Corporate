"use client";

import { useMemo } from "react";
import { Server, Database, HardDrive, Activity } from "lucide-react";
import { Skeleton } from "@/components/elements/Skeleton";
import { PermissionLocked } from "@/core/permissions/components/PermissionLocked";
import { PERMISSIONS } from "@/core/permissions/constants";
import { SystemStats as SystemStatsType } from "@/types/analytics/analytics";
import { formatNumber } from "@/core/utils/format";

interface SystemStatsProps {
  systemStats: SystemStatsType | undefined;
  isLoading?: boolean;
}

const COLORS = {
  media: '#8B5CF6',
};

export const SystemStats: React.FC<SystemStatsProps> = ({ systemStats, isLoading = false }) => {
  const storageData = useMemo(() => {
    if (!systemStats?.storage?.by_type) return [];
    return Object.entries(systemStats.storage.by_type).map(([type, data]) => ({
      name: type === 'image' ? 'تصاویر' : type === 'video' ? 'ویدیو' : type === 'audio' ? 'صدا' : 'اسناد',
      value: data.size_mb || 0,
      count: data.count || 0,
      formatted: data.formatted || '0 B'
    })).filter(item => item.value > 0);
  }, [systemStats]);

  if (isLoading) {
    return (
      <div className="bg-card border border-br rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="w-9 h-9 rounded-lg" />
          <div className="text-right flex-1">
            <Skeleton className="h-6 w-28 mb-2" />
            <Skeleton className="h-4 w-36" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border border-br bg-bg">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-5 w-16" />
            </div>
            <div className="p-3 rounded-lg border border-br bg-bg">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-5 w-16" />
            </div>
          </div>
          <div className="p-3 rounded-lg border border-br bg-bg">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-5 w-12 mb-2" />
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[...Array(2)].map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <PermissionLocked
      permission={PERMISSIONS.ANALYTICS.SYSTEM_READ}
      lockedMessage="دسترسی به آمار سیستم"
      borderColorClass="border-primary"
      iconBgColorClass="bg-primary/10"
      iconColorClass="text-primary"
    >
      <div className="bg-card border border-br rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Server className="w-5 h-5 text-primary" />
        </div>
        <div className="text-right">
          <h2 className="text-lg font-semibold text-font-p">آمار سیستم</h2>
          <p className="text-xs text-font-s">وضعیت سرور و دیتابیس</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg border border-br bg-bg">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-blue-1" />
              <span className="text-xs text-font-s font-medium text-right">حجم دیتابیس</span>
            </div>
            <p className="text-base font-bold text-font-p text-right">
              {systemStats?.database?.size_formatted || 'N/A'}
            </p>
          </div>

          <div className="p-3 rounded-lg border border-br bg-bg">
            <div className="flex items-center gap-2 mb-2">
              <HardDrive className="w-4 h-4 text-purple-1" />
              <span className="text-xs text-font-s font-medium text-right">ذخیره‌سازی کل</span>
            </div>
            <p className="text-base font-bold text-font-p text-right">
              {systemStats?.storage?.total_formatted || '0 B'}
            </p>
          </div>
        </div>

        <div className="p-3 rounded-lg border border-br bg-bg">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-emerald-1" />
            <span className="text-xs text-font-s font-medium text-right">وضعیت کش</span>
          </div>
          <div>
            <p className="text-base font-bold text-font-p mb-1 text-right">
              {systemStats?.cache?.status === 'connected' ? 'متصل' : 'خطا'}
            </p>
            <div className="flex items-center justify-between text-xs text-font-s">
              <span>حافظه: {systemStats?.cache?.used_memory_formatted || '0B'}</span>
              <span>Hit: {systemStats?.cache?.hit_rate ? `${systemStats.cache.hit_rate.toFixed(1)}%` : '0%'}</span>
            </div>
          </div>
        </div>

        {storageData.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {storageData.map((item, index) => (
              <div key={index} className="p-2.5 rounded-lg border border-br bg-bg">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.media }} />
                  <span className="text-xs text-font-s font-medium">{item.name}</span>
                </div>
                <p className="text-sm font-bold text-font-p text-right">{item.formatted}</p>
                <p className="text-xs text-font-s text-right">{formatNumber(item.count)} فایل</p>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </PermissionLocked>
  );
};
