
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
  LayoutGrid
} from "lucide-react";

import { Card } from "@/components/elements/Card";

import { Skeleton } from "@/components/elements/Skeleton";
import { realEstateApi } from "@/api/real-estate";
import { usePropertyPrintView } from "@/hooks/real-estate/usePropertyPrintView";
import { RealEstateOverview } from "@/components/real-estate/list/view/RealEstateOverview.tsx";
import { RealEstateGridGallery } from "@/components/real-estate/view/RealEstateGridGallery.tsx";
import { RealEstateMedia } from "@/components/real-estate/list/view/RealEstateMedia.tsx";
import { RealEstateSEO } from "@/components/real-estate/list/view/RealEstateSEO.tsx";
import { RealEstateAttributes } from "@/components/real-estate/list/view/RealEstateAttributes.tsx";
import { RealEstateFeatures } from "@/components/real-estate/list/view/RealEstateFeatures.tsx";
import { PropertySidebar } from "@/components/real-estate/view/PropertySidebar.tsx";
import { usePropertyPdfExport } from "@/hooks/real-estate/usePropertyPdfExport";
import { Button } from "@/components/elements/Button";
import { Badge } from "@/components/elements/Badge";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/elements/Tooltip";
import { formatDate } from "@/core/utils/commonFormat";

