import { useQuery } from '@tanstack/react-query';
import { realEstateApi } from '@/api/real-estate/properties';
import {
  Activity,
  Building,
  CheckCircle,
  FileText,
  Grid,
  Home,
  Layers,
  MapPin,
  Tag,
  UserCheck,
  Users,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { PropertiesChart } from './PropertiesChart';
import { FinancialStatsCards } from './FinancialStatsCards';
import { TrafficSourceChart } from './TrafficSourceChart';
import { TopAgentsList } from './TopAgentsList';
import type { PropertyStatistics } from '@/types/real_estate/statistics';
import { showError } from '@/core/toast';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { cn } from "@/core/utils/cn";
import { formatNumber } from "@/core/utils/format";
import type { ReactNode } from "react";

// --- LOCAL STATCARD COMPONENT ---
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  icon: ReactNode;
  iconColor?: string;
  iconBg?: string;
  borderColor?: string;
  isLoading?: boolean;
  className?: string; // Add className prop support
}

function StatCard({
  title,
  value,
  subtitle,
  description,
  trend,
  icon,
  iconColor = "text-blue-500", // standard tailwind colors
  iconBg = "bg-blue-50",
  borderColor = "border-b-blue-500",
  isLoading = false,
  className, // Destructure className
}: StatCardProps) {
  if (isLoading) {
    return (
      <Card className={cn("border-b-4", borderColor, className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="h-4 w-24 bg-gray-200 animate-pulse rounded" />
          <div className="h-8 w-8 bg-gray-200 animate-pulse rounded-lg" />
        </CardHeader>
        <CardContent>
          <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mb-2" />
          <div className="h-3 w-32 bg-gray-200 animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "relative overflow-hidden border-b-4 transition-all hover:shadow-md",
      borderColor,
      className // Apply className here
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={cn("p-2 rounded-lg transition-colors", iconBg)}>
          <div className={cn("h-4 w-4", iconColor)}>{icon}</div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight mb-1">
          {typeof value === 'number' ? formatNumber(value) : value}
        </div>

        {(subtitle || description) && (
          <p className="text-xs text-muted-foreground mt-1">
            {subtitle || description}
          </p>
        )}

        {trend && (
          <div className="flex items-center gap-1.5 text-xs font-medium mt-2">
            {trend.isPositive ? (
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
            )}
            <span className={trend.isPositive ? "text-emerald-600" : "text-rose-600"}>
              {Math.abs(trend.value)}% {trend.label}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- MOCK DATA FOR UI VISUALIZATION ---
const MOCK_STATS: PropertyStatistics = {
  generated_at: new Date().toISOString(),
  properties: {
    total: 1250,
    published: 980,
    draft: 150,
    featured: 85,
    verified: 850,
    active: 1100,
    public: 1100,
    published_percentage: 78.4,
    featured_percentage: 6.8,
    verified_percentage: 68.0,
  },
  types: { total: 12, with_properties: 8, without_properties: 4 },
  states: { total: 32, with_properties: 15, without_properties: 17 },
  labels: { total: 20, with_properties: 12, without_properties: 8 },
  features: { total: 50, with_properties: 35, without_properties: 15 },
  tags: { total: 100, with_properties: 65, without_properties: 35 },
  agents: {
    total: 45,
    active: 38,
    verified: 30,
    with_properties: 32,
    active_percentage: 84.4,
    verified_percentage: 66.7,
  },
  agencies: {
    total: 12,
    active: 10,
    verified: 8,
    with_properties: 9,
    active_percentage: 83.3,
    verified_percentage: 66.7,
  },
  financials: {
    total_sales_value: 154000000000, // 154 Billion Tomans
    total_commissions: 3850000000,   // 3.85 Billion Tomans
    total_sold_properties: 42,
  },
  traffic: {
    web_views: 45200,
    app_views: 12800,
    total_views: 58000,
  },
  top_agents: [
    { id: 1, name: "علی محمدی", avatar: null, rating: 4.8, total_sales: 45000000000, total_commissions: 1125000000, sold_count: 12 },
    { id: 2, name: "سارا حسینی", avatar: null, rating: 4.9, total_sales: 38000000000, total_commissions: 950000000, sold_count: 10 },
    { id: 3, name: "رضا رضایی", avatar: null, rating: 4.5, total_sales: 28000000000, total_commissions: 700000000, sold_count: 8 },
    { id: 4, name: "مریم کریمی", avatar: null, rating: 4.7, total_sales: 22000000000, total_commissions: 550000000, sold_count: 7 },
    { id: 5, name: "محمد احمدی", avatar: null, rating: 4.2, total_sales: 15000000000, total_commissions: 375000000, sold_count: 5 },
  ]
};

const MOCK_MONTHLY_STATS = [
  { month: "فروردین", published: 45, draft: 10, featured: 5, verified: 40 },
  { month: "اردیبهشت", published: 60, draft: 15, featured: 8, verified: 55 },
  { month: "خرداد", published: 85, draft: 20, featured: 12, verified: 80 },
  { month: "تیر", published: 110, draft: 12, featured: 15, verified: 105 },
  { month: "مرداد", published: 95, draft: 18, featured: 10, verified: 90 },
  { month: "شهریور", published: 130, draft: 25, featured: 20, verified: 125 },
];

export function RealEstateStatisticsOverview() {
  // USE MOCK DATA DIRECTLY
  const stats = MOCK_STATS;
  const monthlyStats = MOCK_MONTHLY_STATS;
  const isLoading = false;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const error = null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Financial Overview - Top Relevance */}
      <FinancialStatsCards data={stats?.financials} isLoading={isLoading} />

      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="کل املاک"
          value={stats?.properties?.total || 0}
          icon={<Home className="h-4 w-4 text-blue-500" />}
          description="تعداد کل املاک ثبت شده"
          isLoading={isLoading}
          iconColor="text-blue-500"
          iconBg="bg-blue-50"
          borderColor="border-b-blue-500"
        />
        <StatCard
          title="املاک منتشر شده"
          value={stats?.properties?.published || 0}
          icon={<CheckCircle className="h-4 w-4 text-green-500" />}
          description={`${stats?.properties?.published_percentage || 0}٪ از کل املاک`}
          isLoading={isLoading}
          iconColor="text-green-500"
          iconBg="bg-green-50"
          borderColor="border-b-green-500"
        />
        <StatCard
          title="پیش‌نویس‌ها"
          value={stats?.properties?.draft || 0}
          icon={<FileText className="h-4 w-4 text-amber-500" />}
          description="املاک در انتظار انتشار"
          isLoading={isLoading}
          iconColor="text-amber-500"
          iconBg="bg-amber-50"
          borderColor="border-b-amber-500"
        />
        <StatCard
          title="املاک ویژه"
          value={stats?.properties?.featured || 0}
          icon={<Activity className="h-4 w-4 text-purple-500" />}
          description={`${stats?.properties?.featured_percentage || 0}٪ از کل املاک`}
          isLoading={isLoading}
          iconColor="text-purple-500"
          iconBg="bg-purple-50"
          borderColor="border-b-purple-500"
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Main Activity Chart - Takes 2/3 width */}
        <div className="md:col-span-2">
          <PropertiesChart
            monthlyStats={monthlyStats || []}
            statistics={stats}
            isLoading={isLoading}
          />
        </div>
        {/* Traffic Sources Chart - Takes 1/3 width */}
        <div className="md:col-span-1">
          <TrafficSourceChart
            data={stats?.traffic}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Agents & Agencies Section - Two Columns */}
      <div className="grid gap-6 md:grid-cols-2">
        <TopAgentsList agents={stats?.top_agents} isLoading={isLoading} />

        <div className="space-y-4">
          {/* Detailed Stats Cards for Agents/Agencies */}
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard
              title="مشاورین فعال"
              value={stats?.agents?.active || 0}
              subtitle={`کل مشاورین: ${stats?.agents?.total || 0}`}
              icon={<UserCheck className="h-5 w-5 text-blue-500" />}
              isLoading={isLoading}
              iconColor="text-blue-500"
              iconBg="bg-blue-50"
              borderColor="border-b-blue-500"
            />
            <StatCard
              title="آژانس‌های فعال"
              value={stats?.agencies?.active || 0}
              subtitle={`کل آژانس‌ها: ${stats?.agencies?.total || 0}`}
              icon={<Building className="h-5 w-5 text-indigo-500" />}
              isLoading={isLoading}
              iconColor="text-indigo-500"
              iconBg="bg-indigo-50"
              borderColor="border-b-indigo-500"
            />
            <StatCard
              title="مشاورین دارای ملک"
              value={stats?.agents?.with_properties || 0}
              subtitle={`دارای حداقل یک ملک`}
              icon={<Users className="h-5 w-5 text-cyan-500" />}
              isLoading={isLoading}
              iconColor="text-cyan-500"
              iconBg="bg-cyan-50"
              borderColor="border-b-cyan-500"
            />
            <StatCard
              title="آژانس‌های دارای ملک"
              value={stats?.agencies?.with_properties || 0}
              subtitle={`دارای حداقل یک ملک`}
              icon={<Layers className="h-5 w-5 text-violet-500" />}
              isLoading={isLoading}
              iconColor="text-violet-500"
              iconBg="bg-violet-50"
              borderColor="border-b-violet-500"
            />
          </div>
        </div>
      </div>

      {/* Attribute Distribution - Grid 4 cols */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="انواع ملک استفاده شده"
          value={stats?.types?.with_properties || 0}
          subtitle={`از کل: ${stats?.types?.total || 0}`}
          icon={<Grid className="h-5 w-5 text-slate-500" />}
          isLoading={isLoading}
          iconColor="text-slate-500"
          iconBg="bg-slate-50"
          borderColor="border-b-slate-500"
        />
        <StatCard
          title="استان‌های پوشش داده شده"
          value={stats?.states?.with_properties || 0}
          subtitle={`از کل: ${stats?.states?.total || 0}`}
          icon={<MapPin className="h-5 w-5 text-emerald-500" />}
          isLoading={isLoading}
          iconColor="text-emerald-500"
          iconBg="bg-emerald-50"
          borderColor="border-b-emerald-500"
        />
        <StatCard
          title="برچسب‌های استفاده شده"
          value={stats?.labels?.with_properties || 0}
          subtitle={`از کل: ${stats?.labels?.total || 0}`}
          icon={<Tag className="h-5 w-5 text-pink-500" />}
          isLoading={isLoading}
          iconColor="text-pink-500"
          iconBg="bg-pink-50"
          borderColor="border-b-pink-500"
        />
        <StatCard
          title="ویژگی‌های استفاده شده"
          value={stats?.features?.with_properties || 0}
          subtitle={`از کل: ${stats?.features?.total || 0}`}
          icon={<Activity className="h-5 w-5 text-orange-500" />}
          isLoading={isLoading}
          iconColor="text-orange-500"
          iconBg="bg-orange-50"
          borderColor="border-b-orange-500"
        />
      </div>
    </div>
  );
}
