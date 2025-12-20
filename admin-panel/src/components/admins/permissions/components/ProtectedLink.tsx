import { useMemo } from 'react';
import type { ComponentProps, FC, ReactNode, MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { usePermission } from '../context/PermissionContext';
import { cn } from '@/core/utils/cn';
import { toast } from 'sonner';

interface ProtectedLinkProps extends ComponentProps<typeof Link> {
  permission?: string | string[];
  requireAll?: boolean;
  fallback?: ReactNode;
  showWhenDenied?: boolean;
  showDenyToast?: boolean;
  denyMessage?: string;
}
export const ProtectedLink: FC<ProtectedLinkProps> = ({
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

  const permissions = useMemo(
    () => Array.isArray(permission) ? permission : (permission ? [permission] : []),
    [permission]
  );

  const hasAccess = useMemo(() => {
    if (isLoading || !permission || permissions.length === 0) return true;
    return requireAll
      ? hasAllPermissions(permissions)
      : permissions.length === 1
        ? hasPermission(permissions[0])
        : hasAnyPermission(permissions);
  }, [isLoading, requireAll, permissions, hasPermission, hasAllPermissions, hasAnyPermission, permission]);

  if (!permission || permissions.length === 0) {
    return (
      <Link className={className} onClick={onClick} {...rest}>
        {children}
      </Link>
    );
  }

  if (isLoading) {
    return (
      <span className={cn("opacity-50 pointer-events-none", className)}>
        {children}
      </span>
    );
  }

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

  const handleDisabledClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    
    if (showDenyToast) {
      toast.error(denyMessage);
    }
    
    return false;
  };

  return (
    <div
      className={cn(
        "opacity-50 cursor-not-allowed inline-flex",
        className
      )}
      onClick={handleDisabledClick}
      onClickCapture={handleDisabledClick}
      role="link"
      aria-disabled="true"
      style={{ pointerEvents: 'auto' }}
    >
      {fallback || children}
    </div>
  );
};

