"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/elements/Card";
import { Button } from "@/components/elements/Button";
import { Input } from "@/components/elements/Input";
import { Label } from "@/components/elements/Label";
import { Textarea } from "@/components/elements/Textarea";
import { Switch } from "@/components/elements/Switch";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { portfolioApi } from "@/api/portfolios/route";
import { PortfolioCategory } from "@/types/portfolio/category/portfolioCategory";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
import { Media } from "@/types/shared/media";
import { generateSlug } from '@/core/utils/slugUtils';
import { toast } from "@/components/elements/Sonner";
import { MediaLibraryModal } from "@/components/media/modals/MediaLibraryModal";
import { mediaService } from "@/components/media/services";
import NextImage from "next/image";
import { UploadCloud, X, AlertCircle } from "lucide-react";

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

  // Fetch all categories for parent selection
  const { data: categories } = useQuery({
    queryKey: ['categories-all'],
    queryFn: async () => {
      return await portfolioApi.getCategories({ size: 1000 });
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Function to render category with indentation based on level
  const renderCategoryOption = (category: PortfolioCategory) => {
    // Calculate indentation based on category level
    const level = category.level || 1;
    const indentation = " ".repeat(level - 1); // Using em space for better alignment
    
    // Add indicator for root categories
    const prefix = level === 1 ? "📂 " : "├─ ";
    
    return (
      <SelectItem key={category.id} value={category.id.toString()}>
        {indentation}{prefix}{category.name}
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
      console.error("Error creating category:", error);
    },
  });

  const handleInputChange = (field: string, value: string | boolean | number | null) => {
    // If we're updating the name field, always generate/update slug
    if (field === "name" && typeof value === "string") {
      const generatedSlug = generateSlug(value);
      
      // Update both name and slug
      setFormData(prev => ({
        ...prev,
        [field]: value,
        slug: generatedSlug
      }));
    } else {
      // Update only the specified field
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleParentChange = (value: string) => {
    // According to project specifications, check for both existence and non-null string value
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
    
    // Add image ID to form data if selected
    const formDataWithImage = {
      ...formData,
      ...(selectedMedia?.id && { image_id: selectedMedia.id })
    };
    
    createCategoryMutation.mutate(formDataWithImage);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">ایجاد دسته‌بندی جدید</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column: Form Fields */}
          <div className="flex-1 min-w-0">
            <Card>
              <CardHeader>
                <CardTitle>اطلاعات دسته‌بندی</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">نام *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="نام دسته‌بندی"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">اسلاگ *</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => handleInputChange("slug", e.target.value)}
                      placeholder="نام-دسته‌بندی"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parent_id">دسته‌بندی والد</Label>
                  <Select
                    value={formData.parent_id?.toString() || "null"}
                    onValueChange={handleParentChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="دسته‌بندی والد را انتخاب کنید" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="null">بدون والد (دسته‌بندی مادر)</SelectItem>
                      {categories?.data?.map((category) => renderCategoryOption(category))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    دسته‌بندی‌های بدون والد، دسته‌بندی‌های مادر هستند.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">توضیحات</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="توضیحات دسته‌بندی"
                    rows={4}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => handleInputChange("is_active", checked)}
                  />
                  <Label htmlFor="is_active">فعال</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_public"
                    checked={formData.is_public}
                    onCheckedChange={(checked) => handleInputChange("is_public", checked)}
                  />
                  <Label htmlFor="is_public">عمومی</Label>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    انصراف
                  </Button>
                  <Button
                    type="submit"
                    disabled={createCategoryMutation.isPending}
                  >
                    {createCategoryMutation.isPending ? "در حال ایجاد..." : "ایجاد دسته‌بندی"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Featured Image */}
          <div className="w-full lg:w-[420px] lg:flex-shrink-0">
            <Card className="lg:sticky lg:top-6">
              <CardHeader>
                <CardTitle>تصویر شاخص</CardTitle>
                <CardDescription>
                  این تصویر به عنوان تصویر اصلی دسته‌بندی استفاده می‌شود.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedMedia ? (
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden group border">
                    <NextImage
                      src={mediaService.getMediaUrlFromObject(selectedMedia)}
                      alt={selectedMedia.alt_text || "تصویر شاخص"}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="secondary"
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
                    <UploadCloud className="w-12 h-12 text-muted-foreground" />
                    <p className="mt-4 text-lg font-semibold">انتخاب تصویر شاخص</p>
                    <p className="mt-1 text-sm text-muted-foreground text-center">
                      برای انتخاب از کتابخانه کلیک کنید
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </form>

      <MediaLibraryModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onSelect={handleImageSelect}
        selectMultiple={false}
        initialFileType="image"
      />
    </div>
  );
}