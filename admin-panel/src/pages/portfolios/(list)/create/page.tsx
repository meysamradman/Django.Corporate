import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/elements/Skeleton";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { FileText, Settings } from "lucide-react";
import { PortfolioFormLayout } from "@/components/portfolios/layouts/PortfolioFormLayout";
import { usePortfolioForm } from "@/components/portfolios/hooks/usePortfolioForm";

const TabSkeleton = () => (
  <div className="mt-0 space-y-6">
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 min-w-0">
        <CardWithIcon
          icon={FileText}
          title="اطلاعات پایه"
          iconBgColor="bg-blue"
          iconColor="stroke-blue-2"
          borderColor="border-b-blue-1"
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

      <div className="w-full lg:w-[420px] lg:flex-shrink-0">
        <CardWithIcon
          icon={Settings}
          title="تنظیمات"
          iconBgColor="bg-blue"
          iconColor="stroke-blue-2"
          borderColor="border-b-blue-1"
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

const BaseInfoTab = lazy(() => import("@/components/portfolios/list/create/BaseInfoTab"));
const MediaTab = lazy(() => import("@/components/portfolios/list/create/MediaTab"));
const SEOTab = lazy(() => import("@/components/portfolios/list/create/SEOTab"));
const ExtraAttributesTab = lazy(() => import("@/components/portfolios/list/create/ExtraAttributesTab"));

export default function CreatePortfolioPage() {
  const {
    form,
    activeTab,
    setActiveTab,
    portfolioMedia,
    setPortfolioMedia,
    handleSubmit,
    isPending,
  } = usePortfolioForm({ isEditMode: false });

  return (
    <PortfolioFormLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onSubmit={() => handleSubmit("published")()}
      onSaveDraft={() => handleSubmit("draft")()}
      isPending={isPending}
      isSubmitting={form.formState.isSubmitting}
      isEditMode={false}
    >
      <div className="mt-6">
        {activeTab === "account" && (
          <Suspense fallback={<TabSkeleton />}>
            <BaseInfoTab
              form={form}
              editMode={true}
            />
          </Suspense>
        )}
        {activeTab === "media" && (
          <Suspense fallback={<TabSkeleton />}>
            <MediaTab
              form={form}
              portfolioMedia={portfolioMedia}
              setPortfolioMedia={setPortfolioMedia}
              editMode={true}
            />
          </Suspense>
        )}
        {activeTab === "seo" && (
          <Suspense fallback={<TabSkeleton />}>
            <SEOTab
              form={form}
              editMode={true}
            />
          </Suspense>
        )}
        {activeTab === "extra" && (
          <Suspense fallback={<TabSkeleton />}>
            <ExtraAttributesTab
              form={form}
              editMode={true}
            />
          </Suspense>
        )}
      </div>
    </PortfolioFormLayout>
  );
}
