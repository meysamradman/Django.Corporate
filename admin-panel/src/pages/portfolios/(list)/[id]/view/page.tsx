import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger } from "@/components/elements/Tabs";
import { FileText, Image, Search, Edit2, Settings, Printer } from "lucide-react";
import { Skeleton } from "@/components/elements/Skeleton";
import { portfolioApi } from "@/api/portfolios/portfolios";
import { PortfolioCarousel } from "@/components/portfolios/list/view/PortfolioCarousel.tsx";
import { PortfolioInfo } from "@/components/portfolios/list/view/PortfolioInfo.tsx";
import { PortfolioOverview } from "@/components/portfolios/list/view/PortfolioOverview.tsx";
import { PortfolioMedia } from "@/components/portfolios/list/view/PortfolioMedia.tsx";
import { PortfolioSEO } from "@/components/portfolios/list/view/PortfolioSEO.tsx";
import { PortfolioAttributes } from "@/components/portfolios/list/view/PortfolioAttributes.tsx";
import { FloatingActions } from "@/components/elements/FloatingActions";

export default function PortfolioViewPage() {
  const params = useParams();
  const navigate = useNavigate();
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
      <div className="text-center py-8">
        <p className="text-destructive">شناسه نمونه‌کار یافت نشد</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
          <div className="lg:col-span-7 xl:col-span-8 h-full">
            <Skeleton className="h-full w-full" />
          </div>
          <div className="lg:col-span-5 xl:col-span-4 h-full">
            <div className="sticky top-4 self-start">
              <Skeleton className="h-full w-full" />
            </div>
          </div>
        </div>
        <div>
          <Tabs value="overview" className="w-full">
            <TabsList>
              <TabsTrigger value="overview" disabled>
                <FileText className="h-4 w-4" />
                مرور کلی
              </TabsTrigger>
              <TabsTrigger value="media" disabled>
                <Image className="h-4 w-4" />
                مدیا
              </TabsTrigger>
              <TabsTrigger value="extra" disabled>
                <Settings className="h-4 w-4" />
                فیلدهای اضافی
              </TabsTrigger>
              <TabsTrigger value="seo" disabled>
                <Search className="h-4 w-4" />
                سئو
              </TabsTrigger>
            </TabsList>
            <Skeleton className="h-64 w-full mt-4" />
          </Tabs>
        </div>
      </div>
    );
  }

  if (error || !portfolioData) {
    return (
      <div className="border p-6">
        <div className="text-center py-8">
          <p className="text-red-1 mb-4">خطا در بارگذاری اطلاعات نمونه‌کار</p>
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
              const url = `/portfolios/print?ids=${portfolioId}&type=detail`;
              window.open(url, '_blank', 'width=1024,height=768');
            },
          },
          {
            icon: Edit2,
            label: "ویرایش نمونه کار",
            variant: "default",
            permission: "portfolio.update",
            onClick: () => navigate(`/portfolios/${portfolioId}/edit`),
          },
        ]}
        position="left"
      />

      {/* Top Section: Carousel + Basic Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
        {/* Right Side: Carousel (Gallery) - Takes more space */}
        <div className="lg:col-span-7 xl:col-span-8 h-full">
          <PortfolioCarousel portfolio={portfolioData} className="h-full" />
        </div>

        {/* Left Side: Basic Info Sidebar - Takes less space */}
        <div className="lg:col-span-5 xl:col-span-4 h-full">
          <div className="sticky top-4 self-start">
            <PortfolioInfo portfolio={portfolioData} />
          </div>
        </div>
      </div>

      {/* Bottom Section: Tabs */}
      <div>
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
            <TabsTrigger value="extra">
              <Settings className="h-4 w-4" />
              فیلدهای اضافی
            </TabsTrigger>
            <TabsTrigger value="seo">
              <Search className="h-4 w-4" />
              سئو
            </TabsTrigger>
          </TabsList>

          <PortfolioOverview portfolio={portfolioData} />
          <PortfolioMedia portfolio={portfolioData} />
          <PortfolioAttributes portfolio={portfolioData} />
          <PortfolioSEO portfolio={portfolioData} />
        </Tabs>
      </div>
    </div>
  );
}
