/**
 * رنگ‌های استاندارد وضعیت ایمیل:
 * - جدید: red
 * - خوانده شده: blue
 * - پاسخ داده شده: green
 * - پیش‌نویس: orange
 */
"use client";

import React from "react";
import { Button } from "@/components/elements/Button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/elements/Avatar";
import { Badge } from "@/components/elements/Badge";
import { Mail, Calendar, Phone, Globe, Smartphone, Code, Reply, Trash2, Paperclip, Download, Send, Star } from "lucide-react";
import { cn } from "@/core/utils/cn";
import { EmailMessage } from "@/api/email/route";
import { MailboxType } from "./types";

interface EmailDetailViewProps {
  email: EmailMessage | null;
  onReply?: (email: EmailMessage) => void;
  onDelete?: (email: EmailMessage) => void;
  onPublish?: (email: EmailMessage) => void;
  onToggleStar?: (email: EmailMessage) => void;
  mailbox?: MailboxType;
}

export function EmailDetailView({
  email,
  onReply,
  onDelete,
  onPublish,
  onToggleStar,
  mailbox = "inbox",
}: EmailDetailViewProps) {
  if (!email) return null;

  const getInitials = (name: string, emailAddr?: string, source?: string) => {
    if (name && name.trim()) {
      const words = name.trim().split(" ");
      if (words.length >= 2) {
        return `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase();
      }
      return name.charAt(0).toUpperCase();
    }
    if (emailAddr) {
      return emailAddr.charAt(0).toUpperCase();
    }
    if (source) {
      return source.charAt(0).toUpperCase();
    }
    return "?";
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

  const getDisplayName = (name: string, emailAddr: string, source: string, sourceDisplay?: string) => {
    if (name && name.trim()) {
      return name;
    }
    if (emailAddr) {
      return emailAddr.split("@")[0];
    }
    return sourceDisplay || source;
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "website":
        return <Globe className="size-4" />;
      case "mobile_app":
        return <Smartphone className="size-4" />;
      case "api":
        return <Code className="size-4" />;
      case "email":
        return <Mail className="size-4" />;
      default:
        return <Mail className="size-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const displayName = getDisplayName(email.name, email.email, email.source, email.source_display);
  const avatarText = email.name || email.email || email.source;

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-card">
      {/* Header */}
      <div className="border-b p-4 flex-shrink-0">
        <div className="flex items-center gap-4 mb-4">
          <Avatar className="size-12 shrink-0">
            <AvatarImage 
              src={undefined}
              alt={displayName}
              className="object-cover"
            />
            <AvatarFallback className={cn("text-static-w text-sm", getAvatarColor(avatarText))}>
              {getInitials(email.name, email.email, email.source)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-lg">{displayName}</span>
              {mailbox !== "sent" && (
                <Badge
                  variant={
                    email.status === "new"
                      ? "red"
                      : email.status === "read"
                      ? "blue"
                      : email.status === "replied"
                      ? "green"
                      : email.status === "draft"
                      ? "orange"
                      : "gray"
                  }
                >
                  {email.status_display}
                </Badge>
              )}
              {mailbox === "sent" && (
                <Badge variant="green">
                  ارسال شده
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 flex-wrap text-base">
              <div className="flex items-center gap-1.5 text-font-p">
                <Mail className="size-4 shrink-0" />
                <span>{email.email}</span>
              </div>
              {email.phone && (
                <div className="flex items-center gap-1.5 text-font-p">
                  <Phone className="size-4 shrink-0" />
                  <span>{email.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-font-s">
                {getSourceIcon(email.source)}
                <span>{email.source_display}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-xl font-bold">{email.subject}</h2>
          <div className="flex items-center gap-1.5 text-base text-font-s">
            <Calendar className="size-4" />
            <span>{formatDate(email.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Attachments */}
        {email.has_attachments && email.attachments && email.attachments.length > 0 && (
          <div className="border-b pb-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Paperclip className="size-4 text-font-s" />
              <span className="text-sm font-semibold">پیوست‌ها ({email.attachments.length})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {email.attachments.map((attachment) => (
                <Button
                  key={attachment.id}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Download className="size-3.5" />
                  <span className="text-xs">{attachment.filename}</span>
                  <span className="text-xs text-font-s">({attachment.file_size_formatted})</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Message Content */}
        <div className="mb-4">
          <div className="prose prose-sm max-w-none">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{email.message}</p>
          </div>
        </div>

        {/* Reply Section */}
        {email.reply_message && (
          <div className="border-t pt-4 mt-4">
            <div className="bg-bg/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Reply className="size-4 text-primary" />
                <span className="font-semibold text-sm">پاسخ ادمین</span>
                {email.replied_at && (
                  <span className="text-xs text-font-s">
                    {formatDate(email.replied_at)}
                  </span>
                )}
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{email.reply_message}</p>
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="border-t pt-4 mt-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-font-s">شناسه:</span>
              <span className="mr-2 font-mono">{email.public_id}</span>
            </div>
            {email.ip_address && (
              <div>
                <span className="text-font-s">IP:</span>
                <span className="mr-2">{email.ip_address}</span>
              </div>
            )}
            {email.read_at && mailbox !== "sent" && (
              <div>
                <span className="text-font-s">خوانده شده در:</span>
                <span className="mr-2">{formatDate(email.read_at)}</span>
              </div>
            )}
            {mailbox === "sent" && email.created_at && (
              <div>
                <span className="text-font-s">ارسال شده در:</span>
                <span className="mr-2">{formatDate(email.created_at)}</span>
              </div>
            )}
            {email.replied_at && (
              <div>
                <span className="text-font-s">پاسخ داده شده در:</span>
                <span className="mr-2">{formatDate(email.replied_at)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="border-t px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          {onToggleStar && mailbox !== "spam" && mailbox !== "trash" && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onToggleStar(email)}
              className={email.is_starred 
                ? "bg-amber text-amber-1 border-amber-1 hover:bg-amber/90" 
                : "border-amber-1 text-amber-1 hover:bg-amber/10"
              }
            >
              <Star className={cn("size-4", email.is_starred && "fill-amber-1")} />
              {email.is_starred ? "حذف ستاره" : "ستاره‌دار"}
            </Button>
          )}
          {mailbox === "draft" && onPublish && (
            <Button variant="default" size="sm" onClick={() => onPublish(email)}>
              <Send className="size-4" />
              منتشر کردن
            </Button>
          )}
          {mailbox !== "draft" && onReply && (
            <Button variant="default" size="sm" onClick={() => onReply(email)}>
              <Reply className="size-4" />
              پاسخ
            </Button>
          )}
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => onDelete?.(email)}
            className="!bg-red-1 hover:!bg-red-2 !text-static-w border-0"
          >
            <Trash2 className="size-4" />
            حذف
          </Button>
        </div>
      </div>
    </div>
  );
}
