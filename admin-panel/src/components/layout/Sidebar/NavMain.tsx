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
  selectedItem?: MenuItem | null;
}

export function NavMain({ groups, onIconClick, selectedItem }: NavMainProps) {
  const location = useLocation();
  const pathname = location.pathname;

  const isItemActive = useCallback((item: MenuItem): boolean => {
    if (selectedItem) {
      const selectedUrl = 'url' in selectedItem ? selectedItem.url : undefined;
      const itemUrl = 'url' in item ? item.url : undefined;
      return selectedItem.title === item.title && selectedUrl === itemUrl;
    }

    if ('url' in item && item.url === pathname) return true;

    if ('items' in item && item.items) {
      return item.items.some(subItem => subItem.url === pathname);
    }

    return false;
  }, [pathname, selectedItem]);

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

                const buttonClasses = cn(
                  "inline-flex items-center justify-center h-9 w-9 rounded-lg transition-colors cursor-pointer group",
                  item.disabled && "cursor-not-allowed opacity-50",
                  item.state === "readOnly" && "outline outline-1 outline-amber-1",
                  item.state === "limited" && "outline outline-1 outline-blue-1",
                  item.state === "locked" && "outline outline-1 outline-gray-1",
                  isActive
                    ? "bg-blue text-blue-1"
                    : "bg-transparent text-sdb-ic hover:bg-sdb-hv hover:text-blue-1"
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
                        {item.icon && <item.icon size={22} />}
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

