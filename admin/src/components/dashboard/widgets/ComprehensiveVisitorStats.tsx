"use client";

import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Eye, 
  Monitor, 
  Smartphone,
  Globe,
  BarChart3,
  Calendar,
  Activity
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Legend } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/elements/Card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/elements/Chart";
import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/api/analytics/route";
import { useAnalytics } from "@/components/dashboard/hooks/useAnalytics";
import { Skeleton } from "@/components/elements/Skeleton";
import { formatNumber } from "@/core/utils/format";
import { Badge } from "@/components/elements/Badge";

const chartConfig = {
  desktop: {
    label: "دسکتاپ",
    color: "hsl(var(--chart-1))",
  },
  mobile: {
    label: "موبایل",
    color: "hsl(var(--chart-2))",
  },
  total: {
    label: "کل بازدیدها",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  icon: React.ReactNode;
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
  iconBg = "bg-blue/10"
}: StatCardProps) {
  return (
    <Card className="relative overflow-hidden">
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

export function ComprehensiveVisitorStats() {
  // ============================================
  // 📊 داده‌های Mock برای نمایش و تست
  // بعدا این داده‌ها با API واقعی جایگزین می‌شوند
  // ============================================
  const mockAnalytics = {
    today: {
      total: 1247,
      unique: 892,
      web: 756,
      app: 491,
    },
    last_30_days: {
      total: 45230,
      unique: 28900,
      web: 26500,
      app: 18730,
      mobile: 32000,
      desktop: 13230,
    },
  };

  const mockMonthlyStats = {
    monthly_stats: [
      { month: "ژوئیه", desktop: 1850, mobile: 1200 },
      { month: "آگوست", desktop: 2100, mobile: 1450 },
      { month: "سپتامبر", desktop: 1950, mobile: 1380 },
      { month: "اکتبر", desktop: 2200, mobile: 1620 },
      { month: "نوامبر", desktop: 2400, mobile: 1800 },
      { month: "دسامبر", desktop: 2650, mobile: 2100 },
    ],
  };

  const { data: analytics, isLoading: analyticsLoading } = useAnalytics();
  const { data: monthlyData, isLoading: monthlyLoading } = useQuery({
    queryKey: ["analytics", "monthly-stats"],
    queryFn: () => analyticsApi.getMonthlyStats(),
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // ============================================
  // 🔄 استفاده از داده‌های Mock (موقت)
  // برای فعال کردن API واقعی، این خطوط رو تغییر بدید:
  // const displayAnalytics = analytics || mockAnalytics;
  // const displayMonthlyData = monthlyData || mockMonthlyStats;
  // ============================================
  const displayAnalytics = mockAnalytics; // موقت: استفاده از mock data
  const displayMonthlyData = mockMonthlyStats; // موقت: استفاده از mock data

  // برای نمایش mock data، loading رو false می‌ذاریم
  // بعدا که API واقعی رو فعال کردید، این رو تغییر بدید:
  // const isLoading = analyticsLoading || monthlyLoading;
  const isLoading = false;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32" />
              </CardHeader>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[400px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayData = displayAnalytics;
  const chartData = displayMonthlyData?.monthly_stats || [];

  // Calculate trends
  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return { value: 0, isPositive: true };
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change),
      isPositive: change >= 0,
    };
  };

  // Today vs Yesterday (mock for now, should come from API)
  const todayTotal = displayData.today?.total || 0;
  const yesterdayTotal = Math.floor(todayTotal * 0.85); // Mock
  const todayTrend = calculateTrend(todayTotal, yesterdayTotal);

  // This month vs Last month
  const thisMonthTotal = chartData.length > 0 
    ? (chartData[chartData.length - 1]?.desktop || 0) + (chartData[chartData.length - 1]?.mobile || 0)
    : 0;
  const lastMonthTotal = chartData.length > 1
    ? (chartData[chartData.length - 2]?.desktop || 0) + (chartData[chartData.length - 2]?.mobile || 0)
    : 0;
  const monthTrend = calculateTrend(thisMonthTotal, lastMonthTotal);

  // Device distribution
  const total30Days = displayData.last_30_days?.total || 0;
  const mobile30Days = displayData.last_30_days?.mobile || 0;
  const desktop30Days = displayData.last_30_days?.desktop || 0;
  const mobilePercent = total30Days > 0 ? ((mobile30Days / total30Days) * 100).toFixed(1) : "0";
  const desktopPercent = total30Days > 0 ? ((desktop30Days / total30Days) * 100).toFixed(1) : "0";

  // Prepare chart data with total
  const chartDataWithTotal = chartData.map((item) => ({
    ...item,
    total: (item.desktop || 0) + (item.mobile || 0),
  }));

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>آمار بازدید</CardTitle>
          <CardDescription>داده‌ای برای نمایش وجود ندارد</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[400px] text-font-s">
            داده‌ای برای نمایش وجود ندارد
          </div>
        </CardContent>
      </Card>
    );
  }

  const startMonth = chartData[0]?.month || "";
  const endMonth = chartData[chartData.length - 1]?.month || "";
  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="بازدید امروز"
          value={displayData.today?.total || 0}
          subtitle={`${displayData.today?.unique || 0} بازدیدکننده یکتا`}
          trend={{
            value: todayTrend.value,
            isPositive: todayTrend.isPositive,
            label: "نسبت به دیروز",
          }}
          icon={<Eye className="h-5 w-5" />}
          iconColor="text-blue-1"
          iconBg="bg-blue/10"
        />
        <StatCard
          title="بازدید 30 روز گذشته"
          value={displayData.last_30_days?.total || 0}
          subtitle={`${displayData.last_30_days?.unique || 0} بازدیدکننده یکتا`}
          icon={<Calendar className="h-5 w-5" />}
          iconColor="text-green-1"
          iconBg="bg-green/10"
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
          iconBg="bg-purple/10"
        />
        <StatCard
          title="بازدیدکنندگان یکتا"
          value={displayData.last_30_days?.unique || 0}
          subtitle="در 30 روز گذشته"
          icon={<Users className="h-5 w-5" />}
          iconColor="text-amber-1"
          iconBg="bg-amber/10"
        />
      </div>

      {/* Main Chart Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                آمار بازدید 6 ماه گذشته
              </CardTitle>
              <CardDescription className="mt-1">
                نمایش تفکیک شده بازدیدهای دسکتاپ و موبایل
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">
              {startMonth} - {endMonth} {currentYear}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[400px] w-full">
            <AreaChart
              accessibilityLayer
              data={chartDataWithTotal}
              margin={{
                left: -20,
                right: 12,
                top: 12,
                bottom: 12,
              }}
            >
              <defs>
                <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-desktop)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-desktop)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-mobile)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-mobile)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid 
                vertical={false} 
                strokeDasharray="3 3"
                className="stroke-border/50"
              />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                className="text-xs"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickCount={5}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                className="text-xs"
                tickFormatter={(value) => formatNumber(value)}
              />
              <ChartTooltip
                cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
                content={<ChartTooltipContent 
                  indicator="line"
                  labelFormatter={(value) => `ماه: ${value}`}
                />}
              />
              <Area
                dataKey="desktop"
                type="natural"
                fill="url(#fillDesktop)"
                fillOpacity={0.6}
                stroke="var(--color-desktop)"
                strokeWidth={2}
                stackId="a"
              />
              <Area
                dataKey="mobile"
                type="natural"
                fill="url(#fillMobile)"
                fillOpacity={0.6}
                stroke="var(--color-mobile)"
                strokeWidth={2}
                stackId="a"
              />
              <Legend
                content={<ChartLegendContent />}
                wrapperStyle={{ paddingTop: '20px' }}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
        <CardFooter>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
            {/* Device Distribution */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-font-p">
                <Monitor className="h-4 w-4 text-blue-1" />
                توزیع دستگاه‌ها (30 روز)
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[var(--color-desktop)]" />
                    <span className="text-font-s">دسکتاپ</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-font-p font-medium">
                      {formatNumber(desktop30Days)}
                    </span>
                    <span className="text-font-s">({desktopPercent}%)</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[var(--color-mobile)]" />
                    <span className="text-font-s">موبایل</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-font-p font-medium">
                      {formatNumber(mobile30Days)}
                    </span>
                    <span className="text-font-s">({mobilePercent}%)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Source Distribution */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-font-p">
                <Globe className="h-4 w-4 text-green-1" />
                توزیع منبع (30 روز)
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-font-s">وب‌سایت</span>
                  <span className="text-font-p font-medium">
                    {formatNumber(displayData.last_30_days?.web || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-font-s">اپلیکیشن</span>
                  <span className="text-font-p font-medium">
                    {formatNumber(displayData.last_30_days?.app || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Trend Summary */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-font-p">
                <TrendingUp className="h-4 w-4 text-purple-1" />
                روند تغییرات
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-font-s">امروز</span>
                  <div className="flex items-center gap-1">
                    {todayTrend.isPositive ? (
                      <TrendingUp className="h-3 w-3 text-green-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-1" />
                    )}
                    <span className={todayTrend.isPositive ? "text-green-1" : "text-red-1"}>
                      {todayTrend.value.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-font-s">این ماه</span>
                  <div className="flex items-center gap-1">
                    {monthTrend.isPositive ? (
                      <TrendingUp className="h-3 w-3 text-green-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-1" />
                    )}
                    <span className={monthTrend.isPositive ? "text-green-1" : "text-red-1"}>
                      {monthTrend.value.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

