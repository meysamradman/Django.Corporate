import { useState } from "react";
import { Button } from "@/components/elements/Button";
import { ProtectedButton } from "@/core/permissions";
import { cn } from "@/core/utils/cn";
import type { LucideIcon } from "lucide-react";

export interface FloatingAction {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: "default" | "outline" | "destructive";
  permission?: string;
  className?: string;
}

export interface FloatingActionsProps {
  actions: FloatingAction[];
  position?: "left" | "right";
  className?: string;
}

export function FloatingActions({ 
  actions, 
  position = "left",
  className 
}: FloatingActionsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (actions.length === 0) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 sm:bottom-6 z-50 flex flex-col gap-3 transition-all duration-300 ease-out",
        position === "left" ? "left-4 sm:left-6" : "right-4 sm:right-6",
        className
      )}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {actions.map((action, index) => {
        const Icon = action.icon;
        const button = action.permission ? (
          <ProtectedButton
            key={index}
            permission={action.permission}
            variant={action.variant || "default"}
            onClick={action.onClick}
            className={cn(
              "transition-all duration-300 ease-in-out shadow-md hover:shadow-xl rounded-md",
              isExpanded 
                ? "h-9 px-4 py-2 gap-2" 
                : "w-12 h-12 p-0",
              action.className
            )}
          >
            <Icon className="w-5 h-5 shrink-0" />
            {isExpanded && (
              <span className="whitespace-nowrap">
                {action.label}
              </span>
            )}
          </ProtectedButton>
        ) : (
          <Button
            key={index}
            variant={action.variant || "default"}
            onClick={action.onClick}
            className={cn(
              "transition-all duration-300 ease-in-out shadow-md hover:shadow-xl rounded-md",
              isExpanded 
                ? "h-9 px-4 py-2 gap-2" 
                : "w-12 h-12 p-0",
              action.className
            )}
          >
            <Icon className="w-5 h-5 shrink-0" />
            {isExpanded && (
              <span className="whitespace-nowrap">
                {action.label}
              </span>
            )}
          </Button>
        );

        return button;
      })}
    </div>
  );
}

