import { Menu, PanelLeft } from "lucide-react";
import { Button } from "@/components/elements/Button";
import { Breadcrumb } from "@/components/layout/Breadcrumb/Breadcrumb";
import { Notifications } from "@/components/layout/Header/Notifications";
import { DarkMode } from "@/components/theme/DarkMode";
import { AIChatButton } from "@/components/layout/Header/AIChatButton";
import { ActiveProvidersBar } from "@/components/layout/Header/ActiveProvidersBar";
import { cn } from "@/core/utils/cn";

interface HeaderProps {
  onMenuClick: () => void;
  isContentCollapsed?: boolean;
  onContentToggle?: () => void;
}

export function Header({ onMenuClick, isContentCollapsed = false, onContentToggle }: HeaderProps) {
  return (
    <header className="flex h-16 min-h-16 items-center justify-between gap-2 sm:gap-4 border-b bg-header px-2 sm:px-4 lg:px-6 shrink-0">
      <div className="flex flex-1 items-center gap-2 min-w-0 sm:gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={onMenuClick}
          className="lg:hidden shrink-0 border-none bg-transparent shadow-none hover:bg-transparent cursor-pointer"
          aria-label="باز کردن منو"
        >
          <Menu />
        </Button>

        {isContentCollapsed && onContentToggle && (
          <button
            onClick={() => onContentToggle()}
            className={cn(
              "hidden lg:flex items-center justify-center w-8 h-8 rounded-md",
              "hover:bg-bg transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-ring"
            )}
            aria-label="گسترش سایدبار"
          >
            <PanelLeft className="rotate-180 transition-transform duration-200" />
          </button>
        )}
        
        <div className="hidden flex-1 min-w-0 lg:flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <Breadcrumb />
          </div>
          <div className="shrink-0">
            <ActiveProvidersBar />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-0.5 sm:gap-1 md:gap-2 shrink-0 min-w-0">
        <div className="shrink-0">
          <AIChatButton />
        </div>
        <div className="shrink-0">
          <DarkMode />
        </div>
        <div className="shrink-0">
          <Notifications />
        </div>
      </div>
    </header>
  );
}

