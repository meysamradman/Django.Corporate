import React from 'react';
import { cn } from '@/core/utils/cn';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isContentCollapsed?: boolean;
  onContentToggle?: () => void;
}

export function Sidebar({ isOpen, onToggle, isContentCollapsed = false }: SidebarProps) {
  const sidebarClasses = cn(
    "fixed lg:static inset-y-0 right-0 z-50",
    "bg-sdb border-l",
    "transition-transform duration-300 ease-in-out",
    "lg:translate-x-0",
    isOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0",
    isContentCollapsed ? "w-14" : "w-80"
  );

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden bg-black/50"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}
      <aside className={sidebarClasses}>
        <div className="h-full flex flex-col">
          <div className="h-16 flex items-center justify-center border-b">
            <span className="text-lg font-bold text-sdb-menu-txt">Logo</span>
          </div>
          <nav className="flex-1 overflow-y-auto p-2">
            {/* Menu items will be added later */}
          </nav>
        </div>
      </aside>
    </>
  );
}

