
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
  Calendar,
  Layers,
  LayoutGrid,
  Phone,
  ArrowUpRight
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/elements/Avatar";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/elements/Tooltip";
import { mediaService } from "@/components/media/services";
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
    <div className="relative flex flex-col gap-6">

      {/* Slim & Creative Executive Header */}
      <Card className="flex-row items-center justify-between gap-0 p-4 lg:px-8 py-3 relative overflow-hidden border-br/60 ring-1 ring-static-b/5 shadow-xs shrink-0">
        <div className="absolute top-0 right-0 w-full h-[2px] bg-linear-to-r from-blue-1/40 via-purple-1/40 to-pink-1/40" />

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-black text-font-p tracking-tighter shrink-0 leading-none">{propertyData.title}</h1>
            <div className="flex items-center gap-1.5">
              <Badge variant={statusConfig[propertyData.status]?.variant || "default"} className="rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest gap-1.5 h-5">
                <div className={`w-1.5 h-1.5 rounded-full ${statusConfig[propertyData.status]?.dot || 'bg-current'} animate-pulse`} />
                {statusConfig[propertyData.status]?.label || propertyData.status}
              </Badge>

              {propertyData.is_active && (
                <Badge variant="emerald" className="rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest gap-1.5 h-5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-1 animate-pulse" />
                  فعال
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 text-[10.5px] font-bold text-font-s opacity-50">
            <span className="font-mono text-font-p bg-bg/60 px-1.5 py-0.5 rounded border border-br">#{propertyData.id}</span>
            <div className="w-1 h-1 rounded-full bg-br" />
            <span className="uppercase tracking-widest">{propertyData.property_type?.title || 'Residential'}</span>
            <div className="w-1 h-1 rounded-full bg-br" />
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(propertyData.created_at)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-bg/40 p-1 rounded-xl border border-br/40 h-10">
          <Button
            variant="default"
            size="sm"
            className="h-8 gap-1.5 text-[10px] font-black bg-blue-1 hover:bg-blue-2 text-wt shadow-sm px-4 rounded-lg"
            onClick={() => navigate(`/real-estate/properties/${propertyId}/edit`)}
          >
            <Edit2 className="w-3 h-3" />
            ویرایش
          </Button>
          <div className="w-px h-4 bg-br/60 mx-1" />
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-[10px] font-black border-br hover:bg-bg bg-wt/80 px-3 rounded-lg"
            onClick={() => openPrintWindow([Number(propertyId)], 'detail')}
          >
            <Printer className="w-3 h-3 opacity-60" />
            چاپ
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-[10px] font-black border-br hover:bg-bg bg-wt/80 px-3 rounded-lg"
            onClick={() => exportSinglePropertyPdf(Number(propertyId))}
            isLoading={isExportingPdf}
          >
            <FileText className="w-3 h-3 opacity-60" />
            PDF
          </Button>
        </div>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-8 xl:col-span-9 space-y-5">
          <RealEstateGridGallery property={propertyData} />

          {/* Verified Management Strip: Refined for premium feel and robust photo display */}
          <Card className="flex-row items-center justify-between gap-0 p-6 lg:px-10 overflow-hidden border-br shadow-md bg-card/60 backdrop-blur-md min-h-32 ring-1 ring-br/30">
            <div className="absolute inset-y-0 right-0 w-2.5 bg-blue-1 opacity-50" />

            <div className="flex items-center gap-16 divide-x divide-x-reverse divide-br relative z-10 flex-1">
              {propertyData.agency && (
                <div className="flex items-center gap-6 shrink-0 group">
                  <div
                    onClick={() => navigate(`/admins/agencies/${propertyData.agency?.id}/view`)}
                    className="size-16 rounded-2xl bg-wt border border-br p-3 flex items-center justify-center shadow-sm shrink-0 group-hover:border-blue-1/50 group-hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden"
                  >
                    <Avatar className="size-full rounded-none">
                      <AvatarImage
                        src={
                          (propertyData.agency.logo && mediaService.getMediaUrlFromObject(propertyData.agency.logo as any)) ||
                          (propertyData.agency.logo_url ? mediaService.getMediaUrlFromObject({ file_url: propertyData.agency.logo_url } as any) : undefined)
                        }
                        className="object-contain"
                      />
                      <AvatarFallback className="bg-blue-1/10 text-blue-1 font-black text-lg">
                        {propertyData.agency.name?.[0] || 'A'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-3">
                      <Badge variant="blue" className="text-[10px] font-black tracking-wider px-3 py-1 bg-blue-1/10 text-blue-1 border-none h-5">آژانس املاک</Badge>
                      <h4
                        onClick={() => navigate(`/admins/agencies/${propertyData.agency?.id}/view`)}
                        className="text-lg font-black text-font-p leading-none cursor-pointer hover:text-blue-1 transition-colors"
                      >
                        {propertyData.agency.name}
                      </h4>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2.5 text-font-p hover:text-blue-1 transition-colors cursor-pointer bg-blue-1/5 px-4 py-1.5 rounded-xl border border-blue-1/10 shadow-xs group/phone">
                        <Phone className="w-4 h-4 text-blue-1 group-hover:rotate-12 transition-transform" />
                        <span className="text-[15px] font-black dir-ltr tracking-tight">{propertyData.agency.phone}</span>
                      </div>
                      <button
                        onClick={() => navigate(`/admins/agencies/${propertyData.agency?.id}/view`)}
                        className="flex items-center gap-1 text-[13px] font-bold text-blue-1/60 hover:text-blue-1 transition-colors group/link underline underline-offset-4 decoration-blue-1/20 hover:decoration-blue-1 cursor-pointer"
                      >
                        <span>مشاهده پروفایل</span>
                        <ArrowUpRight className="w-4 h-4 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {(propertyData.agent || propertyData.created_by_name) && (
                <div className="flex items-center gap-6 pr-16 shrink-0 group">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      if (propertyData.agent?.user) {
                        navigate(`/agents/${propertyData.agent.user}/edit`);
                      } else if (propertyData.created_by) {
                        navigate(`/admins/${propertyData.created_by}/edit`);
                      }
                    }}
                    className="relative shrink-0 cursor-pointer"
                  >
                    <Avatar className="size-16 rounded-full border-2 border-wt ring-2 ring-br/20 shadow-md group-hover:ring-indigo-1/40 transition-all duration-300">
                      <AvatarImage
                        src={
                          (propertyData.agent?.profile_image && mediaService.getMediaUrlFromObject(propertyData.agent.profile_image as any)) ||
                          (propertyData.agent?.profile_picture_url ? mediaService.getMediaUrlFromObject({ file_url: propertyData.agent.profile_picture_url } as any) : undefined)
                        }
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-indigo-1/10 text-indigo-1 font-black text-lg">
                        {propertyData.agent ? (propertyData.agent.first_name?.[0] || propertyData.agent.full_name?.[0] || 'م') : (propertyData.created_by_name?.[0] || 'م')}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute bottom-0 right-0 w-4.5 h-4.5 border-2 border-wt rounded-full shadow-md z-10 ${propertyData.agent ? 'bg-emerald-1' : 'bg-blue-1'}`} />
                  </div>
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-3">
                      <Badge variant="purple" className={`text-[10px] font-black tracking-wider px-3 py-1 border-none h-5 ${propertyData.agent ? 'bg-indigo-1/10 text-indigo-1' : 'bg-blue-1/10 text-blue-1'}`}>
                        {propertyData.agent ? 'مشاور ملک' : 'مدیر سیستم'}
                      </Badge>
                      <h4
                        onClick={(e) => {
                          e.stopPropagation();
                          if (propertyData.agent?.user) {
                            navigate(`/agents/${propertyData.agent.user}/edit`);
                          } else if (propertyData.created_by) {
                            navigate(`/admins/${propertyData.created_by}/edit`);
                          }
                        }}
                        className={`text-lg font-black text-font-p leading-none cursor-pointer transition-colors ${propertyData.agent ? 'hover:text-indigo-1' : 'hover:text-blue-1'}`}
                      >
                        {propertyData.agent ? `${propertyData.agent.first_name} ${propertyData.agent.last_name}` : propertyData.created_by_name}
                      </h4>
                    </div>
                    <div className="flex items-center gap-6">
                      {propertyData.agent?.phone ? (
                        <div className="flex items-center gap-2.5 text-font-p hover:text-indigo-1 transition-colors cursor-pointer bg-indigo-1/5 px-4 py-1.5 rounded-xl border border-indigo-1/10 shadow-xs group/phone">
                          <Phone className="w-4 h-4 text-indigo-1 group-hover:rotate-12 transition-transform" />
                          <span className="text-[15px] font-black dir-ltr tracking-tight">{propertyData.agent.phone}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground font-medium">اطلاعات تماس در دسترس نیست</span>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (propertyData.agent?.user) {
                            navigate(`/agents/${propertyData.agent.user}/edit`);
                          } else if (propertyData.created_by) {
                            navigate(`/admins/${propertyData.created_by}/edit`);
                          }
                        }}
                        className={`flex items-center gap-1 text-[13px] font-bold transition-colors group/link underline underline-offset-4 cursor-pointer ${propertyData.agent ? 'text-indigo-1/60 hover:text-indigo-1 decoration-indigo-1/20 hover:decoration-indigo-1' : 'text-blue-1/60 hover:text-blue-1 decoration-blue-1/20 hover:decoration-blue-1'}`}
                      >
                        <span>مشاهده پروفایل</span>
                        <ArrowUpRight className="w-4 h-4 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}


            </div>

            <div className="hidden xl:flex flex-col items-end gap-2.5 relative z-10 pl-2">
              <div className="flex items-center gap-3.5 px-6 py-2.5 bg-emerald-1/5 rounded-2xl border border-emerald-1/20 shadow-sm ring-1 ring-emerald-1/10 group/status cursor-default">
                <div className="w-3 h-3 rounded-full bg-emerald-1 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.4)]" />
                <span className="text-[13px] font-black text-emerald-1 tracking-tight">درگاه تایید شده</span>
              </div>
              <div className="flex flex-col items-end gap-0.5 pr-2">
                <span className="text-[11px] font-black text-font-s opacity-60 uppercase tracking-[0.4em]">مدیر فعال</span>
                <div className="w-12 h-0.5 bg-emerald-1/30 rounded-full" />
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-4 xl:col-span-3">
          <PropertySidebar property={propertyData} />
        </div>
      </div>
      <div className="flex flex-col xl:flex-row gap-6 items-start relative min-w-0">

        <div className="flex-1 grid grid-cols-1 gap-6 min-w-0 w-full">
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
