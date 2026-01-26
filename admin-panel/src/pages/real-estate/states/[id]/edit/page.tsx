import { FileText, Settings } from "lucide-react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { realEstateApi } from "@/api/real-estate";
import { useRealEstateTaxonomyForm } from "@/components/real-estate/hooks/useRealEstateTaxonomyForm.ts";
import { TaxonomyFormLayout } from "@/components/real-estate/layouts/TaxonomyFormLayout.tsx";
import { propertyStateFormSchema, propertyStateFormDefaults } from "@/components/real-estate/validations/stateSchema";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { FormFieldInput, FormField } from "@/components/shared/FormField";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
import { formatSlug } from '@/core/slug/generate';
import { TabsContent } from "@/components/elements/Tabs";
import { Item, ItemContent, ItemTitle, ItemDescription, ItemActions } from "@/components/elements/Item";
import { Switch } from "@/components/elements/Switch";

export default function EditPropertyStatePage() {
  const { id } = useParams<{ id: string }>();

  const {
    form,
    activeTab,
    setActiveTab,
    handleSubmit,
    isLoading,
    isPending,
  } = useRealEstateTaxonomyForm({
    id,
    isEditMode: true,
    schema: propertyStateFormSchema,
    defaultValues: propertyStateFormDefaults,
    fetchQueryKey: ['property-state', Number(id)],
    fetchQueryFn: () => realEstateApi.getStateById(Number(id)),
    createMutationFn: (data) => realEstateApi.createState(data),
    updateMutationFn: (id, data) => realEstateApi.partialUpdateState(id, data),
    invalidateQueryKeys: [['property-states'], ['property-state', Number(id)]],
    onSuccessRedirect: "/real-estate/states",
    itemLabel: "وضعیت ملک",
  });

  const { register, formState: { errors, isSubmitting }, watch, setValue } = form;

  const { data: fieldOptions } = useQuery({
    queryKey: ['property-state-field-options'],
    queryFn: () => realEstateApi.getStateFieldOptions(),
  });

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
      itemLabel="وضعیت ملک"
      formId="state-edit-form"
    >
      <TabsContent value="account">
        <CardWithIcon
          icon={FileText}
          title="اطلاعات وضعیت ملک"
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
                placeholder="عنوان وضعیت ملک"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="نوع کاربری (سیستمی)"
                htmlFor="usage_type"
                required
                error={errors.usage_type?.message}
              >
                <Select
                  value={watch("usage_type") || "sale"}
                  onValueChange={(value) => setValue("usage_type", value)}
                >
                  <SelectTrigger id="usage_type">
                    <SelectValue placeholder="انتخاب نوع کاربری" />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldOptions?.usage_type.map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>
          </div>
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
            <div className="mt-6 space-y-4">
              <div className="border border-green-1/40 bg-green-0/30 hover:border-green-1/60 transition-colors overflow-hidden">
                <Item variant="default" size="default" className="py-5">
                  <ItemContent>
                    <ItemTitle className="text-green-2">وضعیت فعال</ItemTitle>
                    <ItemDescription>
                      با غیرفعال شدن، وضعیت ملک از لیست مدیریت نیز مخفی می‌شود.
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
