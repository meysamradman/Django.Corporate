"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Button } from "@/components/elements/Button";
import { Input } from "@/components/elements/Input";
import { FormField } from "@/components/forms/FormField";
import { Textarea } from "@/components/elements/Textarea";
import { Switch } from "@/components/elements/Switch";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { portfolioApi } from "@/api/portfolios/route";
import { PortfolioCategory } from "@/types/portfolio/category/portfolioCategory";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
import { Media } from "@/types/shared/media";
import { generateSlug, formatSlug } from '@/core/slug/generate';
import { validateSlug } from '@/core/slug/validate';
import { toast } from "@/components/elements/Sonner";
import { MediaLibraryModal } from "@/components/media/modals/MediaLibraryModal";
import { mediaService } from "@/components/media/services";
import NextImage from "next/image";
import { UploadCloud, X, AlertCircle, FolderTree, Image as ImageIcon, FolderOpen, Folder, ChevronRight, Home, Loader2, Save, List, Settings } from "lucide-react";
import { Skeleton } from "@/components/elements/Skeleton";

export default function CreateCategoryPage() {
  const router = useRouter();
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
    queryKey: ['categories-all'],
    queryFn: async () => {
      return await portfolioApi.getCategories({ size: 1000 });
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

  const renderCategoryOption = (category: PortfolioCategory) => {
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
                    <div key={idx} className="w-1 h-1 rounded-full bg-font-s/30" />
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

  const createCategoryMutation = useMutation({
    mutationFn: (data: Partial<PortfolioCategory>) => portfolioApi.createCategory(data),
    onSuccess: (data) => {
      toast.success("دسته‌بندی با موفقیت ایجاد شد");
      queryClient.invalidateQueries();
      router.push("/portfolios/categories");
    },
    onError: (error) => {
      toast.error("خطا در ایجاد دسته‌بندی");
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const slugValidation = validateSlug(formData.slug, true);
    if (!slugValidation.isValid) {
      toast.error(slugValidation.error || "اسلاگ معتبر نیست");
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
        <div className="flex items-center justify-between">
          <h1 className="page-title">ایجاد دسته‌بندی جدید</h1>
          <Skeleton className="h-10 w-32" />
        </div>

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
                  <Skeleton className="h-32 w-full rounded-lg" />
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
      <div className="flex items-center justify-between">
        <h1 className="page-title">ایجاد دسته‌بندی جدید</h1>
        <Button 
          variant="outline"
          onClick={() => router.push("/blogs/categories")}
        >
          <List className="h-4 w-4" />
          نمایش لیست
        </Button>
      </div>

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
                    label="اسلاگ"
                    htmlFor="slug"
                    required
                  >
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => handleInputChange("slug", e.target.value)}
                      placeholder="نام-دسته‌بندی"
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
                                <div className="p-1.5 rounded-md bg-bg/50 shrink-0">
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
                                <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium shrink-0">
                                  {display.badge}
                                </span>
                              )}
                              <div className={`p-1.5 rounded-md shrink-0 ${
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
                            <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">
                              پیش‌فرض
                            </span>
                          </div>
                          <div className="p-1.5 rounded-md bg-primary/10 shrink-0">
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
                      {categories?.data?.map((category) => renderCategoryOption(category))}
                    </SelectContent>
                  </Select>
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

                <div className="flex items-center gap-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => handleInputChange("is_active", checked)}
                  />
                  <label htmlFor="is_active" className="text-sm font-medium cursor-pointer">
                    فعال
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="is_public"
                    checked={formData.is_public}
                    onCheckedChange={(checked) => handleInputChange("is_public", checked)}
                  />
                  <label htmlFor="is_public" className="text-sm font-medium cursor-pointer">
                    عمومی
                  </label>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    انصراف
                  </Button>
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
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden group border">
                    <NextImage
                      src={mediaService.getMediaUrlFromObject(selectedMedia)}
                      alt={selectedMedia.alt_text || "تصویر شاخص"}
                      fill
                      className="object-cover"
                      unoptimized
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
                    className="relative flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors"
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