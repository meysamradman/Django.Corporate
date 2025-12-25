import { useQuery } from "@tanstack/react-query";
import { realEstateApi } from "@/api/real-estate/properties";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Badge } from "@/components/elements/Badge";
import { Skeleton } from "@/components/elements/Skeleton";
import { showError } from '@/core/toast';
import {
  Home,
  CheckCircle2,
  Star,
  Users,
  Building,
  Award,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { PropertiesChart } from "./PropertiesChart";
import { formatNumber } from "@/core/utils/format";
import { cn } from "@/core/utils/cn";
import type { ReactNode } from 'react';

interface PropertyStatistics {
  generated_at: string;
  properties: {
    total: number;
    published: number;
    draft: number;
    featured: number;
    verified: number;
    active: number;
    public: number;
    published_percentage: number;
    featured_percentage: number;
    verified_percentage: number;
  };
  types: {
    total: number;
    with_properties: number;
    without_properties: number;
  };
  states: {
    total: number;
    with_properties: number;
    without_properties: number;
  };
  labels: {
    total: number;
    with_properties: number;
    without_properties: number;
  };
  features: {
    total: number;
    with_properties: number;
    without_properties: number;
  };
  tags: {
    total: number;
    with_properties: number;
    without_properties: number;
  };
  agents: {
    total: number;
    active: number;
    verified: number;
    with_properties: number;
    active_percentage: number;
    verified_percentage: number;
  };
  agencies: {
    total: number;
    active: number;
    verified: number;
    with_properties: number;
    active_percentage: number;
    verified_percentage: number;
  };
  recent_properties?: any[];
}

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

export function RealEstateStatisticsOverview() {
  const { data: stats, isLoading, error } = useQuery<PropertyStatistics>({
    queryKey: ['real-estate-statistics'],
    queryFn: () => realEstateApi.getStatistics(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: monthlyData, isLoading: monthlyLoading } = useQuery({
    queryKey: ['real-estate-monthly-stats'],
    queryFn: () => realEstateApi.getMonthlyStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Handle errors
  if (error) {
    showError(error, { customMessage: "خطا در دریافت آمار املاک" });
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-b-4 border-b-primary">
              <CardContent className="pt-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="rounded-lg border p-6">
        <div className="text-center py-8">
          <p className="text-red-1 mb-4">خطا در بارگذاری آمار املاک</p>
          <p className="text-font-s">
            لطفاً دوباره تلاش کنید یا با مدیر سیستم تماس بگیرید.
          </p>
        </div>
      </div>
    );
  }

  const displayStats = stats || {
    properties: {
      total: 0,
      published: 0,
      draft: 0,
      featured: 0,
      verified: 0,
      published_percentage: 0,
      featured_percentage: 0,
      verified_percentage: 0,
    },
    types: { total: 0, with_properties: 0, without_properties: 0 },
    states: { total: 0, with_properties: 0, without_properties: 0 },
    labels: { total: 0, with_properties: 0, without_properties: 0 },
    features: { total: 0, with_properties: 0, without_properties: 0 },
    tags: { total: 0, with_properties: 0, without_properties: 0 },
    agents: {
      total: 0,
      active: 0,
      verified: 0,
      with_properties: 0,
      active_percentage: 0,
      verified_percentage: 0,
    },
    agencies: {
      total: 0,
      active: 0,
      verified: 0,
      with_properties: 0,
      active_percentage: 0,
      verified_percentage: 0,
    },
  };

  const displayMonthlyData = monthlyData || {
    monthly_stats: [
      { month: "تیر", published: 120, draft: 45, featured: 25, verified: 20 },
      { month: "مرداد", published: 135, draft: 50, featured: 30, verified: 25 },
      { month: "شهریور", published: 128, draft: 48, featured: 28, verified: 22 },
      { month: "مهر", published: 142, draft: 52, featured: 32, verified: 28 },
      { month: "آبان", published: 158, draft: 55, featured: 35, verified: 30 },
      { month: "آذر", published: 165, draft: 58, featured: 38, verified: 32 },
    ],
  };

  const monthlyStats = displayMonthlyData.monthly_stats;

  return (
    <div className="space-y-6">
      {/* آمار کلی املاک */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-font-p">آمار کلی املاک</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="کل املاک"
            value={displayStats.properties.total}
            icon={<Home className="h-5 w-5" />}
            iconColor="text-blue-1"
            iconBg="bg-blue-0"
            borderColor="border-b-blue-1"
          />
          <StatCard
            title="منتشر شده"
            value={displayStats.properties.published}
            subtitle={`${displayStats.properties.published_percentage}% از کل`}
            icon={<CheckCircle2 className="h-5 w-5" />}
            iconColor="text-green-1"
            iconBg="bg-green-0"
            borderColor="border-b-green-1"
          />
          <StatCard
            title="ویژه"
            value={displayStats.properties.featured}
            subtitle={`${displayStats.properties.featured_percentage}% از کل`}
            icon={<Star className="h-5 w-5" />}
            iconColor="text-orange-1"
            iconBg="bg-orange-0"
            borderColor="border-b-orange-1"
          />
          <StatCard
            title="تأیید شده"
            value={displayStats.properties.verified}
            subtitle={`${displayStats.properties.verified_percentage}% از کل`}
            icon={<Award className="h-5 w-5" />}
            iconColor="text-purple-1"
            iconBg="bg-purple-0"
            borderColor="border-b-purple-1"
          />
        </div>
      </div>

      {/* چارت آمار ماهانه */}
      <PropertiesChart
        monthlyStats={monthlyStats}
        statistics={stats}
        isLoading={isLoading || monthlyLoading}
      />

      {/* آمار مشاورین و آژانس‌ها */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CardWithIcon
          icon={Users}
          title="آمار مشاورین"
          iconBgColor="bg-blue"
          iconColor="stroke-blue-2"
          borderColor="border-b-blue-1"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-font-s">کل مشاورین:</span>
              <span className="text-font-p font-semibold">{displayStats.agents.total.toLocaleString('fa-IR')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-font-s">فعال:</span>
              <div className="flex items-center gap-2">
                <span className="text-font-p font-semibold">{displayStats.agents.active.toLocaleString('fa-IR')}</span>
                <Badge variant="blue">{displayStats.agents.active_percentage}%</Badge>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-font-s">تأیید شده:</span>
              <div className="flex items-center gap-2">
                <span className="text-font-p font-semibold">{displayStats.agents.verified.toLocaleString('fa-IR')}</span>
                <Badge variant="green">{displayStats.agents.verified_percentage}%</Badge>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-font-s">دارای ملک:</span>
              <span className="text-font-p font-semibold">{displayStats.agents.with_properties.toLocaleString('fa-IR')}</span>
            </div>
          </div>
        </CardWithIcon>

        <CardWithIcon
          icon={Building}
          title="آمار آژانس‌ها"
          iconBgColor="bg-purple"
          iconColor="stroke-purple-2"
          borderColor="border-b-purple-1"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-font-s">کل آژانس‌ها:</span>
              <span className="text-font-p font-semibold">{displayStats.agencies.total.toLocaleString('fa-IR')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-font-s">فعال:</span>
              <div className="flex items-center gap-2">
                <span className="text-font-p font-semibold">{displayStats.agencies.active.toLocaleString('fa-IR')}</span>
                <Badge variant="purple">{displayStats.agencies.active_percentage}%</Badge>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-font-s">تأیید شده:</span>
              <div className="flex items-center gap-2">
                <span className="text-font-p font-semibold">{displayStats.agencies.verified.toLocaleString('fa-IR')}</span>
                <Badge variant="green">{displayStats.agencies.verified_percentage}%</Badge>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-font-s">دارای ملک:</span>
              <span className="text-font-p font-semibold">{displayStats.agencies.with_properties.toLocaleString('fa-IR')}</span>
            </div>
          </div>
        </CardWithIcon>
      </div>

    </div>
  );
}

