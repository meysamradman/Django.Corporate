"use client";

import { Calendar, Clock } from "lucide-react";
import { useMemo } from "react";
import { format } from 'date-fns-jalali';
import { faIR } from 'date-fns-jalali/locale';
import { Skeleton } from "@/components/elements/Skeleton";
import { useStatistics, useSystemStats } from "@/components/dashboard/hooks/useStatistics";
import { SummaryCards } from "@/components/dashboard/widgets/SummaryCards";
import { ContentDistribution } from "@/components/dashboard/widgets/ContentDistribution";
import { SystemStats } from "@/components/dashboard/widgets/SystemStats";
import { SupportStats } from "@/components/dashboard/widgets/SupportStats";
import { AnalyticsWidget } from "@/components/dashboard/widgets/AnalyticsWidget";

export const DashboardMain = () => {
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

    // Format date in Persian (Jalali) calendar
    const persianDate = format(now, 'd MMMM yyyy', { locale: faIR });
    
    // Format time in Persian locale
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
      <div className="bg-card border border-br rounded-xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="text-right">
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-4 w-40" />
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-font-p mb-1">
                  {greeting}
                </h1>
                <p className="text-sm text-font-s">به پنل مدیریت خوش آمدید</p>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            {isLoading ? (
              <>
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-20" />
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-sm text-font-s">
                  <Calendar className="w-4 h-4 text-font-s" />
                  <span>{date}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-font-s">
                  <Clock className="w-4 h-4 text-font-s" />
                  <span>{time}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <SummaryCards stats={stats} isLoading={statsLoading} />

      <div className="grid lg:grid-cols-3 gap-6">
        <ContentDistribution stats={stats} isLoading={statsLoading} />
        <SystemStats systemStats={systemStats} isLoading={systemLoading} />
        <SupportStats stats={stats} isLoading={statsLoading} />
      </div>

      <AnalyticsWidget isLoading={isLoading} />
    </div>
  );
};
