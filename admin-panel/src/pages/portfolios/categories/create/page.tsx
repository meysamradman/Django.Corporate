import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Button } from "@/components/elements/Button";
import { FormField, FormFieldInput, FormFieldTextarea } from "@/components/forms/FormField";
import { Switch } from "@/components/elements/Switch";
import { Item, ItemContent, ItemTitle, ItemDescription, ItemActions } from "@/components/elements/Item";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { portfolioApi } from "@/api/portfolios/portfolios";
import type { PortfolioCategory } from "@/types/portfolio/category/portfolioCategory";
import { TreeSelect } from "@/components/elements/TreeSelect";
import type { Media } from "@/types/shared/media";
import { generateSlug, formatSlug } from '@/core/slug/generate';
import { portfolioCategoryFormSchema, portfolioCategoryFormDefaults, type PortfolioCategoryFormValues } from '@/components/portfolios/validations/categorySchema';
import { showSuccess, showError, extractFieldErrors, hasFieldErrors } from "@/core/toast";
import { msg } from "@/core/messages";
import { MediaLibraryModal } from "@/components/media/modals/MediaLibraryModal";
import { mediaService } from "@/components/media/services";
import { UploadCloud, X, FolderTree, Image as ImageIcon, Loader2, Save, Settings } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/elements/Tabs";

export default function CreateCategoryPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("account");
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  const form = useForm<PortfolioCategoryFormValues>({
    resolver: zodResolver(portfolioCategoryFormSchema),
    defaultValues: portfolioCategoryFormDefaults,
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

  const { data: categories } = useQuery({
    queryKey: ['portfolio-categories-all'],
    queryFn: async () => {
      const res = await portfolioApi.getCategories({ size: 1000 });
      return res;
    },
    staleTime: 0,
    gcTime: 0,
  });

  const createCategoryMutation = useMutation({
    mutationFn: (data: Partial<PortfolioCategory>) => portfolioApi.createCategory(data),
    onSuccess: (_data) => {
      // ✅ از msg.crud استفاده کنید
      showSuccess(msg.crud("created", { item: "دسته‌بندی" }));
      queryClient.invalidateQueries();
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
    createCategoryMutation.mutate(data);
  });

  return (
    <div className="space-y-6 pb-28 relative">
      <form id="category-form" onSubmit={handleSubmit} noValidate>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="account">
              <FolderTree className="h-4 w-4" />
              اطلاعات پایه
            </TabsTrigger>
            <TabsTrigger value="media">
              <ImageIcon className="h-4 w-4" />
              مدیا
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4" />
              تنظیمات
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account">
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
                      data={categories?.data || []}
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
                </div>
              </CardWithIcon>
            </div>
          </TabsContent>

          <TabsContent value="media">
            <div className="space-y-6">
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
          </TabsContent>
        </Tabs>
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
          form="category-form"
          size="lg"
          disabled={createCategoryMutation.isPending || isSubmitting}
        >
          {createCategoryMutation.isPending || isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              در حال ایجاد...
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              ایجاد دسته‌بندی
            </>
          )}
        </Button>
      </div>
    </div>
  );
}