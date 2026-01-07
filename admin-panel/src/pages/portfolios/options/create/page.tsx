import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Button } from "@/components/elements/Button";
import { FormFieldInput, FormFieldTextarea } from "@/components/forms/FormField";
import { Switch } from "@/components/elements/Switch";
import { Item, ItemContent, ItemTitle, ItemDescription, ItemActions } from "@/components/elements/Item";
import { showError, showSuccess, extractFieldErrors, hasFieldErrors } from "@/core/toast";
import { msg } from "@/core/messages";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { portfolioApi } from "@/api/portfolios/portfolios";
import type { PortfolioOption } from "@/types/portfolio/options/portfolioOption";
import { generateSlug, formatSlug } from '@/core/slug/generate';
import { portfolioOptionFormSchema, portfolioOptionFormDefaults, type PortfolioOptionFormValues } from '@/components/portfolios/validations/optionSchema';
import { Settings, Loader2, Save, List, FileText } from "lucide-react";
import { Skeleton } from "@/components/elements/Skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/elements/Tabs";

export default function CreateOptionPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("account");
  const [isInitialLoading, setIsInitialLoading] = useState(true);

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

  const createOptionMutation = useMutation({
    mutationFn: (data: Partial<PortfolioOption>) => portfolioApi.createOption(data),
    onSuccess: () => {
      // ✅ از msg.crud استفاده کنید
      showSuccess(msg.crud("created", { item: "گزینه" }));
      queryClient.invalidateQueries();
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

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = form.handleSubmit(async (data) => {
    createOptionMutation.mutate(data);
  });

  if (isInitialLoading) {
    return (
      <div className="space-y-6 pb-28 relative">

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

  return (
    <div className="space-y-6 pb-28 relative">
      <div className="flex items-center justify-between">
        <h1 className="page-title">ایجاد گزینه جدید</h1>
        <Button 
          variant="outline"
          onClick={() => navigate("/portfolios/options")}
        >
          <List className="h-4 w-4" />
          نمایش لیست
        </Button>
      </div>

      <form id="option-form" onSubmit={handleSubmit} noValidate>
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
          form="option-form"
          size="lg"
          disabled={createOptionMutation.isPending || isSubmitting}
        >
          {createOptionMutation.isPending || isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              در حال ایجاد...
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              ایجاد گزینه
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
