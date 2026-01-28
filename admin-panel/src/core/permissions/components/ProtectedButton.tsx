import { useMemo, isValidElement } from 'react';
import type { ComponentProps, FC, MouseEventHandler, ReactNode } from 'react';
import { usePermission } from '../context/PermissionContext';
import { Button } from '@/components/elements/Button';
import { cn } from '@/core/utils/cn';
import { toast } from '@/core/toast';

interface Props extends ComponentProps<typeof Button> {
  permission: string | string[];
  requireAll?: boolean;
  showDenyToast?: boolean;
  denyMessage?: string;
}

export const ProtectedButton: FC<Props> = ({
  permission,
  requireAll = false,
  showDenyToast = false,
  denyMessage = 'شما دسترسی لازم برای این عملیات را ندارید',
  onClick,
  children,
  className,
  asChild,
  ...rest
}) => {
  const { hasAllPermissions, hasAnyPermission, isLoading } = usePermission();

  const hasAccess = useMemo(() => {
    if (isLoading) return false;
    
    const permissions = Array.isArray(permission) ? permission : [permission];
    
    if (requireAll) {
      return hasAllPermissions(permissions);
    }
    return hasAnyPermission(permissions);
  }, [isLoading, hasAllPermissions, hasAnyPermission, permission, requireAll]);

  const isDisabled = isLoading || !hasAccess;

  const handleClick: MouseEventHandler<HTMLButtonElement> = (e) => {
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

  if (asChild && !hasAccess) {
    let linkChildren = children;
    if (isValidElement(children)) {
      const props = children.props as { children?: ReactNode };
      if ('children' in props) {
        linkChildren = props.children;
      }
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

