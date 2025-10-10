"use client";

import Link from "next/link";
import { cn } from "@/core/utils/cn";
import { MenuItem } from "@/components/layout/Sidebar/SidebarMenu";
import { usePathname } from "next/navigation";

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
  
  // بررسی اینکه آیا این آیتم active است یا نه
  const isCurrentActive = item.url === pathname;

  const baseClasses = cn(
    "block px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap",
    "text-right"
  );

  const interactiveClasses = cn(
    "hover:bg-sdb-hover hover:text-primary",
    isCurrentActive 
      ? "bg-sdb-hover text-primary" 
      : "text-sdb-menu-txt"
  );

  const titleClasses = cn("text-sdb-menu-title font-semibold text-xs");

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

  return (
    <Link
      key={item.title}
      href={item.url || "#"}
      className={cn(baseClasses, interactiveClasses)}
      onClick={() => onItemClick(item.title)}
    >
      {item.title}
    </Link>
  );
} 