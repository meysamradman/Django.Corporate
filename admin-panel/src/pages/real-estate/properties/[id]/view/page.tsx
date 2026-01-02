import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger } from "@/components/elements/Tabs";
import { Button } from "@/components/elements/Button";
import { ProtectedButton } from "@/core/permissions";
import { FileText, Image, Search, Edit2, FileDown, Settings } from "lucide-react";
import { showError, showSuccess } from '@/core/toast';
import { Skeleton } from "@/components/elements/Skeleton";
import { realEstateApi } from "@/api/real-estate";
import { RealtorCard } from "@/components/real-estate/list/view/RealtorCard";
import { PropertyImageGallery } from "@/components/real-estate/list/view/PropertyImageGallery";
import { PropertyBasicInfo } from "@/components/real-estate/list/view/PropertyBasicInfo";
import { OverviewTab } from "@/components/real-estate/list/view/OverviewTab";
import { MediaInfoTab } from "@/components/real-estate/list/view/MediaInfoTab";
import { SEOInfoTab } from "@/components/real-estate/list/view/SEOInfoTab";
import { ExtraAttributesInfoTab } from "@/components/real-estate/list/view/ExtraAttributesInfoTab";

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

      {/* Top Section: Carousel + Basic Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
        {/* Right Side: Carousel (Gallery) - Takes more space */}
        <div className="lg:col-span-7 xl:col-span-8 h-full">
          <PropertyImageGallery property={propertyData} className="h-full" />
        </div>

        {/* Left Side: Basic Info Sidebar - Takes less space */}
        <div className="lg:col-span-5 xl:col-span-4 h-full">
          <PropertyBasicInfo property={propertyData} />
        </div>
      </div>

      {/* Bottom Section: Existing Sidebar + Tabs - Preserved as requested */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
        <div className="lg:col-span-2">
          {/* User specifically asked not to touch "tab and its sidebar", defaulting to keeping it. 
              The top sidebar has initial info, this might have more details. */}
          {/* Realtor Card - Displays Agent or Admin info */}
          <RealtorCard property={propertyData} />
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
              <TabsTrigger value="advanced">
                <Settings className="h-4 w-4" />
                فیلدهای اضافی
              </TabsTrigger>
            </TabsList>

            <OverviewTab property={propertyData} />
            <MediaInfoTab property={propertyData} />
            <SEOInfoTab property={propertyData} />
            <ExtraAttributesInfoTab property={propertyData} />
          </Tabs>
        </div>
      </div>
    </div>
  );
}
