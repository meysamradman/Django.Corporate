
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  Image as ImageIcon,
  Search,
  Edit2,
  Printer,
  Building2,
  Layers,
  Calendar,
  User,
  LayoutGrid,
  Zap
} from "lucide-react";

import { Skeleton } from "@/components/elements/Skeleton";
import { realEstateApi } from "@/api/real-estate";
import { usePropertyPrintView } from "@/hooks/real-estate/usePropertyPrintView";
import { RealEstateCarousel } from "@/components/real-estate/list/view/RealEstateCarousel.tsx";
import { RealEstateInfo } from "@/components/real-estate/list/view/RealEstateInfo.tsx";
import { RealEstateOverview } from "@/components/real-estate/list/view/RealEstateOverview.tsx";
import { RealEstateMedia } from "@/components/real-estate/list/view/RealEstateMedia.tsx";
import { RealEstateSEO } from "@/components/real-estate/list/view/RealEstateSEO.tsx";
import { RealEstateAttributes } from "@/components/real-estate/list/view/RealEstateAttributes.tsx";
import { RealEstateFeatures } from "@/components/real-estate/list/view/RealEstateFeatures.tsx";
import { PropertySidebar } from "@/components/real-estate/view/PropertySidebar.tsx";
import { usePropertyPdfExport } from "@/hooks/real-estate/usePropertyPdfExport";
import { Button } from "@/components/elements/Button";
import { FloatingActions } from "@/components/elements/FloatingActions";

