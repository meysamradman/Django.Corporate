"use client";

import { useMemo } from "react";
import { LayoutList } from "lucide-react";
import { Skeleton } from "@/components/elements/Skeleton";
import { DashboardStats } from "@/types/analytics/analytics";
import { formatNumber } from "@/core/utils/format";
import { PermissionLocked } from "@/core/permissions/components/PermissionLocked";
import { PERMISSIONS } from "@/core/permissions/constants";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig
} from "@/components/elements/Chart";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts";

interface ContentDistributionProps {
  stats: DashboardStats | undefined;
  isLoading?: boolean;
}

// Colors match theme: amber-1, indigo-1, purple-1
const COLORS = {
  portfolio: 'hsl(var(--color-amber-1))',
  blog: 'hsl(var(--color-indigo-1))',
  media: 'hsl(var(--color-purple-1))',
};

export const ContentDistribution: React.FC<ContentDistributionProps> = ({ stats, isLoading = false }) => {
  const contentDistribution = useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'نمونه کارها', value: stats.total_portfolios, color: COLORS.portfolio },
      { name: 'بلاگ‌ها', value: stats.total_posts, color: COLORS.blog },
      { name: 'رسانه‌ها', value: stats.total_media, color: COLORS.media },
    ].filter(item => item.value > 0);
  }, [stats]);

  const contentDistributionChartData = useMemo(() => {
    if (!stats) return [];
    const data = [];
    if (stats.total_portfolios > 0) {
      data.push({ month: 'نمونه کارها', desktop: stats.total_portfolios });
    }
    if (stats.total_posts > 0) {
      data.push({ month: 'بلاگ‌ها', desktop: stats.total_posts });
    }
    if (stats.total_media > 0) {
      data.push({ month: 'رسانه‌ها', desktop: stats.total_media });
    }
    return data;
  }, [stats]);

  // Chart config uses hex colors matching theme: amber-100, indigo-100, purple-100
  const contentDistributionConfig = useMemo(() => ({
    desktop: {
      label: 'توزیع محتوا',
      color: '#F59E0B', // amber-100
    },
    portfolio: {
      label: 'نمونه کارها',
      color: '#F59E0B', // amber-100
    },
    blog: {
      label: 'بلاگ‌ها',
      color: '#6366F1', // indigo-100
    },
    media: {
      label: 'رسانه‌ها',
      color: '#8B5CF6', // purple-100
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
        <Skeleton className="w-full aspect-square max-h-[250px] rounded-lg mb-3" />
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
        <div className="pt-4 border-t border-br">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <PermissionLocked
      permission={PERMISSIONS.ANALYTICS.CONTENT_READ}
      lockedMessage="دسترسی به آمار محتوا"
      borderColorClass="border-b-primary"
      iconBgColorClass="bg-primary/10"
      iconColorClass="text-primary"
    >
      <CardWithIcon
        icon={LayoutList}
        title="توزیع محتوا"
        iconBgColor="bg-primary/10"
        iconColor="stroke-primary"
        borderColor="border-b-primary"
        className="shadow-sm"
        titleExtra={<p className="text-xs text-font-s">نمونه کارها، بلاگ‌ها و رسانه‌ها</p>}
      >
      <ChartContainer
        config={contentDistributionConfig}
        className="mx-auto aspect-square max-h-[250px] [&_.recharts-polar-angle-axis-tick_text]:text-right [&_.recharts-polar-angle-axis-tick_text]:direction-rtl [&_.recharts-polar-angle-axis-tick_text]:text-anchor-end"
        style={{ direction: 'rtl' }}
      >
        <RadarChart data={contentDistributionChartData}>
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <PolarGrid gridType="circle" radialLines={false} />
          <PolarAngleAxis 
            dataKey="month" 
            tick={{ fill: 'var(--color-font-s)', fontSize: 11 }}
          />
          <Radar
            dataKey="desktop"
            fill="var(--color-desktop)"
            fillOpacity={0.6}
            dot={{
              r: 4,
              fillOpacity: 1,
            }}
          />
        </RadarChart>
      </ChartContainer>
      <div className="grid grid-cols-3 gap-2 mt-3">
        {contentDistribution.map((item, i) => (
          <div key={i} className="text-center p-2 rounded-lg bg-bg border border-br">
            <div className="w-2.5 h-2.5 rounded-full mx-auto mb-1" style={{ backgroundColor: item.color }} />
            <p className="text-xs text-font-s mb-0.5">{item.name}</p>
            <p className="text-sm font-bold text-font-p">{formatNumber(item.value)}</p>
          </div>
        ))}
      </div>

      {/* Detailed Statistics */}
      {(stats?.total_portfolio_categories || stats?.total_portfolio_tags || stats?.total_portfolio_options || 
        stats?.total_blog_categories || stats?.total_blog_tags) && (
        <div className="mt-4 pt-4 border-t border-br">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {/* Portfolio Details */}
            {stats.total_portfolios > 0 && (
              <>
                {stats.total_portfolio_categories > 0 && (
                  <div className="text-center p-2 rounded-lg bg-bg/50 border border-br">
                    <p className="text-xs text-font-s mb-0.5">دسته‌بندی نمونه کارها</p>
                    <p className="text-sm font-bold text-amber-1">
                      {formatNumber(stats.total_portfolio_categories)}
                    </p>
                  </div>
                )}
                {stats.total_portfolio_tags > 0 && (
                  <div className="text-center p-2 rounded-lg bg-bg/50 border border-br">
                    <p className="text-xs text-font-s mb-0.5">تگ نمونه کارها</p>
                    <p className="text-sm font-bold text-amber-1">
                      {formatNumber(stats.total_portfolio_tags)}
                    </p>
                  </div>
                )}
                {stats.total_portfolio_options > 0 && (
                  <div className="text-center p-2 rounded-lg bg-bg/50 border border-br">
                    <p className="text-xs text-font-s mb-0.5">گزینه نمونه کارها</p>
                    <p className="text-sm font-bold text-amber-1">
                      {formatNumber(stats.total_portfolio_options)}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Blog Details */}
            {stats.total_posts > 0 && (
              <>
                {stats.total_blog_categories > 0 && (
                  <div className="text-center p-2 rounded-lg bg-bg/50 border border-br">
                    <p className="text-xs text-font-s mb-0.5">دسته‌بندی بلاگ</p>
                    <p className="text-sm font-bold text-indigo-1">
                      {formatNumber(stats.total_blog_categories)}
                    </p>
                  </div>
                )}
                {stats.total_blog_tags > 0 && (
                  <div className="text-center p-2 rounded-lg bg-bg/50 border border-br">
                    <p className="text-xs text-font-s mb-0.5">تگ بلاگ</p>
                    <p className="text-sm font-bold text-indigo-1">
                      {formatNumber(stats.total_blog_tags)}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
      </CardWithIcon>
    </PermissionLocked>
  );
};
