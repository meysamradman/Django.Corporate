"use client";

import React from "react";
import { Button } from "@/components/elements/Button";
import { Badge } from "@/components/elements/Badge";
import { Send, FileEdit, Star, AlertCircle, Trash2, Inbox as InboxIcon } from "lucide-react";
import { cn } from "@/core/utils/cn";
import { MailboxType, MailboxItem } from "./types";

interface EmailSidebarProps {
  selectedMailbox: MailboxType;
  onMailboxChange: (mailbox: MailboxType) => void;
  onComposeClick: () => void;
  mailboxCounts?: {
    inbox?: number;
    sent?: number;
    draft?: number;
    starred?: number;
    spam?: number;
    trash?: number;
  };
}

const getMailboxes = (counts?: EmailSidebarProps['mailboxCounts']): MailboxItem[] => [
  { id: "inbox", label: "صندوق ورودی", icon: <InboxIcon className="size-4" />, count: counts?.inbox },
  { id: "sent", label: "ارسال شده", icon: <Send className="size-4" />, count: counts?.sent },
  { id: "draft", label: "پیش‌نویس", icon: <FileEdit className="size-4" />, count: counts?.draft },
  { id: "starred", label: "ستاره‌دار", icon: <Star className="size-4" />, count: counts?.starred },
  { id: "spam", label: "هرزنامه", icon: <AlertCircle className="size-4" />, count: counts?.spam },
  { id: "trash", label: "سطل زباله", icon: <Trash2 className="size-4" />, count: counts?.trash },
];


export function EmailSidebar({ selectedMailbox, onMailboxChange, onComposeClick, mailboxCounts }: EmailSidebarProps) {
  const mailboxes = getMailboxes(mailboxCounts);
  
  return (
    <aside className="w-full flex flex-col h-full overflow-hidden">
      {/* Compose Button */}
      <div className="p-4 border-b border-border flex-shrink-0">
        <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm" onClick={onComposeClick}>
          <span>ایجاد ایمیل</span>
        </Button>
      </div>

      {/* Mailboxes */}
      <nav className="flex-1 overflow-y-auto min-h-0">
        {mailboxes.map((mailbox) => {
          const getMailboxColors = (id: string, isSelected: boolean) => {
            if (isSelected) {
              switch (id) {
                case "inbox":
                  return {
                    bg: "bg-primary/10",
                    text: "text-primary",
                    border: "bg-primary",
                    icon: "text-primary",
                  };
                case "sent":
                  return {
                    bg: "bg-green-500/10",
                    text: "text-green-600",
                    border: "bg-green-500",
                    icon: "text-green-600",
                  };
                case "draft":
                  return {
                    bg: "bg-orange-500/10",
                    text: "text-orange-600",
                    border: "bg-orange-500",
                    icon: "text-orange-600",
                  };
                case "starred":
                  return {
                    bg: "bg-amber-500/10",
                    text: "text-amber-600",
                    border: "bg-amber-500",
                    icon: "text-amber-600",
                  };
                case "spam":
                  return {
                    bg: "bg-destructive/10",
                    text: "text-destructive",
                    border: "bg-destructive",
                    icon: "text-destructive",
                  };
                case "trash":
                  return {
                    bg: "bg-muted",
                    text: "text-muted-foreground",
                    border: "bg-muted-foreground",
                    icon: "text-muted-foreground",
                  };
                default:
                  return {
                    bg: "bg-primary/10",
                    text: "text-primary",
                    border: "bg-primary",
                    icon: "text-primary",
                  };
              }
            } else {
              switch (id) {
                case "inbox":
                  return {
                    text: "text-primary",
                    icon: "text-primary",
                  };
                case "sent":
                  return {
                    text: "text-green-600",
                    icon: "text-green-600",
                  };
                case "draft":
                  return {
                    text: "text-orange-600",
                    icon: "text-orange-600",
                  };
                case "starred":
                  return {
                    text: "text-amber-600",
                    icon: "text-amber-600",
                  };
                case "spam":
                  return {
                    text: "text-destructive",
                    icon: "text-destructive",
                  };
                case "trash":
                  return {
                    text: "text-muted-foreground",
                    icon: "text-muted-foreground",
                  };
                default:
                  return {
                    text: "text-muted-foreground",
                    icon: "text-muted-foreground",
                  };
              }
            }
          };

          const colors = getMailboxColors(mailbox.id, selectedMailbox === mailbox.id);
          const isSelected = selectedMailbox === mailbox.id;

          return (
            <button
              key={mailbox.id}
              onClick={() => onMailboxChange(mailbox.id)}
              className={cn(
                "w-full flex items-center justify-between py-2.5 transition-colors relative cursor-pointer",
                mailbox.id !== mailboxes[mailboxes.length - 1].id && "mb-1",
                isSelected
                  ? `${colors.bg} ${colors.text}`
                  : `${colors.text} hover:bg-accent hover:text-accent-foreground`
              )}
            >
              {isSelected && (
                <div className={cn("absolute right-0 top-0 bottom-0 w-1", colors.border)} />
              )}
              <div className="flex items-center justify-between w-full pl-4 pr-3">
                <div className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                  <span className={cn("cursor-pointer", colors.icon)}>{mailbox.icon}</span>
                  <span className="text-sm font-medium cursor-pointer">{mailbox.label}</span>
                </div>
                {mailbox.count !== undefined && mailbox.count > 0 && (
                  <Badge
                    variant="default"
                    className={cn(
                      "text-xs px-2 py-0.5 border-0 flex-shrink-0",
                      mailbox.id === "inbox" && "bg-primary text-primary-foreground",
                      mailbox.id === "sent" && "bg-green-500 text-white",
                      mailbox.id === "draft" && "bg-orange-500 text-white",
                      mailbox.id === "starred" && "bg-amber-500 text-white",
                      mailbox.id === "spam" && "bg-destructive text-white"
                    )}
                  >
                    {mailbox.count}
                  </Badge>
                )}
              </div>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

