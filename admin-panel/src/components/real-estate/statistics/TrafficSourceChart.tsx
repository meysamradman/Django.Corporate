import * as React from "react";
import { Label, Pie, PieChart } from "recharts";
import { Globe, Smartphone } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/elements/Card";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/elements/Chart";
import { Skeleton } from "@/components/elements/Skeleton";
import { formatNumber } from "@/core/utils/format";

const chartConfig = {
    views: {
        label: "بازدید کل",
    },
    web: {
        label: "وب‌سایت",
        color: "hsl(var(--chart-1))",
    },
    app: {
        label: "اپلیکیشن",
        color: "hsl(var(--chart-2))",
    },
} satisfies ChartConfig;

interface TrafficSourceChartProps {
    data?: {
        web_views: number;
        app_views: number;
        total_views: number;
    };
    isLoading?: boolean;
}

export function TrafficSourceChart({ data, isLoading }: TrafficSourceChartProps) {
    const totalViews = React.useMemo(() => {
        return (data?.web_views || 0) + (data?.app_views || 0);
    }, [data]);

    const chartData = React.useMemo(() => [
        { browser: "web", visitors: data?.web_views || 0, fill: "var(--color-web)" },
        { browser: "app", visitors: data?.app_views || 0, fill: "var(--color-app)" },
    ], [data]);

    if (isLoading) {
        return (
            <Card className="flex flex-col h-full shadow-md border-none">
                <CardHeader className="items-center pb-0">
                    <Skeleton className="h-6 w-32 rounded-full" />
                    <Skeleton className="h-4 w-48 mt-2" />
                </CardHeader>
                <CardContent className="flex-1 flex items-center justify-center pb-0">
                    <Skeleton className="h-[200px] w-[200px] rounded-full" />
                </CardContent>
            </Card>
        );
    }

    if (totalViews === 0) {
        return (
            <Card className="flex flex-col h-full shadow-md border-none">
                <CardHeader className="items-center pb-0">
                    <CardTitle className="text-base text-font-p">منابع ترافیک</CardTitle>
                    <CardDescription>داده‌ای یافت نشد</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                    هیچ بازدیدی ثبت نشده است
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="flex flex-col h-full shadow-md border-none bg-card">
            <CardHeader className="items-center pb-0 text-center">
                <CardTitle className="text-lg font-bold text-font-p">منابع ترافیک</CardTitle>
                <CardDescription className="text-xs">
                    تفکیک بازدید ۳۰ روز گذشته
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
                <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square max-h-[250px]"
                >
                    <PieChart>
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                        />
                        <Pie
                            data={chartData}
                            dataKey="visitors"
                            nameKey="browser"
                            innerRadius={60}
                            outerRadius={85}
                            strokeWidth={5}
                            stroke="hsl(var(--card))"
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
                                            >
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={viewBox.cy}
                                                    className="fill-foreground text-3xl font-bold"
                                                >
                                                    {totalViews.toLocaleString()}
                                                </tspan>
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={(viewBox.cy || 0) + 24}
                                                    className="fill-muted-foreground text-xs"
                                                >
                                                    بازدید کل
                                                </tspan>
                                            </text>
                                        )
                                    }
                                }}
                            />
                        </Pie>
                    </PieChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col gap-3 text-sm pt-4 pb-6">
                <div className="flex w-full items-center justify-between px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                            <Globe className="h-4 w-4" />
                        </div>
                        <span className="font-medium text-gray-600 dark:text-gray-300">وب‌سایت</span>
                    </div>
                    <span className="font-bold text-lg text-gray-900 dark:text-gray-100 font-mono">{formatNumber(data?.web_views || 0)}</span>
                </div>
                <div className="flex w-full items-center justify-between px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                            <Smartphone className="h-4 w-4" />
                        </div>
                        <span className="font-medium text-gray-600 dark:text-gray-300">اپلیکیشن</span>
                    </div>
                    <span className="font-bold text-lg text-gray-900 dark:text-gray-100 font-mono">{formatNumber(data?.app_views || 0)}</span>
                </div>
            </CardFooter>
        </Card>
    );
}
