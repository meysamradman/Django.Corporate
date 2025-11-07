"use client";

import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/elements/Avatar";
import { Checkbox } from "@/components/elements/Checkbox";
import { Star, Paperclip } from "lucide-react";
import { cn } from "@/core/utils/cn";
import { EmailMessage } from "@/api/email/route";

interface EmailItemProps {
  email: EmailMessage;
  isSelected: boolean;
  onSelect: (emailId: number) => void;
  onClick?: (email: EmailMessage) => void;
}

export function EmailItem({ email, isSelected, onSelect, onClick }: EmailItemProps) {
  const getInitials = (name: string, email?: string, source?: string) => {
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

  const getDisplayName = (name: string, emailAddr: string, source: string, sourceDisplay?: string) => {
    if (name && name.trim()) {
      return name;
    }
    if (emailAddr) {
      return emailAddr.split("@")[0];
    }
    return sourceDisplay || source;
  };

  const getAvatarColor = (text: string) => {
    const colors = [
      "bg-green-500",
      "bg-blue-500",
      "bg-purple-500",
      "bg-red-500",
      "bg-orange-500",
      "bg-pink-500",
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
        "flex items-center gap-4 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer",
        isSelected && "bg-muted"
      )}
      onClick={() => onClick?.(email)}
    >
      {/* Checkbox */}
      <div onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelect(email.id)}
          aria-label="انتخاب ایمیل"
        />
      </div>

      {/* Star */}
      <Star
        className={cn(
          "size-4 shrink-0 cursor-pointer",
          email.status === "read" ? "text-muted-foreground fill-none" : "text-orange-500 fill-orange-500"
        )}
      />

      {/* Avatar */}
      <Avatar className="size-10 shrink-0">
        <AvatarImage 
          src={undefined}
          alt={displayName}
          className="object-cover"
        />
        <AvatarFallback className={cn("text-white text-xs", getAvatarColor(avatarText))}>
          {getInitials(email.name, email.email, email.source)}
        </AvatarFallback>
      </Avatar>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <div
            className={cn(
              "size-2 rounded-full shrink-0",
              email.status === "new" && "bg-red-500",
              email.status === "read" && "bg-blue-500",
              email.status === "replied" && "bg-green-500",
              email.status === "draft" && "bg-orange-500"
            )}
          />
          <span className="font-semibold text-sm text-foreground truncate cursor-pointer">
            {displayName}
          </span>
          {email.has_attachments && (
            <Paperclip className="size-3.5 text-muted-foreground shrink-0 cursor-pointer" />
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground truncate cursor-pointer">
            {email.subject}
          </span>
          <span className="text-xs text-muted-foreground truncate cursor-pointer">
            - {email.message.substring(0, 50)}...
          </span>
        </div>
      </div>

      {/* Date */}
      <div className="text-xs text-muted-foreground shrink-0 cursor-pointer">
        {formatDate(email.created_at)}
      </div>
    </div>
  );
}

