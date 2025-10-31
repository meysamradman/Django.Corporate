"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/elements/Tabs";
import { FileText, Image, Search } from "lucide-react";
import { Skeleton } from "@/components/elements/Skeleton";
import { portfolioApi } from "@/api/portfolios/route";
import { PortfolioInfoHeader } from "@/components/portfolios/list/view/PortfolioInfoHeader";
import { GeneralInfoTab } from "@/components/portfolios/list/view/GeneralInfoTab";
import { MediaInfoTab } from "@/components/portfolios/list/view/MediaInfoTab";
import { SEOInfoTab } from "@/components/portfolios/list/view/SEOInfoTab";

export default function PortfolioViewPage() {
  const params = useParams();
  const portfolioId = params?.id as string;
  const [activeTab, setActiveTab] = useState("general");

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
        <h1 className="page-title">نمایش نمونه‌کار</h1>
        <div className="rounded-lg border p-6">
          <Skeleton className="h-32 w-full mb-4" />
          <Skeleton className="h-8 w-1/3 mb-2" />
          <Skeleton className="h-4 w-2/3" />
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
            <p className="text-red-500 mb-4">خطا در بارگذاری اطلاعات نمونه‌کار</p>
            <p className="text-sm text-muted-foreground">
              لطفاً دوباره تلاش کنید یا با مدیر سیستم تماس بگیرید.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="page-title">نمایش نمونه‌کار</h1>
      <PortfolioInfoHeader portfolio={portfolioData} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="general">
            <FileText className="w-4 h-4 me-2" />
            اطلاعات عمومی
          </TabsTrigger>
          <TabsTrigger value="media">
            <Image className="w-4 h-4 me-2" />
            رسانه‌ها
          </TabsTrigger>
          <TabsTrigger value="seo">
            <Search className="w-4 h-4 me-2" />
            سئو
          </TabsTrigger>
        </TabsList>

        <GeneralInfoTab portfolio={portfolioData} />
        <MediaInfoTab portfolio={portfolioData} />
        <SEOInfoTab portfolio={portfolioData} />
      </Tabs>
    </div>
  );
}

