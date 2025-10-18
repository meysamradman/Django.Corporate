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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { portfolioApi } from "@/api/portfolios/route";
import { PortfolioTag } from "@/types/portfolio/tags/portfolioTag";
import { generateSlug } from '@/core/utils/slugUtils';

export default function CreateTagPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    is_active: true,
    is_public: true,
    description: "",
  });

  const createTagMutation = useMutation({
    mutationFn: (data: Partial<PortfolioTag>) => portfolioApi.createTag(data),
    onSuccess: () => {
      toast.success("تگ با موفقیت ایجاد شد");
      queryClient.invalidateQueries();
      // Redirect to tag list page after successful creation
      router.push("/portfolios/tags");
    },
    onError: (error) => {
      toast.error("خطا در ایجاد تگ");
      console.error("Create tag error:", error);
    },
  });

  // Automatically generate slug from name (only if slug is empty)
  useEffect(() => {
    if (formData.name && !formData.slug) {
      // Use custom implementation for Persian characters with extended Unicode range
      const generatedSlug = formData.name
          .toLowerCase()
          .replace(/[^\w\u0600-\u06FF\s-]/g, '') // Allow Persian characters and word characters
          .replace(/\s+/g, '-') // Replace spaces with -
          .replace(/-+/g, '-') // Replace multiple - with single -
          .replace(/^-+|-+$/g, '') // Trim - from start and end
          .substring(0, 60); // Ensure it doesn't exceed max length
      setFormData(prev => ({ ...prev, slug: generatedSlug }));
    }
  }, [formData.name, formData.slug]);

  const handleInputChange = (field: string, value: string | boolean) => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTagMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">ایجاد تگ جدید</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>اطلاعات تگ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">نام *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="نام تگ"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">اسلاگ *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleInputChange("slug", e.target.value)}
                  placeholder="نام-تگ"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">توضیحات</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="توضیحات تگ"
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
                disabled={createTagMutation.isPending}
              >
                {createTagMutation.isPending ? "در حال ایجاد..." : "ایجاد تگ"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}