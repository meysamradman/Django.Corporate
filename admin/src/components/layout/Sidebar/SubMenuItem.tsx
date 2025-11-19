"use client";

import Link from "next/link";
import { cn } from "@/core/utils/cn";
import { MenuItem, MENU_BADGE_TONES } from "@/components/layout/Sidebar/SidebarMenu";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/elements/Badge";

interface SubMenuItemProps {
  item: MenuItem;
  index: number;
  isActive: boolean;
  onItemClick: (title: string) => void;
}

export function SubMenuItem({
  item,
  index,
  isActive,
  onItemClick,
}: SubMenuItemProps) {
  const pathname = usePathname();
  
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

  const titleClasses = cn("text-sdb-menu-title font-semibold text-xs");

  const badgeElement = item.badge && (
    <span
      className={cn(
        "text-[10px] leading-none px-2 py-0.5 rounded-full border",
        MENU_BADGE_TONES[item.badge.tone] ?? ""
      )}
    >
      {item.badge.label}
    </span>
  );

  if (item.isTitle) {
    return (
      <div
        key={item.title}
        className={cn(
          baseClasses,
          titleClasses,
          "text-sdb-menu-title",
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
        {badgeElement}
      </div>
    );
  }

  return (
    <Link
      key={item.title}
      href={item.url}
      className={cn(baseClasses, interactiveClasses)}
      onClick={() => onItemClick(item.title)}
    >
      <span>{item.title}</span>
      {badgeElement}
    </Link>
  );
} 
