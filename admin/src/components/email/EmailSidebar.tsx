/**
 * رنگ‌های استاندارد صندوق‌های ایمیل:
 * - صندوق ورودی: default (blue/primary)
 * - ارسال شده: green
 * - پیش‌نویس: orange
 * - ستاره‌دار: amber
 * - هرزنامه: red
 * - سطل زباله: gray
 */
"use client";

import React from "react";
import { Button } from "@/components/elements/Button";
import ProtectedButton from "@/core/permissions/components/ProtectedButton";
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
      <div className="p-5 border-b flex-shrink-0">
        <ProtectedButton
          permission="email.create"
          variant="default"
          className="w-full" 
          onClick={onComposeClick}
          showDenyToast={false}
        >
          <span>ایجاد ایمیل</span>
        </ProtectedButton>
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
                    bg: "bg-green",
                    text: "text-green-1",
                    border: "bg-green-1",
                    icon: "text-green-1",
                  };
                case "draft":
                  return {
                    bg: "bg-orange",
                    text: "text-orange-1",
                    border: "bg-orange-1",
                    icon: "text-orange-1",
                  };
                case "starred":
                  return {
                    bg: "bg-amber",
                    text: "text-amber-1",
                    border: "bg-amber-1",
                    icon: "text-amber-1",
                  };
                case "spam":
                  return {
                    bg: "bg-red",
                    text: "text-red-1",
                    border: "bg-red-1",
                    icon: "text-red-1",
                  };
                case "trash":
                  return {
                    bg: "bg-gray",
                    text: "text-gray-1",
                    border: "bg-gray-1",
                    icon: "text-gray-1",
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
                    text: "text-green-1",
                    icon: "text-green-1",
                  };
                case "draft":
                  return {
                    text: "text-orange-1",
                    icon: "text-orange-1",
                  };
                case "starred":
                  return {
                    text: "text-amber-1",
                    icon: "text-amber-1",
                  };
                case "spam":
                  return {
                    text: "text-red-1",
                    icon: "text-red-1",
                  };
                case "trash":
                  return {
                    text: "text-gray-1",
                    icon: "text-gray-1",
                  };
                default:
                  return {
                    text: "text-font-s",
                    icon: "text-font-s",
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
                "w-full flex items-center justify-between py-4 transition-colors relative cursor-pointer",
                isSelected
                  ? `${colors.bg} ${colors.text}`
                  : `${colors.text} hover:bg-bg`
              )}
            >
              {isSelected && (
                <div className={cn("absolute right-0 top-0 bottom-0 w-1", colors.border)} />
              )}
              <div className="flex items-center justify-between w-full pl-5 pr-4">
                <div className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                  <span className={cn("cursor-pointer", colors.icon)}>{mailbox.icon}</span>
                  <span className="text-sm font-medium cursor-pointer">{mailbox.label}</span>
                </div>
                {mailbox.count !== undefined && mailbox.count > 0 && (
                  <Badge
                    variant={
                      mailbox.id === "inbox" ? "default" :
                      mailbox.id === "sent" ? "green" :
                      mailbox.id === "draft" ? "orange" :
                      mailbox.id === "starred" ? "amber" :
                      mailbox.id === "spam" ? "red" :
                      mailbox.id === "trash" ? "gray" : "default"
                    }
                    className="text-xs px-2 py-0.5 border-0 flex-shrink-0"
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

