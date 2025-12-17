import React from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/elements/Button';
import { cn } from '@/core/utils/cn';

interface HeaderProps {
  onMenuClick: () => void;
  isContentCollapsed?: boolean;
  onContentToggle?: () => void;
}

export function Header({ onMenuClick, isContentCollapsed = false, onContentToggle }: HeaderProps) {
  return (
    <header className="h-16 border-b bg-header flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold text-font-p">پنل مدیریت</h1>
      </div>
      <div className="flex items-center gap-2">
        {/* Header actions will be added later */}
      </div>
    </header>
  );
}

