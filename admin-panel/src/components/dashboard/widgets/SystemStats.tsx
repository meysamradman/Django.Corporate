import { useMemo, type FC } from "react";
import { Server, Database, HardDrive, Clock, Box } from "lucide-react";
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
    label: "حجم (MB)",
    color: "#3b82f6",
  },
} satisfies ChartConfig;

export const SystemStats: FC<SystemStatsProps> = ({ systemStats, isLoading = false }) => {
  const storageData = useMemo(() => {
    const types = {
      image: 'تصاویر',
      video: 'ویدیو',
      audio: 'صوتی',
      document: 'اسناد',
      other: 'سایر'
    };

    return Object.entries(types).map(([key, label]) => {
      const data = systemStats?.storage?.by_type?.[key];
      return {
        label,
        storage: data?.size_mb || 0,
      };
    });
  }, [systemStats]);

  const lastUpdateTime = useMemo(() => {
    if (!systemStats?.generated_at) return null;
    return new Date(systemStats.generated_at).toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }, [systemStats?.generated_at]);

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
          <Skeleton className="h-44 w-full" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        </div>
      </CardWithIcon>
    );
  }

  return (
    <CardWithIcon
      icon={HardDrive}
      title="آنالیز منابع سیستم"
      iconBgColor="bg-primary/10"
      iconColor="stroke-primary"
      borderColor="border-b-primary"
      className="h-full w-full flex flex-col transition-all duration-500 group/card"
      contentClassName="flex-1 flex flex-col pt-5 px-5 pb-0 gap-6"
      titleExtra={<p className="text-[10px] text-font-s opacity-60 font-black tracking-widest uppercase">System Resources</p>}
    >
      <div className="flex flex-col flex-1 gap-6">
        <div className="flex-1 flex items-center justify-center min-h-[220px]">
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square w-full max-h-[250px]"
          >
            <RadarChart data={storageData}>
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <PolarAngleAxis
                dataKey="label"
                tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 700, opacity: 0.6 }}
              />
              <PolarGrid strokeOpacity={0.1} />
              <Radar
                dataKey="storage"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.25}
                dot={{
                  r: 3,
                  fillOpacity: 1,
                  fill: "#3b82f6",
                  stroke: "#fff",
                  strokeWidth: 2
                }}
              />
            </RadarChart>
          </ChartContainer>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3.5 border border-br/50 bg-bg/30 hover:bg-wt hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-0 text-blue-1">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-black text-font-p leading-tight">پایگاه داده</p>
                <p className="text-[10px] font-bold text-font-s opacity-60">{systemStats?.database?.vendor || 'SQL'} Engine</p>
              </div>
            </div>
            <p className="text-sm font-black text-font-p tabular-nums">{systemStats?.database?.size_formatted || '0 B'}</p>
          </div>

          <div className="flex items-center justify-between p-3.5 border border-br/50 bg-bg/30 hover:bg-wt hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-0 text-green-1">
                <Box className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-black text-font-p leading-tight">کل فایل‌ها</p>
                <p className="text-[10px] font-bold text-font-s opacity-60">مجموع رسانه‌ها و اسناد</p>
              </div>
            </div>
            <p className="text-sm font-black text-font-p tabular-nums">{systemStats?.storage?.total_formatted || '0 B'}</p>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between pt-2 border-t border-br/30">
          <div className="flex items-center gap-1.5 opacity-40">
            <Clock className="w-3 h-3" />
            <span className="text-[9px] font-bold">آخرین واکشی: {lastUpdateTime || '--:--'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-1/50 animate-pulse" />
            <span className="text-[9px] font-black text-font-s opacity-60 uppercase tracking-tighter">System Pulse</span>
          </div>
        </div>
      </div>
    </CardWithIcon>
  );
};
