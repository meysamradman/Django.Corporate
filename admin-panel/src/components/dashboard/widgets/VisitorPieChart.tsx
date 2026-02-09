import { useMemo, type FC, type ComponentType, type CSSProperties } from "react";
import { Label, Pie, PieChart as RechartsPieChart } from "recharts";
import { Monitor, Smartphone, Laptop, PieChart } from "lucide-react";
import { Skeleton } from "@/components/elements/Skeleton";
import { useAnalytics } from "@/components/dashboard/hooks/useAnalytics";
import { formatNumber } from "@/core/utils/commonFormat";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
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
  icon: ComponentType<{ className?: string; color?: string; style?: CSSProperties }>;
  value: number;
  color: string;
}

export const VisitorPieChart: FC<{ isLoading?: boolean }> = ({
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

  const sources: SourceItem[] = useMemo(() => {
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

  const chartData = useMemo(() => {
    return sources.map(item => ({
      name: item.name,
      value: item.value,
      fill: item.color,
    }));
  }, [sources]);

  const totalVisitors = useMemo(() => {
    return sources.reduce((sum, item) => sum + item.value, 0);
  }, [sources]);

  const getPercentage = (value: number) => {
    if (totalVisitors === 0) return 0;
    return ((value / totalVisitors) * 100).toFixed(1);
  };

  if (isLoading) {
    return (
      <CardWithIcon
        icon={PieChart}
        title="آمار بازدید"
        iconBgColor="bg-primary/10"
        iconColor="stroke-primary"
        cardBorderColor="border-b-primary"
      >
        <div className="flex flex-col gap-4">
          <Skeleton className="h-[280px] w-full max-w-[280px] aspect-square mx-auto rounded-full" />
          <div className="space-y-4 border-t border-br pt-4">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        </div>
      </CardWithIcon>
    );
  }

  return (
    <CardWithIcon
      icon={PieChart}
      title="آمار بازدید"
      iconBgColor="bg-primary/10"
      iconColor="stroke-primary"
      cardBorderColor="border-b-primary"
      className="h-full flex flex-col"
      contentClassName="flex-1 flex flex-col pt-0 px-4 pb-0"
      titleExtra={
        <Select defaultValue="all">
          <SelectTrigger className="w-[100px] h-8 text-xs">
            <SelectValue placeholder="انتخاب" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه</SelectItem>
            <SelectItem value="web">وب</SelectItem>
            <SelectItem value="mobile">موبایل</SelectItem>
            <SelectItem value="desktop">دسکتاپ</SelectItem>
          </SelectContent>
        </Select>
      }
    >
      <div className="flex flex-col flex-1">
        <ChartStyle id="visitor-pie" config={chartConfig} />
        <div className="flex justify-center">
          <ChartContainer
            id="visitor-pie"
            config={chartConfig}
            className="w-full max-w-[320px] aspect-square mx-auto"
          >
            <RechartsPieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={65}
                outerRadius={100}
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
                            y={(viewBox.cy || 0) - 6}
                            className="text-xs fill-font-s"
                          >
                            کل بازدیدکنندگان
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 15}
                            className="text-xl font-bold fill-font-p"
                          >
                            {formatNumber(totalVisitors)}
                          </tspan>
                        </text>
                      );
                    }
                  }}
                />
              </Pie>
            </RechartsPieChart>
          </ChartContainer>
        </div>

        <div className="mt-auto space-y-0 border-t border-br pt-2">
          {sources.map((source, index) => {
            const Icon = source.icon;
            const percentage = getPercentage(source.value);

            return (
              <div key={source.name}>
                <div className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${source.color}15` }}
                    >
                      <Icon
                        className="w-[18px] h-[18px]"
                        style={{ color: source.color } as CSSProperties}
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
      </div>
    </CardWithIcon>
  );
};
