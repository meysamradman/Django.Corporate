import { useState } from "react";
import { FolderTree, Image as ImageIcon, Settings } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { realEstateApi } from "@/api/real-estate";
import { useRealEstateTaxonomyForm } from "@/components/real-estate/hooks/useRealEstateTaxonomyForm.ts";
import { TaxonomyFormLayout } from "@/components/real-estate/layouts/TaxonomyFormLayout.tsx";
import { propertyTypeFormSchema, propertyTypeFormDefaults } from '@/components/real-estate/validations/typeSchema';
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { FormField, FormFieldInput, FormFieldTextarea } from "@/components/shared/FormField";
import { TreeSelect } from "@/components/elements/TreeSelect";
import { formatSlug } from '@/core/slug/generate';
import { mediaService } from "@/components/media/services";
import { Button } from "@/components/elements/Button";
import { UploadCloud, X } from "lucide-react";
import { MediaLibraryModal } from "@/components/media/modals/MediaLibraryModal";
import { TabsContent } from "@/components/elements/Tabs";
import { Item, ItemContent, ItemTitle, ItemDescription, ItemActions } from "@/components/elements/Item";
import { Switch } from "@/components/elements/Switch";

export default function CreatePropertyTypePage() {
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
  } = useRealEstateTaxonomyForm({
    isEditMode: false,
    schema: propertyTypeFormSchema,
    defaultValues: propertyTypeFormDefaults,
    createMutationFn: (data) => realEstateApi.createType(data),
    updateMutationFn: (id, data) => realEstateApi.partialUpdateType(id, data),
    invalidateQueryKeys: [['property-types']],
    onSuccessRedirect: "/real-estate/types",
    itemLabel: "نوع ملک",
  });

  const { register, formState: { errors, isSubmitting }, watch, setValue } = form;

  const { data: types } = useQuery({
    queryKey: ['property-types-all'],
    queryFn: () => realEstateApi.getTypes({ size: 1000 }),
  });

  const treeData = types?.data?.map(t => ({
    ...t,
    name: t.title
  })) || [];

  const tabs = [
    { value: "account", label: "اطلاعات پایه", icon: FolderTree },
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
      itemLabel="نوع ملک"
      formId="type-create-form"
    >
      <TabsContent value="account">
        <CardWithIcon
          icon={FolderTree}
          title="اطلاعات نوع ملک"
          iconBgColor="bg-purple"
          iconColor="stroke-purple-2"
          borderColor="border-b-purple-1"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormFieldInput
                label="عنوان"
                id="title"
                required
                error={errors.title?.message}
                placeholder="عنوان نوع ملک"
                {...register("title")}
              />
              <FormFieldInput
                label="نامک"
                id="slug"
                required
                error={errors.slug?.message}
                placeholder="نامک"
                {...register("slug", {
                  onChange: (e) => {
                    const formattedSlug = formatSlug(e.target.value);
                    e.target.value = formattedSlug;
                    setValue("slug", formattedSlug);
                  }
                })}
              />
            </div>

            <FormField
              label="نوع والد"
              htmlFor="parent_id"
              description="نوع‌های بدون والد، نوع‌های مادر هستند."
              error={errors.parent_id?.message}
            >
              <TreeSelect
                data={treeData}
                value={watch("parent_id") || null}
                onChange={(value) => setValue("parent_id", value ? parseInt(value) : null)}
                placeholder="انتخاب نوع والد (اختیاری)"
                searchPlaceholder="جستجوی نوع ملک..."
                emptyText="نوع ملکی یافت نشد"
              />
            </FormField>

            <FormFieldTextarea
              label="توضیحات"
              id="description"
              error={errors.description?.message}
              placeholder="توضیحات نوع ملک"
              rows={4}
              {...register("description")}
            />
          </div>
        </CardWithIcon>
      </TabsContent>

      <TabsContent value="media">
        <CardWithIcon
          icon={ImageIcon}
          title="تصویر نوع ملک"
          iconBgColor="bg-blue"
          iconColor="stroke-blue-2"
          borderColor="border-b-blue-1"
        >
          {selectedMedia ? (
            <div className="relative w-full aspect-video overflow-hidden group border">
              <img
                src={mediaService.getMediaUrlFromObject(selectedMedia)}
                alt={selectedMedia.alt_text || "تصویر نوع ملک"}
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
              <p className="mt-4 text-lg font-semibold">انتخاب تصویر</p>
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
          iconBgColor="bg-purple"
          iconColor="stroke-purple-2"
          borderColor="border-b-purple-1"
        >
          <div className="space-y-6">
            <FormFieldInput
              label="ترتیب نمایش"
              id="display_order"
              type="number"
              error={errors.display_order?.message}
              placeholder="ترتیب نمایش"
              {...register("display_order", {
                valueAsNumber: true,
              })}
            />

            <div className="mt-6 space-y-4">
              <div className="border border-green-1/40 bg-green-0/30 hover:border-green-1/60 transition-colors overflow-hidden">
                <Item variant="default" size="default" className="py-5">
                  <ItemContent>
                    <ItemTitle className="text-green-2">وضعیت فعال</ItemTitle>
                    <ItemDescription>
                      با غیرفعال شدن، نوع ملک از لیست مدیریت نیز مخفی می‌شود.
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
