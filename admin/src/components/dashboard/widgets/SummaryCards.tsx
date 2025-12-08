"use client";

import { useMemo } from "react";
import { Users, ShieldUser, LayoutList, Image, Mail, Ticket } from "lucide-react";
import { usePermission } from "@/core/permissions/context/PermissionContext";
import { formatNumber } from "@/core/utils/format";
import { Statistics } from "@/types/statistics/statisticsWidget";

interface SummaryCard {
  id: string;
  icon: React.ElementType;
  label: string;
  value: number;
  permission: string;
  color: string;
  trend: { value: number; label: string } | null;
}

interface SummaryCardsProps {
  stats: Statistics | undefined;
  isLoading?: boolean;
}

const COLORS = {
  user: '#3B82F6',
  admin: '#10B981',
  portfolio: '#F59E0B',
  media: '#8B5CF6',
  email: '#EC4899',
  ticket: '#06B6D4',
};

export const SummaryCards: React.FC<SummaryCardsProps> = ({ stats, isLoading = false }) => {
  const { hasPermission } = usePermission();

  const summaryCards = useMemo(() => {
    const cards: SummaryCard[] = [
      {
        id: 'users',
        icon: Users,
        label: 'کاربران',
        value: stats?.total_users || 0,
        permission: 'statistics.users.read',
        color: COLORS.user,
        trend: null
      },
      {
        id: 'admins',
        icon: ShieldUser,
        label: 'ادمین‌ها',
        value: stats?.total_admins || 0,
        permission: 'statistics.admins.read',
        color: COLORS.admin,
        trend: null
      },
      {
        id: 'content',
        icon: LayoutList,
        label: 'کل محتوا',
        value: (stats?.total_portfolios || 0) + (stats?.total_posts || 0),
        permission: 'statistics.content.read',
        color: COLORS.portfolio,
        trend: null
      },
      {
        id: 'media',
        icon: Image,
        label: 'رسانه‌ها',
        value: stats?.total_media || 0,
        permission: 'media.read',
        color: COLORS.media,
        trend: null
      },
      {
        id: 'emails',
        icon: Mail,
        label: 'ایمیل‌ها',
        value: stats?.total_emails || 0,
        permission: 'statistics.emails.read',
        color: COLORS.email,
        trend: stats?.new_emails ? { value: stats.new_emails, label: 'جدید' } : null
      },
      {
        id: 'tickets',
        icon: Ticket,
        label: 'تیکت‌ها',
        value: stats?.total_tickets || 0,
        permission: 'statistics.tickets.read',
        color: COLORS.ticket,
        trend: stats?.open_tickets ? { value: stats.open_tickets, label: 'باز' } : null
      },
    ];
    return cards.filter(card => hasPermission(card.permission));
  }, [stats, hasPermission]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-card border border-br rounded-xl p-5 animate-pulse"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-lg bg-br" />
            </div>
            <div className="h-8 w-16 bg-br rounded mb-1" />
            <div className="h-4 w-20 bg-br rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {summaryCards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className="bg-card border border-br rounded-xl p-5 hover:shadow-md hover:border-primary/20 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-3">
              <div 
                className="p-2.5 rounded-lg" 
                style={{ backgroundColor: `${card.color}15` }}
              >
                <Icon className="w-5 h-5" style={{ color: card.color }} />
              </div>
              {card.trend && (
                <div className="text-xs text-font-s bg-primary/10 text-primary px-2 py-1 rounded-md font-medium">
                  {card.trend.value} {card.trend.label}
                </div>
              )}
            </div>
            <div className="text-2xl font-bold text-font-p mb-1 text-right">
              {formatNumber(card.value)}
            </div>
            <div className="text-xs text-font-s font-medium text-right">{card.label}</div>
          </div>
        );
      })}
    </div>
  );
};
