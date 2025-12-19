import React from "react";
import { Button } from "@/components/elements/Button";
import { ProtectedButton } from "@/components/admins/permissions/components/ProtectedButton";
import { Badge } from "@/components/elements/Badge";
import { CircleDot, Clock, CheckCircle2, XCircle, Plus } from "lucide-react";
import { cn } from "@/core/utils/cn";
import type { TicketStatusType, TicketStatusItem } from "./types";

interface TicketSidebarProps {
  selectedStatus: TicketStatusType | 'all';
  onStatusChange: (status: TicketStatusType | 'all') => void;
  statusCounts?: {
    all?: number;
    all_unread?: number;
    open?: number;
    open_unread?: number;
    in_progress?: number;
    in_progress_unread?: number;
    resolved?: number;
    resolved_unread?: number;
    closed?: number;
    closed_unread?: number;
  };
}

const getStatuses = (counts?: TicketSidebarProps['statusCounts']): TicketStatusItem[] => [
  { id: 'all', label: "همه تیکت‌ها", count: counts?.all, unreadCount: counts?.all_unread },
  { id: 'open', label: "باز", count: counts?.open, unreadCount: counts?.open_unread },
  { id: 'in_progress', label: "در حال بررسی", count: counts?.in_progress, unreadCount: counts?.in_progress_unread },
  { id: 'resolved', label: "حل شده", count: counts?.resolved, unreadCount: counts?.resolved_unread },
  { id: 'closed', label: "بسته شده", count: counts?.closed, unreadCount: counts?.closed_unread },
];

const getStatusIcon = (status: TicketStatusType | 'all') => {
  switch (status) {
    case 'open':
      return <CircleDot className="size-4" />;
    case 'in_progress':
      return <Clock className="size-4" />;
    case 'resolved':
      return <CheckCircle2 className="size-4" />;
    case 'closed':
      return <XCircle className="size-4" />;
    default:
      return <CircleDot className="size-4" />;
  }
};

export function TicketSidebar({ selectedStatus, onStatusChange, statusCounts }: TicketSidebarProps) {
  const statuses = getStatuses(statusCounts);

  return (
    <aside className="w-full flex flex-col h-full overflow-hidden">
      <nav className="flex-1 overflow-y-auto min-h-0">
        {statuses.map((status) => {
          const getStatusColors = (id: TicketStatusType | 'all', isSelected: boolean) => {
            if (isSelected) {
              switch (id) {
                case 'all':
                  return {
                    bg: "bg-primary/10",
                    text: "text-primary",
                    border: "bg-primary",
                    icon: "text-primary",
                  };
                case 'open':
                  return {
                    bg: "bg-red",
                    text: "text-red-1",
                    border: "bg-red-1",
                    icon: "text-red-1",
                  };
                case 'in_progress':
                  return {
                    bg: "bg-blue",
                    text: "text-blue-1",
                    border: "bg-blue-1",
                    icon: "text-blue-1",
                  };
                case 'resolved':
                  return {
                    bg: "bg-green",
                    text: "text-green-1",
                    border: "bg-green-1",
                    icon: "text-green-1",
                  };
                case 'closed':
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
                case 'all':
                  return {
                    text: "text-primary",
                    icon: "text-primary",
                  };
                case 'open':
                  return {
                    text: "text-red-1",
                    icon: "text-red-1",
                  };
                case 'in_progress':
                  return {
                    text: "text-blue-1",
                    icon: "text-blue-1",
                  };
                case 'resolved':
                  return {
                    text: "text-green-1",
                    icon: "text-green-1",
                  };
                case 'closed':
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

          const colors = getStatusColors(status.id, selectedStatus === status.id);
          const isSelected = selectedStatus === status.id;

          return (
            <button
              key={status.id}
              onClick={() => onStatusChange(status.id)}
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
                  <span className={cn("cursor-pointer", colors.icon)}>
                    {getStatusIcon(status.id)}
                  </span>
                  <span className="text-sm font-medium cursor-pointer">{status.label}</span>
                </div>
                {status.unreadCount !== undefined && status.unreadCount > 0 ? (
                  <Badge
                    variant="red"
                    className="text-xs px-2 py-0.5 flex-shrink-0 animate-pulse border-0"
                  >
                    {status.unreadCount}
                  </Badge>
                ) : status.count !== undefined && status.count > 0 ? (
                  <Badge
                    variant={
                      status.id === 'all' ? "default" :
                        status.id === 'open' ? "red" :
                          status.id === 'in_progress' ? "blue" :
                            status.id === 'resolved' ? "green" :
                              status.id === 'closed' ? "gray" : "default"
                    }
                    className="text-xs px-2 py-0.5 border-0 flex-shrink-0"
                  >
                    {status.count}
                  </Badge>
                ) : null}
              </div>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

