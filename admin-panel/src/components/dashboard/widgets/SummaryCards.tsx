import { useMemo, type ElementType } from "react";
import { Users, ShieldUser, Mail, Ticket } from "lucide-react";
import { Skeleton } from "@/components/elements/Skeleton";
import { Card } from "@/components/elements/Card";
import { cn } from "@/core/utils/cn";
import type { DashboardStats } from "@/types/analytics";

interface SummaryCard {
  id: string;
  icon: ElementType;
  label: string;
  value: number;
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

export function SummaryCards({ stats, isLoading = false }: SummaryCardsProps) {
  const allCards = useMemo<SummaryCard[]>(() => [
    {
      id: 'users',
      icon: Users,
      label: 'کاربران',
      value: stats?.total_users || 0,
      colors: CARD_COLORS.user,
      trend: null
    },
    {
      id: 'admins',
      icon: ShieldUser,
      label: 'ادمین‌ها',
      value: stats?.total_admins || 0,
      colors: CARD_COLORS.admin,
      trend: null
    },
    {
      id: 'emails',
      icon: Mail,
      label: 'ایمیل‌ها',
      value: stats?.total_emails || 0,
      colors: CARD_COLORS.emails,
      trend: stats?.new_emails ? { value: stats.new_emails, label: 'جدید' } : null
    },
    {
      id: 'tickets',
      icon: Ticket,
      label: 'تیکت‌ها',
      value: stats?.total_tickets || 0,
      colors: CARD_COLORS.tickets,
      trend: stats?.open_tickets ? { value: stats.open_tickets, label: 'باز' } : null
    },
  ], [stats]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-fit items-start">
        {[...Array(4)].map((_, i) => (
          <Card
            key={i}
            className="!p-4 !gap-1 border-b-2 border-b-gray-1 h-fit"
          >
            <div className="flex items-center gap-3 mb-1.5">
              <Skeleton className="w-9 h-9 rounded-lg" />
              <Skeleton className="h-7 w-12" />
            </div>
            <Skeleton className="h-4 w-20 mb-0.5" />
            <Skeleton className="h-3 w-28" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-fit items-start">
      {allCards.map((card) => {
        const Icon = card.icon;
        return (
          <Card
            key={card.id}
            className={cn(
              "!py-3.5 !px-4 !gap-1 hover:shadow-md transition-all duration-300 border-b-2 h-fit",
              card.colors.border
            )}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={cn("p-2 rounded-lg", card.colors.iconBg)}>
                <Icon className={cn("w-5 h-5", card.colors.icon)} />
              </div>
              <div className="text-2xl font-bold text-font-p leading-none">
                {card.value.toLocaleString('fa-IR')}
              </div>
            </div>

            <div className="text-sm font-bold text-font-p mb-1">
              {card.label}
            </div>

            <div className="flex items-center gap-1.5 text-[10px] font-medium text-font-s opacity-70">
              {card.trend ? (
                <>
                  <span className="text-primary font-bold">{card.trend.value}+</span>
                  <span className="opacity-80">{card.trend.label}</span>
                </>
              ) : (
                <span className="opacity-60">آمار کلی تا این لحظه</span>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
