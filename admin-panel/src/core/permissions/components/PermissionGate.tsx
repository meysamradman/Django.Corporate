import { useMemo } from 'react';
import type { ReactNode, FC } from 'react';
import { usePermission } from '../context/PermissionContext';

interface Props {
  permission: string | string[];
  requireAll?: boolean;
  fallback?: ReactNode;
  children: ReactNode;
}

export const PermissionGate: FC<Props> = ({
  permission,
  requireAll = false,
  fallback = null,
  children,
}) => {
  const { hasPermission, hasAllPermissions, hasAnyPermission, isLoading } = usePermission();

  const permissions = useMemo(
    () => Array.isArray(permission) ? permission : [permission],
    [permission]
  );

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

