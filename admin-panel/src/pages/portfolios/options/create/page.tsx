import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Button } from "@/components/elements/Button";
import { Input } from "@/components/elements/Input";
import { FormField } from "@/components/forms/FormField";
import { Textarea } from "@/components/elements/Textarea";
import { Switch } from "@/components/elements/Switch";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { portfolioApi } from "@/api/portfolios/portfolios";
import type { PortfolioOption } from "@/types/portfolio/options/portfolioOption";
import { generateSlug, formatSlug } from '@/core/slug/generate';
import { validateSlug } from '@/core/slug/validate';
import { Settings, Loader2, Save, List } from "lucide-react";
import { Skeleton } from "@/components/elements/Skeleton";

export default function CreateOptionPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isInitialLoading, setIsInitialLoading] = React.useState(true);
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
      navigate("/portfolios/options");
    },
    onError: (error) => {
      toast.error("خطا در ایجاد گزینه");
    },
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleInputChange = (field: string, value: string | boolean) => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const slugValidation = validateSlug(formData.slug, true);
    if (!slugValidation.isValid) {
      toast.error(slugValidation.error || "اسلاگ معتبر نیست");
      return;
    }
    
    createOptionMutation.mutate(formData);
  };

  if (isInitialLoading) {
    return (
      <div className="space-y-6 pb-28 relative">
        <div className="flex items-center justify-between">
          <h1 className="page-title">ایجاد گزینه جدید</h1>
          <Button 
            variant="outline"
            onClick={() => navigate("/portfolios/options")}
          >
            <List className="h-4 w-4" />
            نمایش لیست
          </Button>
        </div>

        <CardWithIcon
          icon={Settings}
          title="اطلاعات گزینه"
          iconBgColor="bg-teal"
          iconColor="stroke-teal-2"
          borderColor="border-b-teal-1"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-10" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
        </CardWithIcon>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-28 relative">
      <div className="flex items-center justify-between">
        <h1 className="page-title">ایجاد گزینه جدید</h1>
        <Button 
          variant="outline"
          onClick={() => navigate("/portfolios/options")}
        >
          <List className="h-4 w-4" />
          نمایش لیست
        </Button>
      </div>

      <form id="option-form" onSubmit={handleSubmit}>
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
                onClick={() => navigate(-1)}
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
            const form = document.getElementById('option-form') as HTMLFormElement;
            if (form) form.requestSubmit();
          }}
          size="lg"
          disabled={createOptionMutation.isPending}
        >
          {createOptionMutation.isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              در حال ایجاد...
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              ایجاد گزینه
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
