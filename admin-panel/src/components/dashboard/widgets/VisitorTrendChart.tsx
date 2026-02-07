import { useState, useMemo, type FC } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Skeleton } from "@/components/elements/Skeleton";

import { formatNumber } from "@/core/utils/commonFormat";
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
  sale_properties: {
    label: "ثبت فروش",
    color: "#f59e0b",
  },
  rent_properties: {
    label: "ثبت اجاره",
    color: "#3b82f6",
  },
  inquiries: {
    label: "درخواست‌ها",
    color: "#10b981",
  },
  properties: {
    label: "کل املاک",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export const VisitorTrendChart: FC<{ isLoading?: boolean }> = ({
  isLoading: externalLoading,
}) => {
  const [timeRange, setTimeRange] = useState("year");
  const chartData = [
    { month: "فروردین", sale_properties: 65, rent_properties: 40, inquiries: 120, properties: 105 },
    { month: "اردیبهشت", sale_properties: 59, rent_properties: 45, inquiries: 135, properties: 104 },
    { month: "خرداد", sale_properties: 80, rent_properties: 55, inquiries: 160, properties: 135 },
    { month: "تیر", sale_properties: 81, rent_properties: 60, inquiries: 150, properties: 141 },
    { month: "مرداد", sale_properties: 56, rent_properties: 50, inquiries: 140, properties: 106 },
    { month: "شهریور", sale_properties: 55, rent_properties: 45, inquiries: 130, properties: 100 },
    { month: "مهر", sale_properties: 40, rent_properties: 35, inquiries: 110, properties: 75 },
    { month: "آبان", sale_properties: 70, rent_properties: 60, inquiries: 170, properties: 130 },
    { month: "آذر", sale_properties: 85, rent_properties: 70, inquiries: 190, properties: 155 },
    { month: "دی", sale_properties: 90, rent_properties: 75, inquiries: 210, properties: 165 },
    { month: "بهمن", sale_properties: 100, rent_properties: 85, inquiries: 240, properties: 185 },
    { month: "اسفند", sale_properties: 110, rent_properties: 90, inquiries: 260, properties: 200 },
  ];

  /*
  const { data: trendData, isLoading: trendLoading } = useContentTrend();
  const isLoading = externalLoading || trendLoading;
  const chartData = useMemo(() => {
    return trendData || [];
  }, [trendData]);
  */

  const isLoading = false;

  const metrics = useMemo(() => {
    if (!chartData.length) return { properties: 0, inquiries: 0, sale: 0, rent: 0 };
    return chartData.reduce(
      (acc, curr) => ({
        properties: acc.properties + (Number(curr.properties) || 0),
        inquiries: acc.inquiries + (Number(curr.inquiries) || 0),
        sale: acc.sale + (Number(curr.sale_properties) || 0),
        rent: acc.rent + (Number(curr.rent_properties) || 0),
      }),
      { properties: 0, inquiries: 0, sale: 0, rent: 0 }
    );
  }, [chartData]);

  if (isLoading) {
    return (
      <CardWithIcon
        icon={LineChart}
        title="روند فعالیت املاک"
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
      title="روند فعالیت املاک"
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

        <div className="grid grid-cols-4 gap-4 border-b border-br pb-4">
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-font-p">
              {formatNumber(metrics.sale)}
            </span>
            <span className="text-xs text-font-s mt-1">املاک فروش</span>
          </div>
          <div className="flex flex-col border-r border-br px-4">
            <span className="text-2xl font-bold text-font-p">
              {formatNumber(metrics.rent)}
            </span>
            <span className="text-xs text-font-s mt-1">املاک اجاره</span>
          </div>
          <div className="flex flex-col border-r border-br px-4">
            <span className="text-2xl font-bold text-font-p">
              {formatNumber(metrics.inquiries)}
            </span>
            <span className="text-xs text-font-s mt-1">درخواست‌ها</span>
          </div>
          <div className="flex flex-col border-r border-br px-4">
            <span className="text-2xl font-bold text-font-p">
              {formatNumber(metrics.properties)}
            </span>
            <span className="text-xs text-font-s mt-1">کل ثبت‌ها</span>
          </div>
        </div>

        <ChartContainer
          id="visitor-trend"
          config={chartConfig}
          className="h-[300px] w-full"
        >
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="fillSale" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-sale_properties)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-sale_properties)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillRent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-rent_properties)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-rent_properties)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillInquiries" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-inquiries)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-inquiries)" stopOpacity={0.1} />
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
              dataKey="sale_properties"
              stroke="var(--color-sale_properties)"
              fill="url(#fillSale)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="rent_properties"
              stroke="var(--color-rent_properties)"
              fill="url(#fillRent)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="inquiries"
              stroke="var(--color-inquiries)"
              fill="url(#fillInquiries)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </div>
    </CardWithIcon>
  );
};
