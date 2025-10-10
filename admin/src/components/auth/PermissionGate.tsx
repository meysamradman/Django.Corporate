import React from 'react';
import { useUserPermissions } from '@/components/auth/hooks/usePermissions';

interface PermissionGateProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface PermissionMultiGateProps {
  permissions: string[];
  mode?: 'any' | 'all';
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ProtectedActionProps {
  permission: string;
  children: React.ReactNode;
  renderFallback?: () => React.ReactNode;
}

/**
 * Gate component that renders children only if user has the required permission
 */
export function PermissionGate({ permission, children, fallback = null }: PermissionGateProps) {
  const { hasPermission } = useUserPermissions();

  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Gate component for multiple permissions
 */
export function PermissionMultiGate({ 
  permissions, 
  mode = 'any', 
  children, 
  fallback = null 
}: PermissionMultiGateProps) {
  const { hasAnyPermission, hasAllPermissions } = useUserPermissions();

  const hasAccess = mode === 'any' 
    ? hasAnyPermission(permissions)
    : hasAllPermissions(permissions);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Higher-order component for protecting actions
 */
export function ProtectedAction({ permission, children, renderFallback }: ProtectedActionProps) {
  const { hasPermission } = useUserPermissions();

  if (!hasPermission(permission)) {
    return renderFallback ? <>{renderFallback()}</> : null;
  }

  return <>{children}</>;
}

/**
 * Hook for getting permission-based component props
 */
export function usePermissionProps() {
  const { hasPermission, getResourceAccess } = useUserPermissions();

  /**
   * Get disabled state based on permission
   */
  const getDisabledByPermission = (permission: string) => ({
    disabled: !hasPermission(permission),
  });

  /**
   * Get conditional props based on permission
   */
  const getConditionalProps = (permission: string, props: Record<string, unknown>, fallbackProps?: Record<string, unknown>) => {
    return hasPermission(permission) ? props : (fallbackProps || {});
  };

  /**
   * Get CRUD action availability for a resource
   */
  const getCRUDProps = (resource: string) => {
    const access = getResourceAccess(resource);
    
    return {
      canList: access.list,
      canView: access.view,
      canCreate: access.create,
      canEdit: access.edit,
      canDelete: access.delete,
      canManage: access.manage,
    };
  };

  return {
    getDisabledByPermission,
    getConditionalProps,
    getCRUDProps,
  };
} 