import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { blogApi } from "@/api/blogs/blogs";

import { BlogGallery } from "@/components/blogs/posts/view/media/BlogGallery";
import { BlogSidebar } from "@/components/blogs/posts/view/sidebar/BlogSidebar";
import { BlogDescriptions } from "@/components/blogs/posts/view/descriptions/BlogDescriptions";
import { BlogStats } from "@/components/blogs/posts/view/stats/BlogStats";
import { BlogMediaSummary } from "@/components/blogs/posts/view/media/BlogMediaSummary";
import { BlogCategories } from "@/components/blogs/posts/view/categories/BlogCategories";
import { BlogTags } from "@/components/blogs/posts/view/tags/BlogTags";
import { BlogMedia } from "@/components/blogs/posts/view/media/BlogMedia";
import { BlogSEO } from "@/components/blogs/posts/view/seo/BlogSEO";
import { BlogNavigation } from "@/components/blogs/posts/view/navigation/BlogNavigation";

import { BlogViewSkeleton } from "@/components/blogs/posts/view/BlogViewSkeleton";
import { Button } from "@/components/elements/Button";

export default function BlogViewPage() {
  const params = useParams();
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
      const sections = ["gallery", "overview", "stats", "categories", "tags", "media", "seo"];
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

  if (!blogId) return <div className="text-center py-20 text-red-500 font-bold">شناسه وبلاگ یافت نشد</div>;
  if (isLoading) return <div className="p-6 transition-all duration-500"><BlogViewSkeleton /></div>;
  if (error || !blogData) return (
    <div className="flex flex-col items-center justify-center py-20 bg-card rounded-2xl border border-br">
      <p className="text-red-1 font-bold mb-4 italic">خطا در بارگذاری اطلاعات وبلاگ</p>
      <Button variant="outline" onClick={() => window.location.reload()}>تلاش مجدد</Button>
    </div>
  );

  return (
    <div className="relative flex flex-col gap-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div id="section-gallery" className="lg:col-span-8 xl:col-span-9 scroll-mt-32">
          <BlogGallery blog={blogData} />
        </div>
        <div className="lg:col-span-4 xl:col-span-3">
          <BlogSidebar
            blog={blogData}
            onPrint={() => {
              const url = `/blogs/print?ids=${blogId}&type=detail`;
              window.open(url, '_blank', 'width=1024,height=768');
            }}
          />
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-8 items-start relative min-w-0">
        <div className="flex-1 grid grid-cols-1 gap-8 min-w-0 w-full">
          <div id="section-overview" className="scroll-mt-32">
            <BlogDescriptions blog={blogData} />
          </div>

          <div id="section-stats" className="scroll-mt-32 grid grid-cols-1 xl:grid-cols-2 gap-8 items-stretch">
            <BlogStats blog={blogData} />
            <BlogMediaSummary blog={blogData} />
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

        <BlogNavigation
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
      </div>
    </div>
  );
}

