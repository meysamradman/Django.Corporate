"use client";

import { useAuth } from "@/core/auth/AuthContext";
import { usePermission } from "@/core/permissions/context/PermissionContext";
import { useStatistics, useSystemStats } from "@/components/dashboard/hooks/useStatistics";
import {
  Calendar,
  Clock,
  TrendingUp,
  Users,
  ShieldUser,
  LayoutList,
  FileText,
  Image,
  MessageSquare,
  ImagePlus,
  FileAudio,
  Plus,
  Settings,
  Mail,
  Zap,
  ArrowUpRight,
  Activity,
  TrendingDown,
  Minus,
  Ticket,
  FolderTree,
  Tag,
  List,
  HardDrive,
  Database,
  Server
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { formatNumber } from "@/core/utils/format";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";

export const DashboardMain = () => {
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const { data: stats, isLoading } = useStatistics();
  const { data: systemStats, isLoading: systemLoading } = useSystemStats();

  // دیتای نمودارها (شبیه‌سازی دیتای واقعی)
  const chartData = useMemo(() => {
    // دیتای روند رشد ۷ روز اخیر
    const growthData = [
      { day: 'شنبه', کاربران: 45, محتوا: 23, رسانه: 12 },
      { day: 'یکشنبه', کاربران: 52, محتوا: 28, رسانه: 18 },
      { day: 'دوشنبه', کاربران: 61, محتوا: 35, رسانه: 22 },
      { day: 'سه‌شنبه', کاربران: 58, محتوا: 31, رسانه: 25 },
      { day: 'چهارشنبه', کاربران: 70, محتوا: 42, رسانه: 30 },
      { day: 'پنجشنبه', کاربران: 78, محتوا: 48, رسانه: 35 },
      { day: 'جمعه', کاربران: 85, محتوا: 55, رسانه: 42 },
    ];

    // دیتای توزیع محتوا
    const contentDistribution = [
      { name: 'نمونه کارها', value: stats?.total_portfolios || 45, color: '#F59E0B' },
      { name: 'بلاگ‌ها', value: stats?.total_posts || 32, color: '#6366F1' },
      { name: 'رسانه‌ها', value: stats?.total_media || 68, color: '#8B5CF6' },
    ];

    // دیتای مقایسه ماهانه
    const monthlyComparison = [
      { month: 'فروردین', امسال: 65, پارسال: 45 },
      { month: 'اردیبهشت', امسال: 78, پارسال: 52 },
      { month: 'خرداد', امسال: 85, پارسال: 60 },
      { month: 'تیر', امسال: 92, پارسال: 71 },
    ];

    return { growthData, contentDistribution, monthlyComparison };
  }, [stats]);

  // زمان و تاریخ
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

  // کارت‌های آمار
  const statCards = [
    {
      id: 'users',
      icon: Users,
      label: 'کاربران',
      value: stats?.total_users || 0,
      permission: 'statistics.users.read',
      color: 'blue',
      href: '/users'
    },
    {
      id: 'admins',
      icon: ShieldUser,
      label: 'ادمین‌ها',
      value: stats?.total_admins || 0,
      permission: 'statistics.admins.read',
      color: 'emerald',
      href: '/admins'
    },
    {
      id: 'portfolios',
      icon: LayoutList,
      label: 'نمونه کارها',
      value: stats?.total_portfolios || 0,
      permission: 'portfolio.read',
      color: 'amber',
      href: '/portfolios'
    },
    {
      id: 'portfolio_categories',
      icon: FolderTree,
      label: 'دسته‌بندی نمونه کار',
      value: stats?.total_portfolio_categories || 0,
      permission: 'portfolio.read',
      color: 'amber',
      href: '/portfolios/categories'
    },
    {
      id: 'portfolio_tags',
      icon: Tag,
      label: 'تگ‌های نمونه کار',
      value: stats?.total_portfolio_tags || 0,
      permission: 'portfolio.read',
      color: 'amber',
      href: '/portfolios/tags'
    },
    {
      id: 'portfolio_options',
      icon: List,
      label: 'گزینه‌های نمونه کار',
      value: stats?.total_portfolio_options || 0,
      permission: 'portfolio.read',
      color: 'amber',
      href: '/portfolios/options'
    },
    {
      id: 'blogs',
      icon: FileText,
      label: 'بلاگ‌ها',
      value: stats?.total_posts || 0,
      permission: 'blog.read',
      color: 'indigo',
      href: '/blogs'
    },
    {
      id: 'blog_categories',
      icon: FolderTree,
      label: 'دسته‌بندی بلاگ',
      value: stats?.total_blog_categories || 0,
      permission: 'blog.read',
      color: 'indigo',
      href: '/blogs/categories'
    },
    {
      id: 'blog_tags',
      icon: Tag,
      label: 'تگ‌های بلاگ',
      value: stats?.total_blog_tags || 0,
      permission: 'blog.read',
      color: 'indigo',
      href: '/blogs/tags'
    },
    {
      id: 'media',
      icon: Image,
      label: 'رسانه‌ها',
      value: stats?.total_media || 0,
      permission: 'media.read',
      color: 'purple',
      href: '/media'
    },
    {
      id: 'emails',
      icon: Mail,
      label: 'کل ایمیل‌ها',
      value: stats?.total_emails || 0,
      permission: 'statistics.emails.read',
      color: 'rose',
      href: '/email/messages'
    },
    {
      id: 'new_emails',
      icon: Mail,
      label: 'ایمیل‌های جدید',
      value: stats?.new_emails || 0,
      permission: 'statistics.emails.read',
      color: 'orange',
      href: '/email/messages?status=new'
    },
    {
      id: 'unanswered_emails',
      icon: Mail,
      label: 'بدون پاسخ',
      value: stats?.unanswered_emails || 0,
      permission: 'statistics.emails.read',
      color: 'red',
      href: '/email/messages?status=unanswered'
    },
    {
      id: 'tickets',
      icon: Ticket,
      label: 'کل تیکت‌ها',
      value: stats?.total_tickets || 0,
      permission: 'statistics.tickets.read',
      color: 'cyan',
      href: '/tickets'
    },
    {
      id: 'open_tickets',
      icon: Ticket,
      label: 'تیکت‌های باز',
      value: stats?.open_tickets || 0,
      permission: 'statistics.tickets.read',
      color: 'blue',
      href: '/tickets?status=open'
    },
    {
      id: 'active_tickets',
      icon: Ticket,
      label: 'تیکت‌های فعال',
      value: stats?.active_tickets || 0,
      permission: 'statistics.tickets.read',
      color: 'indigo',
      href: '/tickets?status=active'
    },
    {
      id: 'unanswered_tickets',
      icon: Ticket,
      label: 'تیکت‌های بدون پاسخ',
      value: stats?.unanswered_tickets || 0,
      permission: 'statistics.tickets.read',
      color: 'red',
      href: '/tickets?status=unanswered'
    }
  ];

  // دسترسی‌های سریع
  const quickActions = [
    {
      id: 'portfolio',
      icon: Plus,
      label: 'نمونه کار جدید',
      href: '/portfolios/create',
      permission: 'portfolio.create',
      color: 'amber'
    },
    {
      id: 'blog',
      icon: FileText,
      label: 'بلاگ جدید',
      href: '/blogs/create',
      permission: 'blog.create',
      color: 'indigo'
    },
    {
      id: 'media',
      icon: ImagePlus,
      label: 'آپلود رسانه',
      href: '/media',
      permission: 'media.create',
      color: 'purple'
    },
    {
      id: 'email',
      icon: Mail,
      label: 'قالب ایمیل',
      href: '/email/templates',
      permission: 'email.read',
      color: 'pink'
    }
  ];

  // ویژگی‌های AI
  const aiFeatures = [
    {
      id: 'chat',
      icon: MessageSquare,
      label: 'گفتگو با AI',
      desc: 'چت با مدل‌های هوش مصنوعی',
      href: '/ai/chat',
      permission: 'ai.chat.use',
      gradient: 'from-blue-1/10 to-blue-1/5'
    },
    {
      id: 'image',
      icon: ImagePlus,
      label: 'تولید تصویر',
      desc: 'ساخت تصاویر با AI',
      href: '/ai/image',
      permission: 'ai.image.use',
      gradient: 'from-purple-1/10 to-purple-1/5'
    },
    {
      id: 'audio',
      icon: FileAudio,
      label: 'تولید صدا',
      desc: 'متن به گفتار',
      href: '/ai/audio',
      permission: 'ai.audio.use',
      gradient: 'from-emerald-1/10 to-emerald-1/5'
    }
  ];

  return (
    <div className="space-y-6">
      {/* هدر خوشامدگویی */}
      <div className="bg-card border border-br rounded-lg p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-font-p mb-1">
              {greeting}، {user?.full_name || 'کاربر'} 👋
            </h1>
            <p className="text-sm text-font-s">به پنل مدیریت خوش آمدید</p>
          </div>
          <div className="flex gap-6 text-sm text-font-s">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span>{date}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span>{time}</span>
            </div>
          </div>
        </div>
      </div>

      {/* آمار کلی با Border رنگی - دو ردیف */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {statCards.map((card) => {
          if (!hasPermission(card.permission)) return null;
          const Icon = card.icon;

          return (
            <Link
              key={card.id}
              href={card.href}
              className={`group bg-card border border-br border-b-4 border-b-${card.color}-1 rounded-lg p-4 hover:shadow-md transition-all duration-200`}
            >
              <div className="flex items-center justify-between mb-3">
                {isLoading ? (
                  <div className="h-10 w-20 bg-br animate-pulse rounded" />
                ) : (
                  <div className="text-3xl font-bold text-font-p">
                    {formatNumber(card.value)}
                  </div>
                )}
                <div className={`p-2.5 rounded-lg bg-${card.color} group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-6 h-6 text-${card.color}-1`} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-font-s">{card.label}</p>
                <ArrowUpRight className="w-4 h-4 text-font-s opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* نمودارهای تحلیلی */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* نمودار روند رشد */}
        <div className="bg-card border border-br rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue/10">
                <TrendingUp className="w-5 h-5 text-blue-1" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-font-p">روند رشد</h2>
                <p className="text-xs text-font-s">۷ روز اخیر</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs">
                <div className="w-3 h-3 rounded-full bg-blue-1" />
                <span className="text-font-s">کاربران</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <div className="w-3 h-3 rounded-full bg-indigo-1" />
                <span className="text-font-s">محتوا</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <div className="w-3 h-3 rounded-full bg-purple-1" />
                <span className="text-font-s">رسانه</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData.growthData}>
              <defs>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorContent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorMedia" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" opacity={0.3} />
              <XAxis
                dataKey="day"
                tick={{ fill: '#6b6876', fontSize: 12 }}
                axisLine={{ stroke: '#e8e8e8' }}
              />
              <YAxis
                tick={{ fill: '#6b6876', fontSize: 12 }}
                axisLine={{ stroke: '#e8e8e8' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e8e8e8',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Area
                type="monotone"
                dataKey="کاربران"
                stroke="#3B82F6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorUsers)"
              />
              <Area
                type="monotone"
                dataKey="محتوا"
                stroke="#6366F1"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorContent)"
              />
              <Area
                type="monotone"
                dataKey="رسانه"
                stroke="#8B5CF6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorMedia)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* نمودار توزیع محتوا */}
        <div className="bg-card border border-br rounded-lg p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 rounded-lg bg-purple/10">
              <LayoutList className="w-5 h-5 text-purple-1" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-font-p">توزیع محتوا</h2>
              <p className="text-xs text-font-s">آمار کلی</p>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={chartData.contentDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.contentDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e8e8e8',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4">
            {chartData.contentDistribution.map((item, i) => (
              <div key={i} className="text-center p-3 rounded-lg bg-bg">
                <div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ backgroundColor: item.color }} />
                <p className="text-xs text-font-s mb-1">{item.name}</p>
                <p className="text-lg font-bold text-font-p">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* دسترسی سریع و AI */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* دسترسی سریع */}
        <div className="bg-card border border-br rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-amber-1" />
            <h2 className="text-lg font-semibold text-font-p">دسترسی سریع</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => {
              if (!hasPermission(action.permission)) return null;
              const Icon = action.icon;

              return (
                <Link
                  key={action.id}
                  href={action.href}
                  className={`group p-4 rounded-lg border border-br hover:border-${action.color}-1/50 bg-${action.color}/5 hover:bg-${action.color}/10 transition-all duration-200`}
                >
                  <div className={`w-10 h-10 rounded-lg bg-${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-5 h-5 text-${action.color}-1`} />
                  </div>
                  <p className="text-sm font-medium text-font-p">{action.label}</p>
                </Link>
              );
            })}
          </div>
        </div>

        {/* هوش مصنوعی */}
        <div className="bg-card border border-br rounded-lg p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />

          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-font-p">هوش مصنوعی</h2>
            </div>

            <div className="space-y-3">
              {aiFeatures.map((feature) => {
                if (!hasPermission(feature.permission)) return null;
                const Icon = feature.icon;

                return (
                  <Link
                    key={feature.id}
                    href={feature.href}
                    className={`group block p-4 rounded-lg border border-br hover:border-primary/50 bg-gradient-to-r ${feature.gradient} hover:shadow-sm transition-all duration-200`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-card border border-br group-hover:scale-110 transition-transform">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-font-p">{feature.label}</h3>
                        <p className="text-xs text-font-s mt-0.5">{feature.desc}</p>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-font-s opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                );
              })}

              <Link
                href="/ai/settings"
                className="flex items-center justify-center gap-2 p-2.5 rounded-lg border border-dashed border-br hover:border-primary/50 text-xs text-font-s hover:text-primary transition-all"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>تنظیمات AI</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* آمار سیستم */}
      {hasPermission('statistics.system.read') && (
        <div className="bg-card border border-br rounded-lg p-6">
          <div className="flex items-center gap-2 mb-6">
            <Server className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-font-p">آمار سیستم</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* حجم دیتابیس */}
            <div className="p-4 rounded-lg border border-br bg-bg">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-4 h-4 text-blue-1" />
                <span className="text-sm text-font-s">حجم دیتابیس</span>
              </div>
              {systemLoading ? (
                <div className="h-6 w-20 bg-br animate-pulse rounded" />
              ) : (
                <p className="text-lg font-bold text-font-p">
                  {systemStats?.database?.size_formatted || 'N/A'}
                </p>
              )}
            </div>

            {/* حجم ذخیره‌سازی */}
            <div className="p-4 rounded-lg border border-br bg-bg">
              <div className="flex items-center gap-2 mb-2">
                <HardDrive className="w-4 h-4 text-purple-1" />
                <span className="text-sm text-font-s">حجم فایل‌ها</span>
              </div>
              {systemLoading ? (
                <div className="h-6 w-20 bg-br animate-pulse rounded" />
              ) : (
                <p className="text-lg font-bold text-font-p">
                  {systemStats?.storage?.total_formatted || '0 B'}
                </p>
              )}
            </div>

            {/* وضعیت کش */}
            <div className="p-4 rounded-lg border border-br bg-bg">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-emerald-1" />
                <span className="text-sm text-font-s">وضعیت کش</span>
              </div>
              {systemLoading ? (
                <div className="h-6 w-20 bg-br animate-pulse rounded" />
              ) : (
                <div>
                  <p className="text-lg font-bold text-font-p">
                    {systemStats?.cache?.status === 'connected' ? 'متصل' : 'خطا'}
                  </p>
                  <p className="text-xs text-font-s mt-1">
                    {systemStats?.cache?.used_memory_formatted || '0B'}
                  </p>
                </div>
              )}
            </div>

            {/* نرخ Hit */}
            <div className="p-4 rounded-lg border border-br bg-bg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-amber-1" />
                <span className="text-sm text-font-s">نرخ Hit</span>
              </div>
              {systemLoading ? (
                <div className="h-6 w-20 bg-br animate-pulse rounded" />
              ) : (
                <p className="text-lg font-bold text-font-p">
                  {systemStats?.cache?.hit_rate ? `${systemStats.cache.hit_rate.toFixed(1)}%` : '0%'}
                </p>
              )}
            </div>
          </div>

          {/* حجم بر اساس نوع */}
          {systemStats?.storage?.by_type && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-font-p mb-3">حجم بر اساس نوع</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(systemStats.storage.by_type).map(([type, data]) => (
                  <div key={type} className="p-3 rounded-lg border border-br bg-bg">
                    <p className="text-xs text-font-s mb-1 capitalize">{type}</p>
                    <p className="text-sm font-bold text-font-p">{data.formatted}</p>
                    <p className="text-xs text-font-s mt-1">{data.count} فایل</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};
