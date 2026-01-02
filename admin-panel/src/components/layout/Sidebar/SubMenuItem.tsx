import { Link } from 'react-router-dom';
import { cn } from '@/core/utils/cn';
import type { MenuItem } from '@/types/shared/menu';
import { useLocation } from 'react-router-dom';

interface SubMenuItemProps {
  item: MenuItem;
  index?: number;
  onItemClick?: (title: string) => void;
  showSeparator?: boolean;
}

export function SubMenuItem({
  item,
  index: _index,
  onItemClick,
  showSeparator = false,
}: SubMenuItemProps) {
  const location = useLocation();
  const pathname = location.pathname;

  const isCurrentActive = item.url === pathname;

  const baseClasses = cn(
    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap",
    "text-right"
  );

  const interactiveClasses = cn(
    "hover:bg-sdb-hv hover:text-primary",
    isCurrentActive
      ? "bg-sdb-hv text-primary"
      : "text-sdb-menu-txt",
    item.disabled && "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-sdb-menu-txt"
  );

  const titleClasses = cn(
    "text-sdb-menu-ttl font-semibold text-sm",
    "flex items-center w-full"
  );

  if (item.isTitle) {
    return (
      <div key={item.title} className="w-full">
        {showSeparator && (
          <div className="h-px bg-br my-3 -mx-4" />
        )}
        <div className={cn(baseClasses, titleClasses, "pt-1 pb-2")}>
          <span>{item.title}</span>
        </div>
      </div>
    );
  }

  if (item.disabled || !item.url) {
    return (
      <div
        key={item.title}
        className={cn(baseClasses, interactiveClasses)}
        aria-disabled="true"
      >
        {item.icon && (
          <item.icon className="h-4 w-4 shrink-0" />
        )}
        <span className="flex-1">{item.title}</span>
        {item.badge && (
          <span
            className={cn(
              "px-2 py-0.5 text-xs font-medium rounded border",
              item.badge.tone === "info" && "bg-blue-0 text-blue-1 border-blue-1/30",
              item.badge.tone === "warning" && "bg-amber-0 text-amber-1 border-amber-1/30",
              item.badge.tone === "muted" && "bg-gray-0 text-gray-1 border-gray-1/30"
            )}
          >
            {item.badge.label}
          </span>
        )}
      </div>
    );
  }

  return (
    <Link
      key={item.title}
      to={item.url}
      className={cn(baseClasses, interactiveClasses)}
      onClick={() => onItemClick?.(item.title)}
    >
      {item.icon && (
        <item.icon className="h-4 w-4 shrink-0" />
      )}
      <span className="flex-1">{item.title}</span>
      {item.badge && (
        <span
          className={cn(
            "px-2 py-0.5 text-xs font-medium rounded border",
            item.badge.tone === "info" && "bg-blue-0 text-blue-1 border-blue-1/30",
            item.badge.tone === "warning" && "bg-amber-0 text-amber-1 border-amber-1/30",
            item.badge.tone === "muted" && "bg-gray-0 text-gray-1 border-gray-1/30"
          )}
        >
          {item.badge.label}
        </span>
      )}
    </Link>
  );
}

