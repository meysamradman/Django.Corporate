"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/elements/Tabs";
import { Button } from "@/components/elements/Button";
import { FileText, Image, Search, Edit2, FileDown } from "lucide-react";
import { toast } from '@/components/elements/Sonner';
import { Skeleton } from "@/components/elements/Skeleton";
import { portfolioApi } from "@/api/portfolios/route";
import { PortfolioSidebar } from "@/components/portfolios/list/view/PortfolioSidebar";
import { OverviewTab } from "@/components/portfolios/list/view/OverviewTab";
import { MediaInfoTab } from "@/components/portfolios/list/view/MediaInfoTab";
import { SEOInfoTab } from "@/components/portfolios/list/view/SEOInfoTab";

export default function PortfolioViewPage() {
  const params = useParams();
  const router = useRouter();
  const portfolioId = params?.id as string;
  const [activeTab, setActiveTab] = useState("overview");

  const { data: portfolioData, isLoading, error } = useQuery({
    queryKey: ["portfolio", portfolioId],
    queryFn: () => portfolioApi.getPortfolioById(Number(portfolioId)),
    staleTime: 0,
    enabled: !!portfolioId,
  });

  if (!portfolioId) {
    return (
      <div className="space-y-6">
        <h1 className="page-title">نمایش نمونه‌کار</h1>
        <div className="text-center py-8">
          <p className="text-destructive">شناسه نمونه‌کار یافت نشد</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-2">
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
          <div className="lg:col-span-4 space-y-6">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !portfolioData) {
    return (
      <div className="space-y-6">
        <h1 className="page-title">نمایش نمونه‌کار</h1>
        <div className="rounded-lg border p-6">
          <div className="text-center py-8">
            <p className="text-red-1 mb-4">خطا در بارگذاری اطلاعات نمونه‌کار</p>
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">اطلاعات نمونه کار</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={async () => {
              try {
                await portfolioApi.exportPortfolioPdf(Number(portfolioId));
                toast.success("فایل PDF با موفقیت دانلود شد");
              } catch (error) {
                toast.error("خطا در دانلود فایل PDF");
                console.error("PDF export error:", error);
              }
            }}
          >
            <FileDown className="h-4 w-4" />
            خروجی PDF
          </Button>
          <Button
            onClick={() => router.push(`/portfolios/${portfolioId}/edit`)}
          >
            <Edit2 />
            ویرایش نمونه کار
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
        <div className="lg:col-span-2">
          <PortfolioSidebar portfolio={portfolioData} />
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

            <OverviewTab portfolio={portfolioData} />
            <MediaInfoTab portfolio={portfolioData} />
            <SEOInfoTab portfolio={portfolioData} />
          </Tabs>
        </div>
      </div>
    </div>
  );
}
