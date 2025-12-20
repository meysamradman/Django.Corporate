import type { MenuGroup, MenuItem } from '@/types/shared/menu';
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/elements/Tooltip';
import { useLocation } from 'react-router-dom';
import { cn } from '@/core/utils/cn';
import { useCallback } from 'react';

interface NavMainProps {
  groups: MenuGroup[];
  onIconClick?: (item: MenuItem) => void;
}

export function NavMain({ groups, onIconClick }: NavMainProps) {
  const location = useLocation();
  const pathname = location.pathname;

  const isItemActive = useCallback((item: MenuItem): boolean => {
    if (item.url === pathname) return true;

    if (item.items) {
      return item.items.some(subItem => subItem.url === pathname);
    }

    return false;
  }, [pathname]);

  const handleItemClick = useCallback((item: MenuItem) => {
    if (!item.disabled && onIconClick) {
      onIconClick(item);
    }
  }, [onIconClick]);

  return (
    <TooltipProvider>
      <div className="flex flex-col space-y-2 p-2">
        {groups.map((group) => (
          <div key={group.title}>
            <div className="space-y-2">
              {group.items.map((item) => {
                const isActive = isItemActive(item);

                const iconElement = item.icon && (
                  <item.icon
                    className={cn(
                      "h-5 w-5 transition-colors",
                      isActive
                        ? "text-primary"
                        : "text-sdb-ic group-hover:text-primary"
                    )}
                  />
                );

                const buttonClasses = cn(
                  "relative w-10 h-10 flex items-center justify-center rounded-md transition-colors group",
                  item.disabled && "cursor-not-allowed opacity-50",
                  !item.disabled && "cursor-pointer",
                  item.state === "readOnly" && "border border-amber-1",
                  item.state === "limited" && "border border-blue-1",
                  item.state === "locked" && "border border-gray-1",
                  !item.state &&
                  (isActive
                    ? "bg-sdb-hv text-primary"
                    : "text-sdb-menu-txt hover:bg-sdb-hv hover:text-primary")
                );

                return (
                  <Tooltip key={item.title}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleItemClick(item)}
                        className={buttonClasses}
                        aria-label={item.title}
                        disabled={item.disabled}
                      >
                        {iconElement}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      <p>{item.title}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </TooltipProvider>
  );
}

