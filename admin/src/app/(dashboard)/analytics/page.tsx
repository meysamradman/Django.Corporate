"use client";

import { AnalyticsOverview } from "@/components/analytics";
import { usePermission } from "@/core/permissions/context/PermissionContext";
import { AccessDenied } from "@/core/permissions/components/AccessDenied";
import { ClearAnalyticsButton } from "@/components/analytics/ClearAnalyticsButton";

export default function AnalyticsPage() {
  const { hasPermission } = usePermission();

  if (!hasPermission('analytics.manage')) {
    return <AccessDenied />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">آمار و گزارش‌های بازدید</h1>
          <p className="text-sm text-font-s mt-1">
            مشاهده و تحلیل آمار بازدید وب‌سایت و اپلیکیشن
          </p>
        </div>
        <ClearAnalyticsButton />
      </div>

      <AnalyticsOverview />
    </div>
  );
}

