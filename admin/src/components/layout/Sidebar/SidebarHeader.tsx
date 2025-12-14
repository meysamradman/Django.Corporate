"use client";

import { MenuItem } from "@/components/layout/Sidebar/SidebarMenu";

interface SidebarHeaderProps {
  selectedItem?: MenuItem | null;
}

export function SidebarHeader({ 
  selectedItem
}: SidebarHeaderProps) {
  const title = selectedItem?.title || '';

  return (
    <div className="relative flex h-16 items-center justify-between px-4 border-b">
      <div className="flex-1 text-right">
        {title && (
          <h1 className="text-lg font-semibold text-font-p">
            {title}
          </h1>
        )}
      </div>
    </div>
  );
}
