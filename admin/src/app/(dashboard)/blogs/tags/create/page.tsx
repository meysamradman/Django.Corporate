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
import { toast } from "@/components/elements/Sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { portfolioApi } from "@/api/portfolios/route";
import { PortfolioTag } from "@/types/portfolio/tags/portfolioTag";
import { generateSlug } from '@/core/utils/slugUtils';
import { Tag, Loader2, Save, List } from "lucide-react";

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
      router.push("/portfolios/tags");
    },
    onError: (error) => {
      toast.error("خطا در ایجاد تگ");
    },
  });

  useEffect(() => {
    if (formData.name && !formData.slug) {
      const generatedSlug = formData.name
          .toLowerCase()
          .replace(/[^\w\u0600-\u06FF\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-+|-+$/g, '')
          .substring(0, 60);
      setFormData(prev => ({ ...prev, slug: generatedSlug }));
    }
  }, [formData.name, formData.slug]);

  const handleInputChange = (field: string, value: string | boolean) => {
    if (field === "name" && typeof value === "string") {
      const generatedSlug = generateSlug(value);
      
      setFormData(prev => ({
        ...prev,
        [field]: value,
        slug: generatedSlug
      }));
    } else {
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
    <div className="space-y-6 pb-28 relative">
      <div className="flex items-center justify-between">
        <h1 className="page-title">ایجاد تگ جدید</h1>
        <Button 
          variant="outline"
          onClick={() => router.push("/blogs/tags")}
        >
          <List className="h-4 w-4" />
          نمایش لیست
        </Button>
      </div>

      <form id="tag-form" onSubmit={handleSubmit}>
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
              <FormField
                label="نام"
                htmlFor="name"
                required
              >
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="نام تگ"
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
                  placeholder="نام-تگ"
                  required
                />
              </FormField>
            </div>

            <FormField
              label="توضیحات"
              htmlFor="description"
            >
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="توضیحات تگ"
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
      </form>

      <div className="fixed bottom-0 left-0 right-0 lg:right-[20rem] z-50 border-t border-br bg-card shadow-lg transition-all duration-300 flex items-center justify-end gap-3 py-4 px-8">
        <Button
          type="button"
          onClick={() => {
            const form = document.getElementById('tag-form') as HTMLFormElement;
            if (form) form.requestSubmit();
          }}
          size="lg"
          disabled={createTagMutation.isPending}
        >
          {createTagMutation.isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              در حال ایجاد...
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              ایجاد تگ
            </>
          )}
        </Button>
      </div>
    </div>
  );
}