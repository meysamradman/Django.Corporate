import { type FC } from "react";
import { MessageSquare, Mail, Ticket, Activity } from "lucide-react";
import { Skeleton } from "@/components/elements/Skeleton";
import type { DashboardStats } from "@/types/analytics";
import { formatNumber } from "@/core/utils/format";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  PolarAngleAxis,
} from "recharts";

interface SupportStatsProps {
  stats: DashboardStats | undefined;
  isLoading?: boolean;
}

export const SupportStats: FC<SupportStatsProps> = ({ stats, isLoading = false }) => {
  const responseRate = stats
    ? Math.round(((stats.total_emails + stats.total_tickets - stats.unanswered_emails - stats.unanswered_tickets) /
      (stats.total_emails + stats.total_tickets || 1)) * 100)
    : 0;

  // Ensuring colors are robust and professional
  const chartData = [{ name: 'Response Rate', value: responseRate, fill: '#3b82f6' }];

  if (isLoading) {
    return (
      <CardWithIcon
        icon={MessageSquare}
        title="وضعیت پشتیبانی"
        iconBgColor="bg-primary/10"
        iconColor="stroke-primary"
        borderColor="border-b-primary"
        className="h-full w-full"
      >
        <div className="flex flex-col gap-6 h-full p-2">
          <Skeleton className="h-44 w-full rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
          </div>
        </div>
      </CardWithIcon>
    );
  }

  return (
    <CardWithIcon
      icon={MessageSquare}
      title="وضعیت پشتیبانی"
      iconBgColor="bg-primary/10"
      iconColor="stroke-primary"
      borderColor="border-b-primary"
      className="shadow-xl h-full w-full flex flex-col transition-all duration-500 hover:shadow-primary/5"
      contentClassName="flex-1 flex flex-col p-4"
      titleExtra={<p className="text-[10px] text-font-s opacity-60 font-black tracking-widest uppercase">Support Response</p>}
    >
      <div className="flex flex-col flex-1 gap-6">
        {/* Performance Overview Chart Container */}
        <div className="relative flex-1 min-h-[200px] overflow-hidden group">
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Activity className="w-3.5 h-3.5 text-primary opacity-60" />
                <p className="text-[11px] font-black text-font-s uppercase tracking-tighter">Performance</p>
              </div>
              <p className="text-5xl font-black text-font-p tracking-tighter drop-shadow-md">{responseRate}%</p>
              <p className="text-[11px] text-font-s font-bold opacity-80 mt-1">نرخ پاسخ‌دهی کل</p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="75%"
              outerRadius="95%"
              barSize={16}
              data={chartData}
              startAngle={90}
              endAngle={450}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar
                background={{ fill: 'rgba(59, 130, 246, 0.08)' }}
                dataKey="value"
                cornerRadius={30}
                fill="#3b82f6"
              />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>

        {/* Detailed Support Channels Grid */}
        <div className="grid grid-cols-1 gap-4 pb-1">
          <div className="flex items-center justify-between p-5 rounded-xl border border-br/60 bg-white/40 dark:bg-card/40 hover:bg-white dark:hover:bg-card hover:border-rose-1/40 hover:shadow-lg transition-all duration-500 group">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-rose-0 shadow-sm group-hover:scale-110 transition-all duration-500">
                <Mail className="w-5 h-5 text-rose-1" />
              </div>
              <div>
                <p className="text-sm font-black text-font-p mb-1">مدیریت ایمیل‌ها</p>
                <p className="text-[10px] text-font-s font-bold tracking-tight opacity-70">{formatNumber(stats?.total_emails || 0)} مورد ثبت شده</p>
              </div>
            </div>
            <div className="text-left bg-rose-0/50 px-4 py-2 rounded-2xl border border-rose-1/10 shadow-sm">
              <p className="text-lg font-black text-rose-1 tabular-nums leading-none mb-1">
                {formatNumber(stats?.unanswered_emails || 0)}
              </p>
              <p className="text-[10px] font-black text-rose-1/80 uppercase tracking-tighter">بدون پاسخ</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-5 rounded-xl border border-br/60 bg-white/40 dark:bg-card/40 hover:bg-white dark:hover:bg-card hover:border-cyan-1/40 hover:shadow-lg transition-all duration-500 group">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-cyan-0 shadow-sm group-hover:scale-110 transition-all duration-500">
                <Ticket className="w-5 h-5 text-cyan-1" />
              </div>
              <div>
                <p className="text-sm font-black text-font-p mb-1">وضعیت تیکت‌ها</p>
                <p className="text-[10px] text-font-s font-bold tracking-tight opacity-70">{formatNumber(stats?.total_tickets || 0)} تیکت فعال</p>
              </div>
            </div>
            <div className="text-left bg-cyan-0/50 px-4 py-2 rounded-2xl border border-cyan-1/10 shadow-sm">
              <p className="text-lg font-black text-cyan-1 tabular-nums leading-none mb-1">
                {formatNumber(stats?.open_tickets || 0)}
              </p>
              <p className="text-[10px] font-black text-cyan-1/80 uppercase tracking-tighter">تیکت باز</p>
            </div>
          </div>
        </div>
      </div>
    </CardWithIcon>
  );
};