export default function PropertyViewPage() {
  const params = useParams();
  const navigate = useNavigate();
  const propertyId = params?.id as string;
  const [activeSection, setActiveSection] = useState("overview");

  const statusConfig: Record<string, any> = {
    active: { label: "فعال", bg: "bg-emerald-0/30 text-emerald-1", dot: "bg-emerald-1" },
    pending: { label: "در حال معامله", bg: "bg-amber-0/30 text-amber-1", dot: "bg-amber-1" },
    sold: { label: "فروخته شده", bg: "bg-red-0/30 text-red-1", dot: "bg-red-1" },
    rented: { label: "اجاره داده شده", bg: "bg-blue-0/30 text-blue-1", dot: "bg-blue-1" },
    archived: { label: "بایگانی شده", bg: "bg-gray-0/30 text-font-s", dot: "bg-font-s" },
  };

  const { data: propertyData, isLoading, error } = useQuery({
    queryKey: ["property", propertyId],
    queryFn: () => realEstateApi.getPropertyById(Number(propertyId)),
    staleTime: 0,
    enabled: !!propertyId,
  });

  const { openPrintWindow } = usePropertyPrintView();
  const { exportSinglePropertyPdf, isLoading: isExportingPdf } = usePropertyPdfExport();

  useEffect(() => {
    const handleScroll = () => {
      const sections = ["overview", "features", "amenities", "attributes", "media", "seo"];
      for (const section of sections) {
        const element = document.getElementById(`section-${section}`);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 150 && rect.bottom >= 150) {
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
      const yOffset = -120;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  if (!propertyId) return <div className="text-center py-20 text-red-500">شناسه ملک یافت نشد</div>;
  if (isLoading) return <PropertyViewSkeleton />;
  if (error || !propertyData) return (
    <div className="flex flex-col items-center justify-center py-20 bg-card rounded-2xl border border-br">
      <p className="text-red-1 font-bold mb-4">خطا در بارگذاری اطلاعات ملک</p>
      <Button onClick={() => window.location.reload()}>تلاش مجدد</Button>
    </div>
  );

  const navItems = [
    { id: "overview", label: "مرور کلی", icon: FileText },
    { id: "features", label: "ویژگی‌ها", icon: LayoutGrid },
    { id: "amenities", label: "امکانات", icon: Zap },
    { id: "attributes", label: "مشخصات فنی", icon: Layers },
    { id: "media", label: "رسانه‌ها", icon: ImageIcon },
    { id: "seo", label: "سئو", icon: Search },
  ];

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <FloatingActions
        actions={[
          { icon: Printer, label: "چاپ جزئیات", variant: "outline", onClick: () => openPrintWindow([Number(propertyId)], 'detail') },
          { icon: FileText, label: `PDF ${isExportingPdf ? "..." : ""}`, variant: "outline", onClick: () => exportSinglePropertyPdf(Number(propertyId)) },
          { icon: Edit2, label: "ویرایش", variant: "default", onClick: () => navigate(`/real-estate/properties/${propertyId}/edit`) },
        ]}
        position="left"
      />

      <div className="bg-card rounded-2xl border border-br shadow-sm overflow-hidden p-6 relative">
        <div className="absolute top-0 right-0 w-full h-1 bg-linear-to-r from-blue-1 via-purple-1 to-pink-1" />

        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-bg border border-br flex items-center justify-center text-blue-1 shadow-xs">
              <Building2 className="w-8 h-8 opacity-90" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-font-p tracking-tight">{propertyData.title}</h1>
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${statusConfig[propertyData.status]?.bg}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${statusConfig[propertyData.status]?.dot} animate-pulse`} />
                  {statusConfig[propertyData.status]?.label || propertyData.status}
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs font-bold text-font-s">
                <span className="bg-bg px-2 py-0.5 rounded border border-br font-mono">#{propertyData.id}</span>
                <div className="w-1 h-1 rounded-full bg-br" />
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(propertyData.created_at).toLocaleDateString('fa-IR')}</span>
                </div>
              </div>
            </div>
          </div>

          {propertyData.agent && (
            <div className="flex items-center gap-4 bg-bg/50 p-2 pr-6 rounded-2xl border border-br/50 shadow-xs">
              <div className="text-left">
                <p className="text-sm font-black text-font-p">{propertyData.agent.first_name} {propertyData.agent.last_name}</p>
                <p className="text-[10px] font-bold text-blue-1 mt-0.5 dir-ltr">{propertyData.agent.phone || 'مشاور حرفه‌ای'}</p>
              </div>
              <div className="relative shrink-0">
                {propertyData.agent.profile_picture_url ? (
                  <img src={propertyData.agent.profile_picture_url} className="w-12 h-12 rounded-full border-2 border-wt shadow-md object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-0/50 flex items-center justify-center text-blue-1 border-2 border-wt"><User className="w-6 h-6" /></div>
                )}
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-1 border-2 border-wt rounded-full" />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        <div className="xl:col-span-9 space-y-12">

          <div className="rounded-2xl overflow-hidden border border-br shadow-md group relative">
            <RealEstateCarousel property={propertyData} className="w-full" />
          </div>

          <div className="sticky top-20 z-40 bg-card/80 backdrop-blur-xl border border-br rounded-2xl shadow-lg p-1.5">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-xs font-black transition-all duration-300 ${activeSection === item.id ? "bg-blue-1 text-wt shadow-md shadow-blue-1/20 scale-105" : "text-font-s hover:bg-bg hover:text-font-p"
                    }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div id="section-overview" className="scroll-mt-32">
            <RealEstateOverview property={propertyData} />
          </div>

          <div id="section-features" className="scroll-mt-32">
            <div className="bg-card rounded-2xl border border-br p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-br">
                <LayoutGrid className="w-6 h-6 text-blue-1" />
                <h2 className="text-xl font-black text-font-p">ویژگی‌های ملک</h2>
              </div>
              <RealEstateFeatures property={propertyData} mode="features" />
            </div>
          </div>

          <div id="section-amenities" className="scroll-mt-32">
            <div className="bg-card rounded-2xl border border-br p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-br">
                <Zap className="w-6 h-6 text-orange-1" />
                <h2 className="text-xl font-black text-font-p">امکانات رفاهی</h2>
              </div>
              <RealEstateFeatures property={propertyData} mode="amenities" />
            </div>
          </div>

          <div id="section-attributes" className="scroll-mt-32">
            <div className="bg-card rounded-2xl border border-br p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-br">
                <Layers className="w-6 h-6 text-purple-1" />
                <h2 className="text-xl font-black text-font-p">مشخصات فنی و ثبتی</h2>
              </div>
              <RealEstateAttributes property={propertyData} />
            </div>
          </div>

          <div id="section-media" className="scroll-mt-32">
            <div className="bg-card rounded-2xl border border-br p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-br">
                <ImageIcon className="w-6 h-6 text-pink-1" />
                <h2 className="text-xl font-black text-font-p">رسانه‌ها و گالری</h2>
              </div>
              <RealEstateMedia property={propertyData} />
            </div>
          </div>

          <div id="section-seo" className="scroll-mt-32">
            <div className="bg-card rounded-2xl border border-br p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-br">
                <Search className="w-6 h-6 text-teal-1" />
                <h2 className="text-xl font-black text-font-p">تنظیمات سئو</h2>
              </div>
              <RealEstateSEO property={propertyData} />
            </div>
          </div>

        </div>

        <div className="xl:col-span-3 space-y-8 sticky top-24">
          <PropertySidebar property={propertyData} />
          <RealEstateInfo property={propertyData} />
        </div>
      </div>
    </div>
  );
}

function PropertyViewSkeleton() {
  return (
    <div className="space-y-8 p-6">
      <Skeleton className="w-full h-32 rounded-2xl" />
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-9 space-y-8">
          <Skeleton className="w-full h-[500px] rounded-2xl" />
          <Skeleton className="w-full h-20 rounded-2xl" />
          <Skeleton className="w-full h-96 rounded-2xl" />
        </div>
        <div className="xl:col-span-3 space-y-8">
          <Skeleton className="w-full h-80 rounded-2xl" />
          <Skeleton className="w-full h-64 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
