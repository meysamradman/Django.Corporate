import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger } from "@/components/elements/Tabs";
import { FileText, Image, Search, Edit2, FileDown } from "lucide-react";
import { showError, showSuccess } from '@/core/toast';
import { Skeleton } from "@/components/elements/Skeleton";
import { blogApi } from "@/api/blogs/blogs";
import { BlogImageGallery } from "@/components/blogs/list/view/BlogImageGallery";
import { BlogBasicInfo } from "@/components/blogs/list/view/BlogBasicInfo";
import { OverviewTab } from "@/components/blogs/list/view/OverviewTab";
import { MediaInfoTab } from "@/components/blogs/list/view/MediaInfoTab";
import { SEOInfoTab } from "@/components/blogs/list/view/SEOInfoTab";
import { FloatingActions } from "@/components/elements/FloatingActions";


export default function BlogViewPage() {
  const params = useParams();
  const navigate = useNavigate();
  const blogId = params?.id as string;
  const [activeTab, setActiveTab] = useState("overview");

  const { data: blogData, isLoading, error } = useQuery({
    queryKey: ["blog", blogId],
    queryFn: () => blogApi.getBlogById(Number(blogId)),
    staleTime: 0,
    enabled: !!blogId,
  });

  if (!blogId) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">شناسه وبلاگ یافت نشد</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
          <div className="lg:col-span-7 xl:col-span-8 h-full">
            <Skeleton className="h-full w-full" />
          </div>
          <div className="lg:col-span-5 xl:col-span-4 h-full">
            <div className="sticky top-4 self-start">
              <Skeleton className="h-full w-full" />
            </div>
          </div>
        </div>
        <div>
          <Tabs value="overview" className="w-full">
            <TabsList>
              <TabsTrigger value="overview" disabled>
                <FileText className="h-4 w-4" />
                مرور کلی
              </TabsTrigger>
              <TabsTrigger value="media" disabled>
                <Image className="h-4 w-4" />
                مدیا
              </TabsTrigger>
              <TabsTrigger value="seo" disabled>
                <Search className="h-4 w-4" />
                سئو
              </TabsTrigger>
            </TabsList>
            <Skeleton className="h-64 w-full mt-4" />
          </Tabs>
        </div>
      </div>
    );
  }

  if (error || !blogData) {
    return (
      <div className="border p-6">
        <div className="text-center py-8">
          <p className="text-red-1 mb-4">خطا در بارگذاری اطلاعات وبلاگ</p>
          <p className="text-font-s">
            لطفاً دوباره تلاش کنید یا با مدیر سیستم تماس بگیرید.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <FloatingActions
        actions={[
          {
            icon: FileDown,
            label: "خروجی PDF",
            variant: "outline",
            onClick: async () => {
              try {
                await blogApi.exportBlogPdf(Number(blogId));
                showSuccess("فایل PDF با موفقیت دانلود شد");
              } catch (error) {
                showError("خطا در دانلود فایل PDF");
              }
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

      {/* Top Section: Carousel + Basic Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
        {/* Right Side: Carousel (Gallery) - Takes more space */}
        <div className="lg:col-span-7 xl:col-span-8 h-full">
          <BlogImageGallery blog={blogData} className="h-full" />
        </div>

        {/* Left Side: Basic Info Sidebar - Takes less space */}
        <div className="lg:col-span-5 xl:col-span-4 h-full">
          <div className="sticky top-4 self-start">
            <BlogBasicInfo blog={blogData} />
          </div>
        </div>
      </div>

      {/* Bottom Section: Tabs */}
      <div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="overview">
              <FileText className="h-4 w-4" />
              مرور کلی
            </TabsTrigger>
            <TabsTrigger value="media">
              <Image className="h-4 w-4" />
              مدیا
            </TabsTrigger>
            <TabsTrigger value="seo">
              <Search className="h-4 w-4" />
              سئو
            </TabsTrigger>
          </TabsList>

          <OverviewTab blog={blogData} />
          <MediaInfoTab blog={blogData} />
          <SEOInfoTab blog={blogData} />
        </Tabs>
      </div>
    </div>
  );
}
