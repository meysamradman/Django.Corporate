import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Button } from "@/components/elements/Button";
import { Input } from "@/components/elements/Input";
import { FormField } from "@/components/forms/FormField";
import { Switch } from "@/components/elements/Switch";
import { Item, ItemContent, ItemTitle, ItemDescription } from "@/components/elements/Item";
import { showError, showSuccess } from "@/core/toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { realEstateApi } from "@/api/real-estate";
import type { PropertyState } from "@/types/real_estate/state/realEstateState";
import { generateSlug, formatSlug } from '@/core/slug/generate';
import { validateSlug } from '@/core/slug/validate';
import { FileText, Loader2, Save, List } from "lucide-react";

export default function CreatePropertyStatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    is_active: true,
  });

  const createStateMutation = useMutation({
    mutationFn: (data: Partial<PropertyState>) => realEstateApi.createState(data),
    onSuccess: () => {
      showSuccess("وضعیت ملک با موفقیت ایجاد شد");
      queryClient.invalidateQueries({ queryKey: ['property-states'] });
      navigate("/real-estate/states");
    },
    onError: (error: any) => {
      const errorData = error?.response?.data?.data;
      const errorMessage = errorData?.detail || 
                          error?.response?.data?.metaData?.message ||
                          "خطا در ایجاد وضعیت ملک";
      showError(errorMessage);
    },
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    if (field === "title" && typeof value === "string") {
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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      showError("عنوان الزامی است");
      return;
    }
    
    const slugValidation = validateSlug(formData.slug, true);
    if (!slugValidation.isValid) {
      showError(slugValidation.error || "اسلاگ معتبر نیست");
      return;
    }
    
    createStateMutation.mutate(formData);
  };

  return (
    <div className="space-y-6 pb-28 relative">
      <PageHeader title="ایجاد وضعیت ملک جدید">
        <Button 
          variant="outline"
          onClick={() => navigate("/real-estate/states")}
        >
          <List className="h-4 w-4" />
          نمایش لیست
        </Button>
      </PageHeader>

      <form id="state-create-form" onSubmit={handleSubmit}>
        <CardWithIcon
          icon={FileText}
          title="اطلاعات وضعیت ملک"
          iconBgColor="bg-purple"
          iconColor="stroke-purple-2"
          borderColor="border-b-purple-1"
          className="hover:shadow-lg transition-all duration-300"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="عنوان"
                htmlFor="title"
                required
              >
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="عنوان وضعیت ملک"
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

            <div className="mt-6 space-y-4">
              <div className="rounded-xl border border-green-1/40 bg-green-0/30 hover:border-green-1/60 transition-colors overflow-hidden">
                <Item variant="default" size="default" className="py-5">
                  <ItemContent>
                    <ItemTitle className="text-green-2">وضعیت فعال</ItemTitle>
                    <ItemDescription>
                      با غیرفعال شدن، وضعیت ملک از لیست مدیریت نیز مخفی می‌شود.
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
            </div>
          </div>
        </CardWithIcon>
      </form>

      <div className="fixed bottom-0 left-0 right-0 lg:right-[20rem] z-50 border-t border-br bg-card shadow-lg transition-all duration-300 flex items-center justify-end gap-3 py-4 px-8">
        <Button
          type="button"
          onClick={() => {
            const form = document.getElementById('state-create-form') as HTMLFormElement;
            if (form) form.requestSubmit();
          }}
          size="lg"
          disabled={createStateMutation.isPending}
        >
          {createStateMutation.isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              در حال ایجاد...
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              ایجاد وضعیت ملک
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

