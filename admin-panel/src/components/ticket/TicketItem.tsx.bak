import { Avatar, AvatarImage, AvatarFallback } from "@/components/elements/Avatar";
import { Checkbox } from "@/components/elements/Checkbox";
import { Badge } from "@/components/elements/Badge";
import { MessageSquare } from "lucide-react";
import { cn } from "@/core/utils/cn";
import type { Ticket } from "@/types/ticket/ticket";

interface TicketItemProps {
  ticket: Ticket;
  isSelected: boolean;
  onSelect: (ticketId: number) => void;
  onClick?: (ticket: Ticket) => void;
}

export function TicketItem({ ticket, isSelected, onSelect, onClick }: TicketItemProps) {
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

  const getStatusColor = (status: Ticket['status'], hasUnread: boolean) => {
    if (!hasUnread) {
      return 'bg-gray-1';
    }
    
    switch (status) {
      case 'open':
        return 'bg-red-1 animate-pulse';
      case 'in_progress':
        return 'bg-blue-1 animate-pulse';
      case 'resolved':
        return 'bg-green-1';
      case 'closed':
        return 'bg-gray-1';
      default:
        return 'bg-gray-1';
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

  const displayName = getDisplayName(ticket.user);
  const avatarText = ticket.user?.full_name || ticket.user?.email || ticket.user?.mobile || "?";
  const hasUnreadMessages = ticket.unread_messages_count !== undefined && ticket.unread_messages_count > 0;

  return (
    <div
      className={cn(
        "flex items-center gap-4 px-4 py-3 hover:bg-bg/50 transition-colors cursor-pointer",
        isSelected && "bg-bg"
      )}
      onClick={() => onClick?.(ticket)}
    >
      <div onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelect(ticket.id)}
          aria-label="انتخاب تیکت"
        />
      </div>

      <Avatar className="size-10 shrink-0">
        <AvatarImage 
          src={undefined}
          alt={displayName}
          className="object-cover"
        />
        <AvatarFallback className={cn("text-static-w text-xs", getAvatarColor(avatarText))}>
          {getInitials(ticket.user)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <div
            className={cn(
              "size-2 rounded-full shrink-0",
              getStatusColor(ticket.status, hasUnreadMessages)
            )}
            title={hasUnreadMessages ? 'پیام‌های خوانده نشده' : 'همه پیام‌ها خوانده شده'}
          />
          <span className={cn(
            "font-semibold text-sm truncate cursor-pointer",
            hasUnreadMessages ? "text-font-p" : "text-font-s"
          )}>
            {displayName}
          </span>
          <Badge variant={getPriorityColor(ticket.priority) as any} className="text-xs">
            {ticket.priority === 'urgent' ? 'فوری' :
             ticket.priority === 'high' ? 'بالا' :
             ticket.priority === 'medium' ? 'متوسط' : 'پایین'}
          </Badge>
          {ticket.messages_count && ticket.messages_count > 0 && (
            <div className="flex items-center gap-1 text-font-s">
              <MessageSquare className="size-3.5" />
              <span className="text-xs">{ticket.messages_count}</span>
            </div>
          )}
          {hasUnreadMessages && (
            <Badge variant="red" className="text-xs px-1.5 py-0.5">
              {ticket.unread_messages_count} جدید
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-sm truncate cursor-pointer",
            hasUnreadMessages ? "text-font-p font-medium" : "text-font-s"
          )}>
            {ticket.subject}
          </span>
          {ticket.description && (
            <span className="text-xs text-font-s truncate cursor-pointer">
              - {ticket.description.substring(0, 50)}...
            </span>
          )}
        </div>
      </div>

      <div className="text-xs text-font-s shrink-0 cursor-pointer">
        {formatDate(ticket.created_at)}
      </div>
    </div>
  );
}

