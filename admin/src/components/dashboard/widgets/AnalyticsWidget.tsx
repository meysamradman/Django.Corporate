"use client";

import { useMemo } from "react";
import { BarChart3, Globe, Smartphone, Monitor, MapPin, FileText } from "lucide-react";
import { Skeleton } from "@/components/elements/Skeleton";
import { useAnalytics } from "@/components/dashboard/hooks/useAnalytics";
import { usePermission } from "@/core/permissions/context/PermissionContext";
import { formatNumber } from "@/core/utils/format";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig
} from "@/components/elements/Chart";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

interface AnalyticsWidgetProps {
  isLoading?: boolean;
}

const COLORS = {
  web: '#3B82F6',
  app: '#10B981',
  mobile: '#8B5CF6',
  desktop: '#6366F1',
};

export const AnalyticsWidget: React.FC<AnalyticsWidgetProps> = ({ isLoading: externalLoading }) => {
  const { hasPermission } = usePermission();
  const { data: analytics, isLoading: analyticsLoading } = useAnalytics();
  const isLoading = externalLoading || analyticsLoading;

  if (!hasPermission('analytics.manage')) {
    return null;
  }

  // Test data for styling preview - TODO: Remove when ready for production
  const testData = {
    today: {
      total: 1250,
      unique: 890,
      web: 750,
      app: 500,
    },
    last_30_days: {
      total: 45230,
      unique: 28900,
      web: 26500,
      app: 18730,
      mobile: 32000,
      desktop: 13230,
    },
    top_pages: [
      { path: '/', count: 12500 },
      { path: '/about', count: 8900 },
      { path: '/portfolio', count: 6700 },
      { path: '/blog', count: 5400 },
      { path: '/contact', count: 3200 },
    ],
    top_countries: [
      { country: 'ایران', count: 35000 },
      { country: 'آمریکا', count: 5200 },
      { country: 'کانادا', count: 2800 },
      { country: 'انگلستان', count: 1500 },
      { country: 'آلمان', count: 730 },
    ],
  };

  // TEMPORARY: Force test data for styling preview - Change to: const displayData = analytics || testData;
  const displayData = testData; // Force test data to see styling

  const chartData = useMemo(() => {
    if (!displayData?.last_30_days) return [];
    
    return [
      {
        name: 'کل بازدیدها',
        value: displayData.last_30_days.total,
        color: COLORS.web,
      },
      {
        name: 'بازدیدکنندگان یکتا',
        value: displayData.last_30_days.unique,
        color: COLORS.app,
      },
      {
        name: 'وب',
        value: displayData.last_30_days.web,
        color: COLORS.web,
      },
      {
        name: 'اپلیکیشن',
        value: displayData.last_30_days.app,
        color: COLORS.app,
      },
      {
        name: 'موبایل',
        value: displayData.last_30_days.mobile,
        color: COLORS.mobile,
      },
      {
        name: 'دسکتاپ',
        value: displayData.last_30_days.desktop,
        color: COLORS.desktop,
      },
    ];
  }, [displayData]);

  const chartConfig = useMemo(() => ({
    value: {
      label: 'بازدید',
      color: COLORS.web,
    },
  } satisfies ChartConfig), []);

  if (isLoading) {
    return (
      <div className="bg-card border border-br rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="w-9 h-9 rounded-lg" />
          <div className="text-right flex-1">
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
        <Skeleton className="w-full h-[300px] rounded-lg" />
      </div>
    );
  }

  return (
    <div className="bg-card border border-br rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <BarChart3 className="w-5 h-5 text-primary" />
        </div>
        <div className="text-right">
          <h2 className="text-lg font-semibold text-font-p">آمار بازدید</h2>
          <p className="text-xs text-font-s">آمار بازدید وب‌سایت و اپلیکیشن</p>
        </div>
      </div>

      {/* Today Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="p-3 rounded-lg border border-br bg-bg">
          <div className="flex items-center gap-2 mb-1">
            <Globe className="w-4 h-4 text-blue-1" />
            <span className="text-xs text-font-s font-medium">امروز</span>
          </div>
          <p className="text-lg font-bold text-font-p text-right">
            {formatNumber(displayData.today.total)}
          </p>
          <p className="text-xs text-font-s text-right">
            {formatNumber(displayData.today.unique)} یکتا
          </p>
        </div>
        <div className="p-3 rounded-lg border border-br bg-bg">
          <div className="flex items-center gap-2 mb-1">
            <Smartphone className="w-4 h-4 text-green-1" />
            <span className="text-xs text-font-s font-medium">وب</span>
          </div>
          <p className="text-lg font-bold text-font-p text-right">
            {formatNumber(displayData.today.web)}
          </p>
        </div>
        <div className="p-3 rounded-lg border border-br bg-bg">
          <div className="flex items-center gap-2 mb-1">
            <Monitor className="w-4 h-4 text-purple-1" />
            <span className="text-xs text-font-s font-medium">اپ</span>
          </div>
          <p className="text-lg font-bold text-font-p text-right">
            {formatNumber(displayData.today.app)}
          </p>
        </div>
        <div className="p-3 rounded-lg border border-br bg-bg">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-amber-1" />
            <span className="text-xs text-font-s font-medium">30 روز</span>
          </div>
          <p className="text-lg font-bold text-font-p text-right">
            {formatNumber(displayData.last_30_days.total)}
          </p>
        </div>
      </div>

      {/* Chart */}
      <ChartContainer 
        config={chartConfig} 
        className="min-h-[300px] w-full mb-4 [&_.recharts-cartesian-axis-tick_text]:text-right [&_.recharts-cartesian-axis-tick_text]:direction-rtl"
        style={{ direction: 'rtl' }}
      >
        <BarChart data={chartData}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="name"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tick={{ fill: '#6b6876', fontSize: 11 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#6b6876', fontSize: 11 }}
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent indicator="dashed" />}
          />
          <Bar 
            dataKey="value" 
            fill="var(--color-value)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ChartContainer>

      {/* Top Pages & Countries */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Top Pages */}
        {displayData.top_pages && displayData.top_pages.length > 0 && (
          <div className="p-3 rounded-lg border border-br bg-bg">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-blue-1" />
              <span className="text-sm font-semibold text-font-p">صفحات پربازدید</span>
            </div>
            <div className="space-y-2">
              {displayData.top_pages.slice(0, 5).map((page, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <span className="text-font-s truncate flex-1 text-left ml-2">
                    {page.path || '/'}
                  </span>
                  <span className="text-font-p font-medium">
                    {formatNumber(page.count)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Countries */}
        {displayData.top_countries && displayData.top_countries.length > 0 && (
          <div className="p-3 rounded-lg border border-br bg-bg">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-green-1" />
              <span className="text-sm font-semibold text-font-p">کشورهای پربازدید</span>
            </div>
            <div className="space-y-2">
              {displayData.top_countries.slice(0, 5).map((country, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <span className="text-font-s truncate flex-1 text-left ml-2">
                    {country.country || 'نامشخص'}
                  </span>
                  <span className="text-font-p font-medium">
                    {formatNumber(country.count)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
