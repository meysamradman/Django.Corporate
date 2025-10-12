"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { Button } from "@/components/elements/Button";
import { Input } from "@/components/elements/Input";
import { Label } from "@/components/elements/Label";
import { Textarea } from "@/components/elements/Textarea";
import { Switch } from "@/components/elements/Switch";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { portfolioApi } from "@/api/portfolios/route";
import { PortfolioCategory } from "@/types/portfolio/category/portfolioCategory";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
import slugify from "slugify";
import { MediaSelector } from "@/components/media/selectors/MediaSelector";
import { Media } from "@/types/shared/media";

export default function CreateCategoryPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
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

  const createCategoryMutation = useMutation({
    mutationFn: (data: Partial<PortfolioCategory>) => portfolioApi.createCategory(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries();
      router.push("/portfolios/categories");
    },
    onError: (error) => {
      console.error("Error creating category:", error);
    },
  });

  // Automatically generate slug from name
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
    
    createCategoryMutation.mutate(formDataWithImage);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">ایجاد دسته‌بندی جدید</h1>
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
                  {categories?.data?.map((category) => (
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
                disabled={createCategoryMutation.isPending}
              >
                {createCategoryMutation.isPending ? "در حال ایجاد..." : "ایجاد دسته‌بندی"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}