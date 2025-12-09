"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Legend } from "recharts";
import { Monitor, Globe, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
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
import { Skeleton } from "@/components/elements/Skeleton";
import { formatNumber, getPersianYear } from "@/core/utils/format";
import { Badge } from "@/components/elements/Badge";

const chartConfig = {
  desktop: {
    label: "دسکتاپ",
    color: "#3B82F6", // blue-100
  },
  mobile: {
    label: "موبایل",
    color: "#60A5FA", // blue-400 (lighter blue)
  },
  total: {
    label: "کل بازدیدها",
    color: "#3B82F6", // blue-100
  },
} satisfies ChartConfig;

interface VisitorChartProps {
  monthlyStats: Array<{
    month: string;
    desktop: number;
    mobile: number;
  }>;
  analytics?: {
    last_30_days?: {
      total: number;
      mobile: number;
      desktop: number;
      web: number;
      app: number;
    };
  };
  isLoading?: boolean;
}

export function VisitorChart({ monthlyStats, analytics, isLoading }: VisitorChartProps) {
  if (isLoading) {
    return (
      <Card className="border-b-4 border-b-primary">
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (monthlyStats.length === 0) {
    return (
      <Card className="border-b-4 border-b-primary">
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

  const chartDataWithTotal = monthlyStats.map((item) => ({
    ...item,
    total: (item.desktop || 0) + (item.mobile || 0),
  }));

  const startMonth = monthlyStats[0]?.month || "";
  const endMonth = monthlyStats[monthlyStats.length - 1]?.month || "";
  const currentYear = getPersianYear();

  return (
    <Card className="border-b-4 border-b-primary">
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
          <DeviceDistribution analytics={analytics} />
          
          {/* Source Distribution */}
          <SourceDistribution analytics={analytics} />
          
          {/* Trend Summary */}
          <TrendSummary monthlyStats={monthlyStats} />
        </div>
      </CardFooter>
    </Card>
  );
}

function DeviceDistribution({ analytics }: { analytics: any }) {
  const total30Days = analytics?.last_30_days?.total || 0;
  const mobile30Days = analytics?.last_30_days?.mobile || 0;
  const desktop30Days = analytics?.last_30_days?.desktop || 0;
  const mobilePercent = total30Days > 0 ? ((mobile30Days / total30Days) * 100).toFixed(1) : "0";
  const desktopPercent = total30Days > 0 ? ((desktop30Days / total30Days) * 100).toFixed(1) : "0";

  return (
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
  );
}

function SourceDistribution({ analytics }: { analytics: any }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-font-p">
        <Globe className="h-4 w-4 text-green-1" />
        توزیع منبع (30 روز)
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-font-s">وب‌سایت</span>
          <span className="text-font-p font-medium">
            {formatNumber(analytics?.last_30_days?.web || 0)}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-font-s">اپلیکیشن</span>
          <span className="text-font-p font-medium">
            {formatNumber(analytics?.last_30_days?.app || 0)}
          </span>
        </div>
      </div>
    </div>
  );
}

function TrendSummary({ monthlyStats }: { monthlyStats: Array<{ month: string; desktop: number; mobile: number }> }) {
  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return { value: 0, isPositive: true };
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change),
      isPositive: change >= 0,
    };
  };

  const todayTotal = 0; // TODO: Get from API
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
  );
}

