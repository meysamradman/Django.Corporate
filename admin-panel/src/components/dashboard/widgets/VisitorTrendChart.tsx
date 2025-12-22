import { useState, useMemo, type FC } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Skeleton } from "@/components/elements/Skeleton";
import { useContentTrend } from "@/hooks/dashboard/useAnalytics";
import { formatNumber } from "@/core/utils/format";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { LineChart } from "lucide-react";
import {
  ChartContainer,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/elements/Chart";
import type { ChartConfig } from "@/components/elements/Chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/elements/Select";

const chartConfig = {
  portfolios: {
    label: "نمونه کارها",
    color: "hsl(var(--primary))",
  },
  posts: {
    label: "وبلاگ",
    color: "#2563eb",
  },
  media: {
    label: "رسانه‌ها",
    color: "#10b981",
  },
} satisfies ChartConfig;

export const VisitorTrendChart: FC<{ isLoading?: boolean }> = ({
  isLoading: externalLoading,
}) => {
  const { data: trendData, isLoading: trendLoading } = useContentTrend();
  const isLoading = externalLoading || trendLoading;
  const [timeRange, setTimeRange] = useState("year");

  const chartData = useMemo(() => {
    return trendData || [];
  }, [trendData]);

  const metrics = useMemo(() => {
    if (!chartData.length) return { portfolios: 0, posts: 0, media: 0 };
    return chartData.reduce(
      (acc, curr) => ({
        portfolios: acc.portfolios + (Number(curr.portfolios) || 0),
        posts: acc.posts + (Number(curr.posts) || 0),
        media: acc.media + (Number(curr.media) || 0),
      }),
      { portfolios: 0, posts: 0, media: 0 }
    );
  }, [chartData]);

  if (isLoading) {
    return (
      <CardWithIcon
        icon={LineChart}
        title="روند انتشار محتوا"
        iconBgColor="bg-primary/10"
        iconColor="stroke-primary"
        borderColor="border-b-primary"
        className="h-full"
      >
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </CardWithIcon>
    );
  }

  return (
    <CardWithIcon
      icon={LineChart}
      title="روند انتشار محتوا"
      iconBgColor="bg-primary/10"
      iconColor="stroke-primary"
      borderColor="border-b-primary"
      className="h-full"
      contentClassName="space-y-6"
      titleExtra={
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="انتخاب بازه" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">هفته جاری</SelectItem>
            <SelectItem value="month">ماه جاری</SelectItem>
            <SelectItem value="year">سال جاری</SelectItem>
          </SelectContent>
        </Select>
      }
    >
      <div className="space-y-6">
        <ChartStyle id="visitor-trend" config={chartConfig} />

        <div className="grid grid-cols-3 gap-4 border-b border-br pb-4">
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-font-p">
              {formatNumber(metrics.portfolios)}
            </span>
            <span className="text-sm text-font-s mt-1">نمونه کارها</span>
          </div>
          <div className="flex flex-col border-r border-l border-br px-4">
            <span className="text-2xl font-bold text-font-p">
              {formatNumber(metrics.posts)}
            </span>
            <span className="text-sm text-font-s mt-1">وبلاگ</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-font-p">
              {formatNumber(metrics.media)}
            </span>
            <span className="text-sm text-font-s mt-1">رسانه‌ها</span>
          </div>
        </div>

        <ChartContainer
          id="visitor-trend"
          config={chartConfig}
          className="h-[300px] w-full"
        >
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="fillPortfolios" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-portfolios)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-portfolios)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillPosts" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-posts)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-posts)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillMedia" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-media)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-media)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-br" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              className="text-xs fill-font-s"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              className="text-xs fill-font-s"
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Area
              type="monotone"
              dataKey="portfolios"
              stroke="var(--color-portfolios)"
              fill="url(#fillPortfolios)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="posts"
              stroke="var(--color-posts)"
              fill="url(#fillPosts)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="media"
              stroke="var(--color-media)"
              fill="url(#fillMedia)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </div>
    </CardWithIcon>
  );
};
