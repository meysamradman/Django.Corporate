"use client";

import { useAuth } from "@/core/auth/AuthContext";
import { usePermission } from "@/core/permissions/context/PermissionContext";
import { useStatistics, useSystemStats } from "@/components/dashboard/hooks/useStatistics";
import { 
  Calendar, 
  Clock, 
  Users,
  ShieldUser,
  LayoutList,
  FileText,
  Image,
  Mail,
  Ticket,
  Database,
  HardDrive,
  Activity,
  TrendingUp,
  Server,
  RefreshCw
} from "lucide-react";
import { useMemo } from "react";
import { formatNumber } from "@/core/utils/format";
import { 
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  LabelList,
  Cell
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig
} from "@/components/elements/Chart";

const COLORS = {
  portfolio: '#F59E0B',
  blog: '#6366F1',
  media: '#8B5CF6',
  email: '#EC4899',
  ticket: '#06B6D4',
  user: '#3B82F6',
  admin: '#10B981',
  system: '#6B7280'
};

export const DashboardMain = () => {
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const { data: stats, isLoading, refetch } = useStatistics();
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

  const supportStats = useMemo(() => {
    if (!stats) return [];
    const replied = (stats.total_emails || 0) - (stats.new_emails || 0) - (stats.unanswered_emails || 0);
    return [
      { 
        category: 'جدید', 
        newEmails: stats.new_emails || 0,
        newTickets: 0,
      },
      { 
        category: 'بدون پاسخ', 
        unansweredEmails: stats.unanswered_emails || 0,
        unansweredTickets: stats.unanswered_tickets || 0,
      },
      { 
        category: 'پاسخ داده شده', 
        repliedEmails: replied > 0 ? replied : 0,
        repliedTickets: 0,
      },
      { 
        category: 'باز', 
        openEmails: 0,
        openTickets: stats.open_tickets || 0,
      },
      { 
        category: 'فعال', 
        activeEmails: 0,
        activeTickets: stats.active_tickets || 0,
      },
    ].filter(item => 
      ((item.newEmails || 0) > 0 || (item.newTickets || 0) > 0) ||
      ((item.unansweredEmails || 0) > 0 || (item.unansweredTickets || 0) > 0) ||
      ((item.repliedEmails || 0) > 0 || (item.repliedTickets || 0) > 0) ||
      ((item.openEmails || 0) > 0 || (item.openTickets || 0) > 0) ||
      ((item.activeEmails || 0) > 0 || (item.activeTickets || 0) > 0)
    );
  }, [stats]);

  const supportStatsConfig = useMemo(() => ({
    newEmails: {
      label: 'ایمیل جدید',
      color: '#3B82F6', // blue-500
    },
    newTickets: {
      label: 'تیکت جدید',
      color: '#60A5FA', // blue-400
    },
    unansweredEmails: {
      label: 'ایمیل بدون پاسخ',
      color: '#2563EB', // blue-600
    },
    unansweredTickets: {
      label: 'تیکت بدون پاسخ',
      color: '#3B82F6', // blue-500
    },
    repliedEmails: {
      label: 'ایمیل پاسخ داده شده',
      color: '#1D4ED8', // blue-700
    },
    repliedTickets: {
      label: 'تیکت پاسخ داده شده',
      color: '#2563EB', // blue-600
    },
    openEmails: {
      label: 'ایمیل باز',
      color: '#1E40AF', // blue-800
    },
    openTickets: {
      label: 'تیکت باز',
      color: '#1D4ED8', // blue-700
    },
    activeEmails: {
      label: 'ایمیل فعال',
      color: '#1E3A8A', // blue-900
    },
    activeTickets: {
      label: 'تیکت فعال',
      color: '#1E40AF', // blue-800
    },
  } satisfies ChartConfig), []);

  const storageData = useMemo(() => {
    if (!systemStats?.storage?.by_type) return [];
    return Object.entries(systemStats.storage.by_type).map(([type, data]) => ({
      name: type === 'image' ? 'تصاویر' : type === 'video' ? 'ویدیو' : type === 'audio' ? 'صدا' : 'اسناد',
      value: data.size_mb || 0,
      count: data.count || 0,
      formatted: data.formatted || '0 B'
    })).filter(item => item.value > 0);
  }, [systemStats]);

  const summaryCards = useMemo(() => {
    const cards = [
    {
      id: 'users',
      icon: Users,
      label: 'کاربران',
      value: stats?.total_users || 0,
      permission: 'statistics.users.read',
        color: COLORS.user,
        trend: null
    },
    {
      id: 'admins',
      icon: ShieldUser,
      label: 'ادمین‌ها',
      value: stats?.total_admins || 0,
      permission: 'statistics.admins.read',
        color: COLORS.admin,
        trend: null
    },
    {
        id: 'content',
      icon: LayoutList,
        label: 'کل محتوا',
        value: (stats?.total_portfolios || 0) + (stats?.total_posts || 0),
        permission: 'statistics.content.read',
        color: COLORS.portfolio,
        trend: null
    },
    {
      id: 'media',
      icon: Image,
      label: 'رسانه‌ها',
      value: stats?.total_media || 0,
      permission: 'media.read',
        color: COLORS.media,
        trend: null
    },
    {
      id: 'emails',
      icon: Mail,
        label: 'ایمیل‌ها',
      value: stats?.total_emails || 0,
      permission: 'statistics.emails.read',
        color: COLORS.email,
        trend: stats?.new_emails ? { value: stats.new_emails, label: 'جدید' } : null
    },
    {
      id: 'tickets',
      icon: Ticket,
        label: 'تیکت‌ها',
      value: stats?.total_tickets || 0,
      permission: 'statistics.tickets.read',
        color: COLORS.ticket,
        trend: stats?.open_tickets ? { value: stats.open_tickets, label: 'باز' } : null
      },
    ];
    return cards.filter(card => hasPermission(card.permission));
  }, [stats, hasPermission]);

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
              {greeting}، {user?.full_name || 'کاربر'} 👋
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
            <button
              onClick={() => refetch()}
              className="p-2 rounded-lg hover:bg-bg transition-colors"
              title="به‌روزرسانی"
            >
              <RefreshCw className="w-4 h-4 text-font-s" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              className="bg-card border border-br rounded-xl p-5 hover:shadow-md hover:border-primary/20 transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-3">
                <div 
                  className="p-2.5 rounded-lg" 
                  style={{ backgroundColor: `${card.color}15` }}
                >
                  <Icon className="w-5 h-5" style={{ color: card.color }} />
                </div>
                {card.trend && (
                  <div className="text-xs text-font-s bg-primary/10 text-primary px-2 py-1 rounded-md font-medium">
                    {card.trend.value} {card.trend.label}
                  </div>
                )}
              </div>
              <div className="text-2xl font-bold text-font-p mb-1 text-right">
                {formatNumber(card.value)}
              </div>
              <div className="text-xs text-font-s font-medium text-right">{card.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {contentDistribution.length > 0 && (
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
        )}

        {hasPermission('statistics.system.read') && (
          <div className="bg-card border border-br rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Server className="w-5 h-5 text-primary" />
              </div>
              <div className="text-right">
                <h2 className="text-lg font-semibold text-font-p">آمار سیستم</h2>
                <p className="text-xs text-font-s">وضعیت سرور و دیتابیس</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border border-br bg-bg">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-4 h-4 text-blue-1" />
                    <span className="text-xs text-font-s font-medium text-right">حجم دیتابیس</span>
              </div>
              {systemLoading ? (
                    <div className="h-5 w-16 bg-br animate-pulse rounded" />
              ) : (
                    <p className="text-base font-bold text-font-p text-right">
                  {systemStats?.database?.size_formatted || 'N/A'}
                </p>
              )}
            </div>

                <div className="p-3 rounded-lg border border-br bg-bg">
              <div className="flex items-center gap-2 mb-2">
                <HardDrive className="w-4 h-4 text-purple-1" />
                    <span className="text-xs text-font-s font-medium text-right">ذخیره‌سازی کل</span>
              </div>
              {systemLoading ? (
                    <div className="h-5 w-16 bg-br animate-pulse rounded" />
              ) : (
                    <p className="text-base font-bold text-font-p text-right">
                  {systemStats?.storage?.total_formatted || '0 B'}
                </p>
              )}
                </div>
            </div>

              <div className="p-3 rounded-lg border border-br bg-bg">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-emerald-1" />
                  <span className="text-xs text-font-s font-medium text-right">وضعیت کش</span>
              </div>
              {systemLoading ? (
                  <div className="h-5 w-16 bg-br animate-pulse rounded" />
              ) : (
                <div>
                    <p className="text-base font-bold text-font-p mb-1 text-right">
                    {systemStats?.cache?.status === 'connected' ? 'متصل' : 'خطا'}
                  </p>
                    <div className="flex items-center justify-between text-xs text-font-s">
                      <span>حافظه: {systemStats?.cache?.used_memory_formatted || '0B'}</span>
                      <span>Hit: {systemStats?.cache?.hit_rate ? `${systemStats.cache.hit_rate.toFixed(1)}%` : '0%'}</span>
                    </div>
                </div>
              )}
              </div>

              {storageData.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {storageData.map((item, index) => (
                    <div key={index} className="p-2.5 rounded-lg border border-br bg-bg">
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.media }} />
                        <span className="text-xs text-font-s font-medium">{item.name}</span>
                      </div>
                      <p className="text-sm font-bold text-font-p text-right">{item.formatted}</p>
                      <p className="text-xs text-font-s text-right">{formatNumber(item.count)} فایل</p>
                    </div>
                  ))}
              </div>
              )}
              </div>
            </div>
          )}

        {supportStats.length > 0 && 
          (hasPermission('statistics.emails.read') || hasPermission('statistics.tickets.read')) && (
          <div className="bg-card border border-br rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <div className="text-right">
                <h2 className="text-lg font-semibold text-font-p">وضعیت پشتیبانی</h2>
                <p className="text-xs text-font-s">ایمیل‌ها و تیکت‌ها</p>
              </div>
            </div>
            <div className="flex items-center gap-3 mb-3 text-xs text-font-s">
              {hasPermission('statistics.emails.read') && (
                      <div className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-rose-1" />
                  <span>ایمیل: {formatNumber(stats?.total_emails || 0)}</span>
                      </div>
              )}
              {hasPermission('statistics.tickets.read') && (
                      <div className="flex items-center gap-1">
                  <Ticket className="w-3.5 h-3.5 text-cyan-1" />
                  <span>تیکت: {formatNumber(stats?.total_tickets || 0)}</span>
                </div>
              )}
            </div>
            <ChartContainer 
              config={supportStatsConfig} 
              className="min-h-[300px] w-full [&_.recharts-cartesian-axis-tick_text]:text-right [&_.recharts-cartesian-axis-tick_text]:direction-rtl"
              style={{ direction: 'rtl' }}
            >
              <BarChart accessibilityLayer data={supportStats}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="category"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tick={{ fill: '#6b6876', fontSize: 11 }}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dashed" />}
                />
                {hasPermission('statistics.emails.read') && (
                  <>
                    <Bar dataKey="newEmails" stackId="a" fill="var(--color-newEmails)" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="unansweredEmails" stackId="a" fill="var(--color-unansweredEmails)" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="repliedEmails" stackId="a" fill="var(--color-repliedEmails)" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="openEmails" stackId="a" fill="var(--color-openEmails)" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="activeEmails" stackId="a" fill="var(--color-activeEmails)" radius={[0, 0, 4, 4]} />
                  </>
                )}
                {hasPermission('statistics.tickets.read') && (
                  <>
                    <Bar dataKey="newTickets" stackId="a" fill="var(--color-newTickets)" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="unansweredTickets" stackId="a" fill="var(--color-unansweredTickets)" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="repliedTickets" stackId="a" fill="var(--color-repliedTickets)" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="openTickets" stackId="a" fill="var(--color-openTickets)" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="activeTickets" stackId="a" fill="var(--color-activeTickets)" radius={[4, 4, 0, 0]} />
                  </>
                )}
              </BarChart>
            </ChartContainer>
          </div>
        )}
        </div>
    </div>
  );
};
