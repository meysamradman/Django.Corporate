import { useState, lazy, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/elements/Tabs";
import { Skeleton } from "@/components/elements/Skeleton";
import { FileText, Image, Search, Edit2, FileDown } from "lucide-react";
import { showError, showSuccess } from '@/core/toast';
import { blogApi } from "@/api/blogs/blogs";
import { BlogSidebar } from "@/components/blogs/list/view/BlogSidebar";
import { FloatingActions } from "@/components/elements/FloatingActions";

const TabSkeleton = () => (
  <div className="mt-6 space-y-4">
    <div className="border p-6">
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-full" />
          </div>
        </div>
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
    <div className="border p-6">
      <Skeleton className="h-6 w-24 mb-4" />
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  </div>
);

const OverviewTab = lazy(() => import("@/components/blogs/list/view/OverviewTab").then(m => ({ default: m.OverviewTab })));
const MediaInfoTab = lazy(() => import("@/components/blogs/list/view/MediaInfoTab").then(m => ({ default: m.MediaInfoTab })));
const SEOInfoTab = lazy(() => import("@/components/blogs/list/view/SEOInfoTab").then(m => ({ default: m.SEOInfoTab })));

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
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-2">
            <div className="border p-6 space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
          <div className="lg:col-span-4">
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
              <TabSkeleton />
            </Tabs>
          </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
        <div className="lg:col-span-2">
          <BlogSidebar blog={blogData} />
        </div>

        <div className="lg:col-span-4">
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

            <TabsContent value="overview">
              <Suspense fallback={<TabSkeleton />}>
                <OverviewTab blog={blogData} />
              </Suspense>
            </TabsContent>
            <TabsContent value="media">
              <Suspense fallback={<TabSkeleton />}>
                <MediaInfoTab blog={blogData} />
              </Suspense>
            </TabsContent>
            <TabsContent value="seo">
              <Suspense fallback={<TabSkeleton />}>
                <SEOInfoTab blog={blogData} />
              </Suspense>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
