"use client";

import { useMemo } from "react";
import { Users, ShieldUser, LayoutList, Image, Mail, Ticket } from "lucide-react";
import { Skeleton } from "@/components/elements/Skeleton";
import { Card } from "@/components/elements/Card";
import { cn } from "@/core/utils/cn";
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

// Map colors to Tailwind border classes
const COLOR_BORDER_CLASSES: Record<string, string> = {
  '#3B82F6': 'border-b-blue-1',
  '#10B981': 'border-b-emerald-1',
  '#F59E0B': 'border-b-amber-1',
  '#8B5CF6': 'border-b-purple-1',
  '#EC4899': 'border-b-rose-1',
  '#06B6D4': 'border-b-cyan-1',
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
          <Card
            key={i}
            className="!py-5 p-5 border-b-4 border-b-gray-1"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <Skeleton className="w-12 h-12 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {summaryCards.map((card) => {
        const Icon = card.icon;
        const borderClass = COLOR_BORDER_CLASSES[card.color] || 'border-b-gray-1';
        return (
          <Card
            key={card.id}
            className={cn(
              "!py-5 p-5 hover:shadow-md hover:border-primary/20 transition-all duration-200 border-b-4",
              borderClass
            )}
            style={{ borderBottomColor: card.color }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div 
                  className="p-2.5 rounded-lg flex-shrink-0" 
                  style={{ backgroundColor: `${card.color}15` }}
                >
                  <Icon className="w-5 h-5" style={{ color: card.color }} />
                </div>
                <div className="flex-1">
                  <div className="text-2xl font-bold text-font-p leading-none mb-1">
                    {formatNumber(card.value)}
                  </div>
                  <div className="text-xs text-font-s font-medium">{card.label}</div>
                </div>
              </div>
              {card.trend && (
                <div className="text-xs text-font-s bg-primary/10 text-primary px-2 py-1 rounded-md font-medium whitespace-nowrap flex-shrink-0">
                  {card.trend.value} {card.trend.label}
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
};
