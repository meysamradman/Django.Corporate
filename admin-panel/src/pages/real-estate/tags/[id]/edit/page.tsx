import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Button } from "@/components/elements/Button";
import { FormFieldInput, FormFieldTextarea } from "@/components/forms/FormField";
import { Switch } from "@/components/elements/Switch";
import { Item, ItemContent, ItemTitle, ItemDescription, ItemActions } from "@/components/elements/Item";
import { showError, showSuccess, showInfo, extractFieldErrors, hasFieldErrors } from "@/core/toast";
import { msg } from "@/core/messages";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { realEstateApi } from "@/api/real-estate";
import type { PropertyTag } from "@/types/real_estate/tags/realEstateTag";
import { generateSlug, formatSlug } from '@/core/slug/generate';
import { Hash, Loader2, Save, Settings, FileText } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/elements/Tabs";
import { Skeleton } from "@/components/elements/Skeleton";
import { propertyTagFormSchema, propertyTagFormDefaults, type PropertyTagFormValues } from '@/components/real-estate/validations/tagSchema';

export default function EditPropertyTagPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const tagId = Number(id);
  const [activeTab, setActiveTab] = useState<string>("account");

  const form = useForm<PropertyTagFormValues>({
    resolver: zodResolver(propertyTagFormSchema),
    defaultValues: propertyTagFormDefaults,
    mode: "onSubmit",
  });

  const { register, formState: { errors, isSubmitting }, watch, setValue } = form;
  const titleValue = watch("title");

  // Auto-generate slug from title
  useEffect(() => {
    if (titleValue) {
      const generatedSlug = generateSlug(titleValue);
      setValue("slug", generatedSlug, { shouldValidate: false });
    }
  }, [titleValue, setValue]);

  const { data: tag, isLoading, error } = useQuery({
    queryKey: ['property-tag', tagId],
    queryFn: () => realEstateApi.getTagById(tagId),
    enabled: !!tagId,
  });

  // Reset form with tag data
  useEffect(() => {
    if (tag) {
      form.reset({
        title: tag.title || "",
        slug: tag.slug || "",
        description: tag.description || "",
        is_active: tag.is_active ?? true,
        is_public: tag.is_public ?? true,
      });
    }
  }, [tag, form]);

  const updateTagMutation = useMutation({
    mutationFn: (data: Partial<PropertyTag>) => realEstateApi.partialUpdateTag(tagId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-tag', tagId] });
      queryClient.invalidateQueries({ queryKey: ['property-tags'] });
      // ✅ از msg.crud استفاده کنید
      showSuccess(msg.crud("updated", { item: "تگ ملک" }));
      navigate("/real-estate/tags");
    },
    onError: (error: any) => {
      // ✅ Field Errors → Inline + Toast کلی
      if (hasFieldErrors(error)) {
        const fieldErrors = extractFieldErrors(error);
        
        Object.entries(fieldErrors).forEach(([field, message]) => {
          form.setError(field as keyof PropertyTagFormValues, {
            type: 'server',
            message: message as string
          });
        });
        
        // Toast کلی برای راهنمایی کاربر
        showError(error, { customMessage: "لطفاً خطاهای فرم را بررسی کنید" });
      } 
      // ✅ General Errors → فقط Toast
      else {
        // showError خودش تصمیم می‌گیرد (بک‌اند یا frontend)
        showError(error);
      }
    },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    if (!tag) return;
    
    // ✅ حفظ منطق: فقط فیلدهایی که تغییر کرده‌اند را ارسال کن
    const submitData: Partial<PropertyTag> = {};
    
    if (data.title !== tag.title) {
      submitData.title = data.title;
    }
    
    if (data.slug !== tag.slug) {
      submitData.slug = data.slug;
    }
    
    if (data.description !== (tag.description || "")) {
      submitData.description = data.description || "";
    }
    
    if (data.is_active !== (tag.is_active ?? true)) {
      submitData.is_active = data.is_active;
    }
    
    if (data.is_public !== (tag.is_public ?? true)) {
      submitData.is_public = data.is_public;
    }
    
    if (Object.keys(submitData).length === 0) {
      showInfo("تغییری اعمال نشده است");
      return;
    }
    
    updateTagMutation.mutate(submitData);
  });

  if (isLoading) {
    return (
      <div className="space-y-6 pb-28 relative">

        <CardWithIcon
          icon={Hash}
          title="اطلاعات تگ ملک"
          iconBgColor="bg-blue"
          iconColor="stroke-blue-2"
          borderColor="border-b-blue-1"
        >
          <div className="space-y-6">
            <Skeleton className="h-10 w-full" />
          </div>
        </CardWithIcon>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-1 mb-4">خطا در بارگذاری داده‌ها</p>
        <Button 
          onClick={() => navigate(-1)} 
          className="mt-4"
        >
          بازگشت
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-28 relative">
      <form id="tag-edit-form" onSubmit={handleSubmit} noValidate>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="account">
              <FileText className="h-4 w-4" />
              اطلاعات پایه
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4" />
              تنظیمات
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account">
            <div className="space-y-6">
              <CardWithIcon
                icon={Hash}
                title="اطلاعات تگ ملک"
                iconBgColor="bg-indigo"
                iconColor="stroke-indigo-2"
                borderColor="border-b-indigo-1"
                className="hover:shadow-lg transition-all duration-300"
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
                    placeholder="توضیحات تگ ملک (اختیاری)"
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
            </div>
          </TabsContent>
        </Tabs>
      </form>

      <div className="fixed bottom-0 left-0 right-0 lg:right-[20rem] z-50 border-t border-br bg-card shadow-lg transition-all duration-300 flex items-center justify-end gap-3 py-4 px-8">
        <Button
          type="submit"
          form="tag-edit-form"
          size="lg"
          disabled={updateTagMutation.isPending || isSubmitting}
        >
          {updateTagMutation.isPending || isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              در حال به‌روزرسانی...
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              به‌روزرسانی تگ ملک
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
