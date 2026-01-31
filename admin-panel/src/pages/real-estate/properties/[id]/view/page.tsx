import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FileText, Image, Search, Edit2, Printer, MapPin, Building2, Layers, Calendar, Clock, Eye, User } from "lucide-react";

import { Skeleton } from "@/components/elements/Skeleton";
import { realEstateApi } from "@/api/real-estate";
import { usePropertyPrintView } from "@/hooks/real-estate/usePropertyPrintView";
import { RealEstateCarousel } from "@/components/real-estate/list/view/RealEstateCarousel.tsx";
import { RealEstateInfo } from "@/components/real-estate/list/view/RealEstateInfo.tsx";
import { RealEstateOverview } from "@/components/real-estate/list/view/RealEstateOverview.tsx";
import { RealEstateMedia } from "@/components/real-estate/list/view/RealEstateMedia.tsx";
import { RealEstateSEO } from "@/components/real-estate/list/view/RealEstateSEO.tsx";
import { RealEstateAttributes } from "@/components/real-estate/list/view/RealEstateAttributes.tsx";
import { PropertySidebar } from "@/components/real-estate/view/PropertySidebar.tsx";
import { usePropertyPdfExport } from "@/hooks/real-estate/usePropertyPdfExport";
import { Button } from "@/components/elements/Button";
import { Star, Globe } from "lucide-react";
import { FloatingActions } from "@/components/elements/FloatingActions";

