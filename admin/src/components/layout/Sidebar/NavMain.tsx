"use client";

import Link from "next/link";
import { MenuGroup, MenuItem } from "@/components/layout/Sidebar/SidebarMenu";
import {
  CustomTooltipProvider,
  CustomTooltip,
  CustomTooltipTrigger,
  CustomTooltipContent,
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
    <CustomTooltipProvider>
      <div className="flex flex-col space-y-2 p-2">
        {allItems.map((item) => {
          const isActive = isItemActive(item);
          const hasSubMenus = item.items && item.items.length > 0;
          const hasDirectUrl = item.url && !hasSubMenus;
          
          const iconElement = item.icon && (
            <item.icon className={cn(
              "h-5 w-5 transition-colors",
              isActive 
                ? "stroke-primary" 
                : "stroke-sdb-ic group-hover:stroke-primary"
            )} />
          );
          
          const buttonClasses = cn(
            "w-10 h-10 flex items-center justify-center rounded-md transition-colors group",
            item.disabled 
              ? "cursor-not-allowed opacity-50" 
              : "cursor-pointer",
            isActive 
              ? "bg-sdb-hover text-primary" 
              : !item.disabled && "hover:bg-sdb-hover hover:text-primary"
          );
          
          return (
            <CustomTooltip key={item.title}>
              <CustomTooltipTrigger asChild>
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
              </CustomTooltipTrigger>
              <CustomTooltipContent side="left">
                <p>{item.title}</p>
              </CustomTooltipContent>
            </CustomTooltip>
          );
        })}
      </div>
    </CustomTooltipProvider>
  );
}
