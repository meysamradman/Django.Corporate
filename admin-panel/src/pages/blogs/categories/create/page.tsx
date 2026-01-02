import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Button } from "@/components/elements/Button";
import { Input } from "@/components/elements/Input";
import { FormField } from "@/components/forms/FormField";
import { Textarea } from "@/components/elements/Textarea";
import { Switch } from "@/components/elements/Switch";
import { Item, ItemContent, ItemTitle, ItemDescription, ItemActions } from "@/components/elements/Item";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { blogApi } from "@/api/blogs/blogs";
import type { BlogCategory } from "@/types/blog/category/blogCategory";
import { TreeSelect } from "@/components/elements/TreeSelect";
import type { Media } from "@/types/shared/media";
import { generateSlug, formatSlug } from '@/core/slug/generate';
import { validateSlug } from '@/core/slug/validate';
import { showError, showSuccess } from "@/core/toast";
import { MediaLibraryModal } from "@/components/media/modals/MediaLibraryModal";
import { mediaService } from "@/components/media/services";
import { UploadCloud, X, FolderTree, Image as ImageIcon, Loader2, Save, Settings } from "lucide-react";
import { Skeleton } from "@/components/elements/Skeleton";

export default function CreateCategoryPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    parent_id: null as number | null,
    is_active: true,
    is_public: true,
    description: "",
  });

  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['blog-categories-all'],
    queryFn: async () => {
      const res = await blogApi.getCategories({ size: 1000 });
      return res;
    },
    staleTime: 0,
    gcTime: 0,
  });

  const createCategoryMutation = useMutation({
    mutationFn: (data: Partial<BlogCategory>) => blogApi.createCategory(data),
    onSuccess: (_data) => {
      showSuccess("دسته‌بندی با موفقیت ایجاد شد");
      queryClient.invalidateQueries();
      navigate("/blogs/categories");
    },
    onError: (_error) => {
      showError("خطا در ایجاد دسته‌بندی");
    },
  });

  const handleInputChange = (field: string, value: string | boolean | number | null) => {
    if (field === "name" && typeof value === "string") {
      const generatedSlug = generateSlug(value);

      setFormData(prev => ({
        ...prev,
        [field]: value,
        slug: generatedSlug
      }));
    } else if (field === "slug" && typeof value === "string") {
      const formattedSlug = formatSlug(value);
      setFormData(prev => ({
        ...prev,
        [field]: formattedSlug
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleImageSelect = (media: Media | Media[] | null) => {
    const selected = Array.isArray(media) ? media[0] || null : media;
    setSelectedMedia(selected);
    setIsMediaModalOpen(false);
  };

  const handleRemoveImage = () => {
    setSelectedMedia(null);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const slugValidation = validateSlug(formData.slug, true);
    if (!slugValidation.isValid) {
      showError(slugValidation.error || "اسلاگ معتبر نیست");
      return;
    }

    const formDataWithImage = {
      ...formData,
      ...(selectedMedia?.id && { image_id: selectedMedia.id })
    };

    createCategoryMutation.mutate(formDataWithImage);
  };

  if (isLoadingCategories) {
    return (
      <div className="space-y-6 pb-28 relative">

        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-4 space-y-6">
            <CardWithIcon
              icon={FolderTree}
              title="اطلاعات دسته‌بندی"
              iconBgColor="bg-blue"
              iconColor="stroke-blue-2"
              borderColor="border-b-blue-1"
            >
              <div className="space-y-6">
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
            <CardWithIcon
              icon={Settings}
              title="تنظیمات"
              iconBgColor="bg-blue"
              iconColor="stroke-blue-2"
              borderColor="border-b-blue-1"
              className="lg:sticky lg:top-20"
            >
              <div className="space-y-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-32 w-full" />
                </div>
              </div>
            </CardWithIcon>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-28 relative">

      <form id="category-form" onSubmit={handleSubmit}>
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
                    <FormField
                      label="نام"
                      htmlFor="name"
                      required
                    >
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        placeholder="نام دسته‌بندی"
                        required
                      />
                    </FormField>
                    <FormField
                      label="نامک"
                      htmlFor="slug"
                      required
                    >
                      <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e) => handleInputChange("slug", e.target.value)}
                        placeholder="نامک"
                        required
                      />
                    </FormField>
                  </div>

                  <FormField
                    label="دسته‌بندی والد"
                    htmlFor="parent_id"
                    description="دسته‌بندی‌های بدون والد، دسته‌بندی‌های مادر هستند."
                  >
                    <TreeSelect
                      data={categories?.data || []}
                      value={formData.parent_id || null}
                      onChange={(value) => handleInputChange("parent_id", value ? parseInt(value) : null)}
                      placeholder="انتخاب دسته‌بندی والد (اختیاری)"
                      searchPlaceholder="جستجوی دسته‌بندی..."
                      emptyText="دسته‌بندی یافت نشد"
                    />
                  </FormField>

                  <FormField
                    label="توضیحات"
                    htmlFor="description"
                  >
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      placeholder="توضیحات دسته‌بندی"
                      rows={4}
                    />
                  </FormField>

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
                            checked={formData.is_active}
                            onCheckedChange={(checked) => handleInputChange("is_active", checked)}
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
                            checked={formData.is_public}
                            onCheckedChange={(checked) => handleInputChange("is_public", checked)}
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
                      className="object-cover w-full h-full"
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
        context="blog"
      />

      <div className="fixed bottom-0 left-0 right-0 lg:right-[20rem] z-50 border-t border-br bg-card shadow-lg transition-all duration-300 flex items-center justify-end gap-3 py-4 px-8">
        <Button
          type="button"
          onClick={() => {
            const form = document.getElementById('category-form') as HTMLFormElement;
            if (form) form.requestSubmit();
          }}
          size="lg"
          disabled={createCategoryMutation.isPending}
        >
          {createCategoryMutation.isPending ? (
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
