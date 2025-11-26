"use client";

import React, { useMemo } from "react";
import { Lock } from "lucide-react";
import { usePermission } from "../context/PermissionContext";
import { cn } from "@/core/utils/cn";
import { Card, CardContent } from "@/components/elements/Card";

interface PermissionLockedProps {
  /**
   * Permission string or array of permissions
   */
  permission: string | string[];
  /**
   * If true, requires ALL permissions (default: false - any)
   */
  requireAll?: boolean;
  /**
   * Children to render if permission is granted
   */
  children: React.ReactNode;
  /**
   * Custom className for the locked card wrapper
   */
  className?: string;
  /**
   * Custom message to show when locked
   */
  lockedMessage?: string;
  /**
   * Border color class for the locked card (to match original card)
   */
  borderColorClass?: string;
  /**
   * Icon background color class (to match original card)
   */
  iconBgColorClass?: string;
  /**
   * Icon color class (to match original card)
   */
  iconColorClass?: string;
}

/**
 * ✅ PermissionLocked Component
 * 
 * Renders children only if user has permission.
 * If no permission, shows a locked card overlay (children are NOT rendered in DOM).
 * 
 * Security: Children are completely removed from DOM when locked (not just hidden with CSS).
 * 
 * @example
 * <PermissionLocked permission="statistics.users.read">
 *   <StatCard ... />
 * </PermissionLocked>
 * 
 * @example
 * <PermissionLocked permission={['statistics.content.read', 'portfolio.read']} requireAll>
 *   <StatCard ... />
 * </PermissionLocked>
 */
export const PermissionLocked: React.FC<PermissionLockedProps> = ({
  permission,
  requireAll = false,
  children,
  className,
  lockedMessage = "دسترسی محدود شده",
  borderColorClass = "border-b-gray-1",
  iconBgColorClass = "bg-gray",
  iconColorClass = "stroke-gray-1",
}) => {
  const { hasPermission, hasAllPermissions, hasAnyPermission, isLoading } = usePermission();

  // Memoize permissions array
  const permissions = useMemo(
    () => Array.isArray(permission) ? permission : [permission],
    [permission]
  );

  // Memoize access check
  const hasAccess = useMemo(() => {
    if (isLoading) return false;
    return requireAll
      ? hasAllPermissions(permissions)
      : permissions.length === 1
        ? hasPermission(permissions[0])
        : hasAnyPermission(permissions);
  }, [isLoading, requireAll, permissions, hasPermission, hasAllPermissions, hasAnyPermission]);

  // If loading, show skeleton/placeholder
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

  // ✅ SECURITY: If no access, DO NOT render children in DOM
  // Render locked card with same structure as StatCard but locked overlay
  if (!hasAccess) {
    return (
      <Card 
        className={cn("border-b-4 shadow-sm relative overflow-hidden opacity-75", borderColorClass, className)}
      >
        <CardContent className="p-4 flex flex-col justify-between h-full relative">
          {/* Locked Overlay - covers entire card */}
          <div className="absolute inset-0 bg-card/90 backdrop-blur-[1.5px] z-20 flex items-center justify-center rounded-lg">
            <div className="flex flex-col items-center gap-3">
              {/* Colorful Lock Icon */}
              <div className="relative">
                <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center shadow-lg border-2", iconBgColorClass, iconColorClass.replace("stroke-", "border-"))}>
                  <Lock 
                    className={cn("w-7 h-7", iconColorClass)}
                    strokeWidth={2.5}
                  />
                </div>
                {/* Animated glow ring */}
                <div className={cn("absolute inset-0 rounded-xl animate-pulse opacity-40 border-2", iconColorClass.replace("stroke-", "border-"))} />
              </div>
              {/* Message */}
              <span className="text-xs font-medium text-font-s text-center px-2">
                {lockedMessage}
              </span>
            </div>
          </div>
          
          {/* Placeholder structure (invisible - maintains layout) */}
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

  // ✅ If has access, render children normally
  return <>{children}</>;
};

export default PermissionLocked;

