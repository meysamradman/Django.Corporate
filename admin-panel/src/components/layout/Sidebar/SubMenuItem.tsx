import { Link } from 'react-router-dom';
import { cn } from '@/core/utils/cn';
import type { MenuItem } from '@/types/shared/menu';
import { useLocation } from 'react-router-dom';

interface SubMenuItemProps {
  item: MenuItem;
  index: number;
  onItemClick?: (title: string) => void;
}

export function SubMenuItem({
  item,
  index,
  onItemClick,
}: SubMenuItemProps) {
  const location = useLocation();
  const pathname = location.pathname;
  
  const isCurrentActive = item.url === pathname;

  const baseClasses = cn(
    "flex items-center justify-between gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap",
    "text-right"
  );

  const interactiveClasses = cn(
    "hover:bg-sdb-hv hover:text-primary",
    isCurrentActive 
      ? "bg-sdb-hv text-primary" 
      : "text-sdb-menu-txt",
    item.disabled && "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-sdb-menu-txt"
  );

  const titleClasses = cn("text-sdb-menu-ttl font-semibold text-sm");

  if (item.isTitle) {
    return (
      <div
        key={item.title}
        className={cn(
          baseClasses,
          titleClasses,
          index > 0 && "mt-4"
        )}
      >
        {item.title}
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
        <span>{item.title}</span>
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
      <span>{item.title}</span>
    </Link>
  );
}

