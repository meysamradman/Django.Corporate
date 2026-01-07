import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Button } from "@/components/elements/Button";
import { FormFieldInput, FormFieldTextarea } from "@/components/forms/FormField";
import { Switch } from "@/components/elements/Switch";
import { Item, ItemContent, ItemTitle, ItemDescription, ItemActions } from "@/components/elements/Item";
import { showError, showSuccess, extractFieldErrors, hasFieldErrors } from "@/core/toast";
import { msg } from "@/core/messages";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { blogApi } from "@/api/blogs/blogs";
import type { BlogTag } from "@/types/blog/tags/blogTag";
import { generateSlug, formatSlug } from '@/core/slug/generate';
import { blogTagFormSchema, blogTagFormDefaults, type BlogTagFormValues } from '@/components/blogs/validations/tagSchema';
import { Loader2, Save, Tag } from "lucide-react";
import { Skeleton } from "@/components/elements/Skeleton";

export default function EditTagPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const tagId = Number(id);

  const form = useForm<BlogTagFormValues>({
    resolver: zodResolver(blogTagFormSchema) as any,
    defaultValues: blogTagFormDefaults as any,
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

  const { data: tag, isLoading, error } = useQuery({
    queryKey: ['blog-tag', tagId],
    queryFn: () => blogApi.getTagById(tagId),
    enabled: !!tagId,
  });

  // Reset form with tag data
  useEffect(() => {
    if (tag) {
      form.reset({
        name: tag.name || "",
        slug: tag.slug || "",
        is_active: tag.is_active ?? true,
        is_public: tag.is_public ?? true,
        description: tag.description || "",
      });
    }
  }, [tag, form]);

  const updateTagMutation = useMutation({
    mutationFn: (data: Partial<BlogTag>) => blogApi.updateTag(tagId, data),
    onSuccess: (_data) => {
      queryClient.invalidateQueries({ queryKey: ['blog-tag', tagId] });
      queryClient.invalidateQueries({ queryKey: ['blog-tags'] });
      // ✅ از msg.crud استفاده کنید
      showSuccess(msg.crud("updated", { item: "تگ" }));
      navigate("/blogs/tags");
    },
    onError: (error: any) => {
      // ✅ Field Errors → Inline + Toast کلی
      if (hasFieldErrors(error)) {
        const fieldErrors = extractFieldErrors(error);
        
        Object.entries(fieldErrors).forEach(([field, message]) => {
          form.setError(field as keyof BlogTagFormValues, {
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
    updateTagMutation.mutate(data);
  });

  if (isLoading) {
    return (
      <div className="space-y-6 pb-28 relative">

        <CardWithIcon
          icon={Tag}
          title="اطلاعات تگ"
          iconBgColor="bg-indigo"
          iconColor="stroke-indigo-2"
          borderColor="border-b-indigo-1"
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
                    setValue("slug", formattedSlug);
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

            <div className="mt-6 space-y-4">
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
          </div>
        </CardWithIcon>
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
              به‌روزرسانی تگ
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
