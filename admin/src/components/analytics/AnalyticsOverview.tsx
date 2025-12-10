"use client";

import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/api/analytics/route";
import { useAnalytics } from "@/components/dashboard/hooks/useAnalytics";
import { SummaryCards } from "./SummaryCards";
import { VisitorChart } from "./VisitorChart";
import { TopPages } from "./TopPages";
import { TopCountries } from "./TopCountries";
import { PermissionGate } from "@/core/permissions/components/PermissionGate";

// ============================================
// 📊 داده‌های Mock برای نمایش و تست
// بعدا این داده‌ها با API واقعی جایگزین می‌شوند
// ============================================
const mockAnalytics = {
  today: {
    total: 1247,
    unique: 892,
    web: 756,
    app: 491,
  },
  last_30_days: {
    total: 45230,
    unique: 28900,
    web: 26500,
    app: 18730,
    mobile: 32000,
    desktop: 13230,
  },
  top_pages: [
    { path: '/', count: 12500 },
    { path: '/about', count: 8900 },
    { path: '/portfolio', count: 6700 },
    { path: '/blog', count: 5400 },
    { path: '/contact', count: 3200 },
  ],
  top_countries: [
    { country: 'ایران', count: 35000 },
    { country: 'آمریکا', count: 5200 },
    { country: 'کانادا', count: 2800 },
    { country: 'انگلستان', count: 1500 },
    { country: 'آلمان', count: 730 },
  ],
};

const mockMonthlyStats = {
  monthly_stats: [
    { month: "تیر", desktop: 1850, mobile: 1200 },
    { month: "مرداد", desktop: 2100, mobile: 1450 },
    { month: "شهریور", desktop: 1950, mobile: 1380 },
    { month: "مهر", desktop: 2200, mobile: 1620 },
    { month: "آبان", desktop: 2400, mobile: 1800 },
    { month: "آذر", desktop: 2650, mobile: 2100 },
  ],
};

export function AnalyticsOverview() {
  const { data: analytics, isLoading: analyticsLoading } = useAnalytics();
  const { data: monthlyData, isLoading: monthlyLoading } = useQuery({
    queryKey: ["analytics", "monthly-stats"],
    queryFn: () => analyticsApi.getMonthlyStats(),
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // ============================================
  // 🔄 استفاده از داده‌های Mock (موقت)
  // برای فعال کردن API واقعی، این خطوط رو تغییر بدید:
  // const displayAnalytics = analytics || mockAnalytics;
  // const displayMonthlyData = monthlyData || mockMonthlyStats;
  // ============================================
  const displayAnalytics = mockAnalytics; // موقت: استفاده از mock data
  const displayMonthlyData = mockMonthlyStats; // موقت: استفاده از mock data

  // برای نمایش mock data، loading رو false می‌ذاریم
  // بعدا که API واقعی رو فعال کردید، این رو تغییر بدید:
  // const isLoading = analyticsLoading || monthlyLoading;
  const isLoading = false;

  const monthlyStats = displayMonthlyData?.monthly_stats || [];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <PermissionGate permission="analytics.manage">
        <SummaryCards 
          analytics={displayAnalytics} 
          monthlyStats={monthlyStats}
        />
      </PermissionGate>

      {/* Main Chart */}
      <PermissionGate permission="analytics.manage">
        <VisitorChart 
          monthlyStats={monthlyStats}
          analytics={displayAnalytics}
          isLoading={isLoading}
        />
      </PermissionGate>

      {/* Top Pages & Countries */}
      <PermissionGate permission="analytics.manage">
        <div className="grid md:grid-cols-2 gap-4">
          <TopPages 
            topPages={displayAnalytics.top_pages}
            isLoading={isLoading}
          />
          <TopCountries 
            topCountries={displayAnalytics.top_countries}
            isLoading={isLoading}
          />
        </div>
      </PermissionGate>
    </div>
  );
}

