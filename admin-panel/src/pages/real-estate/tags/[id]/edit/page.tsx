import { FileText, Hash, Settings } from "lucide-react";
import { useParams } from "react-router-dom";
import { realEstateApi } from "@/api/real-estate";
import { useTaxonomyForm } from "@/components/real-estate/hooks/useTaxonomyForm";
import { TaxonomyFormLayout } from "@/components/real-estate/layouts/TaxonomyFormLayout";
import { propertyTagFormSchema, propertyTagFormDefaults } from '@/components/real-estate/validations/tagSchema';
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { FormFieldInput, FormFieldTextarea } from "@/components/forms/FormField";
import { formatSlug } from '@/core/slug/generate';
import { TabsContent } from "@/components/elements/Tabs";
import { Item, ItemContent, ItemTitle, ItemDescription, ItemActions } from "@/components/elements/Item";
import { Switch } from "@/components/elements/Switch";

export default function EditPropertyTagPage() {
  const { id } = useParams<{ id: string }>();

  const {
    form,
    activeTab,
    setActiveTab,
    handleSubmit,
    isLoading,
    isPending,
  } = useTaxonomyForm({
    id,
    isEditMode: true,
    schema: propertyTagFormSchema,
    defaultValues: propertyTagFormDefaults,
    fetchQueryKey: ['property-tag', Number(id)],
    fetchQueryFn: () => realEstateApi.getTagById(Number(id)),
    createMutationFn: (data) => realEstateApi.createTag(data),
    updateMutationFn: (id, data) => realEstateApi.partialUpdateTag(id, data),
    invalidateQueryKeys: [['property-tags'], ['property-tag', Number(id)]],
    onSuccessRedirect: "/real-estate/tags",
    itemLabel: "تگ ملک",
  });

  const { register, formState: { errors, isSubmitting }, watch, setValue } = form;

  const tabs = [
    { value: "account", label: "اطلاعات پایه", icon: FileText },
    { value: "settings", label: "تنظیمات", icon: Settings },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6 pb-28 relative">
        <div className="h-40 w-full bg-card animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <TaxonomyFormLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onSubmit={handleSubmit}
      isPending={isPending}
      isSubmitting={isSubmitting}
      isEditMode={true}
      tabs={tabs}
      itemLabel="تگ ملک"
      formId="tag-edit-form"
    >
      <TabsContent value="account">
        <CardWithIcon
          icon={Hash}
          title="اطلاعات تگ ملک"
          iconBgColor="bg-indigo"
          iconColor="stroke-indigo-2"
          borderColor="border-b-indigo-1"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormFieldInput
                label="عنوان"
                id="title"
                required
                error={errors.title?.message}
                placeholder="عنوان تگ ملک"
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

            <FormFieldTextarea
              label="توضیحات"
              id="description"
              error={errors.description?.message}
              placeholder="توضیحات تگ ملک"
              rows={4}
              {...register("description")}
            />
          </div>
        </CardWithIcon>
      </TabsContent>

      <TabsContent value="settings">
        <CardWithIcon
          icon={Settings}
          title="تنظیمات"
          iconBgColor="bg-indigo"
          iconColor="stroke-indigo-2"
          borderColor="border-b-indigo-1"
        >
          <div className="space-y-6">
            <div className="mt-6 space-y-4">
              <div className="border border-green-1/40 bg-green-0/30 hover:border-green-1/60 transition-colors overflow-hidden">
                <Item variant="default" size="default" className="py-5">
                  <ItemContent>
                    <ItemTitle className="text-green-2">وضعیت فعال</ItemTitle>
                    <ItemDescription>
                      با غیرفعال شدن، تگ ملک از لیست مدیریت نیز مخفی می‌شود.
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
                      اگر غیرفعال باشد تگ در سایت نمایش داده نمی‌شود.
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
          </div>
        </CardWithIcon>
      </TabsContent>
    </TaxonomyFormLayout>
  );
}
