"use client";

import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePermission } from '../context/PermissionContext';
import { cn } from '@/core/utils/cn';
import { toast } from '@/components/elements/Sonner';

interface ProtectedLinkProps extends React.ComponentProps<typeof Link> {
  /**
   * Permission required to access this link (e.g., "blog.read", "users.update")
   * If user doesn't have permission, the link will be disabled (pointer-events-none, opacity-50)
   */
  permission?: string | string[];
  /**
   * If true, user must have ALL permissions (AND logic)
   * If false, user needs ANY permission (OR logic) - default
   */
  requireAll?: boolean;
  /**
   * Fallback content when user doesn't have permission (default: same as children but disabled)
   */
  fallback?: React.ReactNode;
  /**
   * If true, show the link but disable it (default: true)
   * If false, hide the link completely
   */
  showWhenDenied?: boolean;
  /**
   * If true, show toast notification when user clicks without permission
   * Default: false (silent disable)
   */
  showDenyToast?: boolean;
  /**
   * Custom message to show in toast when access is denied
   */
  denyMessage?: string;
}

/**
 * 🔥 ProtectedLink Component
 * 
 * Strategy:
 * - If user has permission: Normal Link
 * - If user doesn't have permission: Disabled Link (or fallback)
 * 
 * Used for:
 * - Name column links in tables (to view/edit pages)
 * - Navigation links that require permission
 */
export const ProtectedLink: React.FC<ProtectedLinkProps> = ({
  permission,
  requireAll = false,
  fallback,
  showWhenDenied = true,
  showDenyToast = false,
  denyMessage = 'شما دسترسی لازم برای این عملیات را ندارید',
  children,
  className,
  onClick,
  ...rest
}) => {
  const { hasPermission, hasAllPermissions, hasAnyPermission, isLoading } = usePermission();

  // Memoize permissions array to avoid recreating on every render
  const permissions = useMemo(
    () => Array.isArray(permission) ? permission : (permission ? [permission] : []),
    [permission]
  );

  // Memoize access check
  const hasAccess = useMemo(() => {
    if (isLoading || !permission || permissions.length === 0) return true;
    return requireAll
      ? hasAllPermissions(permissions)
      : permissions.length === 1
        ? hasPermission(permissions[0])
        : hasAnyPermission(permissions);
  }, [isLoading, requireAll, permissions, hasPermission, hasAllPermissions, hasAnyPermission, permission]);

  // If no permission required, render normal link
  if (!permission || permissions.length === 0) {
    return (
      <Link className={className} onClick={onClick} {...rest}>
        {children}
      </Link>
    );
  }

  // If loading, show disabled state
  if (isLoading) {
    return (
      <span className={cn("opacity-50 pointer-events-none", className)}>
        {children}
      </span>
    );
  }

  // If user has access, render normal link
  if (hasAccess) {
    return (
      <Link className={className} onClick={onClick} {...rest}>
        {children}
      </Link>
    );
  }

  if (!showWhenDenied) {
    return <>{fallback || null}</>;
  }

  const handleDisabledClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    
    if (showDenyToast) {
      toast.error(denyMessage);
    }
    
    return false; // ✅ Extra safety
  };

  // Render as div (NOT Link, NOT span) to completely prevent navigation
  return (
    <div
      className={cn(
        "opacity-50 cursor-not-allowed inline-flex",
        className
      )}
      onClick={handleDisabledClick}
      onClickCapture={handleDisabledClick} // ✅ Capture phase to block early
      role="link"
      aria-disabled="true"
      style={{ pointerEvents: 'auto' }} // ✅ Ensure clicks are captured
    >
      {fallback || children}
    </div>
  );
};

