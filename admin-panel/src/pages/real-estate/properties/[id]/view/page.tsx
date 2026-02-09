import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { RealEstateViewSkeleton } from "@/components/real-estate/properties/view/RealEstateViewSkeleton";
import { Button } from "@/components/elements/Button";
import { Card } from "@/components/elements/Card";
import { realEstateApi } from "@/api/real-estate";
import { usePropertyPrintView } from "@/components/real-estate/hooks/usePropertyPrintView";
import { usePropertyPdfExport } from "@/components/real-estate/hooks/usePropertyPdfExport";

// Modular Component Imports
import { RealEstateHeader } from "@/components/real-estate/properties/view/header/RealEstateHeader";
import { RealEstateCRM } from "@/components/real-estate/properties/view/crm/RealEstateCRM";
import { RealEstateLocation } from "@/components/real-estate/properties/view/location/RealEstateLocation";
import { RealEstateNavigation } from "@/components/real-estate/properties/view/navigation/RealEstateNavigation";
import { RealEstateGallery as RealEstateGridGallery } from "@/components/real-estate/properties/view/media/RealEstateGallery";

import { RealEstateDetails } from "@/components/real-estate/properties/view/details/RealEstateDetails";
import { RealEstateAttributes } from "@/components/real-estate/properties/view/attributes/RealEstateAttributes";
import { RealEstateDescriptions } from "@/components/real-estate/properties/view/info/RealEstateDescriptions";
import { RealEstateFloorPlans } from "@/components/real-estate/properties/view/floor-plans/RealEstateFloorPlans";
import { RealEstateFeatures } from "@/components/real-estate/properties/view/info/RealEstateFeatures";
import { RealEstateMedia } from "@/components/real-estate/properties/view/media/RealEstateMedia";
import { RealEstateSEO } from "@/components/real-estate/properties/view/seo/RealEstateSEO";

import { RealEstateStats } from "@/components/real-estate/properties/view/stats/RealEstateStats";
import { RealEstateMediaSummary } from "@/components/real-estate/properties/view/media/RealEstateMediaSummary";

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
      const scrollPosition = window.scrollY + 150;

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
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (isLoading) return <RealEstateViewSkeleton />;
  if (error || !propertyData) return (
    <div className="flex flex-col items-center justify-center py-20 bg-card rounded-2xl border border-br">
      <p className="text-red-1 font-bold mb-4">خطا در بارگذاری اطلاعات ملک</p>
      <Button onClick={() => window.location.reload()}>تلاش مجدد</Button>
    </div>
  );

  return (
    <div className="relative flex flex-col gap-6">
      <RealEstateHeader
        property={propertyData}
        onPrint={() => openPrintWindow([Number(propertyId)], 'detail')}
        onPdf={() => exportSinglePropertyPdf(Number(propertyId))}
        isExportingPdf={isExportingPdf}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-8 xl:col-span-9 space-y-5">
          <div id="section-gallery" className="scroll-mt-32">
            <RealEstateGridGallery property={propertyData} />
          </div>

          <RealEstateCRM property={propertyData} />
        </div>

        <div className="lg:col-span-4 xl:col-span-3">
          <div className="w-full h-full">
            <Card className="h-full overflow-hidden border-br shadow-2xl bg-card p-0 relative flex flex-col ring-1 ring-br/20">
              <RealEstateLocation property={propertyData} />
            </Card>
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 items-start relative min-w-0">
        <div className="flex-1 grid grid-cols-1 gap-6 min-w-0 w-full">
          <div id="section-overview" className="scroll-mt-32">
            <div className="flex flex-col gap-6">
              <RealEstateDetails property={propertyData} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <RealEstateStats property={propertyData} />
                <RealEstateMediaSummary property={propertyData} />
              </div>

              <RealEstateAttributes property={propertyData} />
              <RealEstateDescriptions property={propertyData} />
              <RealEstateFloorPlans property={propertyData} />
            </div>
          </div>

          <div id="section-features" className="scroll-mt-32">
            <RealEstateFeatures property={propertyData} />
          </div>

          <div id="section-media" className="scroll-mt-32">
            <RealEstateMedia property={propertyData} />
          </div>

          <div id="section-seo" className="scroll-mt-32">
            <RealEstateSEO property={propertyData} />
          </div>
        </div>

        <aside className="hidden xl:block w-16 sticky top-24 self-start flex-none">
          <RealEstateNavigation
            activeSection={activeSection}
            onNavClick={(id) => {
              setActiveSection(id);
              const element = document.getElementById(`section-${id}`);
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
          />
        </aside>
      </div>
    </div>
  );
}
