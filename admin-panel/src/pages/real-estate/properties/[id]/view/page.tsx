import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger } from "@/components/elements/Tabs";
import { Button } from "@/components/elements/Button";
import { ProtectedButton } from "@/components/admins/permissions";
import { FileText, Image, Search, Edit2, FileDown } from "lucide-react";
import { showError, showSuccess } from '@/core/toast';
import { Skeleton } from "@/components/elements/Skeleton";
import { realEstateApi } from "@/api/real-estate";
import { PropertySidebar } from "@/components/real-estate/list/view/PropertySidebar";
import { PropertyImageGallery } from "@/components/real-estate/list/view/PropertyImageGallery";
import { OverviewTab } from "@/components/real-estate/list/view/OverviewTab";
import { MediaInfoTab } from "@/components/real-estate/list/view/MediaInfoTab";
import { SEOInfoTab } from "@/components/real-estate/list/view/SEOInfoTab";

export default function PropertyViewPage() {
  const params = useParams();
  const navigate = useNavigate();
  const propertyId = params?.id as string;
  const [activeTab, setActiveTab] = useState("overview");

  const { data: propertyData, isLoading, error } = useQuery({
    queryKey: ["property", propertyId],
    queryFn: () => realEstateApi.getPropertyById(Number(propertyId)),
    staleTime: 0,
    enabled: !!propertyId,
  });

  if (!propertyId) {
    return (
      <div className="space-y-6">
        <PageHeader title="نمایش ملک" />
        <div className="text-center py-8">
          <p className="text-destructive">شناسه ملک یافت نشد</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="اطلاعات ملک">
          <>
            <Button variant="outline" disabled>
              <FileDown className="h-4 w-4" />
              خروجی PDF
            </Button>
            <Button disabled>
              <Edit2 />
              ویرایش ملک
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

  if (error || !propertyData) {
    return (
      <div className="space-y-6">
        <PageHeader title="نمایش ملک" />
        <div className="rounded-lg border p-6">
          <div className="text-center py-8">
            <p className="text-red-1 mb-4">خطا در بارگذاری اطلاعات ملک</p>
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
      <PageHeader title="اطلاعات ملک">
        <>
          <Button
            variant="outline"
            onClick={async () => {
              try {
                await realEstateApi.exportPropertyPdf(Number(propertyId));
                showSuccess("فایل PDF با موفقیت دانلود شد");
              } catch (error) {
                showError("خطا در دانلود فایل PDF");
              }
            }}
          >
            <FileDown className="h-4 w-4" />
            خروجی PDF
          </Button>
          <ProtectedButton
            permission="real_estate.property.update"
            onClick={() => navigate(`/real-estate/properties/${propertyId}/edit`)}
          >
            <Edit2 />
            ویرایش ملک
          </ProtectedButton>
        </>
      </PageHeader>

      {/* گالری تصاویر حرفه‌ای */}
      <PropertyImageGallery property={propertyData} />

      <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
        <div className="lg:col-span-2">
          <PropertySidebar property={propertyData} />
        </div>

        <div className="lg:col-span-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList>
              <TabsTrigger value="overview">
                <FileText className="h-4 w-4" />
                مرور کلی
              </TabsTrigger>
              <TabsTrigger value="media">
                <Image className="h-4 w-4" />
                مدیا
              </TabsTrigger>
              <TabsTrigger value="seo">
                <Search className="h-4 w-4" />
                سئو
              </TabsTrigger>
            </TabsList>

            <OverviewTab property={propertyData} />
            <MediaInfoTab property={propertyData} />
            <SEOInfoTab property={propertyData} />
          </Tabs>
        </div>
      </div>
    </div>
  );
}

