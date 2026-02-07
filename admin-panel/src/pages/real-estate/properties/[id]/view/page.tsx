
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  Image as ImageIcon,
  Search,
  Layers,
  LayoutGrid,
  PlayCircle
} from "lucide-react";



import { Skeleton } from "@/components/elements/Skeleton";
import { Button } from "@/components/elements/Button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/elements/Tooltip";
import { realEstateApi } from "@/api/real-estate";
import { usePropertyPrintView } from "@/components/real-estate/hooks/usePropertyPrintView";
import { usePropertyPdfExport } from "@/components/real-estate/hooks/usePropertyPdfExport";
import { RealEstateViewHeader } from "@/components/real-estate/properties/view/RealEstateViewHeader";
import { RealEstateManagement } from "@/components/real-estate/properties/view/RealEstateManagement";
import { RealEstateGridGallery } from "@/components/real-estate/properties/view/RealEstateGridGallery";
import { PropertySidebar } from "@/components/real-estate/properties/view/PropertySidebar";
import { RealEstateOverview } from "@/components/real-estate/properties/view/RealEstateOverview";
import { RealEstateFeatures } from "@/components/real-estate/properties/view/RealEstateFeatures";
import { RealEstateAttributes } from "@/components/real-estate/properties/view/RealEstateAttributes";
import { RealEstateMedia } from "@/components/real-estate/properties/view/RealEstateMedia";
import { RealEstateSEO } from "@/components/real-estate/properties/view/RealEstateSEO";

export default function PropertyViewPage() {
  const params = useParams();
  const propertyId = params?.id as string;
  const [activeSection, setActiveSection] = useState("gallery");

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
      const sections = ["gallery", "overview", "features", "attributes", "media", "seo"];
      const scrollPosition = window.scrollY + 150; // Offset for better detection

      for (const section of sections) {
        const element = document.getElementById(`section-${section}`);
        if (element) {
          const top = element.offsetTop;
          const height = element.offsetHeight;

          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section);
            break;
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check
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
    { id: "gallery", label: "گالری", icon: ImageIcon },
    { id: "overview", label: "مرور کلی", icon: FileText },
    { id: "features", label: "ویژگی‌ها و امکانات", icon: LayoutGrid },
    { id: "attributes", label: "مشخصات فنی", icon: Layers },
    { id: "media", label: "رسانه‌ها", icon: PlayCircle },
    { id: "seo", label: "سئو", icon: Search },
  ];

  return (
    <div className="relative flex flex-col gap-6">
      <RealEstateViewHeader
        property={propertyData}
        propertyId={propertyId}
        onPrint={() => openPrintWindow([Number(propertyId)], 'detail')}
        onPdf={() => exportSinglePropertyPdf(Number(propertyId))}
        isExportingPdf={isExportingPdf}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-8 xl:col-span-9 space-y-5">
          <div id="section-gallery" className="scroll-mt-32">
            <RealEstateGridGallery property={propertyData} />
          </div>

          <RealEstateManagement property={propertyData} />
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
