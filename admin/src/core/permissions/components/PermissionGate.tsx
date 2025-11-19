'use client';

import React, { useMemo } from 'react';
import { usePermission } from '../context/PermissionContext';

interface Props {
  permission: string | string[];
  requireAll?: boolean; // default: false (any)
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * ✅ Conditional render component based on permissions
 * 🔥 Optimized: Uses memoized permission checks from Context (cached for 5 minutes)
 * 
 * Industry Standard Pattern (used by React Admin, Material-UI Admin, etc.)
 * 
 * @example
 * <PermissionGate permission="media.upload">
 *   <UploadButton />
 * </PermissionGate>
 * 
 * <PermissionGate permission={['media.upload', 'media.delete']} requireAll>
 *   <AdvancedSection />
 * </PermissionGate>
 */
export const PermissionGate: React.FC<Props> = ({
  permission,
  requireAll = false,
  fallback = null,
  children,
}) => {
  const { hasPermission, hasAllPermissions, hasAnyPermission, isLoading } = usePermission();

  // 🔥 Memoize permissions array to avoid recreating on every render
  const permissions = useMemo(
    () => Array.isArray(permission) ? permission : [permission],
    [permission]
  );

  // 🔥 Memoize access check to avoid recalculating on every render
  const hasAccess = useMemo(() => {
    if (isLoading) return false;
    return requireAll
      ? hasAllPermissions(permissions)
      : permissions.length === 1
        ? hasPermission(permissions[0])
        : hasAnyPermission(permissions);
  }, [isLoading, requireAll, permissions, hasPermission, hasAllPermissions, hasAnyPermission]);

  if (isLoading) {
    return <>{fallback}</>;
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

export default PermissionGate;


