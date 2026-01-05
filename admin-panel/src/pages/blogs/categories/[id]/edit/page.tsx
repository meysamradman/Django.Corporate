import { useState, useEffect, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Button } from "@/components/elements/Button";
import { Input } from "@/components/elements/Input";
import { FormField } from "@/components/forms/FormField";
import { Textarea } from "@/components/elements/Textarea";
import { Switch } from "@/components/elements/Switch";
import { Item, ItemContent, ItemTitle, ItemDescription, ItemActions } from "@/components/elements/Item";
import { showError, showSuccess, showInfo } from "@/core/toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { blogApi } from "@/api/blogs/blogs";
import type { BlogCategory } from "@/types/blog/category/blogCategory";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
import type { Media } from "@/types/shared/media";
import { generateSlug, formatSlug } from '@/core/slug/generate';
import { blogCategoryFormSchema } from '@/components/blogs/validations/categorySchema';
import { MediaLibraryModal } from "@/components/media/modals/MediaLibraryModal";
import { mediaService } from "@/components/media/services";
import { UploadCloud, X, FolderTree, Image as ImageIcon, FolderOpen, Folder, Home, Loader2, Save } from "lucide-react";
import { Skeleton } from "@/components/elements/Skeleton";

export default function EditCategoryPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const categoryId = Number(id);
  
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
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: category, isLoading, error } = useQuery({
    queryKey: ['blog-category', categoryId],
    queryFn: () => blogApi.getCategoryById(categoryId),
    enabled: !!categoryId,
  });

  const { data: categories } = useQuery({
    queryKey: ['blog-categories-all'],
    queryFn: async () => {
      return await blogApi.getCategories({ size: 1000 });
    },
    staleTime: 0,
    gcTime: 0,
  });

  const getSelectedCategoryDisplay = () => {
    if (!formData.parent_id) {
      return {
        name: "بدون والد (دسته‌بندی مادر)",
        icon: Home,
        level: 0,
        badge: "پیش‌فرض"
      };
    }
    const selected = categories?.data?.find(cat => cat.id === formData.parent_id);
    if (!selected) return null;
    
    return {
      name: selected.name,
      icon: (selected.level || 1) === 1 ? FolderOpen : Folder,
      level: selected.level || 1,
      badge: null
    };
  };

  const renderCategoryOption = (category: BlogCategory) => {
    const level = category.level || 1;
    const indentPx = (level - 1) * 24;
    const Icon = level === 1 ? FolderOpen : Folder;
    const isSelected = formData.parent_id === category.id;
    
    return (
      <SelectItem 
        key={category.id} 
        value={category.id.toString()}
        className="relative"
      >
        <div 
          className="flex items-center gap-3 w-full justify-end" 
          style={{ paddingRight: `${indentPx}px` }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0 justify-end text-right">
            {level > 1 && (
              <div className="flex items-center gap-1 shrink-0">
                <div className="flex gap-0.5">
                  {Array.from({ length: level - 1 }).map((_, idx) => (
                    <div key={idx} className="w-1 h-1 bg-font-s/30" />
                  ))}
                </div>
              </div>
            )}
            <span className={`flex-1 truncate text-right ${isSelected ? 'font-medium text-foreground' : 'text-foreground'}`}>
              {category.name}
            </span>
          </div>
          {level > 1 && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-border" />
          )}
          <Icon 
            className={`w-4 h-4 shrink-0 transition-colors ${
              isSelected 
                ? 'text-primary' 
                : level === 1 
                  ? 'text-primary/70' 
                  : 'text-font-s'
            }`} 
          />
        </div>
      </SelectItem>
    );
  };

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || "",
        slug: category.slug || "",
        parent_id: category.parent_id || null,
        is_active: category.is_active,
        is_public: category.is_public,
        description: category.description || "",
      });
      
      if (category.image) {
        setSelectedMedia(category.image);
      }
    }
  }, [category]);

  const updateCategoryMutation = useMutation({
    mutationFn: (data: Partial<BlogCategory>) => blogApi.partialUpdateCategory(categoryId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-category', categoryId] });
      queryClient.invalidateQueries({ queryKey: ['blog-categories'] });
      showSuccess("دسته‌بندی با موفقیت به‌روزرسانی شد");
      navigate("/blogs/categories");
    },
    onError: (error: any) => {
      const errorData = error?.response?.data?.data;
      const errorMessage = errorData?.detail || 
                          error?.response?.data?.metaData?.message ||
                          "خطا در به‌روزرسانی دسته‌بندی";
      
      if (errorData?.name || errorData?.slug) {
        const validationErrors: string[] = [];
        if (errorData.name) validationErrors.push(...errorData.name);
        if (errorData.slug) validationErrors.push(...errorData.slug);
        showError(validationErrors.join(", "));
      } else {
        showError(errorMessage);
      }
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

  const handleParentChange = (value: string) => {
    const parentId = value && value !== "null" ? parseInt(value) : null;
    setFormData(prev => ({ ...prev, parent_id: parentId }));
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
    
    if (!category) return;
    
    setErrors({});
    
    try {
      const validatedData = blogCategoryFormSchema.parse({
        ...formData,
        image_id: selectedMedia?.id || null,
      });
      
      const submitData: Partial<BlogCategory> = {};
      
      if (validatedData.name !== category.name) {
        submitData.name = validatedData.name;
      }
      
      if (validatedData.slug !== category.slug) {
        submitData.slug = validatedData.slug;
      }
      
      if (validatedData.parent_id !== (category.parent_id || null)) {
        submitData.parent_id = validatedData.parent_id;
      }
      
      if (validatedData.is_active !== category.is_active) {
        submitData.is_active = validatedData.is_active;
      }
      
      if (validatedData.is_public !== category.is_public) {
        submitData.is_public = validatedData.is_public;
      }
      
      if (validatedData.description !== (category.description || "")) {
        submitData.description = validatedData.description || "";
      }
      
      const currentImageId = category.image?.id || null;
      const newImageId = validatedData.image_id || null;
      if (currentImageId !== newImageId) {
        submitData.image_id = newImageId;
      }
      
      if (Object.keys(submitData).length === 0) {
        showInfo("تغییری اعمال نشده است");
        return;
      }
      
      updateCategoryMutation.mutate(submitData);
    } catch (error: any) {
      if (error.errors || error.issues) {
        const fieldErrors: Record<string, string> = {};
        const errorsToProcess = error.errors || error.issues || [];
        errorsToProcess.forEach((err: any) => {
          if (err.path && err.path.length > 0) {
            fieldErrors[err.path[0]] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        showError("خطا در اعتبارسنجی فرم");
      }
    }
  };

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

      <form id="blog-category-edit-form" onSubmit={handleSubmit}>
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
                    error={errors.name}
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
                    error={errors.slug}
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
                  <Select
                    value={formData.parent_id?.toString() || "null"}
                    onValueChange={handleParentChange}
                  >
                    <SelectTrigger className="w-full h-auto min-h-[2.5rem] py-2 !justify-start">
                      <div className="flex items-center gap-3 w-full flex-1 min-w-0">
                        {(() => {
                          const display = getSelectedCategoryDisplay();
                          if (!display) {
                            return (
                              <>
                                <SelectValue placeholder="دسته‌بندی والد را انتخاب کنید" className="flex-1 text-right w-full" />
                                <div className="p-1.5 bg-bg/50 shrink-0">
                                  <Home className="w-4 h-4 text-font-s" />
                                </div>
                              </>
                            );
                          }
                          const Icon = display.icon;
                          return (
                            <>
                              <SelectValue className="flex-1 text-right w-full">
                                <span className="font-medium truncate text-right block">{display.name}</span>
                              </SelectValue>
                              {display.badge && (
                                <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary font-medium shrink-0">
                                  {display.badge}
                                </span>
                              )}
                              <div className={`p-1.5 shrink-0 ${
                                display.level === 0 
                                  ? 'bg-primary/10' 
                                  : 'bg-bg/50'
                              }`}>
                                <Icon className={`w-4 h-4 ${
                                  display.level === 0 
                                    ? 'text-primary' 
                                    : 'text-foreground'
                                }`} />
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      <SelectItem 
                        value="null"
                        className="font-medium"
                      >
                        <div className="flex items-center gap-3 w-full justify-end">
                          <div className="flex items-center gap-2 flex-1 justify-end text-right">
                            <span>بدون والد (دسته‌بندی مادر)</span>
                            <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary font-medium">
                              پیش‌فرض
                            </span>
                          </div>
                          <div className="p-1.5 bg-primary/10 shrink-0">
                            <Home className="w-4 h-4 text-primary" />
                          </div>
                        </div>
                      </SelectItem>
                      {categories?.data && categories.data.length > 0 && (
                        <>
                          <div className="h-px bg-border/50 my-2 mx-2" />
                          <div className="px-3 py-2 text-xs font-semibold text-font-s uppercase tracking-wide text-right">
                            دسته‌بندی‌های موجود
                          </div>
                        </>
                      )}
                      {categories?.data
                        ?.filter(cat => cat.id !== categoryId)
                        .map((category) => renderCategoryOption(category))}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField
                  label="توضیحات"
                  htmlFor="description"
                  error={errors.description}
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
        context="blog"
      />

      <div className="fixed bottom-0 left-0 right-0 lg:right-[20rem] z-50 border-t border-br bg-card shadow-lg transition-all duration-300 flex items-center justify-end gap-3 py-4 px-8">
        <Button
          type="button"
          onClick={() => {
            const form = document.getElementById('blog-category-edit-form') as HTMLFormElement;
            if (form) form.requestSubmit();
          }}
          size="lg"
          disabled={updateCategoryMutation.isPending}
        >
          {updateCategoryMutation.isPending ? (
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