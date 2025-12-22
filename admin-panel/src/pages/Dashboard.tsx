import { Calendar, Clock, LayoutDashboard } from "lucide-react";
import { useMemo } from "react";
import { useAuth } from "@/core/auth/AuthContext";
import { useStatistics, useSystemStats } from "@/hooks/dashboard/useStatistics";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import {
  SummaryCards,
  SystemStats,
  SupportStats,
  QuickActionsWidget,
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

  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <CardWithIcon
        icon={LayoutDashboard}
        title={
          <div className="flex items-center gap-2 leading-tight">
            {greeting}، {user?.full_name || 'ادمین عزیز'}
            <span className="animate-bounce-slow text-lg">👋</span>
          </div>
        }
        iconBgColor="bg-primary/10"
        iconColor="stroke-primary"
        borderColor="border-b-primary"
        className="!shadow-none !h-fit !py-0"
        headerClassName="!py-3 !px-4 !items-center"
        contentClassName="hidden"
        titleExtra={
          <div className="flex items-center gap-5">
            <p className="hidden lg:block text-xs text-font-s font-medium opacity-70">امیدواریم روز فوق‌العاده‌ای داشته باشی</p>
            <div className="flex items-center gap-3 bg-bg/50 px-3 py-2 rounded-xl border border-br/50 backdrop-blur-sm">
              <div className="flex items-center gap-1.5 text-xs font-bold text-font-p">
                <Calendar className="w-4 h-4 text-primary" />
                <span>{date}</span>
              </div>
              <div className="w-px h-3 bg-br/50" />
              <div className="flex items-center gap-1.5 text-xs font-bold text-font-p">
                <Clock className="w-4 h-4 text-primary" />
                <span>{time}</span>
              </div>
            </div>
          </div>
        }
      >
        {null}
      </CardWithIcon>
      <div className="grid lg:grid-cols-12 gap-6 items-stretch">
        {/* Side Widget (Prominent) */}
        <div className="lg:col-span-4 order-2 lg:order-1 flex flex-col h-full">
          <VisitorPieChart isLoading={isLoading} />
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-6 order-1 lg:order-2 flex flex-col">
          <SummaryCards stats={stats} isLoading={statsLoading} />
          <div className="flex-1 min-h-0">
            <VisitorTrendChart isLoading={isLoading} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
        <QuickActionsWidget isLoading={isLoading} />
        <SupportStats stats={stats} isLoading={statsLoading} />
        <SystemStats systemStats={systemStats} isLoading={systemLoading} />
      </div>
    </div>
  );
}
