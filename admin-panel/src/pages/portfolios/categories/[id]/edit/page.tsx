import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FolderTree, Image as ImageIcon, Settings, UploadCloud, X } from "lucide-react";
import { TaxonomyFormLayout } from "@/components/real-estate/layouts/TaxonomyFormLayout.tsx";
import { useRealEstateTaxonomyForm } from "@/components/real-estate/hooks/useRealEstateTaxonomyForm.ts";
import { portfolioApi } from "@/api/portfolios/portfolios";
import { portfolioCategoryFormSchema, portfolioCategoryFormDefaults, type PortfolioCategoryFormValues } from "@/components/portfolios/validations/categorySchema";
import { TabsContent } from "@/components/elements/Tabs";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { FormField, FormFieldInput, FormFieldTextarea } from "@/components/shared/FormField";
import { TreeSelect } from "@/components/elements/TreeSelect";
import { Item, ItemContent, ItemTitle, ItemDescription, ItemActions } from "@/components/elements/Item";
import { Switch } from "@/components/elements/Switch";
import { Button } from "@/components/elements/Button";
import { MediaLibraryModal } from "@/components/media/modals/MediaLibraryModal";
import { mediaService } from "@/components/media/services";
import { formatSlug } from '@/core/slug/generate';

export default function EditCategoryPage() {
  const { id } = useParams<{ id: string }>();
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
    isSubmitting,
  } = useRealEstateTaxonomyForm<PortfolioCategoryFormValues>({
    id,
    isEditMode: true,
    fetchQueryKey: ['portfolio-category', Number(id)],
    fetchQueryFn: () => portfolioApi.getCategoryById(Number(id)),
    createMutationFn: (data) => portfolioApi.createCategory(data), // Not executed in edit mode
    updateMutationFn: (id, data) => portfolioApi.updateCategory(id, data),
    invalidateQueryKeys: [['portfolio-categories'], ['portfolio-category', Number(id)], ['portfolio-categories-all']],
    onSuccessRedirect: "/portfolios/categories",
    itemLabel: "دسته‌بندی",
    schema: portfolioCategoryFormSchema,
    defaultValues: portfolioCategoryFormDefaults,
    titleFieldName: "name",
  });

  const { register, formState: { errors }, watch, setValue } = form;

  const { data: categories } = useQuery({
    queryKey: ['portfolio-categories-all'],
    queryFn: async () => {
      return await portfolioApi.getCategories({ size: 1000 });
    },
    staleTime: 0,
    gcTime: 0,
  });

  const tabs = [
    { value: "account", label: "اطلاعات پایه", icon: FolderTree },
    { value: "media", label: "مدیا", icon: ImageIcon },
    { value: "settings", label: "تنظیمات", icon: Settings },
  ];

  return (
    <>
      <TaxonomyFormLayout
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSubmit={handleSubmit}
        isPending={isPending}
        isSubmitting={isSubmitting}
        isEditMode={true}
        formId="portfolio-category-form"
        itemLabel="دسته‌بندی"
        tabs={tabs}
      >
        <TabsContent value="account">
          <div className="space-y-6">
            <CardWithIcon
              icon={FolderTree}
              title="اطلاعات دسته‌بندی"
              iconBgColor="bg-purple"
              iconColor="stroke-purple-2"
              borderColor="border-b-purple-1"
              className="hover:shadow-lg transition-all duration-300"
            >
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormFieldInput
                    label="نام"
                    id="name"
                    required
                    error={errors.name?.message}
                    placeholder="نام دسته‌بندی"
                    {...register("name")}
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
                        setValue("slug", formattedSlug as any, { shouldValidate: true });
                      }
                    })}
                  />
                </div>

                <FormField
                  label="دسته‌بندی والد"
                  htmlFor="parent_id"
                  description="دسته‌بندی‌های بدون والد، دسته‌بندی‌های مادر هستند."
                  error={errors.parent_id?.message}
                >
                  <TreeSelect
                    data={categories?.data?.filter(cat => cat.id !== Number(id)) || []}
                    value={watch("parent_id") || null}
                    onChange={(value) => setValue("parent_id", value ? parseInt(value) : null)}
                    placeholder="انتخاب دسته‌بندی والد (اختیاری)"
                    searchPlaceholder="جستجوی دسته‌بندی..."
                    emptyText="دسته‌بندی یافت نشد"
                  />
                </FormField>

                <FormFieldTextarea
                  label="توضیحات"
                  id="description"
                  error={errors.description?.message}
                  placeholder="توضیحات دسته‌بندی"
                  rows={4}
                  {...register("description")}
                />
              </div>
            </CardWithIcon>
          </div>
        </TabsContent>

        <TabsContent value="media">
          <div className="space-y-6">
            <CardWithIcon
              icon={ImageIcon}
              title="تصویر شاخص"
              iconBgColor="bg-blue"
              iconColor="stroke-blue-2"
              borderColor="border-b-blue-1"
              className="hover:shadow-lg transition-all duration-300"
            >
              {selectedMedia ? (
                <div className="relative w-full aspect-video overflow-hidden group border">
                  <img
                    src={mediaService.getMediaUrlFromObject(selectedMedia)}
                    alt={selectedMedia.alt_text || "تصویر شاخص"}
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
                  <p className="mt-4 text-lg font-semibold">انتخاب تصویر شاخص</p>
                  <p className="mt-1 text-sm text-font-s text-center">
                    برای انتخاب از کتابخانه کلیک کنید
                  </p>
                </div>
              )}
            </CardWithIcon>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <div className="space-y-6">
            <CardWithIcon
              icon={Settings}
              title="تنظیمات"
              iconBgColor="bg-blue"
              iconColor="stroke-blue-2"
              borderColor="border-b-blue-1"
              className="hover:shadow-lg transition-all duration-300"
            >
              <div className="space-y-4">
                <div className="border border-green-1/40 bg-green-0/30 hover:border-green-1/60 transition-colors overflow-hidden">
                  <Item variant="default" size="default" className="py-5">
                    <ItemContent>
                      <ItemTitle className="text-green-2">وضعیت فعال</ItemTitle>
                      <ItemDescription>
                        با غیرفعال شدن، دسته‌بندی از لیست مدیریت نیز مخفی می‌شود.
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

                <div className="border border-blue-1/40 bg-blue-0/30 hover:border-blue-1/60 transition-colors overflow-hidden">
                  <Item variant="default" size="default" className="py-5">
                    <ItemContent>
                      <ItemTitle className="text-blue-2">نمایش عمومی</ItemTitle>
                      <ItemDescription>
                        اگر غیرفعال باشد دسته‌بندی در سایت نمایش داده نمی‌شود.
                      </ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      <Switch
                        checked={watch("is_public")}
                        onCheckedChange={(checked) => setValue("is_public", checked)}
                      />
                    </ItemActions>
                  </Item>
                </div>
              </div>
            </CardWithIcon>
          </div>
        </TabsContent>
      </TaxonomyFormLayout>

      <MediaLibraryModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onSelect={handleImageSelect}
        selectMultiple={false}
        initialFileType="image"
        showTabs={true}
        context="portfolio"
      />
    </>
  );
}
