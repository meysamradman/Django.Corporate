import { lazy, Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { Skeleton } from "@/components/elements/Skeleton";
import { usePermission, AccessDenied } from "@/core/permissions";

const StatisticsSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="border p-6">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-32" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="border p-6">
          <Skeleton className="h-6 w-48 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      ))}
    </div>
  </div>
);

const RealEstateStatisticsOverview = lazy(() => 
  import("@/components/real-estate/statistics/RealEstateStatisticsOverview").then(mod => ({ 
    default: mod.RealEstateStatisticsOverview 
  }))
);

export default function RealEstateStatisticsPage() {
  const { hasPermission: _hasPermission, hasAnyPermission, isLoading } = usePermission();

  if (isLoading) {
    return <StatisticsSkeleton />;
  }

  if (!hasAnyPermission([
    'real_estate.property.read',
    'real_estate.agent.read',
    'real_estate.agency.read',
  ])) {
    return <AccessDenied />;
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="آمار و گزارش‌های املاک"
        description="مشاهده و تحلیل آمار کلی املاک، مشاورین و آژانس‌ها"
      />

      <Suspense fallback={<StatisticsSkeleton />}>
        <RealEstateStatisticsOverview />
      </Suspense>
    </div>
  );
}

