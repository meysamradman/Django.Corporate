import * as React from "react";
import { Bell, Mail, Ticket, ChevronLeft } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/elements/DropdownMenu";
import { useNotifications } from "./hooks/useNotifications";
import { useNavigate } from "react-router-dom";
import { usePermission } from "@/components/admins/permissions";
import { PERMISSIONS } from "@/components/admins/permissions/constants/permissions";
import { cn } from "@/core/utils/cn";

export function Notifications() {
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const { data: notifications, isLoading } = useNotifications();
  
  const hasTicketPermission = hasPermission(PERMISSIONS.TICKET.READ) || hasPermission(PERMISSIONS.TICKET.MANAGE);
  const hasEmailPermission = hasPermission(PERMISSIONS.EMAIL.READ);
  
  const totalCount = notifications?.total || 0;
  const hasNotifications = totalCount > 0;

  if (!hasTicketPermission && !hasEmailPermission) {
    return null;
  }

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'text-gray-500',
      medium: 'text-blue-500',
      high: 'text-orange-500',
      urgent: 'text-red-500',
    };
    return colors[priority] || 'text-gray-500';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      open: 'باز',
      in_progress: 'در حال بررسی',
      resolved: 'حل شده',
      closed: 'بسته',
    };
    return labels[status] || status;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="relative inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center cursor-pointer text-font-p hover:text-foreground transition-colors shrink-0 rounded-md hover:bg-bg"
          aria-label="اعلان‌ها"
        >
          <Bell className="h-5 w-5" />
          {hasNotifications && !isLoading && (
            <div className="absolute inline-flex items-center justify-center w-3.5 h-3.5 sm:w-4 sm:h-4 text-[9px] sm:text-[10px] font-bold text-static-w bg-red-500 border border-static-w rounded-full top-0.5 right-0.5 sm:top-1 sm:right-1 animate-pulse">
              {totalCount > 99 ? '99+' : totalCount}
            </div>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 sm:w-96">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>اعلان‌ها</span>
          {hasNotifications && (
            <span className="text-xs font-normal text-font-s">
              {totalCount} مورد جدید
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {isLoading ? (
          <div className="p-4 text-center text-sm text-font-s">
            در حال بارگذاری...
          </div>
        ) : !hasNotifications ? (
          <div className="p-4 text-center text-sm text-font-s">
            هیچ اعلان جدیدی وجود ندارد
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {hasTicketPermission && notifications && notifications.tickets.total_new > 0 && (
              <>
                <div className="px-2 py-1.5">
                  <div className="flex items-center gap-2 text-xs font-medium text-font-s mb-1">
                    <Ticket className="h-4 w-4" />
                    <span>تیکت‌های جدید ({notifications.tickets.total_new})</span>
                  </div>
                </div>
                {notifications.tickets.recent_tickets.slice(0, 5).map((ticket) => (
                  <DropdownMenuItem
                    key={ticket.id}
                    className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                    onClick={() => navigate(`/ticket?ticketId=${ticket.id}`)}
                  >
                    <div className="flex items-start justify-between w-full gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-font-p truncate">
                          {ticket.subject}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn("text-xs", getPriorityColor(ticket.priority))}>
                            {ticket.priority === 'urgent' ? 'فوری' : 
                             ticket.priority === 'high' ? 'زیاد' :
                             ticket.priority === 'medium' ? 'متوسط' : 'کم'}
                          </span>
                          <span className="text-xs text-font-s">
                            {getStatusLabel(ticket.status)}
                          </span>
                        </div>
                      </div>
                      <ChevronLeft className="h-4 w-4 text-font-s shrink-0" />
                    </div>
                    <span className="text-xs text-font-s">
                      {new Date(ticket.created_at).toLocaleDateString('fa-IR', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </DropdownMenuItem>
                ))}
                {notifications && notifications.tickets.total_new > 5 && (
                  <DropdownMenuItem
                    className="justify-center text-center text-sm text-primary hover:bg-primary/10"
                    onClick={() => navigate('/ticket?status=open')}
                  >
                    مشاهده همه تیکت‌ها ({notifications.tickets.total_new})
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
              </>
            )}

            {hasEmailPermission && notifications && notifications.emails.new_count > 0 && (
              <>
                <div className="px-2 py-1.5">
                  <div className="flex items-center gap-2 text-xs font-medium text-font-s mb-1">
                    <Mail className="h-4 w-4" />
                    <span>ایمیل‌های جدید ({notifications.emails.new_count})</span>
                  </div>
                </div>
                <DropdownMenuItem
                  className="justify-center text-center text-sm text-primary hover:bg-primary/10"
                  onClick={() => navigate('/email?status=new')}
                >
                  مشاهده ایمیل‌های جدید
                </DropdownMenuItem>
              </>
            )}
          </div>
        )}

        <DropdownMenuSeparator />
        <div className="flex gap-2 p-2">
          {hasTicketPermission && (
            <DropdownMenuItem
              className="flex-1 justify-center"
              onClick={() => navigate('/ticket')}
            >
              <Ticket className="h-4 w-4 ml-2" />
              همه تیکت‌ها
            </DropdownMenuItem>
          )}
          {hasEmailPermission && (
            <DropdownMenuItem
              className="flex-1 justify-center"
              onClick={() => navigate('/email')}
            >
              <Mail className="h-4 w-4 ml-2" />
              همه ایمیل‌ها
            </DropdownMenuItem>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

