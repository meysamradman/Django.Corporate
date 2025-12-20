import { PanelRight } from "lucide-react";
import { cn } from "@/core/utils/cn";
import type { MenuItem } from '@/types/shared/menu';

interface SidebarHeaderProps {
  selectedItem?: MenuItem | null;
  isContentCollapsed?: boolean;
  onContentToggle?: () => void;
}

export function SidebarHeader({ 
  selectedItem,
  isContentCollapsed = false,
  onContentToggle
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
      {onContentToggle && (
        <button
          onClick={() => onContentToggle()}
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-md",
            "hover:bg-sdb-hv text-sdb-menu-txt hover:text-primary",
            "transition-colors duration-200",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "shrink-0"
          )}
          aria-label={
            isContentCollapsed ? "گسترش سایدبار" : "جمع کردن سایدبار"
          }
        >
          <PanelRight className={cn(
            "h-5 w-5 transition-transform duration-200",
            isContentCollapsed && "rotate-180"
          )} />
        </button>
      )}
    </div>
  );
}

