import { lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/api/analytics/analytics";
import { useAnalytics } from "@/components/dashboard/hooks/useAnalytics";
import { PermissionGate } from "@/components/admins/permissions/components/PermissionGate";
import { Skeleton } from "@/components/elements/Skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { BarChart3, FileText, MapPin } from "lucide-react";

// Summary Cards Skeleton
const SummaryCardsSkeleton = () => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    {[...Array(4)].map((_, i) => (
      <Card key={i} className="border-b-4 border-b-primary">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-20" />
        </CardContent>
      </Card>
    ))}
  </div>
);

// Visitor Chart Skeleton
const VisitorChartSkeleton = () => (
  <Card className="border-b-4 border-b-primary">
    <CardHeader>
      <CardTitle className="flex items-center gap-3">
        <div className="p-2.5 rounded-lg shadow-sm bg-primary/10">
          <BarChart3 className="w-5 h-5 stroke-primary" />
        </div>
        <Skeleton className="h-6 w-48" />
      </CardTitle>
      <Skeleton className="h-4 w-64 mt-1" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-[400px] w-full" />
    </CardContent>
  </Card>
);

// Top Pages Skeleton
const TopPagesSkeleton = () => (
  <CardWithIcon
    icon={FileText}
    title="صفحات پربازدید"
    iconBgColor="bg-blue"
    iconColor="stroke-blue-2"
    borderColor="border-b-blue-1"
  >
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  </CardWithIcon>
);

// Top Countries Skeleton
const TopCountriesSkeleton = () => (
  <CardWithIcon
    icon={MapPin}
    title="کشورهای پربازدید"
    iconBgColor="bg-green"
    iconColor="stroke-green-2"
    borderColor="border-b-green-1"
  >
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  </CardWithIcon>
);

// Lazy imports
const SummaryCards = lazy(() => import("./SummaryCards").then(mod => ({ default: mod.SummaryCards })));
const VisitorChart = lazy(() => import("./VisitorChart").then(mod => ({ default: mod.VisitorChart })));
const TopPages = lazy(() => import("./TopPages").then(mod => ({ default: mod.TopPages })));
const TopCountries = lazy(() => import("./TopCountries").then(mod => ({ default: mod.TopCountries })));

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
        <Suspense fallback={<SummaryCardsSkeleton />}>
          <SummaryCards 
            analytics={displayAnalytics} 
            monthlyStats={monthlyStats}
          />
        </Suspense>
      </PermissionGate>

      {/* Main Chart */}
      <PermissionGate permission="analytics.manage">
        <Suspense fallback={<VisitorChartSkeleton />}>
          <VisitorChart 
            monthlyStats={monthlyStats}
          analytics={displayAnalytics}
          isLoading={isLoading}
        />
        </Suspense>
      </PermissionGate>

      <PermissionGate permission="analytics.manage">
        <div className="grid md:grid-cols-2 gap-4">
          <Suspense fallback={<TopPagesSkeleton />}>
            <TopPages 
              topPages={displayAnalytics.top_pages}
              isLoading={isLoading}
            />
          </Suspense>
          <Suspense fallback={<TopCountriesSkeleton />}>
            <TopCountries 
              topCountries={displayAnalytics.top_countries}
              isLoading={isLoading}
            />
          </Suspense>
        </div>
      </PermissionGate>
    </div>
  );
}

