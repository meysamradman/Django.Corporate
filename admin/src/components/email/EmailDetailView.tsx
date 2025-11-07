"use client";

import React from "react";
import { Button } from "@/components/elements/Button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/elements/Avatar";
import { Badge } from "@/components/elements/Badge";
import { Mail, Calendar, Phone, Globe, Smartphone, Code, Reply, Trash2, Paperclip, Download, ArrowRight } from "lucide-react";
import { cn } from "@/core/utils/cn";
import { EmailMessage } from "@/api/email/route";

interface EmailDetailViewProps {
  email: EmailMessage | null;
  onReply?: (email: EmailMessage) => void;
  onDelete?: (email: EmailMessage) => void;
  onBack?: () => void;
}

export function EmailDetailView({
  email,
  onReply,
  onDelete,
  onBack,
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
      <div className="border-b border-border p-4 flex-shrink-0">
        {onBack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="mb-4"
          >
            <ArrowRight className="size-4 ml-2" />
            بازگشت به لیست
          </Button>
        )}
        <div className="flex items-start gap-4 mb-4">
          <Avatar className="size-12 shrink-0">
            <AvatarImage 
              src={undefined}
              alt={displayName}
              className="object-cover"
            />
            <AvatarFallback className={cn("text-white text-sm", getAvatarColor(avatarText))}>
              {getInitials(email.name, email.email, email.source)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-base">{displayName}</span>
              <Badge
                variant={
                  email.status === "new"
                    ? "default"
                    : email.status === "read"
                    ? "secondary"
                    : email.status === "replied"
                    ? "default"
                    : email.status === "draft"
                    ? "secondary"
                    : "secondary"
                }
                className={cn(
                  email.status === "new" && "bg-red-500 text-white",
                  email.status === "read" && "bg-blue-500 text-white",
                  email.status === "replied" && "bg-green-500 text-white",
                  email.status === "draft" && "bg-orange-500 text-white"
                )}
              >
                {email.status_display}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Mail className="size-3.5" />
                <span>{email.email}</span>
              </div>
              {email.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="size-3.5" />
                  <span>{email.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                {getSourceIcon(email.source)}
                <span>{email.source_display}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{email.subject}</h2>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="size-4" />
              <span>{formatDate(email.created_at)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Attachments */}
        {email.has_attachments && email.attachments && email.attachments.length > 0 && (
          <div className="border-b border-border pb-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Paperclip className="size-4 text-muted-foreground" />
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
                  <span className="text-xs text-muted-foreground">({attachment.file_size_formatted})</span>
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
          <div className="border-t border-border pt-4 mt-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Reply className="size-4 text-primary" />
                <span className="font-semibold text-sm">پاسخ ادمین</span>
                {email.replied_at && (
                  <span className="text-xs text-muted-foreground">
                    {formatDate(email.replied_at)}
                  </span>
                )}
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{email.reply_message}</p>
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="border-t border-border pt-4 mt-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">شناسه:</span>
              <span className="mr-2 font-mono">{email.public_id}</span>
            </div>
            {email.ip_address && (
              <div>
                <span className="text-muted-foreground">IP:</span>
                <span className="mr-2">{email.ip_address}</span>
              </div>
            )}
            {email.read_at && (
              <div>
                <span className="text-muted-foreground">خوانده شده در:</span>
                <span className="mr-2">{formatDate(email.read_at)}</span>
              </div>
            )}
            {email.replied_at && (
              <div>
                <span className="text-muted-foreground">پاسخ داده شده در:</span>
                <span className="mr-2">{formatDate(email.replied_at)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="border-t border-border px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onReply?.(email)}>
            <Reply className="size-4 ml-2" />
            پاسخ
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDelete?.(email)}>
            <Trash2 className="size-4 ml-2" />
            حذف
          </Button>
        </div>
      </div>
    </div>
  );
}
