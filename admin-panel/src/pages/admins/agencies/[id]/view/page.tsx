import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger } from "@/components/elements/Tabs";
import { Button } from "@/components/elements/Button";
import { FileText, Search, Edit2 } from "lucide-react";
import { Skeleton } from "@/components/elements/Skeleton";
import { realEstateApi } from "@/api/real-estate/properties";
import { AgencySidebar } from "@/components/real-estate/agencies/view/AgencySidebar";
import { OverviewTab } from "@/components/real-estate/agencies/view/OverviewTab";
import { SEOInfoTab } from "@/components/real-estate/agencies/view/SEOInfoTab";

export default function AgencyViewPage() {
  const params = useParams();
  const navigate = useNavigate();
  const agencyId = params?.id as string;
  const [activeTab, setActiveTab] = useState("overview");

  const { data: agencyData, isLoading, error } = useQuery({
    queryKey: ["agency", agencyId],
    queryFn: () => realEstateApi.getAgencyById(Number(agencyId)),
    staleTime: 0,
    enabled: !!agencyId,
  });

  if (!agencyId) {
    return (
      <div className="space-y-6">
        <PageHeader title="نمایش آژانس" />
        <div className="text-center py-8">
          <p className="text-destructive">شناسه آژانس یافت نشد</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="اطلاعات آژانس">
          <>
            <Button disabled>
              <Edit2 />
              ویرایش آژانس
            </Button>
          </>
        </PageHeader>
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-2">
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
          <div className="lg:col-span-4 space-y-6">
            <div className="flex gap-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !agencyData) {
    return (
      <div className="space-y-6">
        <PageHeader title="نمایش آژانس" />
        <div className="rounded-lg border p-6">
          <div className="text-center py-8">
            <p className="text-red-1 mb-4">خطا در بارگذاری اطلاعات آژانس</p>
            <p className="text-font-s">
              لطفاً دوباره تلاش کنید یا با مدیر سیستم تماس بگیرید.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="اطلاعات آژانس">
        <>
          <Button
            onClick={() => navigate(`/admins/agencies/${agencyId}/edit`)}
          >
            <Edit2 />
            ویرایش آژانس
          </Button>
        </>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
        <div className="lg:col-span-2">
          <AgencySidebar agency={agencyData} />
        </div>

        <div className="lg:col-span-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList>
              <TabsTrigger value="overview">
                <FileText className="h-4 w-4" />
                مرور کلی
              </TabsTrigger>
              <TabsTrigger value="seo">
                <Search className="h-4 w-4" />
                سئو
              </TabsTrigger>
            </TabsList>

            <OverviewTab agency={agencyData} />
            <SEOInfoTab agency={agencyData} />
          </Tabs>
        </div>
      </div>
    </div>
  );
}