export default function PropertyViewPage() {
  const params = useParams();
  const navigate = useNavigate();
  const propertyId = params?.id as string;
  const [activeSection, setActiveSection] = useState("overview");

  const statusConfig: Record<string, any> = {
    active: { label: "فعال", variant: "emerald", dot: "bg-emerald-1" },
    pending: { label: "در حال معامله", variant: "amber", dot: "bg-amber-1" },
    sold: { label: "فروخته شده", variant: "red", dot: "bg-red-1" },
    rented: { label: "اجاره داده شده", variant: "blue", dot: "bg-blue-1" },
    archived: { label: "بایگانی شده", variant: "gray", dot: "bg-font-s" },
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
      const sections = ["overview", "features", "attributes", "media", "seo"];
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
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    { id: "features", label: "ویژگی‌ها و امکانات", icon: LayoutGrid },
    { id: "attributes", label: "مشخصات فنی", icon: Layers },
    { id: "media", label: "رسانه‌ها", icon: ImageIcon },
    { id: "seo", label: "سئو", icon: Search },
  ];

  return (
    <div className="relative space-y-10 pb-20 animate-in fade-in duration-500">

      <Card className="shadow-xs overflow-hidden p-6 relative block">
        <div className="absolute top-0 right-0 w-full h-1 bg-linear-to-r from-blue-1 via-purple-1 to-pink-1 opacity-60" />

        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-bg border border-br flex items-center justify-center text-blue-1 shadow-xs">
              <Building2 className="w-8 h-8 opacity-80" />
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-black text-font-p tracking-tight">{propertyData.title}</h1>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={statusConfig[propertyData.status]?.variant || "default"} className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${statusConfig[propertyData.status]?.dot || 'bg-current'} animate-pulse`} />
                      {statusConfig[propertyData.status]?.label || propertyData.status}
                    </Badge>

                    {propertyData.is_active && (
                      <Badge variant="emerald" className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-1 animate-pulse" />
                        فعال
                      </Badge>
                    )}

                    {propertyData.is_featured && (
                      <Badge variant="orange" className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                        ویژه
                      </Badge>
                    )}

                    {!propertyData.is_published && (
                      <Badge variant="amber" className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                        پیش‌نویس
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-font-s opacity-80">
                <span className="bg-bg px-2 py-0.5 rounded border border-br font-mono">#{propertyData.id}</span>
                <div className="w-1 h-1 rounded-full bg-br" />
                <span className="uppercase tracking-widest">{propertyData.property_type?.title || 'نامشخص'}</span>
                <div className="w-1 h-1 rounded-full bg-br" />
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 opacity-60" />
                  <span>{formatDate(propertyData.created_at)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-bg/40 p-1.5 rounded-xl border border-br/40">
              <Button
                variant="default"
                size="sm"
                className="h-9 gap-2 text-xs font-black shadow-sm bg-blue-1 hover:bg-blue-2 text-wt border-none px-4"
                onClick={() => navigate(`/real-estate/properties/${propertyId}/edit`)}
              >
                <Edit2 className="w-4 h-4" />
                ویرایش ملک
              </Button>
              <div className="w-px h-6 bg-br/60 mx-1" />
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-2 text-xs font-black border-br hover:bg-bg bg-wt/80 px-4"
                onClick={() => openPrintWindow([Number(propertyId)], 'detail')}
              >
                <Printer className="w-4 h-4 opacity-70" />
                چاپ
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-2 text-xs font-black border-br hover:bg-bg bg-wt/80 px-4"
                onClick={() => exportSinglePropertyPdf(Number(propertyId))}
                isLoading={isExportingPdf}
              >
                <FileText className="w-4 h-4 opacity-70" />
                PDF
              </Button>
            </div>

            {propertyData.agency && (
              <div className="flex items-center gap-3.5 bg-bg/40 p-2 pr-5 rounded-2xl border border-br/40 shadow-xs ring-1 ring-static-b/5">
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase tracking-tighter bg-blue-1/10 text-blue-1 px-1.5 py-0.5 rounded-sm">
                      آژانس
                    </span>
                    <p className="text-sm font-black text-font-p whitespace-nowrap">
                      {propertyData.agency.name}
                    </p>
                  </div>
                  <p className="text-[10px] font-bold text-font-s opacity-60 mt-0.5 dir-ltr">
                    {propertyData.agency.phone}
                  </p>
                </div>
                <div className="relative shrink-0">
                  {propertyData.agency.logo_url || propertyData.agency.logo?.file_url ? (
                    <img
                      src={propertyData.agency.logo_url || propertyData.agency.logo?.file_url}
                      className="w-11 h-11 rounded-full border-2 border-wt shadow-sm object-cover bg-wt"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-blue-0/30 flex items-center justify-center text-blue-1 border-2 border-wt">
                      <Building2 className="w-5 h-5" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {(propertyData.agent || propertyData.created_by_name) && (
              <div className="flex items-center gap-3.5 bg-bg/40 p-2 pr-5 rounded-2xl border border-br/40 shadow-xs ring-1 ring-static-b/5">
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase tracking-tighter bg-blue-1/10 text-blue-1 px-1.5 py-0.5 rounded-sm">
                      {propertyData.agent ? 'مشاور' : 'مدیر'}
                    </span>
                    <p className="text-sm font-black text-font-p whitespace-nowrap">
                      {propertyData.agent
                        ? `${propertyData.agent.first_name} ${propertyData.agent.last_name}`
                        : propertyData.created_by_name}
                    </p>
                  </div>
                  <p className="text-[10px] font-bold text-font-s opacity-60 mt-0.5 dir-ltr">
                    {propertyData.agent?.phone || 'Central Management'}
                  </p>
                </div>
                <div className="relative shrink-0">
                  {propertyData.agent?.profile_picture_url ? (
                    <img src={propertyData.agent.profile_picture_url} className="w-11 h-11 rounded-full border-2 border-wt shadow-sm object-cover" />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-blue-0/30 flex items-center justify-center text-blue-1 border-2 border-wt">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-1 border-2 border-wt rounded-full" />
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-8 xl:col-span-9">
          <RealEstateGridGallery property={propertyData} />
        </div>

        <div className="lg:col-span-4 xl:col-span-3">
          <PropertySidebar property={propertyData} />
        </div>
      </div>

      < div className="flex flex-col xl:flex-row gap-8 items-start relative mt-6 min-w-0" >

        < div className="flex-1 space-y-12 min-w-0 w-full" >
          <div id="section-overview" className="scroll-mt-32">
            <RealEstateOverview property={propertyData} />
          </div>

          <div id="section-features" className="scroll-mt-32">
            <RealEstateFeatures property={propertyData} />
          </div >


          <div id="section-attributes" className="scroll-mt-32">
            <RealEstateAttributes property={propertyData} />
          </div >

          <div id="section-media" className="scroll-mt-32">
            <RealEstateMedia property={propertyData} />
          </div >

          <div id="section-seo" className="scroll-mt-32">
            <RealEstateSEO property={propertyData} />
          </div >
        </div >

        <aside className="hidden xl:block w-16 sticky top-24 self-start flex-none">
          <TooltipProvider>
            <nav className="flex flex-col gap-3 p-2 bg-card border border-br rounded-full shadow-lg ring-1 ring-static-b/5">
              {navItems.map((item) => (
                <Tooltip key={item.id} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => scrollToSection(item.id)}
                      className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 cursor-pointer group relative ${activeSection === item.id
                        ? "bg-blue-1 text-wt shadow-md shadow-blue-1/20 scale-110"
                        : "text-font-s hover:bg-bg hover:text-blue-1"
                        }`}
                    >
                      <item.icon className="w-5 h-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={12}>
                    <p className="text-[10px] font-black">{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </nav>
          </TooltipProvider>
        </aside>
      </div >
    </div >
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
