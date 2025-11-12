"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/core/utils/cn";
import { MenuItem } from "@/components/layout/Sidebar/SidebarMenu";
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
  
  // Get title for selected section
  const getTitle = () => {
    if (!selectedItem) return '';
    return selectedItem.title;
  };
  
  const title = getTitle();

  return (
    <div className="relative flex h-16 items-center justify-between px-4 border-b border-br">
      {/* Section Title - positioned based on RTL */}
      <div className={cn(
        "flex-1",
        "text-right"
      )}>
        {title && (
        <h1 className="text-lg font-semibold text-font-p">
          {title}
        </h1>
        )}
      </div>

      {/* Toggle Button - در لبه header */}
      {onContentToggle && (
        <div className={cn(
          "absolute top-1/2 -translate-y-1/2 z-50",
          "-left-3"
        )}>
          <button
            onClick={onContentToggle}
            className={cn(
              "flex items-center justify-center w-6 h-6 rounded-full",
              "bg-sidebar border border-br shadow-xl",
              "hover:bg-sidebar-accent transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-ring"
            )}
            aria-label={isContentCollapsed ? 
              "گسترش محتوا" : 
              "جمع کردن محتوا"
            }
          >
            {isContentCollapsed ? (
              <ChevronLeft className="h-3 w-3 text-sidebar-foreground" />
            ) : (
              <ChevronRight className="h-3 w-3 text-sidebar-foreground" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
