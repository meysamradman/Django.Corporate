"use client";

import { useMemo } from "react";
import { Activity, Mail, Ticket } from "lucide-react";
import { Skeleton } from "@/components/elements/Skeleton";
import { usePermission } from "@/core/permissions/context/PermissionContext";
import { Statistics } from "@/types/statistics/statisticsWidget";
import { formatNumber } from "@/core/utils/format";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig
} from "@/components/elements/Chart";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
} from "recharts";

interface SupportStatsProps {
  stats: Statistics | undefined;
  isLoading?: boolean;
}

export const SupportStats: React.FC<SupportStatsProps> = ({ stats, isLoading = false }) => {
  const { hasPermission } = usePermission();

  const supportStats = useMemo(() => {
    if (!stats) return [];
    const replied = (stats.total_emails || 0) - (stats.new_emails || 0) - (stats.unanswered_emails || 0);
    return [
      { 
        category: 'جدید', 
        newEmails: stats.new_emails || 0,
        newTickets: 0,
      },
      { 
        category: 'بدون پاسخ', 
        unansweredEmails: stats.unanswered_emails || 0,
        unansweredTickets: stats.unanswered_tickets || 0,
      },
      { 
        category: 'پاسخ داده شده', 
        repliedEmails: replied > 0 ? replied : 0,
        repliedTickets: 0,
      },
      { 
        category: 'باز', 
        openEmails: 0,
        openTickets: stats.open_tickets || 0,
      },
      { 
        category: 'فعال', 
        activeEmails: 0,
        activeTickets: stats.active_tickets || 0,
      },
    ].filter(item => 
      ((item.newEmails || 0) > 0 || (item.newTickets || 0) > 0) ||
      ((item.unansweredEmails || 0) > 0 || (item.unansweredTickets || 0) > 0) ||
      ((item.repliedEmails || 0) > 0 || (item.repliedTickets || 0) > 0) ||
      ((item.openEmails || 0) > 0 || (item.openTickets || 0) > 0) ||
      ((item.activeEmails || 0) > 0 || (item.activeTickets || 0) > 0)
    );
  }, [stats]);

  const supportStatsConfig = useMemo(() => ({
    newEmails: {
      label: 'ایمیل جدید',
      color: '#3B82F6',
    },
    newTickets: {
      label: 'تیکت جدید',
      color: '#60A5FA',
    },
    unansweredEmails: {
      label: 'ایمیل بدون پاسخ',
      color: '#2563EB',
    },
    unansweredTickets: {
      label: 'تیکت بدون پاسخ',
      color: '#3B82F6',
    },
    repliedEmails: {
      label: 'ایمیل پاسخ داده شده',
      color: '#1D4ED8',
    },
    repliedTickets: {
      label: 'تیکت پاسخ داده شده',
      color: '#2563EB',
    },
    openEmails: {
      label: 'ایمیل باز',
      color: '#1E40AF',
    },
    openTickets: {
      label: 'تیکت باز',
      color: '#1D4ED8',
    },
    activeEmails: {
      label: 'ایمیل فعال',
      color: '#1E3A8A',
    },
    activeTickets: {
      label: 'تیکت فعال',
      color: '#1E40AF',
    },
  } satisfies ChartConfig), []);

  const hasEmailPermission = hasPermission('statistics.emails.read');
  const hasTicketPermission = hasPermission('statistics.tickets.read');

  if (isLoading) {
    return (
      <div className="bg-card border border-br rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="w-9 h-9 rounded-lg" />
          <div className="text-right flex-1">
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
        <div className="flex gap-3 mb-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="w-full h-[300px] rounded-lg" />
      </div>
    );
  }

  if (supportStats.length === 0 || (!hasEmailPermission && !hasTicketPermission)) {
    return null;
  }

  return (
    <div className="bg-card border border-br rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Activity className="w-5 h-5 text-primary" />
        </div>
        <div className="text-right">
          <h2 className="text-lg font-semibold text-font-p">وضعیت پشتیبانی</h2>
          <p className="text-xs text-font-s">ایمیل‌ها و تیکت‌ها</p>
        </div>
      </div>
      <div className="flex items-center gap-3 mb-3 text-xs text-font-s">
        {hasEmailPermission && (
          <div className="flex items-center gap-1">
            <Mail className="w-3.5 h-3.5 text-rose-1" />
            <span>ایمیل: {formatNumber(stats?.total_emails || 0)}</span>
          </div>
        )}
        {hasTicketPermission && (
          <div className="flex items-center gap-1">
            <Ticket className="w-3.5 h-3.5 text-cyan-1" />
            <span>تیکت: {formatNumber(stats?.total_tickets || 0)}</span>
          </div>
        )}
      </div>
      <ChartContainer 
        config={supportStatsConfig} 
        className="min-h-[300px] w-full [&_.recharts-cartesian-axis-tick_text]:text-right [&_.recharts-cartesian-axis-tick_text]:direction-rtl"
        style={{ direction: 'rtl' }}
      >
        <BarChart accessibilityLayer data={supportStats}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="category"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tick={{ fill: '#6b6876', fontSize: 11 }}
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent indicator="dashed" />}
          />
          {hasEmailPermission && (
            <>
              <Bar dataKey="newEmails" stackId="a" fill="var(--color-newEmails)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="unansweredEmails" stackId="a" fill="var(--color-unansweredEmails)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="repliedEmails" stackId="a" fill="var(--color-repliedEmails)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="openEmails" stackId="a" fill="var(--color-openEmails)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="activeEmails" stackId="a" fill="var(--color-activeEmails)" radius={[0, 0, 4, 4]} />
            </>
          )}
          {hasTicketPermission && (
            <>
              <Bar dataKey="newTickets" stackId="a" fill="var(--color-newTickets)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="unansweredTickets" stackId="a" fill="var(--color-unansweredTickets)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="repliedTickets" stackId="a" fill="var(--color-repliedTickets)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="openTickets" stackId="a" fill="var(--color-openTickets)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="activeTickets" stackId="a" fill="var(--color-activeTickets)" radius={[4, 4, 0, 0]} />
            </>
          )}
        </BarChart>
      </ChartContainer>
    </div>
  );
};
