import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Skeleton } from "@/components/elements/Skeleton";
import { useAnalytics } from "@/components/dashboard/hooks/useAnalytics";
import { formatNumber } from "@/core/utils/format";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/elements/Card";
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
  total: {
    label: "کل بازدید",
    color: "var(--chart-1)",
  },
  unique: {
    label: "بازدید یکتا",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

const generateMockData = () => {
  const months = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
  return months.map((month) => ({
    month: month.substring(0, 3),
    total: Math.floor(Math.random() * 50000) + 20000,
    unique: Math.floor(Math.random() * 35000) + 15000,
  }));
};

export const VisitorTrendChart: React.FC<{ isLoading?: boolean }> = ({
  isLoading: externalLoading,
}) => {
  const { data: analytics, isLoading: analyticsLoading } = useAnalytics();
  const isLoading = externalLoading || analyticsLoading;
  const [timeRange, setTimeRange] = React.useState("year");

  const mockData = React.useMemo(() => generateMockData(), []);

  const chartData = React.useMemo(() => {
    return mockData;
  }, [mockData]);

  const metrics = React.useMemo(() => {
    const total = chartData.reduce((sum, item) => sum + item.total, 0);
    const unique = chartData.reduce((sum, item) => sum + item.unique, 0);
    const avgDaily = Math.floor(total / 30);
    return {
      total,
      unique,
      avgDaily,
    };
  }, [chartData]);

  if (isLoading) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="flex-row items-center justify-between pb-4 gap-4">
          <CardTitle>روند بازدید</CardTitle>
          <Skeleton className="h-9 w-32 rounded-md" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      <ChartStyle id="visitor-trend" config={chartConfig} />
      <CardHeader className="flex-row items-center justify-between pb-4 gap-4">
        <CardTitle>روند بازدید</CardTitle>
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
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-3 gap-4 border-b border-br pb-4">
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-font-p">
              {formatNumber(metrics.total)}
            </span>
            <span className="text-sm text-font-s mt-1">کل بازدید</span>
          </div>
          <div className="flex flex-col border-r border-l border-br px-4">
            <span className="text-2xl font-bold text-font-p">
              {formatNumber(metrics.unique)}
            </span>
            <span className="text-sm text-font-s mt-1">بازدید یکتا</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-font-p">
              {formatNumber(metrics.avgDaily)}
            </span>
            <span className="text-sm text-font-s mt-1">میانگین روزانه</span>
          </div>
        </div>

        <ChartContainer
          id="visitor-trend"
          config={chartConfig}
          className="h-[300px] w-full"
        >
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-total)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-total)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillUnique" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-unique)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-unique)"
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
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="var(--color-total)"
              fill="url(#fillTotal)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="unique"
              stroke="var(--color-unique)"
              fill="url(#fillUnique)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>

        <div className="flex items-center justify-center gap-6 pt-2">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: "var(--color-total)" }}
            />
            <span className="text-sm text-font-s">کل بازدید</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: "var(--color-unique)" }}
            />
            <span className="text-sm text-font-s">بازدید یکتا</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
