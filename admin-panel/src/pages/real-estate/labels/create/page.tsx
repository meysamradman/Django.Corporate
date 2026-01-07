import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Button } from "@/components/elements/Button";
import { FormFieldInput } from "@/components/forms/FormField";
import { Switch } from "@/components/elements/Switch";
import { Item, ItemContent, ItemTitle, ItemDescription, ItemActions } from "@/components/elements/Item";
import { showError, showSuccess, extractFieldErrors, hasFieldErrors } from "@/core/toast";
import { msg } from "@/core/messages";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { realEstateApi } from "@/api/real-estate";
import type { PropertyLabel } from "@/types/real_estate/label/realEstateLabel";
import { generateSlug, formatSlug } from '@/core/slug/generate';
import { Tag, Loader2, Save } from "lucide-react";
import { propertyLabelFormSchema, propertyLabelFormDefaults, type PropertyLabelFormValues } from '@/components/real-estate/validations/labelSchema';

export default function CreatePropertyLabelPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const form = useForm<PropertyLabelFormValues>({
    resolver: zodResolver(propertyLabelFormSchema) as any,
    defaultValues: propertyLabelFormDefaults as any,
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

  const createLabelMutation = useMutation({
    mutationFn: (data: Partial<PropertyLabel>) => realEstateApi.createLabel(data),
    onSuccess: () => {
      // ✅ از msg.crud استفاده کنید
      showSuccess(msg.crud("created", { item: "برچسب ملک" }));
      queryClient.invalidateQueries({ queryKey: ['property-labels'] });
      navigate("/real-estate/labels");
    },
    onError: (error: any) => {
      // ✅ Field Errors → Inline + Toast کلی
      if (hasFieldErrors(error)) {
        const fieldErrors = extractFieldErrors(error);
        
        Object.entries(fieldErrors).forEach(([field, message]) => {
          form.setError(field as keyof PropertyLabelFormValues, {
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
    createLabelMutation.mutate(data);
  });

  return (
    <div className="space-y-6 pb-28 relative">

      <form id="label-create-form" onSubmit={handleSubmit} noValidate>
        <CardWithIcon
          icon={Tag}
          title="اطلاعات برچسب ملک"
          iconBgColor="bg-orange"
          iconColor="stroke-orange-2"
          borderColor="border-b-orange-1"
          className="hover:shadow-lg transition-all duration-300"
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
      </form>

      <div className="fixed bottom-0 left-0 right-0 lg:right-[20rem] z-50 border-t border-br bg-card shadow-lg transition-all duration-300 flex items-center justify-end gap-3 py-4 px-8">
        <Button
          type="submit"
          form="label-create-form"
          size="lg"
          disabled={createLabelMutation.isPending || isSubmitting}
        >
          {createLabelMutation.isPending || isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              در حال ایجاد...
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              ایجاد برچسب ملک
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

