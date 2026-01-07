import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Button } from "@/components/elements/Button";
import { FormFieldInput, FormField } from "@/components/forms/FormField";
import { Switch } from "@/components/elements/Switch";
import { Item, ItemContent, ItemTitle, ItemDescription, ItemActions } from "@/components/elements/Item";
import { showError, showSuccess, extractFieldErrors, hasFieldErrors } from "@/core/toast";
import { msg } from "@/core/messages";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { realEstateApi } from "@/api/real-estate";
import type { PropertyState } from "@/types/real_estate/state/realEstateState";
import { generateSlug, formatSlug } from '@/core/slug/generate';
import { propertyStateFormSchema, propertyStateFormDefaults, type PropertyStateFormValues } from "@/components/real-estate/validations/stateSchema";
import { FileText, Loader2, Save, Settings } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/elements/Tabs";

export default function CreatePropertyStatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("account");

  const form = useForm<PropertyStateFormValues>({
    resolver: zodResolver(propertyStateFormSchema),
    defaultValues: propertyStateFormDefaults,
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

  const { data: fieldOptions } = useQuery({
    queryKey: ['property-state-field-options'],
    queryFn: () => realEstateApi.getStateFieldOptions(),
  });

  const createStateMutation = useMutation({
    mutationFn: (data: Partial<PropertyState>) => realEstateApi.createState(data),
    onSuccess: () => {
      // ✅ از msg.crud استفاده کنید
      showSuccess(msg.crud("created", { item: "وضعیت ملک" }));
      queryClient.invalidateQueries({ queryKey: ['property-states'] });
      navigate("/real-estate/states");
    },
    onError: (error: any) => {
      // ✅ Field Errors → Inline + Toast کلی
      if (hasFieldErrors(error)) {
        const fieldErrors = extractFieldErrors(error);
        
        Object.entries(fieldErrors).forEach(([field, message]) => {
          form.setError(field as keyof PropertyStateFormValues, {
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
    createStateMutation.mutate(data);
  });

  return (
    <div className="space-y-6 pb-28 relative">
      <form id="state-create-form" onSubmit={handleSubmit} noValidate>
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
                icon={FileText}
                title="اطلاعات وضعیت ملک"
                iconBgColor="bg-purple"
                iconColor="stroke-purple-2"
                borderColor="border-b-purple-1"
                className="hover:shadow-lg transition-all duration-300"
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
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="space-y-6">
              <CardWithIcon
                icon={Settings}
                title="تنظیمات"
                iconBgColor="bg-purple"
                iconColor="stroke-purple-2"
                borderColor="border-b-purple-1"
                className="hover:shadow-lg transition-all duration-300"
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
            </div>
          </TabsContent>
        </Tabs>
      </form>

      <div className="fixed bottom-0 left-0 right-0 lg:right-[20rem] z-50 border-t border-br bg-card shadow-lg transition-all duration-300 flex items-center justify-end gap-3 py-4 px-8">
        <Button
          type="submit"
          form="state-create-form"
          size="lg"
          disabled={createStateMutation.isPending || isSubmitting}
        >
          {createStateMutation.isPending || isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              در حال ایجاد...
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              ایجاد وضعیت ملک
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

