"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { Button } from "@/components/elements/Button";
import { Input } from "@/components/elements/Input";
import { Label } from "@/components/elements/Label";
import { Textarea } from "@/components/elements/Textarea";
import { Switch } from "@/components/elements/Switch";
import { toast } from "@/components/elements/Sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { portfolioApi } from "@/api/portfolios/route";
import { PortfolioCategory } from "@/types/portfolio/category/portfolioCategory";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
import slugify from "slugify";
import { MediaSelector } from "@/components/media/selectors/MediaSelector";
import { Media } from "@/types/shared/media";

export default function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const unwrappedParams = React.use(params);
  const categoryId = Number(unwrappedParams.id);
  
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    parent_id: null as number | null,
    is_active: true,
    is_public: true,
    description: "",
  });

  // Fetch category data
  const { data: category, isLoading, error } = useQuery({
    queryKey: ['category', categoryId],
    queryFn: () => portfolioApi.getCategoryById(categoryId),
    enabled: !!categoryId,
  });

  // Fetch all categories for parent selection (excluding current category)
  const { data: categories } = useQuery({
    queryKey: ['categories-all'],
    queryFn: async () => {
      return await portfolioApi.getCategories({ size: 1000 });
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update form data when category data is fetched
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
      
      // Set selected media if category has an image
      if (category.image) {
        setSelectedMedia(category.image);
      }
    }
  }, [category]);

  const updateCategoryMutation = useMutation({
    mutationFn: (data: Partial<PortfolioCategory>) => portfolioApi.updateCategory(categoryId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['category', categoryId] });
      router.push("/portfolios/categories");
    },
    onError: (error) => {
      console.error("Update category error:", error);
    },
  });

  // Automatically generate slug from name (only if slug is empty)
  useEffect(() => {
    if (formData.name && !formData.slug) {
      const generatedSlug = slugify(formData.name, { 
        lower: true, 
        strict: true,
        locale: 'en' // Use English locale for consistency
      });
      setFormData(prev => ({ ...prev, slug: generatedSlug }));
    }
  }, [formData.name, formData.slug]);

  const handleInputChange = (field: string, value: string | boolean | number | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleParentChange = (value: string) => {
    // According to project specifications, check for both existence and non-null string value
    const parentId = value && value !== "null" ? parseInt(value) : null;
    setFormData(prev => ({ ...prev, parent_id: parentId }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Add image ID to form data if selected
    const formDataWithImage = {
      ...formData,
      ...(selectedMedia?.id && { image_id: selectedMedia.id })
    };
    
    updateCategoryMutation.mutate(formDataWithImage);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="page-title">ویرایش دسته‌بندی</h1>
        </div>
        <div className="text-center py-8">
          <p>در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="page-title">ویرایش دسته‌بندی</h1>
        </div>
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">خطا در بارگذاری داده‌ها</p>
          <Button 
            onClick={() => router.back()} 
            className="mt-4"
          >
            بازگشت
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">ویرایش دسته‌بندی</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>اطلاعات دسته‌بندی</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <MediaSelector
              selectedMedia={selectedMedia}
              onMediaSelect={setSelectedMedia}
              label="تصویر دسته‌بندی"
              size="md"
            />
            
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
                  <SelectItem value="null">بدون والد</SelectItem>
                  {categories?.data
                    ?.filter(cat => cat.id !== categoryId) // Exclude current category
                    .map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
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
                disabled={updateCategoryMutation.isPending}
              >
                {updateCategoryMutation.isPending ? "در حال به‌روزرسانی..." : "به‌روزرسانی دسته‌بندی"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}