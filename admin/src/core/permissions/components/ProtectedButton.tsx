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
  showDenyToast = false, // ✅ FIX: Default to false - disable is better than toast
  denyMessage = 'شما دسترسی لازم برای این عملیات را ندارید',
  onClick,
  children,
  className,
  asChild,
  ...rest
}) => {
  const { hasPermission, hasAllPermissions, hasAnyPermission, isLoading } = usePermission();

  // ✅ FIX: Use hasPermission function which checks wildcards, manage, and synonyms
  const hasAccess = useMemo(() => {
    if (isLoading) return false;
    
    const permissions = Array.isArray(permission) ? permission : [permission];
    
    if (requireAll) {
      return hasAllPermissions(permissions);
    }
    return hasAnyPermission(permissions);
  }, [isLoading, hasPermission, hasAllPermissions, hasAnyPermission, permission, requireAll]);

  const isDisabled = isLoading || !hasAccess;

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    if (!hasAccess) {
      e.preventDefault();
      e.stopPropagation();
      // ✅ FIX: Show toast only if showDenyToast is true
      if (showDenyToast) {
        toast.error(denyMessage);
      }
      return;
    }

    onClick?.(e);
  };

  // اگر asChild هست و دسترسی نداره، محتوای Link رو extract کنیم
  if (asChild && !hasAccess) {
    // Extract children from Link component
    let linkChildren = children;
    if (React.isValidElement(children)) {
      linkChildren = (children.props as any).children;
    }

    return (
      <Button
        {...rest}
        asChild={false}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (showDenyToast) {
            toast.error(denyMessage);
          }
        }}
        className={cn(className)}
        disabled={true}
        aria-disabled={true}
      >
        {linkChildren}
      </Button>
    );
  }

  return (
    <Button
      {...rest}
      asChild={asChild}
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


