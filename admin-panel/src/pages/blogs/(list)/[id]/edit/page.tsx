import { lazy, Suspense } from "react";
import { useParams } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/elements/Tabs";
import { Skeleton } from "@/components/elements/Skeleton";
import {
  FileText, Image, Search, Settings
} from "lucide-react";
import { useBlogForm } from "@/components/blogs/hooks/useBlogForm";
import { BlogFormLayout } from "@/components/blogs/layouts/BlogFormLayout";

const TabSkeleton = () => (
  <div className="mt-0 space-y-6">
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 min-w-0">
        <div className="border border-br overflow-hidden">
          <div className="border-b border-b-blue-1 bg-bg/50 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center bg-blue">
                <FileText className="h-5 w-5 stroke-blue-2" />
              </div>
              <Skeleton className="h-6 w-32" />
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-20 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-64 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full lg:w-[420px] lg:flex-shrink-0">
        <div className="border border-br overflow-hidden lg:sticky lg:top-20">
          <div className="border-b border-b-blue-1 bg-bg/50 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center bg-blue">
                <Settings className="h-5 w-5 stroke-blue-2" />
              </div>
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-8">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const BaseInfoTab = lazy(() => import("@/components/blogs/list/create/BaseInfoTab"));
const MediaTab = lazy(() => import("@/components/blogs/list/create/MediaTab"));
const SEOTab = lazy(() => import("@/components/blogs/list/create/SEOTab"));

export default function EditBlogPage() {
  const { id } = useParams<{ id: string }>();

  const {
    form,
    activeTab,
    setActiveTab,
    blogMedia,
    setBlogMedia,
    handleSubmit,
    isPending,
    isLoading,
    item: blog
  } = useBlogForm({ id, isEditMode: true });

  const handleSave = handleSubmit("published");
  const handleSaveDraft = handleSubmit("draft");

  if (isLoading) {
    return (
      <div className="space-y-6 pb-28 relative">
        <Tabs value="account" className="w-full">
          <TabsList>
            <TabsTrigger value="account">
              <FileText className="h-4 w-4" />
              اطلاعات پایه
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
    );
  }

  if (!blog) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">وبلاگ مورد نظر یافت نشد.</p>
      </div>
    );
  }

  return (
    <BlogFormLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onSubmit={handleSave}
      onSaveDraft={handleSaveDraft}
      isPending={isPending}
      isSubmitting={form.formState.isSubmitting}
      isEditMode={true}
    >
      <TabsContent value="account">
        <Suspense fallback={<TabSkeleton />}>
          <BaseInfoTab
            form={form}
            editMode={true}
            blogId={id}
          />
        </Suspense>
      </TabsContent>
      <TabsContent value="media">
        <Suspense fallback={<TabSkeleton />}>
          <MediaTab
            form={form}
            blogMedia={blogMedia}
            setBlogMedia={setBlogMedia}
            editMode={true}
            blogId={id}
          />
        </Suspense>
      </TabsContent>
      <TabsContent value="seo">
        <Suspense fallback={<TabSkeleton />}>
          <SEOTab
            form={form}
            editMode={true}
            blogId={id}
          />
        </Suspense>
      </TabsContent>
    </BlogFormLayout>
  );
}
