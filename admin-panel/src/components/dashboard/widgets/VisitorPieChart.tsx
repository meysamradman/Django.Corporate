import * as React from "react";
import { Label, Pie, PieChart } from "recharts";
import { Monitor, Smartphone, Laptop } from "lucide-react";
import { Skeleton } from "@/components/elements/Skeleton";
import { useAnalytics } from "@/hooks/dashboard/useAnalytics";
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
  visitors: {
    label: "بازدیدکنندگان",
  },
  web: {
    label: "وب",
    color: "#3b82f6",
  },
  mobile: {
    label: "موبایل",
    color: "#10b981",
  },
  desktop: {
    label: "دسکتاپ",
    color: "#f59e0b",
  },
} satisfies ChartConfig;

interface SourceItem {
  name: "web" | "mobile" | "desktop";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  color: string;
}

export const VisitorPieChart: React.FC<{ isLoading?: boolean }> = ({
  isLoading: externalLoading,
}) => {
  const { data: analytics, isLoading: analyticsLoading } = useAnalytics();
  const isLoading = externalLoading || analyticsLoading;

  const testData = {
    last_30_days: {
      total: 45230,
      unique: 28900,
      web: 26500,
      app: 18730,
      mobile: 32000,
      desktop: 13230,
    },
  };

  const displayData = analytics || testData;

  const sources: SourceItem[] = React.useMemo(() => {
    const data = displayData?.last_30_days || testData.last_30_days;
    return [
      {
        name: "web" as const,
        label: "وب",
        icon: Monitor,
        value: data.web || 26500,
        color: "#3b82f6",
      },
      {
        name: "mobile" as const,
        label: "موبایل",
        icon: Smartphone,
        value: data.mobile || 32000,
        color: "#10b981",
      },
      {
        name: "desktop" as const,
        label: "دسکتاپ",
        icon: Laptop,
        value: data.desktop || 13230,
        color: "#f59e0b",
      },
    ].filter(item => item.value > 0) as SourceItem[];
  }, [displayData]);

  const chartData = React.useMemo(() => {
    return sources.map(item => ({
      name: item.name,
      value: item.value,
      fill: item.color,
    }));
  }, [sources]);

  const totalVisitors = React.useMemo(() => {
    return sources.reduce((sum, item) => sum + item.value, 0);
  }, [sources]);

  const getPercentage = (value: number) => {
    if (totalVisitors === 0) return 0;
    return ((value / totalVisitors) * 100).toFixed(1);
  };

  if (isLoading) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="flex-row items-center justify-between pb-4">
          <CardTitle>آمار بازدید</CardTitle>
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
      <ChartStyle id="visitor-pie" config={chartConfig} />
      <CardHeader className="flex-row items-center justify-between pb-4 gap-4">
        <div className="flex items-center gap-3 flex-1">
          <CardTitle>آمار بازدید</CardTitle>
          <Select defaultValue="all">
            <SelectTrigger className="w-[120px] h-9">
              <SelectValue placeholder="انتخاب" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه</SelectItem>
              <SelectItem value="web">وب</SelectItem>
              <SelectItem value="mobile">موبایل</SelectItem>
              <SelectItem value="desktop">دسکتاپ</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-center">
          <ChartContainer
            id="visitor-pie"
            config={chartConfig}
            className="w-full max-w-[400px] aspect-square"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={70}
                outerRadius={110}
                strokeWidth={2}
                stroke="#fff"
                startAngle={90}
                endAngle={-270}
              >
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="fill-font-p"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) - 8}
                            className="text-sm fill-font-s"
                          >
                            کل بازدیدکنندگان
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 16}
                            className="text-3xl font-bold fill-font-p"
                          >
                            {formatNumber(totalVisitors)}
                          </tspan>
                        </text>
                      );
                    }
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        </div>

        <div className="space-y-0 border-t border-br pt-4">
          {sources.map((source, index) => {
            const Icon = source.icon;
            const percentage = getPercentage(source.value);
            
            return (
              <div key={source.name}>
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${source.color}15` }}
                    >
                      <Icon 
                        className="w-5 h-5" 
                        style={{ color: source.color } as React.CSSProperties}
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-font-p">
                        {source.label}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: source.color }}
                        />
                        <span className="text-xs text-font-s">
                          {source.name.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-semibold text-font-p">
                      {formatNumber(source.value)}
                    </span>
                    <span className="text-xs text-font-s mt-0.5">
                      {percentage}%
                    </span>
                  </div>
                </div>
                {index < sources.length - 1 && (
                  <div className="border-t border-br" />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
