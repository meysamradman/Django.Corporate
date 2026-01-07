import { useState } from "react";
import { FileText, Image as ImageIcon, Settings, Star, UploadCloud, X } from "lucide-react";
import { realEstateApi } from "@/api/real-estate";
import { useTaxonomyForm } from "@/components/real-estate/hooks/useTaxonomyForm";
import { TaxonomyFormLayout } from "@/components/real-estate/layouts/TaxonomyFormLayout";
import { propertyFeatureFormSchema, propertyFeatureFormDefaults } from '@/components/real-estate/validations/featureSchema';
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { FormFieldInput } from "@/components/forms/FormField";
import { mediaService } from "@/components/media/services";
import { Button } from "@/components/elements/Button";
import { MediaLibraryModal } from "@/components/media/modals/MediaLibraryModal";
import { TabsContent } from "@/components/elements/Tabs";
import { Item, ItemContent, ItemTitle, ItemDescription, ItemActions } from "@/components/elements/Item";
import { Switch } from "@/components/elements/Switch";

export default function CreatePropertyFeaturePage() {
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  const {
    form,
    activeTab,
    setActiveTab,
    selectedMedia,
    handleImageSelect,
    handleRemoveImage,
    handleSubmit,
    isPending,
  } = useTaxonomyForm({
    isEditMode: false,
    schema: propertyFeatureFormSchema,
    defaultValues: propertyFeatureFormDefaults,
    createMutationFn: (data) => realEstateApi.createFeature(data),
    updateMutationFn: (id, data) => realEstateApi.partialUpdateFeature(id, data),
    invalidateQueryKeys: [['property-features']],
    onSuccessRedirect: "/real-estate/features",
    itemLabel: "ویژگی ملک",
    autoSlug: false, // Features don't have slugs in the schema I saw
  });

  const { register, formState: { errors, isSubmitting }, watch, setValue } = form;

  const tabs = [
    { value: "account", label: "اطلاعات پایه", icon: FileText },
    { value: "media", label: "مدیا", icon: ImageIcon },
    { value: "settings", label: "تنظیمات", icon: Settings },
  ];

  return (
    <TaxonomyFormLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onSubmit={handleSubmit}
      isPending={isPending}
      isSubmitting={isSubmitting}
      isEditMode={false}
      tabs={tabs}
      itemLabel="ویژگی ملک"
      formId="feature-create-form"
    >
      <TabsContent value="account">
        <CardWithIcon
          icon={Star}
          title="اطلاعات ویژگی ملک"
          iconBgColor="bg-yellow"
          iconColor="stroke-yellow-2"
          borderColor="border-b-yellow-1"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormFieldInput
                label="عنوان"
                id="title"
                required
                error={errors.title?.message}
                placeholder="عنوان ویژگی ملک"
                {...register("title")}
              />
              <FormFieldInput
                label="دسته‌بندی"
                id="group"
                error={errors.group?.message}
                placeholder="دسته‌بندی ویژگی"
                {...register("group")}
              />
            </div>
          </div>
        </CardWithIcon>
      </TabsContent>

      <TabsContent value="media">
        <CardWithIcon
          icon={ImageIcon}
          title="تصویر/آیکون ویژگی"
          iconBgColor="bg-blue"
          iconColor="stroke-blue-2"
          borderColor="border-b-blue-1"
        >
          {selectedMedia ? (
            <div className="relative w-full aspect-square overflow-hidden group border">
              <img
                src={mediaService.getMediaUrlFromObject(selectedMedia)}
                alt={selectedMedia.alt_text || "تصویر ویژگی"}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-static-b/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsMediaModalOpen(true)}
                  className="mx-1"
                  type="button"
                >
                  تغییر تصویر
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveImage}
                  className="mx-1"
                  type="button"
                >
                  <X className="w-4 h-4" />
                  حذف
                </Button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => setIsMediaModalOpen(true)}
              className="relative flex flex-col items-center justify-center w-full p-8 border-2 border-dashed cursor-pointer hover:border-primary transition-colors"
            >
              <UploadCloud className="w-12 h-12 text-font-s" />
              <p className="mt-4 text-lg font-semibold">انتخاب تصویر/آیکون</p>
              <p className="mt-1 text-sm text-font-s text-center">
                برای انتخاب از کتابخانه کلیک کنید
              </p>
            </div>
          )}
        </CardWithIcon>
      </TabsContent>

      <TabsContent value="settings">
        <CardWithIcon
          icon={Settings}
          title="تنظیمات"
          iconBgColor="bg-yellow"
          iconColor="stroke-yellow-2"
          borderColor="border-b-yellow-1"
        >
          <div className="space-y-6">
            <div className="mt-6 space-y-4">
              <div className="border border-green-1/40 bg-green-0/30 hover:border-green-1/60 transition-colors overflow-hidden">
                <Item variant="default" size="default" className="py-5">
                  <ItemContent>
                    <ItemTitle className="text-green-2">وضعیت فعال</ItemTitle>
                    <ItemDescription>
                      با غیرفعال شدن، ویژگی ملک از لیست مدیریت نیز مخفی می‌شود.
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <Switch
                      checked={watch("is_active")}
                      onCheckedChange={(checked) => setValue("is_active", checked)}
                    />
                  </ItemActions>
                </Item>
              </div>
            </div>
          </div>
        </CardWithIcon>
      </TabsContent>

      <MediaLibraryModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onSelect={(media) => {
          handleImageSelect(media);
          setIsMediaModalOpen(false);
        }}
        selectMultiple={false}
        initialFileType="image"
        showTabs={true}
        context="media_library"
      />
    </TaxonomyFormLayout>
  );
}
