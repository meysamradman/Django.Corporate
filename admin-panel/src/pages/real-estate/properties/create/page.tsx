import { lazy, Suspense } from "react";
import { TabsContent } from "@/components/elements/Tabs";
import { Skeleton } from "@/components/elements/Skeleton";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { FileText, Settings } from "lucide-react";
import { useRealEstateForm } from "@/components/real-estate/hooks/useRealEstateForm.ts";
import { FormLayout } from "@/components/real-estate/layouts/FormLayout.tsx";

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

const BaseInfoTab = lazy(() => import("@/components/real-estate/properties/create/RealEstateInfo"));
const DetailsTab = lazy(() => import("@/components/real-estate/properties/create/RealEstateDetails"));
const MediaTab = lazy(() => import("@/components/real-estate/properties/create/RealEstateMedia"));
const SEOTab = lazy(() => import("@/components/real-estate/properties/create/RealEstateSEO"));
const LocationTab = lazy(() => import("@/components/real-estate/properties/create/RealEstateLocation"));
const FloorPlansTab = lazy(() => import("@/components/real-estate/properties/create/RealEstateFloorPlans"));
const ExtraAttributesTab = lazy(() => import("@/components/real-estate/properties/create/RealEstateAttributes"));

export default function PropertyCreatePage() {
  const {
    form,
    activeTab,
    setActiveTab,
    tempFloorPlans,
    setTempFloorPlans,
    selectedLabels,
    selectedTags,
    selectedFeatures,
    propertyMedia,
    setPropertyMedia,
    handleSubmit,
    handleSaveDraft,
    handleFeaturedImageChange,
    handleGalleryChange,
    handleVideoGalleryChange,
    handleAudioGalleryChange,
    handlePdfDocumentsChange,
    handleLabelToggle,
    handleLabelRemove,
    handleTagToggle,
    handleTagRemove,
    handleFeatureToggle,
    handleFeatureRemove,
    handleLocationChange,
    handleInputChange,
    isPending,
  } = useRealEstateForm({ isEditMode: false });

  const formData = form.watch();

  return (
    <FormLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onSubmit={handleSubmit}
      onSaveDraft={handleSaveDraft}
      isPending={isPending}
      isSubmitting={form.formState.isSubmitting}
      isEditMode={false}
      tempFloorPlansCount={tempFloorPlans.length}
    >
      <TabsContent value="account">
        <Suspense fallback={<TabSkeleton />}>
          <BaseInfoTab
            form={form}
            selectedLabels={selectedLabels}
            onLabelToggle={handleLabelToggle}
            onLabelRemove={handleLabelRemove}
            selectedTags={selectedTags}
            onTagToggle={handleTagToggle}
            onTagRemove={handleTagRemove}
            selectedFeatures={selectedFeatures}
            onFeatureToggle={handleFeatureToggle}
            onFeatureRemove={handleFeatureRemove}
            editMode={true}
          />
        </Suspense>
      </TabsContent>

      <TabsContent value="location">
        <Suspense fallback={<TabSkeleton />}>
          <LocationTab
            form={form}
            latitude={formData.latitude}
            longitude={formData.longitude}
            onLocationChange={handleLocationChange}
            editMode={true}
            districtName={null}
          />
        </Suspense>
      </TabsContent>

      <TabsContent value="details">
        <Suspense fallback={<TabSkeleton />}>
          <DetailsTab
            formData={formData}
            handleInputChange={handleInputChange}
            editMode={true}
            errors={Object.fromEntries(
              Object.entries(form.formState.errors).map(([key, error]) => [
                key,
                typeof error === 'object' && error !== null && 'message' in error
                  ? String(error.message)
                  : ""
              ])
            ) as Record<string, string>}
          />
        </Suspense>
      </TabsContent>

      <TabsContent value="floorplans">
        <Suspense fallback={<TabSkeleton />}>
          <FloorPlansTab
            propertyId={undefined}
            editMode={true}
            tempFloorPlans={tempFloorPlans}
            onTempFloorPlansChange={setTempFloorPlans}
          />
        </Suspense>
      </TabsContent>

      <TabsContent value="media">
        <Suspense fallback={<TabSkeleton />}>
          <MediaTab
            propertyMedia={propertyMedia}
            setPropertyMedia={setPropertyMedia}
            editMode={true}
            featuredImage={propertyMedia.featuredImage}
            onFeaturedImageChange={handleFeaturedImageChange}
            onGalleryChange={handleGalleryChange}
            onVideoGalleryChange={handleVideoGalleryChange}
            onAudioGalleryChange={handleAudioGalleryChange}
            onPdfDocumentsChange={handlePdfDocumentsChange}
            propertyId={undefined}
          />
        </Suspense>
      </TabsContent>

      <TabsContent value="seo">
        <Suspense fallback={<TabSkeleton />}>
          <SEOTab
            formData={formData}
            handleInputChange={handleInputChange}
            editMode={true}
            propertyId={undefined}
          />
        </Suspense>
      </TabsContent>

      <TabsContent value="extra">
        <Suspense fallback={<TabSkeleton />}>
          <ExtraAttributesTab
            formData={formData}
            handleInputChange={handleInputChange}
            editMode={true}
          />
        </Suspense>
      </TabsContent>
    </FormLayout>
  );
}
