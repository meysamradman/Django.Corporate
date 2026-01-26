import { TaxonomyFormLayout } from "@/components/real-estate/layouts/TaxonomyFormLayout.tsx";
import { useRealEstateTaxonomyForm } from "@/components/real-estate/hooks/useRealEstateTaxonomyForm.ts";
import { blogApi } from "@/api/blogs/blogs";
import { blogTagFormSchema, blogTagFormDefaults, type BlogTagFormValues } from '@/components/blogs/validations/tagSchema';
import { Tag, Settings, FileText } from "lucide-react";
import { TabsContent } from "@/components/elements/Tabs";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { FormFieldInput, FormFieldTextarea } from "@/components/shared/FormField";
import { Item, ItemContent, ItemTitle, ItemDescription, ItemActions } from "@/components/elements/Item";
import { Switch } from "@/components/elements/Switch";
import { formatSlug } from '@/core/slug/generate';

export default function CreateTagPage() {
  const {
    form,
    activeTab,
    setActiveTab,
    handleSubmit,
    isPending,
  } = useRealEstateTaxonomyForm<BlogTagFormValues>({
    isEditMode: false,
    itemLabel: "تگ",
    schema: blogTagFormSchema,
    defaultValues: blogTagFormDefaults,
    createMutationFn: (data) => blogApi.createTag(data),
    updateMutationFn: async () => { },
    invalidateQueryKeys: [['blog-tags-all']],
    onSuccessRedirect: "/blogs/tags",
    titleFieldName: "name",
  });

  const { register, formState: { errors, isSubmitting }, watch, setValue } = form;

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
      isEditMode={false}
      formId="tag-form"
      itemLabel="تگ"
      tabs={tabs}
    >
      <TabsContent value="account">
        <div className="space-y-6">
          <CardWithIcon
            icon={Tag}
            title="اطلاعات تگ"
            iconBgColor="bg-indigo"
            iconColor="stroke-indigo-2"
            borderColor="border-b-indigo-1"
            className="hover:shadow-lg transition-all duration-300"
          >
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormFieldInput
                  label="نام"
                  id="name"
                  required
                  error={errors.name?.message}
                  placeholder="نام تگ"
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
                      setValue("slug", formattedSlug, { shouldValidate: true });
                    }
                  })}
                />
              </div>

              <FormFieldTextarea
                label="توضیحات"
                id="description"
                error={errors.description?.message}
                placeholder="توضیحات تگ"
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
            iconBgColor="bg-indigo"
            iconColor="stroke-indigo-2"
            borderColor="border-b-indigo-1"
            className="hover:shadow-lg transition-all duration-300"
          >
            <div className="space-y-4">
              <div className="border border-green-1/40 bg-green-0/30 hover:border-green-1/60 transition-colors overflow-hidden">
                <Item variant="default" size="default" className="py-5">
                  <ItemContent>
                    <ItemTitle className="text-green-2">وضعیت فعال</ItemTitle>
                    <ItemDescription>
                      با غیرفعال شدن، تگ از لیست مدیریت نیز مخفی می‌شود.
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
          </CardWithIcon>
        </div>
      </TabsContent>
    </TaxonomyFormLayout>
  );
}