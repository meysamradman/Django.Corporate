import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Button } from "@/components/elements/Button";
import { FormField, FormFieldInput, FormFieldTextarea } from "@/components/forms/FormField";
import { Switch } from "@/components/elements/Switch";
import { Item, ItemContent, ItemTitle, ItemDescription, ItemActions } from "@/components/elements/Item";
import { showError, showSuccess, showInfo, extractFieldErrors, hasFieldErrors } from "@/core/toast";
import { msg } from "@/core/messages";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { portfolioApi } from "@/api/portfolios/portfolios";
import type { PortfolioCategory } from "@/types/portfolio/category/portfolioCategory";
import { TreeSelect } from "@/components/elements/TreeSelect";
import type { Media } from "@/types/shared/media";
import { generateSlug, formatSlug } from '@/core/slug/generate';
import { portfolioCategoryFormSchema, portfolioCategoryFormDefaults, type PortfolioCategoryFormValues } from '@/components/portfolios/validations/categorySchema';
import { MediaLibraryModal } from "@/components/media/modals/MediaLibraryModal";
import { mediaService } from "@/components/media/services";
import { UploadCloud, X, FolderTree, Image as ImageIcon, Loader2, Save } from "lucide-react";
import { Skeleton } from "@/components/elements/Skeleton";

