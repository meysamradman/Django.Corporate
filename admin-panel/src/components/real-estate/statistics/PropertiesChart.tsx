import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Legend } from "recharts";
import { Home, FileText, Star, Award, BarChart3 } from "lucide-react";
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
  ChartLegendContent,
} from "@/components/elements/Chart";
import type { ChartConfig } from "@/components/elements/Chart";
import { Skeleton } from "@/components/elements/Skeleton";
import { formatNumber, getPersianYear } from "@/core/utils/format";
import { Badge } from "@/components/elements/Badge";

const chartConfig = {
  published: {
    label: "منتشر شده",
    color: "#10B981", // green-500
  },
  draft: {
    label: "پیش‌نویس",
    color: "#F59E0B", // amber-500
  },
  featured: {
    label: "ویژه",
    color: "#8B5CF6", // violet-500
  },
  verified: {
    label: "تأیید شده",
    color: "#EF4444", // red-500
  },
  total: {
    label: "کل املاک",
    color: "#3B82F6", // blue-500
  },
} satisfies ChartConfig;

interface PropertiesChartProps {
  monthlyStats: Array<{
    month: string;
    published: number;
    draft: number;
    featured: number;
    verified: number;
  }>;
  statistics?: {
    properties?: {
      published: number;
      draft: number;
      featured: number;
      verified: number;
      total: number;
    };
  };
  isLoading?: boolean;
}

export function PropertiesChart({ monthlyStats, statistics, isLoading }: PropertiesChartProps) {
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
            <span>آمار املاک</span>
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
    total: (item.published || 0) + (item.draft || 0),
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
            <span>آمار املاک 6 ماه گذشته</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {startMonth} - {endMonth} {currentYear}
          </Badge>
        </CardTitle>
        <CardDescription className="mt-1">
          نمایش تفکیک شده املاک منتشر شده و پیش‌نویس
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
              <linearGradient id="fillPublished" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartConfig.published.color} stopOpacity={0.8} />
                <stop offset="95%" stopColor={chartConfig.published.color} stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillDraft" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartConfig.draft.color} stopOpacity={0.8} />
                <stop offset="95%" stopColor={chartConfig.draft.color} stopOpacity={0.1} />
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
              dataKey="published"
              type="natural"
              fill="url(#fillPublished)"
              fillOpacity={0.6}
              stroke={chartConfig.published.color}
              strokeWidth={2}
              stackId="a"
            />
            <Area
              dataKey="draft"
              type="natural"
              fill="url(#fillDraft)"
              fillOpacity={0.6}
              stroke={chartConfig.draft.color}
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
          <PropertyStatusDistribution statistics={statistics} />

          <FeaturedVerifiedDistribution statistics={statistics} />

          <TrendSummary monthlyStats={monthlyStats} />
        </div>
      </CardFooter>
    </Card>
  );
}

