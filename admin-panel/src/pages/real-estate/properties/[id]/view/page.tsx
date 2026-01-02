import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger } from "@/components/elements/Tabs";
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
import { FloatingActions } from "@/components/elements/FloatingActions";

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
      <div className="text-center py-8">
        <p className="text-destructive">شناسه ملک یافت نشد</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Top Section Skeleton: Carousel + Basic Info */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
          {/* Main Gallery Skeleton */}
          <div className="lg:col-span-7 xl:col-span-8 h-full bg-card rounded-xl border border-br p-6">
            <Skeleton className="h-[500px] w-full rounded-xl" />
            <div className="flex gap-3 mt-4 overflow-hidden">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-24 w-36 rounded-lg shrink-0" />
              ))}
            </div>
          </div>
          {/* Basic Info Skeleton */}
          <div className="lg:col-span-5 xl:col-span-4 h-full bg-card rounded-xl border border-br p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3 mb-6">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))}
              </div>
              <Skeleton className="h-10 w-3/4 rounded-lg" />
              <div className="space-y-3 mt-8">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="flex justify-between py-2 border-b border-br">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section Skeleton: Sidebar + Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-2 bg-card rounded-xl border border-br p-6 self-start">
            <div className="space-y-6">
              <Skeleton className="aspect-video w-full rounded-xl" />
              <div className="space-y-4">
                <Skeleton className="h-8 w-2/3 mx-auto" />
                <Skeleton className="h-6 w-1/3 mx-auto" />
              </div>
              <div className="space-y-3 pt-6 border-t border-br">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="flex gap-2">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-10 w-28 rounded-lg" />
              ))}
            </div>
            <div className="bg-card rounded-xl border border-br p-6 flex-1">
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-32 w-full rounded-lg" />
                ))}
              </div>
              <Skeleton className="h-64 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }



  if (error || !propertyData) {
    return (
      <div className="border p-6">
        <div className="text-center py-8">
          <p className="text-red-1 mb-4">خطا در بارگذاری اطلاعات ملک</p>
          <p className="text-font-s">
            لطفاً دوباره تلاش کنید یا با مدیر سیستم تماس بگیرید.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <FloatingActions
        actions={[
          {
            icon: FileDown,
            label: "خروجی PDF",
            variant: "outline",
            onClick: async () => {
              try {
                await realEstateApi.exportPropertyPdf(Number(propertyId));
                showSuccess("فایل PDF با موفقیت دانلود شد");
              } catch (error) {
                showError("خطا در دانلود فایل PDF");
              }
            },
          },
          {
            icon: Edit2,
            label: "ویرایش ملک",
            variant: "default",
            permission: "real_estate.property.update",
            onClick: () => navigate(`/real-estate/properties/${propertyId}/edit`),
          },
        ]}
        position="left"
      />

      {/* Top Section: Carousel + Basic Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
        {/* Right Side: Carousel (Gallery) - Takes more space */}
        <div className="lg:col-span-7 xl:col-span-8 h-full">
          <PropertyImageGallery property={propertyData} className="h-full" />
        </div>

        {/* Left Side: Basic Info Sidebar - Takes less space */}
        <div className="lg:col-span-5 xl:col-span-4 h-full">
          <div className="sticky top-4 self-start">
            <PropertyBasicInfo property={propertyData} />
          </div>
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
