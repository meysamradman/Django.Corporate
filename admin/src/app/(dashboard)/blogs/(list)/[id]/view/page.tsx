"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/elements/Tabs";
import { Button } from "@/components/elements/Button";
import { Skeleton } from "@/components/elements/Skeleton";
import { FileText, Image, Search, Edit2, FileDown } from "lucide-react";
import { toast } from '@/components/elements/Sonner';
import { blogApi } from "@/api/blogs/route";
import { BlogSidebar } from "@/components/blogs/list/view/BlogSidebar";

// Skeleton برای Tab Components
const TabSkeleton = () => (
  <div className="mt-6 space-y-4">
    <div className="rounded-lg border p-6">
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
    <div className="rounded-lg border p-6">
      <Skeleton className="h-6 w-24 mb-4" />
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  </div>
);

// Dynamic imports برای Tab Components
const OverviewTab = dynamic(
  () => import("@/components/blogs/list/view/OverviewTab").then(m => ({ default: m.OverviewTab })),
  { 
    ssr: false,
    loading: () => <TabSkeleton />
  }
);
const MediaInfoTab = dynamic(
  () => import("@/components/blogs/list/view/MediaInfoTab").then(m => ({ default: m.MediaInfoTab })),
  { 
    ssr: false,
    loading: () => <TabSkeleton />
  }
);
const SEOInfoTab = dynamic(
  () => import("@/components/blogs/list/view/SEOInfoTab").then(m => ({ default: m.SEOInfoTab })),
  { 
    ssr: false,
    loading: () => <TabSkeleton />
  }
);

export default function BlogViewPage() {
  const params = useParams();
  const router = useRouter();
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
      <div className="space-y-6">
        <h1 className="page-title">نمایش وبلاگ</h1>
        <div className="text-center py-8">
          <p className="text-destructive">شناسه وبلاگ یافت نشد</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="page-title">اطلاعات وبلاگ</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" disabled>
              <FileDown className="h-4 w-4" />
              خروجی PDF
            </Button>
            <Button disabled>
              <Edit2 />
              ویرایش وبلاگ
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-2">
            <div className="rounded-lg border p-6 space-y-4">
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
      <div className="space-y-6">
        <h1 className="page-title">نمایش وبلاگ</h1>
        <div className="rounded-lg border p-6">
          <div className="text-center py-8">
            <p className="text-red-1 mb-4">خطا در بارگذاری اطلاعات وبلاگ</p>
            <p className="text-font-s">
              لطفاً دوباره تلاش کنید یا با مدیر سیستم تماس بگیرید.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">اطلاعات وبلاگ</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={async () => {
              try {
                await blogApi.exportBlogPdf(Number(blogId));
                toast.success("فایل PDF با موفقیت دانلود شد");
              } catch (error) {
                toast.error("خطا در دانلود فایل PDF");
              }
            }}
          >
            <FileDown className="h-4 w-4" />
            خروجی PDF
          </Button>
          <Button
            onClick={() => router.push(`/blogs/${blogId}/edit`)}
          >
            <Edit2 />
            ویرایش وبلاگ
          </Button>
        </div>
      </div>

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
              <OverviewTab blog={blogData} />
            </TabsContent>
            <TabsContent value="media">
              <MediaInfoTab blog={blogData} />
            </TabsContent>
            <TabsContent value="seo">
              <SEOInfoTab blog={blogData} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