function PropertyStatusDistribution({ statistics }: { statistics: any }) {
  const published = statistics?.properties?.published || 0;
  const draft = statistics?.properties?.draft || 0;
  const total = statistics?.properties?.total || 0;

  const publishedPercent = total > 0 ? ((published / total) * 100).toFixed(1) : "0";
  const draftPercent = total > 0 ? ((draft / total) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-3 h-full flex flex-col">
      <div className="flex items-center gap-2 text-sm font-medium text-font-p">
        <Home className="h-4 w-4 text-green-1" />
        وضعیت انتشار (کل)
      </div>
      <div className="space-y-3 flex-1">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-1" />
              <span className="text-font-s font-medium">منتشر شده</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-font-s">({publishedPercent}%)</span>
              <span className="text-sm font-bold text-font-p">
                {formatNumber(published)}
              </span>
            </div>
          </div>
          <div className="h-2 bg-bg rounded-full overflow-hidden">
            <div
              className="h-full bg-green-1 rounded-full transition-all"
              style={{ width: `${publishedPercent}%` }}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-1" />
              <span className="text-font-s font-medium">پیش‌نویس</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-font-s">({draftPercent}%)</span>
              <span className="text-sm font-bold text-font-p">
                {formatNumber(draft)}
              </span>
            </div>
          </div>
          <div className="h-2 bg-bg rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-1 rounded-full transition-all"
              style={{ width: `${draftPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function FeaturedVerifiedDistribution({ statistics }: { statistics: any }) {
  const featured = statistics?.properties?.featured || 0;
  const verified = statistics?.properties?.verified || 0;
  const total = statistics?.properties?.total || 0;

  const featuredPercent = total > 0 ? ((featured / total) * 100).toFixed(1) : '0';
  const verifiedPercent = total > 0 ? ((verified / total) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-3 h-full flex flex-col">
      <div className="flex items-center gap-2 text-sm font-medium text-font-p">
        <Award className="h-4 w-4 text-purple-1" />
        ویژگی‌های ویژه
      </div>
      <div className="space-y-3 flex-1">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-1" />
              <span className="text-font-s font-medium">ویژه</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-font-s">({featuredPercent}%)</span>
              <span className="text-sm font-bold text-font-p">
                {formatNumber(featured)}
              </span>
            </div>
          </div>
          <div className="h-2 bg-bg rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-1 rounded-full transition-all"
              style={{ width: `${featuredPercent}%` }}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-1" />
              <span className="text-font-s font-medium">تأیید شده</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-font-s">({verifiedPercent}%)</span>
              <span className="text-sm font-bold text-font-p">
                {formatNumber(verified)}
              </span>
            </div>
          </div>
          <div className="h-2 bg-bg rounded-full overflow-hidden">
            <div
              className="h-full bg-red-1 rounded-full transition-all"
              style={{ width: `${verifiedPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function TrendSummary({ monthlyStats }: { monthlyStats: Array<{ month: string; published: number; draft: number; featured: number; verified: number }> }) {
  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return { value: 0, isPositive: true };
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change),
      isPositive: change >= 0,
    };
  };

  const thisMonthPublished = monthlyStats.length > 0
    ? (monthlyStats[monthlyStats.length - 1]?.published || 0)
    : 0;
  const lastMonthPublished = monthlyStats.length > 1
    ? (monthlyStats[monthlyStats.length - 2]?.published || 0)
    : 0;
  const publishedTrend = calculateTrend(thisMonthPublished, lastMonthPublished);

  const thisMonthTotal = monthlyStats.length > 0
    ? (monthlyStats[monthlyStats.length - 1]?.published || 0) + (monthlyStats[monthlyStats.length - 1]?.draft || 0)
    : 0;
  const lastMonthTotal = monthlyStats.length > 1
    ? (monthlyStats[monthlyStats.length - 2]?.published || 0) + (monthlyStats[monthlyStats.length - 2]?.draft || 0)
    : 0;
  const totalTrend = calculateTrend(thisMonthTotal, lastMonthTotal);

  return (
    <div className="space-y-3 h-full flex flex-col">
      <div className="flex items-center gap-2 text-sm font-medium text-font-p">
        <Star className="h-4 w-4 text-indigo-1" />
        روند تغییرات
      </div>
      <div className="grid grid-cols-2 gap-3 flex-1">
        <div className="p-2.5 rounded-lg bg-bg/50 border border-br flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-font-s">منتشر شده</span>
            <div className="flex items-center gap-1">
              {publishedTrend.isPositive ? (
                <Award className="h-3.5 w-3.5 text-green-1" />
              ) : (
                <FileText className="h-3.5 w-3.5 text-red-1" />
              )}
              <span className={`text-sm font-bold ${publishedTrend.isPositive ? "text-green-1" : "text-red-1"}`}>
                {publishedTrend.value.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="text-xs text-font-s">
            نسبت به ماه قبل
          </div>
        </div>
        <div className="p-2.5 rounded-lg bg-bg/50 border border-br flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-font-s">کل املاک</span>
            <div className="flex items-center gap-1">
              {totalTrend.isPositive ? (
                <Home className="h-3.5 w-3.5 text-green-1" />
              ) : (
                <BarChart3 className="h-3.5 w-3.5 text-red-1" />
              )}
              <span className={`text-sm font-bold ${totalTrend.isPositive ? "text-green-1" : "text-red-1"}`}>
                {totalTrend.value.toFixed(1)}%
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
