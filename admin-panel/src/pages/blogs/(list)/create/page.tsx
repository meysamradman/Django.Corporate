import { lazy, Suspense } from "react";
import { FileText, Settings } from "lucide-react";
import { Skeleton } from "@/components/elements/Skeleton";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { useBlogForm } from "@/components/blogs/hooks/useBlogForm";
import { BlogFormLayout } from "@/components/blogs/layouts/BlogFormLayout.tsx";
import { TabsContent } from "@/components/elements/Tabs";

const TabSkeleton = () => (
  <div className="mt-0 space-y-6">
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 min-w-0">
        <CardWithIcon
          icon={FileText}
          title="اطلاعات پایه"
          iconBgColor="bg-blue"
          iconColor="stroke-blue-2"
          cardBorderColor="border-b-blue-1"
        >
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
        </CardWithIcon>
      </div>

      <div className="w-full lg:w-[420px] lg:shrink-0">
        <CardWithIcon
          icon={Settings}
          title="تنظیمات"
          iconBgColor="bg-blue"
          iconColor="stroke-blue-2"
          cardBorderColor="border-b-blue-1"
          className="lg:sticky lg:top-20"
        >
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
        </CardWithIcon>
      </div>
    </div>
  </div>
);

const BaseInfoTab = lazy(() => import("@/components/blogs/posts/create/BlogInfo"));
const MediaTab = lazy(() => import("@/components/blogs/posts/create/BlogMedia"));
const SEOTab = lazy(() => import("@/components/blogs/posts/create/BlogSEO"));

export default function CreateBlogPage() {
  const {
    form,
    activeTab,
    setActiveTab,
    blogMedia,
    setBlogMedia,
    handleSubmit,
    isPending,
  } = useBlogForm({ isEditMode: false });

  const handleSave = handleSubmit("published");
  const handleSaveDraft = handleSubmit("draft");

  return (
    <BlogFormLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onSubmit={handleSave}
      onSaveDraft={handleSaveDraft}
      isPending={isPending}
      isSubmitting={form.formState.isSubmitting}
      isEditMode={false}
    >
      <TabsContent value="account">
        <Suspense fallback={<TabSkeleton />}>
          <BaseInfoTab
            form={form}
            editMode={true}
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
          />
        </Suspense>
      </TabsContent>
      <TabsContent value="seo">
        <Suspense fallback={<TabSkeleton />}>
          <SEOTab
            form={form}
            editMode={true}
          />
        </Suspense>
      </TabsContent>
    </BlogFormLayout>
  );
}
