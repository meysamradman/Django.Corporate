"use client";

import {
  Menu,
  PanelRight,
} from "lucide-react";
import { Button } from "@/components/elements/Button";
import { Breadcrumb } from "@/components/layout/Breadcrumb/Breadcrumb";
import { Notifications } from "@/components/layout/Header/Notifications";
import { DarkMode } from "@/components/theme/DarkMode";
import { cn } from "@/core/utils/cn";


interface HeaderProps {
  onMenuClick: () => void;
  isContentCollapsed?: boolean;
  onContentToggle?: () => void;
  hasSubMenu?: boolean;
}

export function Header({ onMenuClick, isContentCollapsed, onContentToggle, hasSubMenu }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 min-h-16 items-center justify-between gap-4 border-b bg-header px-4 sm:px-6">
      {/* Left side: Toggles + Breadcrumb (grows) */}
      <div className="flex flex-1 items-center gap-2 min-w-0 sm:gap-4">
        {/* Mobile Menu Toggle */}
        <Button
          variant="outline"
          size="icon"
          onClick={onMenuClick}
          className="lg:hidden shrink-0"
          aria-label="باز کردن منو"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Desktop Sidebar Toggle */}
        {onContentToggle && (
          <button
            onClick={() => hasSubMenu && onContentToggle()}
            className={cn(
              "hidden lg:flex items-center justify-center w-8 h-8 rounded-md hover:bg-bg transition-colors focus:outline-none focus:ring-2 focus:ring-ring",
              !hasSubMenu && "cursor-not-allowed opacity-50"
            )}
            aria-label={
              isContentCollapsed ? "گسترش سایدبار" : "جمع کردن سایدبار"
            }
            disabled={!hasSubMenu}
          >
            <PanelRight className="h-5 w-5" />
          </button>
        )}
        
        {/* Breadcrumb container - hidden on mobile */}
        <div className="hidden flex-1 min-w-0 lg:block">
          <Breadcrumb />
        </div>
      </div>

      {/* Right side: Actions (fixed size) */}
      <div className="flex items-center gap-1 sm:gap-2">
        <DarkMode />
        <Notifications />
      </div>
    </header>
  );
}
