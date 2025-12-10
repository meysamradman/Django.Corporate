"use client";

import { useMemo } from "react";
import { Users, ShieldUser, LayoutList, Image, Mail, Ticket } from "lucide-react";
import { Skeleton } from "@/components/elements/Skeleton";
import { Card } from "@/components/elements/Card";
import { cn } from "@/core/utils/cn";
import { PermissionLocked } from "@/core/permissions/components/PermissionLocked";
import { formatNumber } from "@/core/utils/format";
import { DashboardStats } from "@/types/analytics/analytics";

interface SummaryCard {
  id: string;
  icon: React.ElementType;
  label: string;
  value: number;
  permission: string;
  hasAccess: boolean;
  colors: {
    border: string;
    iconBg: string;
    icon: string;
  };
  trend: { value: number; label: string } | null;
}

interface SummaryCardsProps {
  stats: DashboardStats | undefined;
  isLoading?: boolean;
}

// Map card IDs to theme color classes
const CARD_COLORS = {
  user: {
    border: 'border-b-blue-1',
    iconBg: 'bg-blue-0',
    icon: 'text-blue-1',
  },
  admin: {
    border: 'border-b-green-1',
    iconBg: 'bg-green-0',
    icon: 'text-green-1',
  },
  content: {
    border: 'border-b-amber-1',
    iconBg: 'bg-amber-0',
    icon: 'text-amber-1',
  },
  media: {
    border: 'border-b-purple-1',
    iconBg: 'bg-purple-0',
    icon: 'text-purple-1',
  },
  emails: {
    border: 'border-b-pink-1',
    iconBg: 'bg-pink-0',
    icon: 'text-pink-1',
  },
  tickets: {
    border: 'border-b-teal-1',
    iconBg: 'bg-teal-0',
    icon: 'text-teal-1',
  },
};

export const SummaryCards: React.FC<SummaryCardsProps> = ({ stats, isLoading = false }) => {
  const allCards = useMemo<SummaryCard[]>(() => [
    {
      id: 'users',
      icon: Users,
      label: 'کاربران',
      value: stats?.total_users || 0,
      permission: 'analytics.users.read',
      hasAccess: false,
      colors: CARD_COLORS.user,
      trend: null
    },
    {
      id: 'admins',
      icon: ShieldUser,
      label: 'ادمین‌ها',
      value: stats?.total_admins || 0,
      permission: 'analytics.admins.read',
      hasAccess: false,
      colors: CARD_COLORS.admin,
      trend: null
    },
    {
      id: 'content',
      icon: LayoutList,
      label: 'کل محتوا',
      value: (stats?.total_portfolios || 0) + (stats?.total_posts || 0),
      permission: 'analytics.content.read',
      hasAccess: false,
      colors: CARD_COLORS.content,
      trend: null
    },
    {
      id: 'media',
      icon: Image,
      label: 'رسانه‌ها',
      value: stats?.total_media || 0,
      permission: 'media.read',
      hasAccess: false,
      colors: CARD_COLORS.media,
      trend: null
    },
    {
      id: 'emails',
      icon: Mail,
      label: 'ایمیل‌ها',
      value: stats?.total_emails || 0,
      permission: 'analytics.emails.read',
      hasAccess: false,
      colors: CARD_COLORS.emails,
      trend: stats?.new_emails ? { value: stats.new_emails, label: 'جدید' } : null
    },
    {
      id: 'tickets',
      icon: Ticket,
      label: 'تیکت‌ها',
      value: stats?.total_tickets || 0,
      permission: 'analytics.tickets.read',
      hasAccess: false,
      colors: CARD_COLORS.tickets,
      trend: stats?.open_tickets ? { value: stats.open_tickets, label: 'باز' } : null
    },
  ], [stats]);

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
      {allCards.map((card) => {
        const Icon = card.icon;
        return (
          <PermissionLocked
            key={card.id}
            permission={card.permission}
            lockedMessage="دسترسی محدود"
            borderColorClass={card.colors.border}
            iconBgColorClass={card.colors.iconBg}
            iconColorClass={card.colors.icon}
          >
            <Card
              className={cn(
                "!py-5 p-5 hover:shadow-md hover:border-primary/20 transition-all duration-200 border-b-4",
                card.colors.border
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div 
                    className={cn("p-2.5 rounded-lg flex-shrink-0", card.colors.iconBg)}
                  >
                    <Icon className={cn("w-5 h-5", card.colors.icon)} />
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
          </PermissionLocked>
        );
      })}
    </div>
  );
};
