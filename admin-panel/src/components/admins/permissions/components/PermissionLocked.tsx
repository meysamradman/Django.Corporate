"use client";

import React, { useMemo } from "react";
import { Lock } from "lucide-react";
import { usePermission } from "../context/PermissionContext";
import { cn } from "@/core/utils/cn";
import { Card, CardContent } from "@/components/elements/Card";

interface PermissionLockedProps {
  permission: string | string[];
  requireAll?: boolean;
  children: React.ReactNode;
  className?: string;
  lockedMessage?: string;
  borderColorClass?: string; // Kept for backward compatibility, not used when locked
  iconBgColorClass?: string;
  iconColorClass?: string;
}

export const PermissionLocked: React.FC<PermissionLockedProps> = ({
  permission,
  requireAll = false,
  children,
  className,
  lockedMessage = "دسترسی محدود شده",
  borderColorClass, // Not used when locked, kept for backward compatibility
  iconBgColorClass = "bg-gray",
  iconColorClass = "stroke-gray-1",
}) => {
  const { hasPermission, hasAllPermissions, hasAnyPermission, check, isLoading } = usePermission();

  const permissions = useMemo(
    () => {
      const perms = Array.isArray(permission) ? permission : [permission];
      // فیلتر کردن undefined و null و string های خالی
      return perms.filter(p => p && typeof p === 'string' && p.trim().length > 0);
    },
    [permission]
  );

  const hasAccess = useMemo(() => {
    if (isLoading || permissions.length === 0) return false;
    
    // برای Analytics permissions باید چک دقیق کنیم:
    // analytics.stats.manage به همه analytics.*.read دسترسی میده
    // ولی analytics.manage فقط آمار بازدید رو مدیریت میکنه
    const isAnalyticsStatsPermission = permissions.some(p => 
      p.startsWith('analytics.') && 
      (p.includes('.read') || p === 'analytics.stats.manage')
    );
    
    if (isAnalyticsStatsPermission) {
      // برای analytics permissions:
      // 1. اگه خود permission رو داره (exact) → true
      // 2. اگه analytics.stats.manage داره → به همه analytics.*.read دسترسی داره
      const hasStatsManage = check('analytics.stats.manage');
      
      if (requireAll) {
        return permissions.every(p => check(p) || hasStatsManage);
      } else {
        return permissions.some(p => check(p) || hasStatsManage);
      }
    }
    
    // برای بقیه permissions از hasPermission استفاده میکنیم (با wildcard)
    return requireAll
      ? hasAllPermissions(permissions)
      : permissions.length === 1
        ? hasPermission(permissions[0])
        : hasAnyPermission(permissions);
  }, [isLoading, requireAll, permissions, hasPermission, hasAllPermissions, hasAnyPermission, check]);

  // Convert borderColorClass to border-b-* if needed, and remove full border
  const bottomBorderClass = useMemo(() => {
    if (!borderColorClass) return null;
    // If already border-b-*, use as is
    if (borderColorClass.includes("border-b-")) {
      return borderColorClass;
    }
    // If border-* (full border), convert to border-b-*
    if (borderColorClass.startsWith("border-") && !borderColorClass.includes("border-b-")) {
      return borderColorClass.replace("border-", "border-b-");
    }
    return borderColorClass;
  }, [borderColorClass]);

  if (isLoading) {
    return (
      <div className={cn("relative opacity-50", className)}>
        <div className="absolute inset-0 bg-bg/50 backdrop-blur-[1px] z-10 rounded-lg" />
        <div className="relative z-0 opacity-30">
          {children}
        </div>
      </div>
    );
  }

  if (!hasAccess) {

    return (
      <Card 
        className={cn(
          "border-0 shadow-sm relative overflow-hidden opacity-75",
          bottomBorderClass && "border-b-4",
          bottomBorderClass,
          className
        )}
      >
        <CardContent className="p-4 flex flex-col justify-between h-full relative">
          <div className="absolute inset-0 bg-card/90 backdrop-blur-[1.5px] z-20 flex items-center justify-center rounded-lg">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center shadow-lg border-2", iconBgColorClass, iconColorClass.replace("stroke-", "border-"))}>
                  <Lock 
                    className={cn("w-7 h-7", iconColorClass)}
                    strokeWidth={2.5}
                  />
                </div>
                <div className={cn("absolute inset-0 rounded-xl animate-pulse opacity-40 border-2", iconColorClass.replace("stroke-", "border-"))} />
              </div>
              <span className="text-xs font-medium text-font-s text-center px-2">
                {lockedMessage}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between opacity-0 pointer-events-none">
            <div className="text-3xl font-bold">--</div>
            <div className={cn("p-3 rounded-lg", iconBgColorClass)}>
              <div className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-2 opacity-0 pointer-events-none">
            <p className="text-base font-medium">---</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
};

export default PermissionLocked;

