import { Calendar, Clock } from "lucide-react";
import { useMemo } from "react";
import { useStatistics, useSystemStats } from "@/hooks/dashboard/useStatistics";
import {
  SummaryCards,
  SystemStats,
  SupportStats,
  ContentDistribution,
  AnalyticsWidget,
  VisitorPieChart,
  VisitorTrendChart,
} from "@/components/dashboard/widgets";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useStatistics();
  const { data: systemStats, isLoading: systemLoading } = useSystemStats();
  const isLoading = statsLoading || systemLoading;

  const { date, time, greeting } = useMemo(() => {
    const now = new Date();
    const hour = now.getHours();
    
    let greetingText = "سلام";
    if (hour >= 5 && hour < 12) greetingText = "صبح بخیر";
    else if (hour >= 12 && hour < 17) greetingText = "ظهر بخیر";
    else if (hour >= 17 && hour < 21) greetingText = "عصر بخیر";
    else greetingText = "شب بخیر";

    const persianDate = now.toLocaleDateString('fa-IR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    const persianTime = now.toLocaleTimeString('fa-IR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    return {
      date: persianDate,
      time: persianTime,
      greeting: greetingText
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header با تاریخ و ساعت */}
      <div className="bg-card border border-br rounded-xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="text-right">
            <h1 className="text-2xl font-bold text-font-p mb-1">
              {greeting}
            </h1>
            <p className="text-sm text-font-s">به پنل مدیریت خوش آمدید</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-font-s">
              <Calendar className="w-4 h-4 text-font-s" />
              <span>{date}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-font-s">
              <Clock className="w-4 h-4 text-font-s" />
              <span>{time}</span>
            </div>
          </div>
        </div>
      </div>

      {/* کارت‌های خلاصه آمار */}
      <SummaryCards stats={stats} isLoading={statsLoading} />

      {/* Grid سه‌تایی: Pie Chart, System Stats, Support Stats */}
      <div className="grid lg:grid-cols-3 gap-6">
        <VisitorPieChart isLoading={isLoading} />
        <SystemStats systemStats={systemStats} isLoading={systemLoading} />
        <SupportStats stats={stats} isLoading={statsLoading} />
      </div>

      {/* Analytics Widget */}
      <AnalyticsWidget isLoading={isLoading} />

      {/* Visitor Trend Chart */}
      <VisitorTrendChart isLoading={isLoading} />

      {/* Content Distribution */}
      <ContentDistribution stats={stats} isLoading={statsLoading} />
    </div>
  );
}
