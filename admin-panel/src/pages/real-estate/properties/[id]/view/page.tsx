import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger } from "@/components/elements/Tabs";
import { FileText, Image, Search, Edit2, Printer, Settings } from "lucide-react";

import { Skeleton } from "@/components/elements/Skeleton";
import { realEstateApi } from "@/api/real-estate";
import { usePropertyPrintView } from "@/hooks/real-estate/usePropertyPrintView";
import { RealEstateRealtorCard } from "@/components/real-estate/list/view/RealEstateRealtorCard.tsx";
import { RealEstateCarousel } from "@/components/real-estate/list/view/RealEstateCarousel.tsx";
import { RealEstateInfo } from "@/components/real-estate/list/view/RealEstateInfo.tsx";
import { RealEstateOverview } from "@/components/real-estate/list/view/RealEstateOverview.tsx";
import { RealEstateMedia } from "@/components/real-estate/list/view/RealEstateMedia.tsx";
import { RealEstateSEO } from "@/components/real-estate/list/view/RealEstateSEO.tsx";
import { RealEstateAttributes } from "@/components/real-estate/list/view/RealEstateAttributes.tsx";
import { usePropertyPdfExport } from "@/hooks/real-estate/usePropertyPdfExport";
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

  const { openPrintWindow } = usePropertyPrintView();
  const { exportSinglePropertyPdf, isLoading: isExportingPdf } = usePropertyPdfExport();

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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-125">
          {/* Main Gallery Skeleton */}
          <div className="lg:col-span-7 xl:col-span-8 h-full bg-card rounded-xl border border-br p-6">
            <Skeleton className="h-125 w-full rounded-xl" />
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
            icon: Printer,
            label: "خروجی PDF / چاپ سند",
            variant: "outline",
            onClick: () => {
              openPrintWindow([Number(propertyId)], 'detail');
            },
          },
          {
            icon: FileText,
            label: `دریافت فایل PDF ${isExportingPdf ? "..." : ""}`,
            variant: "outline",
            onClick: () => exportSinglePropertyPdf(Number(propertyId)),
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


      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-125">
        <div className="lg:col-span-7 xl:col-span-8 h-full">
          <RealEstateCarousel property={propertyData} className="h-full" />
        </div>
        <div className="lg:col-span-5 xl:col-span-4 h-full">
          <div className="sticky top-4 self-start">
            <RealEstateInfo property={propertyData} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
        <div className="lg:col-span-2">
          <RealEstateRealtorCard property={propertyData} />
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

            <RealEstateOverview property={propertyData} />
            <RealEstateMedia property={propertyData} />
            <RealEstateSEO property={propertyData} />
            <RealEstateAttributes property={propertyData} />
          </Tabs>
        </div>
      </div>
    </div>
  );
}
