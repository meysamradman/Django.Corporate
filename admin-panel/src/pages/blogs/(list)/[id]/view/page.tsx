import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger } from "@/components/elements/Tabs";
import { FileText, Image, Search, Edit2, Printer } from "lucide-react";
import { Skeleton } from "@/components/elements/Skeleton";
import { blogApi } from "@/api/blogs/blogs";
import { BlogCarousel } from "@/components/blogs/list/view/BlogCarousel.tsx";
import { BlogInfo } from "@/components/blogs/list/view/BlogInfo.tsx";
import { BlogOverview } from "@/components/blogs/list/view/BlogOverview.tsx";
import { BlogMedia } from "@/components/blogs/list/view/BlogMedia.tsx";
import { BlogSEO } from "@/components/blogs/list/view/BlogSEO.tsx";
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
        <div className="lg:col-span-7 xl:col-span-8 h-full">
          <BlogCarousel blog={blogData} className="h-full" />
        </div>

        <div className="lg:col-span-5 xl:col-span-4 h-full">
          <div className="sticky top-4 self-start">
            <BlogInfo blog={blogData} />
          </div>
        </div>
      </div>

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

          <BlogOverview blog={blogData} />
          <BlogMedia blog={blogData} />
          <BlogSEO blog={blogData} />
        </Tabs>
      </div>
    </div>
  );
}