export default function EditCategoryPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const categoryId = Number(id);
  
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  const form = useForm<PortfolioCategoryFormValues>({
    resolver: zodResolver(portfolioCategoryFormSchema) as any,
    defaultValues: portfolioCategoryFormDefaults as any,
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

  const { data: category, isLoading, error } = useQuery({
    queryKey: ['portfolio-category', categoryId],
    queryFn: () => portfolioApi.getCategoryById(categoryId),
    enabled: !!categoryId,
  });

  const { data: categories } = useQuery({
    queryKey: ['portfolio-categories-all'],
    queryFn: async () => {
      return await portfolioApi.getCategories({ size: 1000 });
    },
    staleTime: 0,
    gcTime: 0,
  });

  // Reset form with category data
  useEffect(() => {
    if (category) {
      form.reset({
        name: category.name || "",
        slug: category.slug || "",
        parent_id: category.parent_id || null,
        is_active: category.is_active ?? true,
        is_public: category.is_public ?? true,
        description: category.description || "",
        image_id: category.image?.id || null,
      });
      
      if (category.image) {
        setSelectedMedia(category.image);
      }
    }
  }, [category, form]);

  const updateCategoryMutation = useMutation({
    mutationFn: (data: Partial<PortfolioCategory>) => portfolioApi.partialUpdateCategory(categoryId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-category', categoryId] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-categories'] });
      // ✅ از msg.crud استفاده کنید
      showSuccess(msg.crud("updated", { item: "دسته‌بندی نمونه‌کار" }));
      navigate("/portfolios/categories");
    },
    onError: (error: any) => {
      // ✅ Field Errors → Inline + Toast کلی
      if (hasFieldErrors(error)) {
        const fieldErrors = extractFieldErrors(error);
        
        Object.entries(fieldErrors).forEach(([field, message]) => {
          form.setError(field as keyof PortfolioCategoryFormValues, {
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

  const handleImageSelect = (media: Media | Media[] | null) => {
    const selected = Array.isArray(media) ? media[0] || null : media;
    setSelectedMedia(selected);
    setValue("image_id", selected?.id || null, { shouldValidate: false });
    setIsMediaModalOpen(false);
  };

  const handleRemoveImage = () => {
    setSelectedMedia(null);
    setValue("image_id", null, { shouldValidate: false });
  };

  const handleSubmit = form.handleSubmit(async (data) => {
    if (!category) return;
    
    // ✅ حفظ منطق: فقط فیلدهایی که تغییر کرده‌اند را ارسال کن
    const submitData: Partial<PortfolioCategory> = {};
    
    if (data.name !== category.name) {
      submitData.name = data.name;
    }
    
    if (data.slug !== category.slug) {
      submitData.slug = data.slug;
    }
    
    if (data.parent_id !== (category.parent_id || null)) {
      submitData.parent_id = data.parent_id;
    }
    
    if (data.is_active !== (category.is_active ?? true)) {
      submitData.is_active = data.is_active;
    }
    
    if (data.is_public !== (category.is_public ?? true)) {
      submitData.is_public = data.is_public;
    }
    
    if (data.description !== (category.description || "")) {
      submitData.description = data.description || "";
    }
    
    const currentImageId = category.image?.id || null;
    const newImageId = data.image_id || null;
    if (currentImageId !== newImageId) {
      submitData.image_id = newImageId;
    }
    
    if (Object.keys(submitData).length === 0) {
      showInfo("تغییری اعمال نشده است");
      return;
    }
    
    updateCategoryMutation.mutate(submitData);
  });

  if (isLoading) {
    return (
      <div className="space-y-6 pb-28 relative">

        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-4">
            <CardWithIcon
              icon={FolderTree}
              title="اطلاعات دسته‌بندی"
              iconBgColor="bg-blue"
              iconColor="stroke-blue-2"
              borderColor="border-b-blue-1"
            >
              <div className="space-y-6">
                <Skeleton className="h-32 w-full" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              </div>
            </CardWithIcon>
          </div>

          <div className="lg:col-span-2">
            <div className="w-full space-y-6 sticky top-20 transition-all duration-300 ease-in-out self-start">
              <CardWithIcon
                icon={ImageIcon}
                title="تصویر شاخص"
                iconBgColor="bg-blue"
                iconColor="stroke-blue-2"
                borderColor="border-b-blue-1"
                className="lg:sticky lg:top-20"
              >
                <div className="space-y-6">
                  <Skeleton className="h-32 w-full" />
                </div>
              </CardWithIcon>
            </div>
          </div>
        </div>
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

      <form id="category-edit-form" onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-4 space-y-6">
            <div className="space-y-6">
            <CardWithIcon
              icon={FolderTree}
              title="اطلاعات دسته‌بندی"
              iconBgColor="bg-purple"
              iconColor="stroke-purple-2"
              borderColor="border-b-purple-1"
              className="hover:shadow-lg transition-all duration-300"
            >
                <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormFieldInput
                    label="نام"
                    id="name"
                    required
                    error={errors.name?.message}
                    placeholder="نام دسته‌بندی"
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

                <FormField
                  label="دسته‌بندی والد"
                  htmlFor="parent_id"
                  description="دسته‌بندی‌های بدون والد، دسته‌بندی‌های مادر هستند."
                  error={errors.parent_id?.message}
                >
                  <TreeSelect
                    data={categories?.data?.filter(cat => cat.id !== categoryId) || []}
                    value={watch("parent_id") || null}
                    onChange={(value) => setValue("parent_id", value ? parseInt(value) : null)}
                    placeholder="انتخاب دسته‌بندی والد (اختیاری)"
                    searchPlaceholder="جستجوی دسته‌بندی..."
                    emptyText="دسته‌بندی یافت نشد"
                  />
                </FormField>

                <FormFieldTextarea
                  label="توضیحات"
                  id="description"
                  error={errors.description?.message}
                  placeholder="توضیحات دسته‌بندی"
                  rows={4}
                  {...register("description")}
                />

                <div className="mt-6 space-y-4">
                  <div className="border border-green-1/40 bg-green-0/30 hover:border-green-1/60 transition-colors overflow-hidden">
                    <Item variant="default" size="default" className="py-5">
                      <ItemContent>
                        <ItemTitle className="text-green-2">وضعیت فعال</ItemTitle>
                        <ItemDescription>
                          با غیرفعال شدن، دسته‌بندی از لیست مدیریت نیز مخفی می‌شود.
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
                          اگر غیرفعال باشد دسته‌بندی در سایت نمایش داده نمی‌شود.
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
          </div>

          <div className="lg:col-span-2">
            <div className="w-full space-y-6 sticky top-20 transition-all duration-300 ease-in-out self-start">
            <CardWithIcon
              icon={ImageIcon}
              title="تصویر شاخص"
              iconBgColor="bg-blue"
              iconColor="stroke-blue-2"
              borderColor="border-b-blue-1"
              className="hover:shadow-lg transition-all duration-300"
            >
                {selectedMedia ? (
                  <div className="relative w-full aspect-video overflow-hidden group border">
                    <img
                      src={mediaService.getMediaUrlFromObject(selectedMedia)}
                      alt={selectedMedia.alt_text || "تصویر شاخص"}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-static-b/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsMediaModalOpen(true)}
                        className="mx-1"
                        type="button"
                      >
                        تغییر تصویر
                      </Button>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleRemoveImage}
                        className="mx-1"
                        type="button"
                      >
                        <X className="w-4 h-4" />
                        حذف
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => setIsMediaModalOpen(true)}
                    className="relative flex flex-col items-center justify-center w-full p-8 border-2 border-dashed cursor-pointer hover:border-primary transition-colors"
                  >
                    <UploadCloud className="w-12 h-12 text-font-s" />
                    <p className="mt-4 text-lg font-semibold">انتخاب تصویر شاخص</p>
                    <p className="mt-1 text-sm text-font-s text-center">
                      برای انتخاب از کتابخانه کلیک کنید
                    </p>
                  </div>
                )}
            </CardWithIcon>
            </div>
          </div>
        </div>
      </form>

      <MediaLibraryModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onSelect={handleImageSelect}
        selectMultiple={false}
        initialFileType="image"
        showTabs={true}
        context="portfolio"
      />

      <div className="fixed bottom-0 left-0 right-0 lg:right-[20rem] z-50 border-t border-br bg-card shadow-lg transition-all duration-300 flex items-center justify-end gap-3 py-4 px-8">
        <Button
          type="submit"
          form="category-edit-form"
          size="lg"
          disabled={updateCategoryMutation.isPending || isSubmitting}
        >
          {updateCategoryMutation.isPending || isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              در حال به‌روزرسانی...
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              به‌روزرسانی دسته‌بندی
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
