import { FileText, Settings, Tag } from "lucide-react";
import { useParams } from "react-router-dom";
import { realEstateApi } from "@/api/real-estate";
import { useTaxonomyForm } from "@/components/real-estate/hooks/useTaxonomyForm";
import { TaxonomyFormLayout } from "@/components/real-estate/layouts/TaxonomyFormLayout";
import { propertyLabelFormSchema, propertyLabelFormDefaults } from '@/components/real-estate/validations/labelSchema';
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { FormFieldInput } from "@/components/forms/FormField";
import { formatSlug } from '@/core/slug/generate';
import { TabsContent } from "@/components/elements/Tabs";
import { Item, ItemContent, ItemTitle, ItemDescription, ItemActions } from "@/components/elements/Item";
import { Switch } from "@/components/elements/Switch";

export default function EditPropertyLabelPage() {
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
    schema: propertyLabelFormSchema,
    defaultValues: propertyLabelFormDefaults,
    fetchQueryKey: ['property-label', Number(id)],
    fetchQueryFn: () => realEstateApi.getLabelById(Number(id)),
    createMutationFn: (data) => realEstateApi.createLabel(data),
    updateMutationFn: (id, data) => realEstateApi.partialUpdateLabel(id, data),
    invalidateQueryKeys: [['property-labels'], ['property-label', Number(id)]],
    onSuccessRedirect: "/real-estate/labels",
    itemLabel: "برچسب ملک",
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
      itemLabel="برچسب ملک"
      formId="label-edit-form"
    >
      <TabsContent value="account">
        <CardWithIcon
          icon={Tag}
          title="اطلاعات برچسب ملک"
          iconBgColor="bg-orange"
          iconColor="stroke-orange-2"
          borderColor="border-b-orange-1"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormFieldInput
                label="عنوان"
                id="title"
                required
                error={errors.title?.message}
                placeholder="عنوان برچسب ملک"
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
          </div>
        </CardWithIcon>
      </TabsContent>

      <TabsContent value="settings">
        <CardWithIcon
          icon={Settings}
          title="تنظیمات"
          iconBgColor="bg-orange"
          iconColor="stroke-orange-2"
          borderColor="border-b-orange-1"
        >
          <div className="space-y-6">
            <div className="mt-6 space-y-4">
              <div className="border border-green-1/40 bg-green-0/30 hover:border-green-1/60 transition-colors overflow-hidden">
                <Item variant="default" size="default" className="py-5">
                  <ItemContent>
                    <ItemTitle className="text-green-2">وضعیت فعال</ItemTitle>
                    <ItemDescription>
                      با غیرفعال شدن، برچسب ملک از لیست مدیریت نیز مخفی می‌شود.
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
    </TaxonomyFormLayout>
  );
}
