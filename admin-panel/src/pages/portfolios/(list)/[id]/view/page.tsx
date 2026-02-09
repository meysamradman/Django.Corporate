import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { PortfolioViewSkeleton } from "@/components/portfolios/projects/view/PortfolioViewSkeleton";
import { portfolioApi } from "@/api/portfolios/portfolios";

import { PortfolioGallery } from "@/components/portfolios/projects/view/media/PortfolioGallery";
import { PortfolioNavigation } from "@/components/portfolios/projects/view/navigation/PortfolioNavigation";
import { PortfolioDescriptions } from "@/components/portfolios/projects/view/descriptions/PortfolioDescriptions";
import { PortfolioCategories } from "@/components/portfolios/projects/view/categories/PortfolioCategories";
import { PortfolioTags } from "@/components/portfolios/projects/view/tags/PortfolioTags";
import { PortfolioOptions } from "@/components/portfolios/projects/view/options/PortfolioOptions";
import { PortfolioStats } from "@/components/portfolios/projects/view/stats/PortfolioStats";
import { PortfolioAttributes } from "@/components/portfolios/projects/view/attributes/PortfolioAttributes";
import { PortfolioSEO } from "@/components/portfolios/projects/view/seo/PortfolioSEO";
import { PortfolioSidebar } from "@/components/portfolios/projects/view/sidebar/PortfolioSidebar";

import { PortfolioVideo } from "@/components/portfolios/projects/view/media/PortfolioVideo";
import { PortfolioAttachments } from "@/components/portfolios/projects/view/media/PortfolioAttachments";
import { PortfolioMediaSummary } from "@/components/portfolios/projects/view/media/PortfolioMediaSummary";

import { Button } from "@/components/elements/Button";

export default function PortfolioViewPage() {
  const params = useParams();
  const portfolioId = params?.id as string;
  const [activeSection, setActiveSection] = useState("gallery");

  const { data: portfolioData, isLoading, error } = useQuery({
    queryKey: ["portfolio", portfolioId],
    queryFn: () => portfolioApi.getPortfolioById(Number(portfolioId)),
    staleTime: 0,
    enabled: !!portfolioId,
  });

  useEffect(() => {
    const handleScroll = () => {
      const sections = ["gallery", "overview", "media", "attributes", "seo"];
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

  if (isLoading) return <PortfolioViewSkeleton />;
  if (error || !portfolioData) return (
    <div className="flex flex-col items-center justify-center py-20 bg-card rounded-2xl border border-br">
      <p className="text-red-1 font-bold mb-4">خطا در بارگذاری اطلاعات پروژه</p>
      <Button onClick={() => window.location.reload()}>تلاش مجدد</Button>
    </div>
  );

  return (
    <div className="relative flex flex-col gap-6 text-right" dir="rtl">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 xl:col-span-9">
          <div id="section-gallery" className="scroll-mt-32">
            <PortfolioGallery portfolio={portfolioData} />
          </div>
        </div>

        <div className="lg:col-span-4 xl:col-span-3">
          <div className="flex flex-col gap-4">
            <PortfolioSidebar
              portfolio={portfolioData}
              onPrint={() => {
                const url = `/portfolios/print?ids=${portfolioId}&type=detail`;
                window.open(url, '_blank', 'width=1024,height=768');
              }}
              onPdf={() => { }}
              isExportingPdf={false}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 items-start relative min-w-0">
        <div className="flex-1 grid grid-cols-1 gap-6 min-w-0 w-full">

          <div id="section-overview" className="scroll-mt-32 flex flex-col gap-6">
            <PortfolioDescriptions portfolio={portfolioData} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <PortfolioOptions portfolio={portfolioData} />
              <PortfolioTags portfolio={portfolioData} />
              <PortfolioCategories portfolio={portfolioData} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PortfolioStats portfolio={portfolioData} />
              <PortfolioMediaSummary portfolio={portfolioData} />
            </div>
          </div>

          <div id="section-media" className="scroll-mt-32">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">
              <PortfolioVideo portfolio={portfolioData} />

              <div className="flex flex-col">
                <PortfolioAttachments portfolio={portfolioData} />
              </div>
            </div>
          </div>

          <div id="section-attributes" className="scroll-mt-32">
            <PortfolioAttributes portfolio={portfolioData} />
          </div>

          <div id="section-seo" className="scroll-mt-32">
            <PortfolioSEO portfolio={portfolioData} />
          </div>

        </div>

        <aside className="hidden xl:block w-16 sticky top-24 self-start flex-none">
          <PortfolioNavigation
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
