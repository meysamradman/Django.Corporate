import { useParams } from "react-router-dom";
import { Settings, FileText } from "lucide-react";
import { TaxonomyFormLayout } from "@/components/real-estate/layouts/TaxonomyFormLayout";
import { useTaxonomyForm } from "@/components/real-estate/hooks/useTaxonomyForm";
import { portfolioApi } from "@/api/portfolios/portfolios";
import { portfolioOptionFormSchema, portfolioOptionFormDefaults, type PortfolioOptionFormValues } from "@/components/portfolios/validations/optionSchema";
import { TabsContent } from "@/components/elements/Tabs";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { FormFieldInput, FormFieldTextarea } from "@/components/forms/FormField";
import { Item, ItemContent, ItemTitle, ItemDescription, ItemActions } from "@/components/elements/Item";
import { Switch } from "@/components/elements/Switch";
import { formatSlug } from '@/core/slug/generate';

export default function EditOptionPage() {
  const { id } = useParams<{ id: string }>();

  const {
    form,
    activeTab,
    setActiveTab,
    handleSubmit,
    isPending,
    isSubmitting,
  } = useTaxonomyForm<PortfolioOptionFormValues>({
    id,
    isEditMode: true,
    fetchQueryKey: ['portfolio-option', Number(id)],
    fetchQueryFn: () => portfolioApi.getOptionById(Number(id)),
    createMutationFn: (data) => portfolioApi.createOption(data),
    updateMutationFn: (id, data) => portfolioApi.updateOption(id, data),
    invalidateQueryKeys: [['portfolio-options'], ['portfolio-option', Number(id)]],
    onSuccessRedirect: "/portfolios/options",
    itemLabel: "گزینه",
    schema: portfolioOptionFormSchema,
    defaultValues: portfolioOptionFormDefaults,
    titleFieldName: "name",
  });

  const { register, formState: { errors }, setValue, watch } = form;

  const tabs = [
    { value: "account", label: "اطلاعات پایه", icon: FileText },
    { value: "settings", label: "تنظیمات", icon: Settings },
  ];

  return (
    <TaxonomyFormLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onSubmit={handleSubmit}
      isPending={isPending}
      isSubmitting={isSubmitting}
      isEditMode={true}
      formId="portfolio-option-form"
      itemLabel="گزینه"
      tabs={tabs}
    >
      <TabsContent value="account">
        <div className="space-y-6">
          <CardWithIcon
            icon={Settings}
            title="اطلاعات گزینه"
            iconBgColor="bg-teal"
            iconColor="stroke-teal-2"
            borderColor="border-b-teal-1"
            className="hover:shadow-lg transition-all duration-300"
          >
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormFieldInput
                  label="نام"
                  id="name"
                  required
                  error={errors.name?.message}
                  placeholder="نام گزینه"
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

              <FormFieldTextarea
                label="توضیحات"
                id="description"
                error={errors.description?.message}
                placeholder="توضیحات گزینه"
                rows={4}
                {...register("description")}
              />
            </div>
          </CardWithIcon>
        </div>
      </TabsContent>

      <TabsContent value="settings">
        <div className="space-y-6">
          <CardWithIcon
            icon={Settings}
            title="تنظیمات"
            iconBgColor="bg-teal"
            iconColor="stroke-teal-2"
            borderColor="border-b-teal-1"
            className="hover:shadow-lg transition-all duration-300"
          >
            <div className="space-y-4">
              <div className="border border-green-1/40 bg-green-0/30 hover:border-green-1/60 transition-colors overflow-hidden">
                <Item variant="default" size="default" className="py-5">
                  <ItemContent>
                    <ItemTitle className="text-green-2">وضعیت فعال</ItemTitle>
                    <ItemDescription>
                      با غیرفعال شدن، گزینه از لیست مدیریت نیز مخفی می‌شود.
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
                      اگر غیرفعال باشد گزینه در سایت نمایش داده نمی‌شود.
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
  );
}
