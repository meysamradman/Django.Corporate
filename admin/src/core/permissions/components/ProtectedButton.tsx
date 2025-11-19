'use client';

import React, { useMemo } from 'react';
import { usePermission } from '../context/PermissionContext';
import { Button } from '@/components/elements/Button';
import { cn } from '@/core/utils/cn';
import { toast } from '@/components/elements/Sonner';

interface Props extends React.ComponentProps<typeof Button> {
  permission: string | string[];
  requireAll?: boolean;
  showDenyToast?: boolean;
  denyMessage?: string;
}

/**
 * ✅ Protected Button component with permission check
 * 🔥 Optimized: Uses memoized permission checks from Context (cached for 5 minutes)
 * @example
 * <ProtectedButton
 *   permission="media.upload"
 *   onClick={handleUpload}
 *   showDenyToast
 * >
 *   آپلود رسانه
 * </ProtectedButton>
 */
export const ProtectedButton: React.FC<Props> = ({
  permission,
  requireAll = false,
  showDenyToast = true,
  denyMessage = 'شما دسترسی لازم برای این عملیات را ندارید',
  onClick,
  children,
  className,
  ...rest
}) => {
  const { permissionMap, isLoading } = usePermission();

  // Fast permission check using cached Set (no function calls)
  const hasAccess = useMemo(() => {
    if (isLoading || !permissionMap) return false;
    
    // Super admin bypass
    if (permissionMap.is_superadmin) return true;
    
    // Direct Set lookup (O(1) - fastest)
    const permissions = Array.isArray(permission) ? permission : [permission];
    const permSet = new Set(permissionMap.user_permissions || []);
    
    if (requireAll) {
      return permissions.every(p => permSet.has(p));
    }
    return permissions.some(p => permSet.has(p));
  }, [isLoading, permissionMap, permission, requireAll]);

  const isDisabled = isLoading || !hasAccess;

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    if (!hasAccess) {
      e.preventDefault();
      e.stopPropagation();

      if (showDenyToast) {
        toast.error(denyMessage);
      }
      return;
    }

    onClick?.(e);
  };

  return (
    <Button
      {...rest}
      onClick={handleClick}
      className={cn(className)}
      disabled={isDisabled}
      aria-disabled={isDisabled}
    >
      {children}
    </Button>
  );
};

export default ProtectedButton;


