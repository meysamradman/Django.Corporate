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
import { PortfolioOption } from "@/types/portfolio/options/portfolioOption";
import { generateSlug } from '@/core/utils/slugUtils';
import { Settings } from "lucide-react";

export default function CreateOptionPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    is_active: true,
    is_public: true,
    description: "",
  });

  const createOptionMutation = useMutation({
    mutationFn: (data: Partial<PortfolioOption>) => portfolioApi.createOption(data),
    onSuccess: () => {
      toast.success("گزینه با موفقیت ایجاد شد");
      queryClient.invalidateQueries();
      router.push("/portfolios/options");
    },
    onError: (error) => {
      toast.error("خطا در ایجاد گزینه");
    },
  });

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
    createOptionMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">ایجاد گزینه جدید</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <CardWithIcon
          icon={Settings}
          title="اطلاعات گزینه"
          iconBgColor="bg-teal"
          iconColor="stroke-teal-2"
          borderColor="border-b-teal-1"
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
                  placeholder="نام گزینه"
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
                  placeholder="نام-گزینه"
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
                placeholder="توضیحات گزینه"
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
              <Button
                type="submit"
                disabled={createOptionMutation.isPending}
              >
                {createOptionMutation.isPending ? "در حال ایجاد..." : "ایجاد گزینه"}
              </Button>
            </div>
            </div>
        </CardWithIcon>
      </form>
    </div>
  );
}