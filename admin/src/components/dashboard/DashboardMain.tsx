"use client";

import { Calendar, Clock } from "lucide-react";
import { useMemo } from "react";
import { useStatistics, useSystemStats } from "@/components/dashboard/hooks/useStatistics";
import { SummaryCards } from "@/components/dashboard/widgets/SummaryCards";
import { ContentDistribution } from "@/components/dashboard/widgets/ContentDistribution";
import { SystemStats } from "@/components/dashboard/widgets/SystemStats";
import { SupportStats } from "@/components/dashboard/widgets/SupportStats";

export const DashboardMain = () => {
  const { data: stats, isLoading } = useStatistics();
  const { data: systemStats, isLoading: systemLoading } = useSystemStats();

  const { date, time, greeting } = useMemo(() => {
    const now = new Date();
    const hour = now.getHours();
    
    let greetingText = "سلام";
    if (hour >= 5 && hour < 12) greetingText = "صبح بخیر";
    else if (hour >= 12 && hour < 17) greetingText = "ظهر بخیر";
    else if (hour >= 17 && hour < 21) greetingText = "عصر بخیر";
    else greetingText = "شب بخیر";

    return {
      date: now.toLocaleDateString('fa-IR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: now.toLocaleTimeString('fa-IR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      greeting: greetingText
    };
  }, []);


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-font-s">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

      <SummaryCards stats={stats} isLoading={isLoading} />

      <div className="grid lg:grid-cols-3 gap-6">
        <ContentDistribution stats={stats} />
        <SystemStats systemStats={systemStats} isLoading={systemLoading} />
        <SupportStats stats={stats} />
      </div>
    </div>
  );
};
