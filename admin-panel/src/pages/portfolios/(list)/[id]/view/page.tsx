import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Edit2,
  Printer,
  PlayCircle,
  FolderOpen,
  Tag,
  ImageIcon,
  LayoutGrid,
  FileCode,
  Settings
} from "lucide-react";

import { Skeleton } from "@/components/elements/Skeleton";
import { Button } from "@/components/elements/Button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/elements/Tooltip";
import { portfolioApi } from "@/api/portfolios/portfolios";
import { PortfolioGridGallery } from "@/components/portfolios/projects/view/PortfolioGridGallery";
import { PortfolioInfo } from "@/components/portfolios/projects/view/PortfolioInfo";
import { PortfolioOverview } from "@/components/portfolios/projects/view/PortfolioOverview";
import { PortfolioCategories } from "@/components/portfolios/projects/view/PortfolioCategories";
import { PortfolioTags } from "@/components/portfolios/projects/view/PortfolioTags";
import { PortfolioOptions } from "@/components/portfolios/projects/view/PortfolioOptions";
import { PortfolioMedia } from "@/components/portfolios/projects/view/PortfolioMedia";
import { PortfolioAttributes } from "@/components/portfolios/projects/view/PortfolioAttributes";
import { PortfolioSEO } from "@/components/portfolios/projects/view/PortfolioSEO";
import { FloatingActions } from "@/components/elements/FloatingActions";
import { Card, CardContent } from "@/components/elements/Card";

export default function PortfolioViewPage() {
  const params = useParams();
  const navigate = useNavigate();
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
      const sections = ["gallery", "overview", "categories", "tags", "options", "media", "attributes", "seo"];
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
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(`section-${sectionId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (!portfolioId) return <div className="text-center py-20 text-red-500">شناسه نمونه‌کار یافت نشد</div>;
  if (isLoading) return <PortfolioViewSkeleton />;
  if (error || !portfolioData) return (
    <div className="flex flex-col items-center justify-center py-20 bg-card rounded-2xl border border-br">
      <p className="text-red-1 font-bold mb-4">خطا در بارگذاری اطلاعات پروژه</p>
      <Button onClick={() => window.location.reload()}>تلاش مجدد</Button>
    </div>
  );

  const navItems = [
    { id: "gallery", label: "گالری", icon: ImageIcon },
    { id: "overview", label: "مرور کلی", icon: LayoutGrid },
    { id: "categories", label: "دسته‌بندی‌ها", icon: FolderOpen },
    { id: "tags", label: "تگ‌ها", icon: Tag },
    { id: "options", label: "گزینه‌ها", icon: FileCode },
    { id: "media", label: "رسانه‌ها", icon: PlayCircle },
    { id: "attributes", label: "ویژگی‌ها", icon: Settings },
    { id: "seo", label: "سئو", icon: Search },
  ];

  return (
    <div className="relative flex flex-col gap-6 text-right" dir="rtl">
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
            label: "ویرایش پروژه",
            variant: "default",
            permission: "portfolio.update",
            onClick: () => navigate(`/portfolios/${portfolioId}/edit`),
          },
        ]}
        position="left"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch pt-4">
        <div className="lg:col-span-8 xl:col-span-9 space-y-5">
          <div id="section-gallery" className="scroll-mt-32">
            <PortfolioGridGallery portfolio={portfolioData} className="h-full min-h-[500px]" />
          </div>
        </div>

        <div className="lg:col-span-4 xl:col-span-3">
          <PortfolioInfo portfolio={portfolioData} />
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 items-start relative min-w-0 px-1">
        <div className="flex-1 grid grid-cols-1 gap-6 min-w-0 w-full">
          <div id="section-overview" className="scroll-mt-32">
            <PortfolioOverview portfolio={portfolioData} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div id="section-categories" className="scroll-mt-32">
              <PortfolioCategories portfolio={portfolioData} />
            </div>
            <div id="section-tags" className="scroll-mt-32">
              <PortfolioTags portfolio={portfolioData} />
            </div>
            <div id="section-options" className="scroll-mt-32">
              <PortfolioOptions portfolio={portfolioData} />
            </div>
          </div>
          <div id="section-media" className="scroll-mt-32">
            <PortfolioMedia portfolio={portfolioData} />
          </div>
          <div id="section-attributes" className="scroll-mt-32">
            <PortfolioAttributes portfolio={portfolioData} />
          </div>
          <div id="section-seo" className="scroll-mt-32">
            <PortfolioSEO portfolio={portfolioData} />
          </div>
        </div>

        <aside className="hidden xl:block w-16 sticky top-24 self-start flex-none">
          <TooltipProvider>
            <Card className="gap-0 rounded-full shadow-lg ring-1 ring-static-b/5 border-br/50 items-center">
              <CardContent className="p-2">
                <nav className="flex flex-col gap-3">
                  {navItems.map((item) => (
                    <Tooltip key={item.id} delayDuration={0}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => scrollToSection(item.id)}
                          className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 cursor-pointer group relative ${activeSection === item.id
                            ? "bg-primary text-wt shadow-md shadow-primary/20 scale-110"
                            : "text-font-s hover:bg-bg hover:text-primary"
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
              </CardContent>
            </Card>
          </TooltipProvider>
        </aside>
      </div>
    </div>
  );
}

function PortfolioViewSkeleton() {
  return (
    <div className="space-y-8 p-6 text-right" dir="rtl">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-9 space-y-8">
          <Skeleton className="w-full h-[500px] rounded-2xl" />
          <Skeleton className="w-full h-96 rounded-2xl" />
        </div>
        <div className="xl:col-span-3 space-y-8">
          <Skeleton className="h-[500px] w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

