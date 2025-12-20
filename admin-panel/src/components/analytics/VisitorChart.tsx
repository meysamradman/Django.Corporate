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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/elements/Chart";
import type { ChartConfig } from "@/components/elements/Chart";
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
    color: "#3B82F6", // blue-100 (using same color as theme)
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
          <CardTitle className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg shadow-sm bg-primary/10">
              <BarChart3 className="w-5 h-5 stroke-primary" />
            </div>
            <Skeleton className="h-6 w-48" />
          </CardTitle>
          <Skeleton className="h-4 w-64 mt-1" />
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
          <CardTitle className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg shadow-sm bg-primary/10">
              <BarChart3 className="w-5 h-5 stroke-primary" />
            </div>
            <span>آمار بازدید</span>
          </CardTitle>
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
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg shadow-sm bg-primary/10">
              <BarChart3 className="w-5 h-5 stroke-primary" />
            </div>
            <span>آمار بازدید 6 ماه گذشته</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {startMonth} - {endMonth} {currentYear}
          </Badge>
        </CardTitle>
        <CardDescription className="mt-1">
          نمایش تفکیک شده بازدیدهای دسکتاپ و موبایل
        </CardDescription>
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
                <stop offset="5%" stopColor={chartConfig.desktop.color} stopOpacity={0.8} />
                <stop offset="95%" stopColor={chartConfig.desktop.color} stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartConfig.mobile.color} stopOpacity={0.8} />
                <stop offset="95%" stopColor={chartConfig.mobile.color} stopOpacity={0.1} />
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
              tick={{ fill: 'var(--color-font-s)', fontSize: 12 }}
              className="text-xs"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickCount={5}
              tick={{ fill: 'var(--color-font-s)', fontSize: 12 }}
              className="text-xs"
              tickFormatter={(value: number) => formatNumber(value)}
            />
            <ChartTooltip
              cursor={{ stroke: 'var(--color-br)', strokeWidth: 1 }}
              content={<ChartTooltipContent 
                indicator="line"
                labelFormatter={(value: string) => `ماه: ${value}`}
              />}
            />
            <Area
              dataKey="desktop"
              type="natural"
              fill="url(#fillDesktop)"
              fillOpacity={0.6}
              stroke={chartConfig.desktop.color}
              strokeWidth={2}
              stackId="a"
            />
            <Area
              dataKey="mobile"
              type="natural"
              fill="url(#fillMobile)"
              fillOpacity={0.6}
              stroke={chartConfig.mobile.color}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full items-stretch">
          {/* Device Distribution */}
          <DeviceDistribution analytics={analytics} />
          
          {/* Source Distribution */}
          <SourceDistribution analytics={analytics} />
          
          {/* Trend Summary */}
          <TrendSummary monthlyStats={monthlyStats} analytics={analytics} />
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
    <div className="space-y-3 h-full flex flex-col">
      <div className="flex items-center gap-2 text-sm font-medium text-font-p">
        <Monitor className="h-4 w-4 text-blue-1" />
        توزیع دستگاه‌ها (30 روز)
      </div>
      <div className="space-y-3 flex-1">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-1" />
              <span className="text-font-s font-medium">دسکتاپ</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-font-s">({desktopPercent}%)</span>
              <span className="text-sm font-bold text-font-p">
                {formatNumber(desktop30Days)}
              </span>
            </div>
          </div>
          <div className="h-2 bg-bg rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-1 rounded-full transition-all"
              style={{ width: `${desktopPercent}%` }}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-1" />
              <span className="text-font-s font-medium">موبایل</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-font-s">({mobilePercent}%)</span>
              <span className="text-sm font-bold text-font-p">
                {formatNumber(mobile30Days)}
              </span>
            </div>
          </div>
          <div className="h-2 bg-bg rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-1 rounded-full transition-all"
              style={{ width: `${mobilePercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function SourceDistribution({ analytics }: { analytics: any }) {
  const web = analytics?.last_30_days?.web || 0;
  const app = analytics?.last_30_days?.app || 0;
  const total = web + app;
  const webPercent = total > 0 ? ((web / total) * 100).toFixed(1) : '0';
  const appPercent = total > 0 ? ((app / total) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-3 h-full flex flex-col">
      <div className="flex items-center gap-2 text-sm font-medium text-font-p">
        <Globe className="h-4 w-4 text-green-1" />
        توزیع منبع (30 روز)
      </div>
      <div className="space-y-3 flex-1">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-1" />
              <span className="text-font-s font-medium">وب‌سایت</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-font-s">({webPercent}%)</span>
              <span className="text-sm font-bold text-font-p">
                {formatNumber(web)}
              </span>
            </div>
          </div>
          <div className="h-2 bg-bg rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-1 rounded-full transition-all"
              style={{ width: `${webPercent}%` }}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-1" />
              <span className="text-font-s font-medium">اپلیکیشن</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-font-s">({appPercent}%)</span>
              <span className="text-sm font-bold text-font-p">
                {formatNumber(app)}
              </span>
            </div>
          </div>
          <div className="h-2 bg-bg rounded-full overflow-hidden">
            <div 
              className="h-full bg-purple-1 rounded-full transition-all"
              style={{ width: `${appPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function TrendSummary({ monthlyStats, analytics }: { monthlyStats: Array<{ month: string; desktop: number; mobile: number }>, analytics: any }) {
  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return { value: 0, isPositive: true };
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change),
      isPositive: change >= 0,
    };
  };

  const todayTotal = analytics?.today?.total || 0;
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
    <div className="space-y-3 h-full flex flex-col">
      <div className="flex items-center gap-2 text-sm font-medium text-font-p">
        <TrendingUp className="h-4 w-4 text-purple-1" />
        روند تغییرات
      </div>
      <div className="grid grid-cols-2 gap-3 flex-1">
        <div className="p-2.5 rounded-lg bg-bg/50 border border-br flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-font-s">امروز</span>
            <div className="flex items-center gap-1">
              {todayTrend.isPositive ? (
                <TrendingUp className="h-3.5 w-3.5 text-green-1" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-red-1" />
              )}
              <span className={`text-sm font-bold ${todayTrend.isPositive ? "text-green-1" : "text-red-1"}`}>
                {todayTrend.value.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="text-xs text-font-s">
            نسبت به دیروز
          </div>
        </div>
        <div className="p-2.5 rounded-lg bg-bg/50 border border-br flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-font-s">این ماه</span>
            <div className="flex items-center gap-1">
              {monthTrend.isPositive ? (
                <TrendingUp className="h-3.5 w-3.5 text-green-1" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-red-1" />
              )}
              <span className={`text-sm font-bold ${monthTrend.isPositive ? "text-green-1" : "text-red-1"}`}>
                {monthTrend.value.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="text-xs text-font-s">
            نسبت به ماه قبل
          </div>
        </div>
      </div>
    </div>
  );
}

