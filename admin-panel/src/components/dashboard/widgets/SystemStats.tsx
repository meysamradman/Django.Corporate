import { useMemo, type FC } from "react";
import { Server, Database, Zap } from "lucide-react";
import { Skeleton } from "@/components/elements/Skeleton";
import type { SystemStats as SystemStatsType } from "@/types/analytics";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/elements/Chart";

interface SystemStatsProps {
  systemStats: SystemStatsType | undefined;
  isLoading?: boolean;
}

const chartConfig = {
  storage: {
    label: "حجم",
    color: "#3b82f6",
  },
} satisfies ChartConfig;

export const SystemStats: FC<SystemStatsProps> = ({ systemStats, isLoading = false }) => {
  const storageData = useMemo(() => {
    const types = {
      image: 'تصاویر',
      video: 'ویدیویی',
      audio: 'صوتی',
      document: 'اسناد',
      other: 'سایر'
    };

    return Object.entries(types).map(([key, label]) => {
      const data = systemStats?.storage?.by_type?.[key];
      return {
        month: label,
        storage: data?.size_mb || 0,
      };
    });
  }, [systemStats]);

  if (isLoading) {
    return (
      <CardWithIcon
        icon={Server}
        title="آمار سیستم"
        iconBgColor="bg-primary/10"
        iconColor="stroke-primary"
        borderColor="border-b-primary"
        className="h-full w-full"
      >
        <div className="space-y-6 h-full p-2">
          <Skeleton className="h-44 w-full rounded-xl" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
        </div>
      </CardWithIcon>
    );
  }

  return (
    <CardWithIcon
      icon={Server}
      title="آمار سیستم"
      iconBgColor="bg-primary/10"
      iconColor="stroke-primary"
      borderColor="border-b-primary"
      className="shadow-xl h-full w-full flex flex-col transition-all duration-500 hover:shadow-primary/5"
      contentClassName="flex-1 flex flex-col p-4"
      titleExtra={<p className="text-[10px] text-font-s opacity-60 font-black tracking-widest uppercase">System Analytics</p>}
    >
      <div className="flex flex-col flex-1 gap-6">
        {/* EXACT CHART IMPLEMENTATION FROM SNIPPET */}
        <div className="flex-1 flex items-center justify-center">
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square w-full max-h-[250px]"
          >
            <RadarChart data={storageData}>
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <PolarAngleAxis dataKey="month" />
              <PolarGrid />
              <Radar
                dataKey="storage"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.5}
                dot={{
                  r: 4,
                  fillOpacity: 1,
                  fill: "#3b82f6",
                  stroke: "#fff",
                  strokeWidth: 2
                }}
              />
            </RadarChart>
          </ChartContainer>
        </div>

        {/* PRETTY BOTTOM CARDS (RESTORED) */}
        <div className="grid grid-cols-2 gap-4 pb-1">
          <div className="p-4 rounded-xl border border-br/60 bg-white/40 dark:bg-card/40 hover:bg-white dark:hover:bg-card hover:border-blue-1/40 hover:shadow-lg transition-all duration-500 group">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-blue-0 shadow-sm group-hover:scale-110 transition-transform">
                <Database className="w-3.5 h-3.5 text-blue-1" />
              </div>
              <span className="text-[10px] text-font-s font-black uppercase tracking-widest">دیتابیس</span>
            </div>
            <p className="text-lg font-black text-font-p tabular-nums tracking-tighter">
              {systemStats?.database?.size_formatted || '0 B'}
            </p>
          </div>

          <div className="p-4 rounded-xl border border-br/60 bg-white/40 dark:bg-card/40 hover:bg-white dark:hover:bg-card hover:border-amber-1/40 hover:shadow-lg transition-all duration-500 group">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-amber-0 shadow-sm group-hover:scale-110 transition-transform">
                <Zap className="w-3.5 h-3.5 text-amber-1" />
              </div>
              <span className="text-[10px] text-font-s font-black uppercase tracking-widest">کش</span>
            </div>
            <p className="text-lg font-black text-font-p tabular-nums tracking-tighter">
              {systemStats?.cache?.hit_rate ? `${systemStats.cache.hit_rate.toFixed(1)}%` : '0%'}
            </p>
          </div>
        </div>
      </div>
    </CardWithIcon>
  );
};
