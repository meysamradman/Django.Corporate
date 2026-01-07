import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/elements/Button";
import { FormFieldInput, FormFieldTextarea } from "@/components/forms/FormField";
import { Switch } from "@/components/elements/Switch";
import { Item, ItemContent, ItemTitle, ItemDescription, ItemActions } from "@/components/elements/Item";
import { showError, showSuccess, extractFieldErrors, hasFieldErrors } from "@/core/toast";
import { msg } from "@/core/messages";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { portfolioApi } from "@/api/portfolios/portfolios";
import type { PortfolioOption } from "@/types/portfolio/options/portfolioOption";
import { generateSlug, formatSlug } from '@/core/slug/generate';
import { portfolioOptionFormSchema, portfolioOptionFormDefaults, type PortfolioOptionFormValues } from '@/components/portfolios/validations/optionSchema';
import { Loader2, Save, List, Settings, FileText } from "lucide-react";
import { Skeleton } from "@/components/elements/Skeleton";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/elements/Tabs";

export default function EditOptionPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const optionId = Number(id);
  const [activeTab, setActiveTab] = useState<string>("account");

  const form = useForm<PortfolioOptionFormValues>({
    resolver: zodResolver(portfolioOptionFormSchema),
    defaultValues: portfolioOptionFormDefaults,
    mode: "onSubmit",
  });

  const { register, formState: { errors, isSubmitting }, watch, setValue } = form;
  const nameValue = watch("name");

  // Auto-generate slug from name
  useEffect(() => {
    if (nameValue) {
      const generatedSlug = generateSlug(nameValue);
      setValue("slug", generatedSlug, { shouldValidate: false });
    }
  }, [nameValue, setValue]);

  const { data: option, isLoading, error } = useQuery({
    queryKey: ['option', optionId],
    queryFn: () => portfolioApi.getOptionById(optionId),
    enabled: !!optionId,
  });

  // Reset form with option data
  useEffect(() => {
    if (option) {
      form.reset({
        name: option.name || "",
        slug: option.slug || "",
        is_active: option.is_active ?? true,
        is_public: option.is_public ?? true,
        description: option.description || "",
      });
    }
  }, [option, form]);

  const updateOptionMutation = useMutation({
    mutationFn: (data: Partial<PortfolioOption>) => portfolioApi.updateOption(optionId, data),
    onSuccess: (_data) => {
      // ✅ از msg.crud استفاده کنید
      showSuccess(msg.crud("updated", { item: "گزینه نمونه‌کار" }));
      queryClient.invalidateQueries({ queryKey: ['option', optionId] });
      navigate("/portfolios/options");
    },
    onError: (error: any) => {
      // ✅ Field Errors → Inline + Toast کلی
      if (hasFieldErrors(error)) {
        const fieldErrors = extractFieldErrors(error);
        
        Object.entries(fieldErrors).forEach(([field, message]) => {
          form.setError(field as keyof PortfolioOptionFormValues, {
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
    updateOptionMutation.mutate(data);
  });

  if (isLoading) {
    return (
      <div className="space-y-6 pb-28 relative">
        <div className="flex items-center justify-between">
          <h1 className="page-title">ویرایش گزینه</h1>
          <Button 
            variant="outline"
            onClick={() => navigate("/portfolios/options")}
          >
            <List className="h-4 w-4" />
            نمایش لیست
          </Button>
        </div>

        <CardWithIcon
          icon={Settings}
          title="اطلاعات گزینه"
          iconBgColor="bg-teal"
          iconColor="stroke-teal-2"
          borderColor="border-b-teal-1"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-20 w-full" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-10" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
        </CardWithIcon>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="page-title">ویرایش گزینه</h1>
        </div>
        <div className="text-center py-8">
          <p className="text-red-1 mb-4">خطا در بارگذاری داده‌ها</p>
          <Button 
            onClick={() => navigate(-1)} 
            className="mt-4"
          >
            بازگشت
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-28 relative">
      <div className="flex items-center justify-between">
        <h1 className="page-title">ویرایش گزینه</h1>
        <Button 
          variant="outline"
          onClick={() => navigate("/portfolios/options")}
        >
          <List className="h-4 w-4" />
          نمایش لیست
        </Button>
      </div>

      <form id="option-edit-form" onSubmit={handleSubmit} noValidate>
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
                          setValue("slug", formattedSlug);
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
        </Tabs>
      </form>

      <div className="fixed bottom-0 left-0 right-0 lg:right-[20rem] z-50 border-t border-br bg-card shadow-lg transition-all duration-300 flex items-center justify-end gap-3 py-4 px-8">
        <Button
          type="submit"
          form="option-edit-form"
          size="lg"
          disabled={updateOptionMutation.isPending || isSubmitting}
        >
          {updateOptionMutation.isPending || isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              در حال به‌روزرسانی...
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              به‌روزرسانی گزینه
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