export default function PropertyViewPage() {
  const params = useParams();
  const navigate = useNavigate();
  const propertyId = params?.id as string;
  const [activeSection, setActiveSection] = useState("overview");

  const statusConfig: Record<string, any> = {
    active: { label: "فعال", bg: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
    pending: { label: "در حال معامله", bg: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
    sold: { label: "فروخته شده", bg: "bg-rose-50 text-rose-700", dot: "bg-rose-500" },
    rented: { label: "اجاره داده شده", bg: "bg-blue-50 text-blue-700", dot: "bg-blue-500" },
    archived: { label: "بایگانی شده", bg: "bg-slate-50 text-slate-700", dot: "bg-slate-500" },
  };

  const { data: propertyData, isLoading, error } = useQuery({
    queryKey: ["property", propertyId],
    queryFn: () => realEstateApi.getPropertyById(Number(propertyId)),
    staleTime: 0,
    enabled: !!propertyId,
  });

  const { openPrintWindow } = usePropertyPrintView();
  const { exportSinglePropertyPdf, isLoading: isExportingPdf } = usePropertyPdfExport();

  // Scroll spy to update active section based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const sections = ["overview", "media", "seo", "attributes"];

      for (const section of sections) {
        const element = document.getElementById(`section-${section}`);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom >= 100) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(`section-${sectionId}`);
    if (element) {
      // Use a safer scroll approach that works for window or container
      const yOffset = -100; // Offset for sticky header/nav
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  if (!propertyId) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">شناسه ملک یافت نشد</p>
      </div>
    );
  }

  if (isLoading) {
    return <PropertyViewSkeleton />;
  }

  if (error || !propertyData) {
    return (
      <div className="border p-6 rounded-xl bg-card border-br">
        <div className="text-center py-8">
          <p className="text-red-1 mb-4">خطا در بارگذاری اطلاعات ملک</p>
          <p className="text-font-s mb-6">
            لطفاً دوباره تلاش کنید یا با مدیر سیستم تماس بگیرید.
          </p>
          <Button onClick={() => window.location.reload()}>تلاش مجدد</Button>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: "overview", label: "مرور کلی", icon: FileText },
    { id: "media", label: "رسانه‌ها", icon: Image },
    { id: "seo", label: "سئو و متادیتا", icon: Search },
    { id: "attributes", label: "ویزگی‌های اضافی", icon: Layers },
  ];

  return (
    <div className="space-y-6 pb-20">

      {/* Floating Actions Sidebar - Portfolio Style */}
      <FloatingActions
        actions={[
          {
            icon: Printer,
            label: "خروجی PDF / چاپ جزئیات",
            variant: "outline",
            onClick: () => openPrintWindow([Number(propertyId)], 'detail'),
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
            permission: "real_estate.update", // Assuming permission check, can be adjusted
            onClick: () => navigate(`/real-estate/properties/${propertyId}/edit`),
          },
        ]}
        position="left"
      />

      {/* Header Actions */}
      {/* Minimal & Professional Header */}
      <div className="bg-card rounded-xl border border-br shadow-sm p-5 relative overflow-hidden">
        {/* Decorative Background Pattern */}
        <div className="absolute top-0 right-0 w-full h-1 bg-linear-to-r from-blue/40 via-purple/40 to-pink/40" />

        <div className="flex flex-wrap items-center justify-between gap-4">

          {/* Title & Status Section */}
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-bg border border-br text-blue-600 dark:text-blue-400 shadow-sm">
              <Building2 className="w-7 h-7 opacity-80" />
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-font-p tracking-tight">{propertyData.title}</h1>
                <span className="font-mono text-xs text-font-s bg-bg px-2 py-0.5 rounded border border-br">ID: {propertyData.id}</span>
                {/* Status Badge */}
                <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusConfig[propertyData.status]?.bg || 'bg-slate-100'} ${statusConfig[propertyData.status]?.text || 'text-slate-600'} border-transparent`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${statusConfig[propertyData.status]?.dot || 'bg-slate-500'}`} />
                  <span>{statusConfig[propertyData.status]?.label || propertyData.status}</span>
                </div>
              </div>

              {/* Property Key Facts / Main Overview - REPLACED TAGS WITH THIS */}
              <div className="flex flex-wrap items-center gap-6 mt-3 text-sm text-font-p">
                {/* Area */}
                <div className="flex items-center gap-2" title="متراژ">
                  <div className="p-1 rounded bg-blue/10">
                    <Layers className="w-3.5 h-3.5 text-blue" />
                  </div>
                  <span className="font-medium font-mono" dir="ltr">{propertyData.built_area || propertyData.land_area || 0} m²</span>
                </div>

                {/* Bedrooms */}
                <div className="flex items-center gap-2" title="تعداد خواب">
                  <div className="p-1 rounded bg-purple/10">
                    <Building2 className="w-3.5 h-3.5 text-purple" />
                  </div>
                  <span className="font-medium">{propertyData.bedrooms || 0} خواب</span>
                </div>

                {/* Price */}
                <div className="flex items-center gap-2" title="قیمت">
                  <span className="font-bold text-lg text-emerald-600">
                    {propertyData.price
                      ? new Intl.NumberFormat('fa-IR').format(Number(propertyData.price)) + ' تومان'
                      : 'توافقی'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary Meta (Agent & Date) - Redesigned */}
          <div className="flex items-center gap-6 pl-2">

            {/* Date - Hidden on small screens if needed, or kept compact */}
            <div className="hidden sm:flex flex-col items-end gap-1 text-xs text-font-s border-l border-br pl-6 ml-2">
              <span className="opacity-70">تاریخ ثبت</span>
              <div className="flex items-center gap-1.5 font-medium text-font-p">
                <Calendar className="w-3.5 h-3.5" />
                <span>{new Date(propertyData.created_at).toLocaleDateString('fa-IR')}</span>
              </div>
            </div>

            {/* Agent Profile - Larger & Cleaner */}
            {propertyData.agent && (
              <div className="flex items-center gap-4">
                <div className="text-left py-1">
                  <p className="text-base font-bold text-font-p">{propertyData.agent.first_name} {propertyData.agent.last_name}</p>
                  <p className="text-xs text-blue-600 font-medium mt-1 dir-ltr inline-block">
                    {propertyData.agent.phone || 'مشاور املاک'}
                  </p>
                </div>

                <div className="relative shrink-0">
                  {propertyData.agent.profile_picture_url ? (
                    <img
                      src={propertyData.agent.profile_picture_url.startsWith('http') ? propertyData.agent.profile_picture_url : `https://api.irhomeland.com${propertyData.agent.profile_picture_url}`}
                      alt={propertyData.agent.first_name}
                      className="w-14 h-14 rounded-full border-2 border-white shadow-md object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder-avatar.png'; }}
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-blue-50 border-2 border-white shadow-md flex items-center justify-center text-blue-500">
                      <User className="w-7 h-7" />
                    </div>
                  )}
                  <div className="absolute bottom-1 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">

        {/* Main Content Column (Left Side) */}
        <div className="xl:col-span-9 space-y-8">

          {/* Improved Carousel - REMOVED WRAPPER */}
          <div className="shadow-sm rounded-xl overflow-hidden border border-br">
            <RealEstateCarousel property={propertyData} className="w-full" />
          </div>

          {/* Navigation Menu - Horizontal Bar */}
          <div className="bg-card border border-br rounded-xl shadow-sm p-1.5 mb-6 overflow-x-auto sticky top-20 z-30">
            <div className="flex items-center gap-1 min-w-max">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeSection === item.id
                    ? "bg-blue text-white shadow-md shadow-blue/20"
                    : "text-font-s hover:bg-bg-2 hover:text-font-p"
                    }`}
                >
                  <item.icon className={`w-4 h-4 ${activeSection === item.id ? "text-white" : "text-gray-2"}`} />
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sections */}
          <div id="section-overview" className="scroll-mt-24">
            <RealEstateOverview property={propertyData} />
          </div>

          {/* Removed separate Location section as it is now in sidebar */}

          <div id="section-media" className="scroll-mt-24">
            <div className="bg-card rounded-xl border border-br p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-br">
                <Image className="w-5 h-5 text-blue-1" />
                <h2 className="text-lg font-semibold">رسانه‌ها و گالری</h2>
              </div>
              <RealEstateMedia property={propertyData} />
            </div>
          </div>

          <div id="section-seo" className="scroll-mt-24">
            <div className="bg-card rounded-xl border border-br p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-br">
                <Search className="w-5 h-5 text-purple-1" />
                <h2 className="text-lg font-semibold">تنظیمات سئو</h2>
              </div>
              <RealEstateSEO property={propertyData} />
            </div>
          </div>

          <div id="section-attributes" className="scroll-mt-24">
            <div className="bg-card rounded-xl border border-br p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-br">
                <Layers className="w-5 h-5 text-orange-1" />
                <h2 className="text-lg font-semibold">امکانات و ویژگی‌ها</h2>
              </div>
              <RealEstateAttributes property={propertyData} />
            </div>
          </div>

        </div>

        {/* Sidebar Column (Right Side) */}
        <div className="xl:col-span-3 space-y-6 xl:sticky xl:top-24 h-fit">

          {/* Unified Sidebar Card - Map & Agent */}
          <PropertySidebar property={propertyData} />

          {/* Info Card - Status & Details */}
          <RealEstateInfo property={propertyData} />

          {/* Quick Actions (Mobile only) */}
          <div className="xl:hidden grid grid-cols-2 gap-3">
            <Button variant="outline" className="w-full" onClick={() => openPrintWindow([Number(propertyId)], 'detail')}>
              <Printer className="w-4 h-4 me-2" />
              چاپ
            </Button>
            <Button variant="outline" className="w-full" onClick={() => exportSinglePropertyPdf(Number(propertyId))}>
              <FileText className="w-4 h-4 me-2" />
              PDF
            </Button>
          </div>

        </div>

      </div>
    </div >
  );
}

function PropertyViewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-br">
        <div className="flex gap-4">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="w-48 h-6" />
            <Skeleton className="w-24 h-4" />
          </div>
        </div>
        <Skeleton className="w-32 h-10 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-9 space-y-6">
          <Skeleton className="w-full h-[500px] rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
          <Skeleton className="w-full h-96 rounded-xl" />
        </div>
        <div className="xl:col-span-3 space-y-6">
          <Skeleton className="w-full h-64 rounded-xl" />
          <Skeleton className="w-full h-80 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
