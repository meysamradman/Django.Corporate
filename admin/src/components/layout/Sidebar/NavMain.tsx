"use client";

import Link from "next/link";
import { MenuGroup, MenuItem } from "@/components/layout/Sidebar/SidebarMenu";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/elements/Tooltip";
import { usePathname } from "next/navigation";
import { cn } from "@/core/utils/cn";

interface NavMainProps {
  groups: MenuGroup[];
  onIconClick?: (item: MenuItem) => void;
  onLinkClick?: () => void;
}

export function NavMain({ groups, onIconClick, onLinkClick }: NavMainProps) {
  const pathname = usePathname();
  const allItems = groups.flatMap(group => group.items);

  const isItemActive = (item: MenuItem): boolean => {
    if (item.url === pathname) return true;

    if (item.items) {
      return item.items.some(subItem => subItem.url === pathname);
    }
    
    return false;
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col space-y-2 p-2">
        {allItems.map((item) => {
          const isActive = isItemActive(item);
          const hasSubMenus = item.items && item.items.length > 0;
          const hasDirectUrl = item.url && !hasSubMenus;
          
          const iconElement = item.icon && (
            <item.icon
              className={cn(
                "h-5 w-5 transition-colors",
                item.state === "readOnly" && "text-amber-400",
                item.state === "limited" && "text-sky-400",
                item.state === "locked" && "text-slate-400",
                !item.state &&
                  (isActive
                    ? "text-primary"
                    : "text-sdb-ic group-hover:text-primary")
              )}
            />
          );
          
          const buttonClasses = cn(
            "relative w-10 h-10 flex items-center justify-center rounded-md transition-colors group",
            item.disabled && "cursor-not-allowed opacity-50",
            !item.disabled && "cursor-pointer",
            item.state === "readOnly" && "border border-amber-400/30 text-amber-400",
            item.state === "limited" && "border border-sky-400/30 text-sky-400",
            item.state === "locked" && "border border-slate-400/30 text-slate-400",
            !item.state &&
              (isActive
                ? "bg-sdb-hv text-primary"
                : "text-sdb-menu-txt hover:bg-sdb-hv hover:text-primary")
          );
          
          return (
            <Tooltip key={item.title}>
              <TooltipTrigger asChild>
                {hasDirectUrl && !item.disabled ? (
                  <div onClick={() => {
                    onIconClick?.(item);
                    onLinkClick?.();
                  }}>
                    <Link
                      href={item.url!}
                      className={buttonClasses}
                      aria-label={item.title}
                    >
                      {iconElement}
                    </Link>
                  </div>
                ) : (
                  <button
                    onClick={() => !item.disabled && onIconClick?.(item)}
                    className={buttonClasses}
                    aria-label={item.title}
                    disabled={item.disabled}
                  >
                    {iconElement}
                  </button>
                )}
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>{item.title}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
