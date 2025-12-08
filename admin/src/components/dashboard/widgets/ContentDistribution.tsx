"use client";

import { useMemo } from "react";
import { LayoutList } from "lucide-react";
import { Statistics } from "@/types/statistics/statisticsWidget";
import { formatNumber } from "@/core/utils/format";
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
  stats: Statistics | undefined;
}

const COLORS = {
  portfolio: '#F59E0B',
  blog: '#6366F1',
  media: '#8B5CF6',
};

export const ContentDistribution: React.FC<ContentDistributionProps> = ({ stats }) => {
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

  const contentDistributionConfig = useMemo(() => ({
    desktop: {
      label: 'توزیع محتوا',
      color: COLORS.portfolio,
    },
    portfolio: {
      label: 'نمونه کارها',
      color: COLORS.portfolio,
    },
    blog: {
      label: 'بلاگ‌ها',
      color: COLORS.blog,
    },
    media: {
      label: 'رسانه‌ها',
      color: COLORS.media,
    },
  } satisfies ChartConfig), []);

  if (contentDistribution.length === 0) {
    return null;
  }

  return (
    <div className="bg-card border border-br rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <LayoutList className="w-5 h-5 text-primary" />
        </div>
        <div className="text-right">
          <h2 className="text-lg font-semibold text-font-p">توزیع محتوا</h2>
          <p className="text-xs text-font-s">نمونه کارها، بلاگ‌ها و رسانه‌ها</p>
        </div>
      </div>
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
            tick={{ fill: '#6b6876', fontSize: 11 }}
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
    </div>
  );
};
