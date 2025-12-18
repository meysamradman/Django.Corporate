import * as React from "react";
import { MessageCircle } from 'lucide-react';
import { useAIChat } from '@/components/ai/chat/AIChatContext';
import { useAuth } from '@/core/auth/AuthContext';

export function AIChatButton() {
  const { setIsOpen, isOpen } = useAIChat();
  const { user } = useAuth();

  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  const permissions = (user as any)?.permissions;
  const hasAIPermission = Array.isArray(permissions) 
    ? permissions.some((p: string) =>
        p === 'all' || p === 'ai.manage' || p.startsWith('ai.')
      )
    : user?.is_superuser || false;

  if (!hasAIPermission) {
    return null;
  }

  return (
    <div
      className="relative inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center cursor-pointer text-font-p hover:text-foreground transition-colors shrink-0"
      aria-label="چت با AI"
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleClick()}
    >
      <MessageCircle className="h-5 w-5" />
      <span className="absolute top-1 right-1 h-2 w-2 bg-green-1 rounded-full border border-static-w animate-pulse" />
    </div>
  );
}

