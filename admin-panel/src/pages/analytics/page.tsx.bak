import { lazy, Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { Skeleton } from "@/components/elements/Skeleton";
import { usePermission, AccessDenied } from "@/core/permissions";
import { ClearAnalyticsButton } from "@/components/analytics/ClearAnalyticsButton";
import { Card, CardContent, CardHeader } from "@/components/elements/Card";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { BarChart3, FileText, MapPin } from "lucide-react";

const AnalyticsSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="border-b-4 border-b-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-8" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>

    <CardWithIcon
      icon={BarChart3}
      title={<Skeleton className="h-6 w-48" />}
      iconBgColor="bg-blue"
      iconColor="stroke-blue-2"
      cardBorderColor="border-b-blue-1"
    >
      <Skeleton className="h-[400px] w-full" />
    </CardWithIcon>

    <div className="grid md:grid-cols-2 gap-4">
      <CardWithIcon
        icon={FileText}
        title="صفحات پربازدید"
        iconBgColor="bg-blue"
        iconColor="stroke-blue-2"
        cardBorderColor="border-b-blue-1"
      >
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </CardWithIcon>

      <CardWithIcon
        icon={MapPin}
        title="کشورهای پربازدید"
        iconBgColor="bg-green"
        iconColor="stroke-green-2"
        cardBorderColor="border-b-green-1"
      >
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </CardWithIcon>
    </div>
  </div>
);

const AnalyticsOverview = lazy(() => import("@/components/analytics").then(mod => ({ default: mod.AnalyticsOverview })));

export default function AnalyticsPage() {
  const { hasPermission: _hasPermission, hasAnyPermission, isLoading } = usePermission();

  if (isLoading) {
    return <AnalyticsSkeleton />;
  }

  if (!hasAnyPermission([
    'analytics.manage',
    'analytics.stats.manage',
    'analytics.dashboard.read',
  ])) {
    return <AccessDenied />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="آمار و گزارش‌های بازدید"
        description="مشاهده و تحلیل آمار بازدید وب‌سایت و اپلیکیشن"
      >
        <ClearAnalyticsButton />
      </PageHeader>

      <Suspense fallback={<AnalyticsSkeleton />}>
        <AnalyticsOverview />
      </Suspense>
    </div>
  );
}

