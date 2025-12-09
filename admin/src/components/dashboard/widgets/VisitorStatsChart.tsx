"use client";

import { TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
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
} from "@/components/elements/Chart";
import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/api/analytics/route";
import { Skeleton } from "@/components/elements/Skeleton";
import { formatNumber } from "@/core/utils/format";

const chartConfig = {
  desktop: {
    label: "دسکتاپ",
    color: "hsl(var(--chart-1))",
  },
  mobile: {
    label: "موبایل",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function VisitorStatsChart() {
  const { data: monthlyData, isLoading } = useQuery({
    queryKey: ["analytics", "monthly-stats"],
    queryFn: () => analyticsApi.getMonthlyStats(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
        <CardFooter>
          <Skeleton className="h-4 w-full" />
        </CardFooter>
      </Card>
    );
  }

  const chartData = monthlyData?.monthly_stats || [];

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>آمار بازدید</CardTitle>
          <CardDescription>
            نمایش کل بازدیدکنندگان در 6 ماه گذشته
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-font-s">
            داده‌ای برای نمایش وجود ندارد
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate trend (comparing last month to previous month)
  const lastMonth = chartData[chartData.length - 1];
  const prevMonth = chartData.length > 1 ? chartData[chartData.length - 2] : null;
  const totalLast = (lastMonth?.desktop || 0) + (lastMonth?.mobile || 0);
  const totalPrev = prevMonth ? (prevMonth.desktop || 0) + (prevMonth.mobile || 0) : 0;
  const trend = totalPrev > 0 
    ? ((totalLast - totalPrev) / totalPrev * 100).toFixed(1)
    : "0";
  const isPositive = parseFloat(trend) >= 0;

  // Get date range from chart data
  const startMonth = chartData[0]?.month || "";
  const endMonth = chartData[chartData.length - 1]?.month || "";
  const currentYear = new Date().getFullYear();

  return (
    <Card>
      <CardHeader>
        <CardTitle>آمار بازدید</CardTitle>
        <CardDescription>
          نمایش کل بازدیدکنندگان در 6 ماه گذشته
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: -20,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickCount={3}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Area
              dataKey="mobile"
              type="natural"
              fill="var(--color-mobile)"
              fillOpacity={0.4}
              stroke="var(--color-mobile)"
              stackId="a"
            />
            <Area
              dataKey="desktop"
              type="natural"
              fill="var(--color-desktop)"
              fillOpacity={0.4}
              stroke="var(--color-desktop)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 leading-none font-medium">
              {isPositive ? "افزایش" : "کاهش"} {Math.abs(parseFloat(trend))}% نسبت به ماه قبل{" "}
              <TrendingUp className={`h-4 w-4 ${isPositive ? "" : "rotate-180"}`} />
            </div>
            <div className="text-muted-foreground flex items-center gap-2 leading-none">
              {startMonth} - {endMonth} {currentYear}
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

