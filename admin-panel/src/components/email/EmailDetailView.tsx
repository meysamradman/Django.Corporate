"use client";

import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/elements/Avatar";
import { Badge } from "@/components/elements/Badge";
import { Mail, Calendar, Phone, Globe, Smartphone, Code, Reply, Trash2, Paperclip, Download, Send, Star } from "lucide-react";
import { cn } from "@/core/utils/cn";
import { EmailMessage } from "@/types/email/emailMessage";
import { MailboxType } from "./types";
import { ProtectedButton } from "@/core/permissions/components/ProtectedButton";

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

  const getInitials = (name?: string | null, emailAddr?: string | null, source?: string) => {
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

  const getDisplayName = (name?: string | null, emailAddr?: string | null, source?: string, sourceDisplay?: string) => {
    if (name && name.trim()) {
      return name;
    }
    if (emailAddr) {
      return emailAddr.split("@")[0];
    }
    return sourceDisplay || source || 'ناشناس';
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
              {email.email && (
                <div className="flex items-center gap-1.5 text-font-p">
                  <Mail className="size-4 shrink-0" />
                  <span>{email.email}</span>
                </div>
              )}
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
          <h2 className="text-xl font-bold">{email.subject || 'بدون موضوع'}</h2>
          <div className="flex items-center gap-1.5 text-base text-font-s">
            <Calendar className="size-4" />
            <span>{formatDate(email.created_at)}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {email.has_attachments && email.attachments && email.attachments.length > 0 && (
          <div className="border-b pb-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Paperclip className="size-4 text-font-s" />
              <span className="text-sm font-semibold">پیوست‌ها ({email.attachments.length})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {email.attachments.map((attachment) => (
                <ProtectedButton
                  key={attachment.id}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  permission="email.read"
                  showDenyToast={false}
                >
                  <Download className="size-3.5" />
                  <span className="text-xs">{attachment.filename}</span>
                  <span className="text-xs text-font-s">({attachment.file_size_formatted})</span>
                </ProtectedButton>
              ))}
            </div>
          </div>
        )}

        {email.message && (
          <div className="mb-4">
            <div className="prose prose-sm max-w-none">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{email.message}</p>
            </div>
          </div>
        )}

        {email.dynamic_fields && Object.keys(email.dynamic_fields).length > 0 && (
          <div className="mb-4">
            <div className="bg-bg/50 rounded-lg p-4">
              <h3 className="font-semibold text-sm mb-3">اطلاعات فرم:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(email.dynamic_fields).map(([key, value]) => (
                  <div key={key} className="flex flex-col">
                    <span className="text-xs text-font-s mb-1">{key}:</span>
                    <span className="text-sm font-medium">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

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

      <div className="border-t px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          {onToggleStar && mailbox !== "spam" && mailbox !== "trash" && (
            <ProtectedButton 
              variant="outline" 
              size="sm" 
              onClick={() => onToggleStar(email)}
              className={email.is_starred 
                ? "bg-amber text-amber-1 border-amber-1 hover:bg-amber/90" 
                : "border-amber-1 text-amber-1 hover:bg-amber/10"
              }
              permission="email.update"
              showDenyToast={false}
            >
              <Star className={cn("size-4", email.is_starred && "fill-amber-1")} />
              {email.is_starred ? "حذف ستاره" : "ستاره‌دار"}
            </ProtectedButton>
          )}
          {mailbox === "draft" && onPublish && (
            <ProtectedButton 
              variant="default" 
              size="sm" 
              onClick={() => onPublish(email)}
              permission="email.create"
              showDenyToast={false}
            >
              <Send className="size-4" />
              منتشر کردن
            </ProtectedButton>
          )}
          {mailbox !== "draft" && onReply && (
            <ProtectedButton 
              variant="default" 
              size="sm" 
              onClick={() => onReply(email)}
              permission="email.create"
              showDenyToast={false}
            >
              <Reply className="size-4" />
              پاسخ
            </ProtectedButton>
          )}
          <ProtectedButton 
            variant="destructive" 
            size="sm" 
            onClick={() => onDelete?.(email)}
            className="!bg-red-1 hover:!bg-red-2 !text-static-w border-0"
            permission="email.delete"
            showDenyToast={false}
          >
            <Trash2 className="size-4" />
            حذف
          </ProtectedButton>
        </div>
      </div>
    </div>
  );
}
