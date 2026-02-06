
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


import { Card, CardContent } from "@/components/elements/Card";
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
              <Badge variant={statusConfig[propertyData.status]?.variant || "default"} className="rounded-full px-2 py-0.5 text-[9px] font-bold tracking-widest gap-1.5 h-5">
                <div className={`w-1.5 h-1.5 rounded-full ${statusConfig[propertyData.status]?.dot || 'bg-current'} animate-pulse`} />
                {statusConfig[propertyData.status]?.label || propertyData.status}
              </Badge>

              {propertyData.is_active && (
                <Badge variant="emerald" className="rounded-full px-2 py-0.5 text-[9px] font-bold tracking-widest gap-1.5 h-5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-1 animate-pulse" />
                  فعال
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 text-[10.5px] font-bold text-font-s opacity-50">
            <span className="font-mono text-font-p bg-bg/60 px-1.5 py-0.5 rounded border border-br">#{propertyData.id}</span>
            <div className="w-1 h-1 rounded-full bg-br" />
            <span className="tracking-widest">{propertyData.property_type?.title || 'Residential'}</span>
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

          {/* Verified Management Strip: Iteration 3 - Minimalist & Compact */}
          <Card className="overflow-hidden border-br shadow-3xs bg-card ring-1 ring-br/20">
            <CardContent className="p-0">
              <div className={`flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse divide-br/20 ${(!propertyData.agency || (!propertyData.agent && !propertyData.created_by_name)) ? 'justify-center' : ''}`}>
                {propertyData.agency && (
                  <div className={`flex-1 flex items-center gap-6 p-4 transition-colors group ${(!propertyData.agent && !propertyData.created_by_name) ? 'lg:px-16 lg:justify-center' : 'lg:px-8 hover:bg-bg/5'}`}>
                    <div className="size-14 rounded-xl bg-wt border border-br p-2.5 flex items-center justify-center shadow-3xs shrink-0 group-hover:border-blue-1/40 transition-all">
                      <Avatar className="size-full rounded-none">
                        <AvatarImage
                          src={
                            (propertyData.agency.logo && mediaService.getMediaUrlFromObject(propertyData.agency.logo as any)) ||
                            (propertyData.agency.logo_url ? mediaService.getMediaUrlFromObject({ file_url: propertyData.agency.logo_url } as any) : undefined)
                          }
                          className="object-contain"
                        />
                        <AvatarFallback className="bg-blue-1/10 text-blue-1 font-bold text-base">
                          {propertyData.agency.name?.[0] || 'A'}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="blue" className="text-[10px] font-bold px-1.5 h-5 bg-blue-1/10 text-blue-1 border-none">آژانس</Badge>
                        <span className="text-base font-bold text-font-p truncate">{propertyData.agency.name}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Phone className="size-3.5 text-blue-1/60" />
                        <span className="text-sm font-bold text-font-s dir-ltr tracking-tight">{propertyData.agency.phone}</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => navigate(`/admins/agencies/${propertyData.agency?.id}/view`)}
                      className={`size-9 rounded-xl text-blue-1/40 hover:text-blue-1 hover:bg-blue-1/10 border-none bg-transparent transition-colors shadow-none ${(!propertyData.agent && !propertyData.created_by_name) ? 'mr-4' : 'mr-auto'}`}
                    >
                      <ArrowUpRight className="size-5" />
                    </Button>
                  </div>
                )}

                {(propertyData.agent || propertyData.created_by_name) && (
                  <div className={`flex-1 flex items-center gap-6 p-4 transition-colors group ${!propertyData.agency ? 'lg:px-16 lg:justify-center' : 'lg:px-8 hover:bg-bg/5'}`}>
                    <div className="relative shrink-0">
                      <Avatar className="size-14 border border-br/30 shadow-3xs">
                        <AvatarImage
                          src={
                            (propertyData.agent?.profile_image && mediaService.getMediaUrlFromObject(propertyData.agent.profile_image as any)) ||
                            (propertyData.agent?.profile_picture_url ? mediaService.getMediaUrlFromObject({ file_url: propertyData.agent.profile_picture_url } as any) : undefined)
                          }
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-indigo-1/10 text-indigo-1 font-bold text-base">
                          {propertyData.agent?.user ? (propertyData.agent.first_name?.[0] || propertyData.agent.full_name?.[0] || 'م') : (propertyData.created_by_name?.[0] || 'م')}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-0.5 -right-0.5 size-4 border-2 border-wt rounded-full ${propertyData.agent?.user ? 'bg-emerald-1' : 'bg-blue-1'}`} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant={propertyData.agent?.user ? "indigo" : "blue"} className="text-[10px] font-bold px-1.5 h-5 border-none">
                          {propertyData.agent?.user ? 'مشاور' : 'مدیر'}
                        </Badge>
                        <span className="text-base font-bold text-font-p truncate">
                          {propertyData.agent?.user ? (propertyData.agent.full_name || `${propertyData.agent.first_name} ${propertyData.agent.last_name}`) : propertyData.created_by_name}
                        </span>
                      </div>
                      {(propertyData.agent?.phone || (propertyData as any).created_by_phone) ? (
                        <div className="flex items-center gap-2 mt-1">
                          <Phone className="size-3.5 text-indigo-1/60" />
                          <span className="text-sm font-bold text-font-s dir-ltr tracking-tight">{propertyData.agent?.phone || (propertyData as any).created_by_phone}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-font-s/40 font-bold tracking-tight mt-1">بدون تماس</span>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (propertyData.agent?.user) {
                          navigate(`/agents/${propertyData.agent.user}/view`);
                        } else if (propertyData.created_by) {
                          navigate(`/admins/${propertyData.created_by}/view`);
                        }
                      }}
                      className={`size-9 rounded-xl text-indigo-1/40 hover:text-indigo-1 hover:bg-indigo-1/10 border-none bg-transparent transition-colors shadow-none ${!propertyData.agency ? 'mr-4' : 'mr-auto'}`}
                    >
                      <ArrowUpRight className="size-5" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
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
