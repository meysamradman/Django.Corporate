"use client";

import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/elements/Avatar";
import { Checkbox } from "@/components/elements/Checkbox";
import { Star, Paperclip } from "lucide-react";
import { cn } from "@/core/utils/cn";
import { EmailMessage } from "@/types/email/emailMessage";

interface EmailItemProps {
  email: EmailMessage;
  isSelected: boolean;
  onSelect: (emailId: number) => void;
  onClick?: (email: EmailMessage) => void;
  onToggleStar?: (email: EmailMessage) => void;
}

export function EmailItem({ email, isSelected, onSelect, onClick, onToggleStar }: EmailItemProps) {
  const getInitials = (name?: string | null, email?: string | null, source?: string | null) => {
    if (name && name.trim()) {
      const words = name.trim().split(" ");
      if (words.length >= 2) {
        return `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase();
      }
      return name.charAt(0).toUpperCase();
    }
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    if (source) {
      return source.charAt(0).toUpperCase();
    }
    return "?";
  };

  const getDisplayName = (name?: string | null, emailAddr?: string | null, source?: string | null, sourceDisplay?: string | null) => {
    if (name && name.trim()) {
      return name;
    }
    if (emailAddr) {
      return emailAddr.split("@")[0];
    }
    return sourceDisplay || source || '???';
  };

  const getAvatarColor = (text: string) => {
    const colors = [
      "bg-green-1",
      "bg-blue-1",
      "bg-purple-1",
      "bg-red-1",
      "bg-orange-1",
      "bg-pink-1",
    ];
    const index = text.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const displayName = getDisplayName(email.name, email.email, email.source, email.source_display);
  const avatarText = email.name || email.email || email.source;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
    } else if (days === 1) {
      return "دیروز";
    } else if (days < 7) {
      return `${days} روز پیش`;
    } else {
      return date.toLocaleDateString("fa-IR", { month: "long", day: "numeric" });
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-4 px-4 py-3 hover:bg-bg/50 transition-colors cursor-pointer",
        isSelected && "bg-bg"
      )}
      onClick={() => onClick?.(email)}
    >
      <div onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelect(email.id)}
          aria-label="انتخاب ایمیل"
        />
      </div>

      <Star
        className={cn(
          "size-4 shrink-0 transition-colors",
          email.is_starred 
            ? "text-amber-1 fill-amber-1" 
            : "text-font-s fill-none",
          onToggleStar ? "cursor-pointer hover:text-amber-1" : "cursor-default"
        )}
        onClick={onToggleStar ? (e) => {
          e.stopPropagation();
          onToggleStar(email);
        } : undefined}
      />

      <Avatar className="size-10 shrink-0">
        <AvatarImage 
          src={undefined}
          alt={displayName}
          className="object-cover"
        />
        <AvatarFallback className={cn("text-static-w text-xs", getAvatarColor(avatarText))}>
          {getInitials(email.name, email.email, email.source)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <div
            className={cn(
              "size-2 rounded-full shrink-0",
              email.status === "new" && "bg-red-1",
              email.status === "read" && "bg-blue-1",
              email.status === "replied" && "bg-green-1",
              email.status === "draft" && "bg-orange-1"
            )}
          />
          <span className="font-semibold text-sm text-font-p truncate cursor-pointer">
            {displayName}
          </span>
          {email.has_attachments && (
            <Paperclip className="size-3.5 text-font-s shrink-0 cursor-pointer" />
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-font-s truncate cursor-pointer">
            {email.subject || 'بدون موضوع'}
          </span>
          {email.message && (
            <span className="text-xs text-font-s truncate cursor-pointer">
              - {email.message.substring(0, 50)}...
            </span>
          )}
        </div>
      </div>

      <div className="text-xs text-font-s shrink-0 cursor-pointer">
        {formatDate(email.created_at)}
      </div>
    </div>
  );
}

