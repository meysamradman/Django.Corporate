"use client";

import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/elements/Avatar";
import { Badge } from "@/components/elements/Badge";
import { Calendar, User, MessageSquare, Reply, Trash2, Paperclip, Download } from "lucide-react";
import { cn } from "@/core/utils/cn";
import { Ticket, TicketMessage } from "@/types/ticket/ticket";
import { ProtectedButton } from "@/core/permissions/components/ProtectedButton";

interface TicketDetailViewProps {
  ticket: Ticket | null;
  messages?: TicketMessage[];
  onReply?: (ticket: Ticket) => void;
  onDelete?: (ticket: Ticket) => void;
  onStatusChange?: (ticket: Ticket, status: Ticket['status']) => void;
}

export function TicketDetailView({
  ticket,
  messages = [],
  onReply,
  onDelete,
  onStatusChange,
}: TicketDetailViewProps) {
  if (!ticket) return null;

  const getInitials = (user?: Ticket['user']) => {
    if (user?.full_name) {
      const words = user.full_name.trim().split(" ");
      if (words.length >= 2) {
        return `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase();
      }
      return user.full_name.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    if (user?.mobile) {
      return user.mobile.charAt(0).toUpperCase();
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

  const getDisplayName = (user?: Ticket['user']) => {
    if (user?.full_name) {
      return user.full_name;
    }
    if (user?.email) {
      return user.email;
    }
    if (user?.mobile) {
      return user.mobile;
    }
    return "کاربر ناشناس";
  };

  const getStatusColor = (status: Ticket['status']) => {
    switch (status) {
      case 'open':
        return 'red';
      case 'in_progress':
        return 'blue';
      case 'resolved':
        return 'green';
      case 'closed':
        return 'gray';
      default:
        return 'gray';
    }
  };

  const getPriorityColor = (priority: Ticket['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'red';
      case 'high':
        return 'orange';
      case 'medium':
        return 'blue';
      case 'low':
        return 'gray';
      default:
        return 'gray';
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

  const displayName = getDisplayName(ticket.user);
  const avatarText = ticket.user?.full_name || ticket.user?.email || ticket.user?.mobile || "?";

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
              {getInitials(ticket.user)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="font-semibold text-lg">{displayName}</span>
              <Badge variant={getStatusColor(ticket.status) as any}>
                {ticket.status === 'open' ? 'باز' :
                  ticket.status === 'in_progress' ? 'در حال بررسی' :
                    ticket.status === 'resolved' ? 'حل شده' : 'بسته شده'}
              </Badge>
              <Badge variant={getPriorityColor(ticket.priority) as any}>
                {ticket.priority === 'urgent' ? 'فوری' :
                  ticket.priority === 'high' ? 'بالا' :
                    ticket.priority === 'medium' ? 'متوسط' : 'پایین'}
              </Badge>
            </div>
            <div className="flex items-center gap-4 flex-wrap text-base">
              {ticket.user?.email && (
                <div className="flex items-center gap-1.5 text-font-p">
                  <User className="size-4 shrink-0" />
                  <span>{ticket.user.email}</span>
                </div>
              )}
              {ticket.user?.mobile && (
                <div className="flex items-center gap-1.5 text-font-p">
                  <User className="size-4 shrink-0" />
                  <span>{ticket.user.mobile}</span>
                </div>
              )}
              {ticket.assigned_admin && (
                <div className="flex items-center gap-1.5 text-font-s">
                  <User className="size-4 shrink-0" />
                  <span>اختصاص داده شده به: {ticket.assigned_admin.user.username}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-xl font-bold">{ticket.subject}</h2>
          <div className="flex items-center gap-1.5 text-base text-font-s">
            <Calendar className="size-4" />
            <span>{formatDate(ticket.created_at)}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mb-4">
          <div className="prose prose-sm max-w-none">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
          </div>
        </div>

        {messages && messages.length > 0 && (
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="size-4 text-primary" />
              <span className="font-semibold text-sm">پیام‌ها ({messages.length})</span>
            </div>
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className="bg-bg/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">
                        {message.sender_type === 'admin'
                          ? (message.sender_admin?.user?.username || message.sender_admin?.user?.email || 'ادمین')
                          : getDisplayName(ticket.user)}
                      </span>
                      <Badge variant={message.sender_type === 'admin' ? 'blue' : 'gray'}>
                        {message.sender_type === 'admin' ? 'ادمین' : 'کاربر'}
                      </Badge>
                    </div>
                    <span className="text-xs text-font-s">
                      {formatDate(message.created_at)}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.message}</p>
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-2 pt-2 border-t">
                      <div className="flex flex-wrap gap-2">
                        {message.attachments.map((attachment) => {
                          const media = attachment.image || attachment.video || attachment.audio || attachment.document;
                          const mediaUrl = media?.file_url || attachment.media_url;
                          const mediaTitle = media?.title || 'پیوست';
                          return (
                            <ProtectedButton
                              key={attachment.id}
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              permission="ticket.manage"
                              showDenyToast={false}
                              onClick={() => mediaUrl && window.open(mediaUrl, '_blank')}
                            >
                              <Download className="size-3.5" />
                              <span className="text-xs">{mediaTitle}</span>
                            </ProtectedButton>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="border-t px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          {onStatusChange && ticket.status !== 'closed' && (
            <select
              value={ticket.status}
              onChange={(e) => onStatusChange(ticket, e.target.value as Ticket['status'])}
              className="px-3 py-1.5 text-sm border rounded-md bg-card"
            >
              <option value="open">باز</option>
              <option value="in_progress">در حال بررسی</option>
              <option value="resolved">حل شده</option>
              <option value="closed">بسته شده</option>
            </select>
          )}
          {onReply && ticket.status !== 'closed' && (
            <ProtectedButton
              variant="default"
              size="sm"
              onClick={() => onReply(ticket)}
              permission={['ticket.manage', 'ticket.create']}
              requireAll={false}
              showDenyToast={false}
            >
              <Reply className="size-4" />
              پاسخ
            </ProtectedButton>
          )}
          <ProtectedButton
            variant="destructive"
            size="sm"
            onClick={() => onDelete?.(ticket)}
            className="!bg-red-1 hover:!bg-red-2 !text-static-w border-0"
            permission={['ticket.manage', 'ticket.delete']}
            requireAll={false}
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

