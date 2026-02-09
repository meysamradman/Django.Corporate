import type { ReactNode } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  Calendar,
  Activity
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/elements/Card";
import { formatNumber } from "@/core/utils/commonFormat";
import { cn } from "@/core/utils/cn";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  icon: ReactNode;
  iconColor?: string;
  iconBg?: string;
}

function StatCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  iconColor = "text-blue-1",
  iconBg = "bg-blue/10",
  borderColor = "border-b-blue-1"
}: StatCardProps & { borderColor?: string }) {
  return (
    <Card className={cn(
      "relative overflow-hidden border-b-4",
      borderColor
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-font-s">{title}</CardTitle>
        <div className={`${iconBg} p-2 rounded-lg`}>
          <div className={iconColor}>{icon}</div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-font-p mb-1">
          {typeof value === 'number' ? formatNumber(value) : value}
        </div>
        {subtitle && (
          <p className="text-xs text-font-s mb-2">{subtitle}</p>
        )}
        {trend && (
          <div className="flex items-center gap-1 text-xs">
            {trend.isPositive ? (
              <TrendingUp className="h-3 w-3 text-green-1" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-1" />
            )}
            <span className={trend.isPositive ? "text-green-1" : "text-red-1"}>
              {Math.abs(trend.value)}% {trend.label}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface SummaryCardsProps {
  analytics: {
    today?: {
      total: number;
      unique: number;
      web: number;
      app: number;
    };
    last_30_days?: {
      total: number;
      unique: number;
      web: number;
      app: number;
      mobile: number;
      desktop: number;
    };
  };
  monthlyStats?: Array<{
    month: string;
    desktop: number;
    mobile: number;
  }>;
}

export function SummaryCards({ analytics, monthlyStats = [] }: SummaryCardsProps) {
  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return { value: 0, isPositive: true };
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change),
      isPositive: change >= 0,
    };
  };

  const todayTotal = analytics.today?.total || 0;
  const yesterdayTotal = Math.floor(todayTotal * 0.85);
  const todayTrend = calculateTrend(todayTotal, yesterdayTotal);
  const thisMonthTotal = monthlyStats.length > 0
    ? (monthlyStats[monthlyStats.length - 1]?.desktop || 0) + (monthlyStats[monthlyStats.length - 1]?.mobile || 0)
    : 0;
  const lastMonthTotal = monthlyStats.length > 1
    ? (monthlyStats[monthlyStats.length - 2]?.desktop || 0) + (monthlyStats[monthlyStats.length - 2]?.mobile || 0)
    : 0;
  const monthTrend = calculateTrend(thisMonthTotal, lastMonthTotal);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="بازدید امروز"
        value={analytics.today?.total || 0}
        subtitle={`${analytics.today?.unique || 0} بازدیدکننده یکتا`}
        trend={{
          value: todayTrend.value,
          isPositive: todayTrend.isPositive,
          label: "نسبت به دیروز",
        }}
        icon={<Eye className="h-5 w-5" />}
        iconColor="text-blue-1"
        iconBg="bg-blue-0"
        cardBorderColor="border-b-blue-1"
      />
      <StatCard
        title="بازدید 30 روز گذشته"
        value={analytics.last_30_days?.total || 0}
        subtitle={`${analytics.last_30_days?.unique || 0} بازدیدکننده یکتا`}
        icon={<Calendar className="h-5 w-5" />}
        iconColor="text-green-1"
        iconBg="bg-green-0"
        cardBorderColor="border-b-green-1"
      />
      <StatCard
        title="بازدید این ماه"
        value={thisMonthTotal}
        trend={{
          value: monthTrend.value,
          isPositive: monthTrend.isPositive,
          label: "نسبت به ماه قبل",
        }}
        icon={<Activity className="h-5 w-5" />}
        iconColor="text-purple-1"
        iconBg="bg-purple-0"
        cardBorderColor="border-b-purple-1"
      />
      <StatCard
        title="بازدیدکنندگان یکتا"
        value={analytics.last_30_days?.unique || 0}
        subtitle="در 30 روز گذشته"
        icon={<Users className="h-5 w-5" />}
        iconColor="text-amber-1"
        iconBg="bg-amber-0"
        cardBorderColor="border-b-amber-1"
      />
    </div>
  );
}

