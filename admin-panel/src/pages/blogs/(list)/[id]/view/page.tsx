import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  Image as ImageIcon,
  Search,
  Edit2,
  Printer,
  PlayCircle,
  FolderOpen,
  Tag
} from "lucide-react";
import { Skeleton } from "@/components/elements/Skeleton";
import { Button } from "@/components/elements/Button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/elements/Tooltip";
import { blogApi } from "@/api/blogs/blogs";
import { BlogGridGallery } from "@/components/blogs/posts/view/BlogGridGallery.tsx";
import { BlogInfo } from "@/components/blogs/posts/view/BlogInfo.tsx";
import { BlogOverview } from "@/components/blogs/posts/view/BlogOverview.tsx";
import { BlogCategories } from "@/components/blogs/posts/view/BlogCategories.tsx";
import { BlogTags } from "@/components/blogs/posts/view/BlogTags.tsx";
import { BlogMedia } from "@/components/blogs/posts/view/BlogMedia.tsx";
import { BlogSEO } from "@/components/blogs/posts/view/BlogSEO.tsx";
import { FloatingActions } from "@/components/elements/FloatingActions";
import { Card, CardContent } from "@/components/elements/Card";

export default function BlogViewPage() {
  const params = useParams();
  const navigate = useNavigate();
  const blogId = params?.id as string;
  const [activeSection, setActiveSection] = useState("gallery");

  const { data: blogData, isLoading, error } = useQuery({
    queryKey: ["blog", blogId],
    queryFn: () => blogApi.getBlogById(Number(blogId)),
    staleTime: 0,
    enabled: !!blogId,
  });

  useEffect(() => {
    const handleScroll = () => {
      const sections = ["gallery", "overview", "categories", "tags", "media", "seo"];
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

  if (!blogId) return <div className="text-center py-20 text-red-500">شناسه وبلاگ یافت نشد</div>;
  if (isLoading) return <BlogViewSkeleton />;
  if (error || !blogData) return (
    <div className="flex flex-col items-center justify-center py-20 bg-card rounded-2xl border border-br">
      <p className="text-red-1 font-bold mb-4">خطا در بارگذاری اطلاعات وبلاگ</p>
      <Button onClick={() => window.location.reload()}>تلاش مجدد</Button>
    </div>
  );

  const navItems = [
    { id: "gallery", label: "گالری", icon: ImageIcon },
    { id: "overview", label: "مرور کلی", icon: FileText },
    { id: "categories", label: "دسته‌بندی‌ها", icon: FolderOpen },
    { id: "tags", label: "تگ‌ها", icon: Tag },
    { id: "media", label: "رسانه‌ها", icon: PlayCircle },
    { id: "seo", label: "سئو", icon: Search },
  ];

  return (
    <div className="relative flex flex-col gap-6">
      <FloatingActions
        actions={[
          {
            icon: Printer,
            label: "خروجی PDF / چاپ سند",
            variant: "outline",
            onClick: () => {
              const url = `/blogs/print?ids=${blogId}&type=detail`;
              window.open(url, '_blank', 'width=1024,height=768');
            },
          },
          {
            icon: Edit2,
            label: "ویرایش وبلاگ",
            variant: "default",
            permission: "blog.update",
            onClick: () => navigate(`/blogs/${blogId}/edit`),
          },
        ]}
        position="left"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-8 xl:col-span-9 space-y-5">
          <div id="section-gallery" className="scroll-mt-32">
            <BlogGridGallery blog={blogData} className="h-full min-h-[500px]" />
          </div>
        </div>

        <div className="lg:col-span-4 xl:col-span-3">
          <BlogInfo blog={blogData} />
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 items-start relative min-w-0">
        <div className="flex-1 grid grid-cols-1 gap-6 min-w-0 w-full">
          <div id="section-overview" className="scroll-mt-32">
            <BlogOverview blog={blogData} />
          </div>
          <div id="section-categories" className="scroll-mt-32">
            <BlogCategories blog={blogData} />
          </div>
          <div id="section-tags" className="scroll-mt-32">
            <BlogTags blog={blogData} />
          </div>
          <div id="section-media" className="scroll-mt-32">
            <BlogMedia blog={blogData} />
          </div>
          <div id="section-seo" className="scroll-mt-32">
            <BlogSEO blog={blogData} />
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
              </CardContent>
            </Card>
          </TooltipProvider>
        </aside>
      </div>
    </div>
  );
}

function BlogViewSkeleton() {
  return (
    <div className="space-y-8 p-6">
      <Skeleton className="w-full h-32 rounded-2xl" />
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-9 space-y-8">
          <Skeleton className="w-full h-[500px] rounded-2xl" />
          <Skeleton className="w-full h-96 rounded-2xl" />
        </div>
        <div className="xl:col-span-3 space-y-8">
          <Skeleton className="w-full h-80 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

