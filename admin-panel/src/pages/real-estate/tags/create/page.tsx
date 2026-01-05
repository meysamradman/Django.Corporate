import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Button } from "@/components/elements/Button";
import { Input } from "@/components/elements/Input";
import { FormField } from "@/components/forms/FormField";
import { Switch } from "@/components/elements/Switch";
import { Item, ItemContent, ItemTitle, ItemDescription, ItemActions } from "@/components/elements/Item";
import { showError, showSuccess } from "@/core/toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { realEstateApi } from "@/api/real-estate";
import type { PropertyTag } from "@/types/real_estate/tags/realEstateTag";
import { generateSlug, formatSlug } from '@/core/slug/generate';
import { Hash, Loader2, Save } from "lucide-react";
import { propertyTagFormSchema, propertyTagFormDefaults } from '@/components/real-estate/validations/tagSchema';

export default function CreatePropertyTagPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState(propertyTagFormDefaults);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createTagMutation = useMutation({
    mutationFn: (data: Partial<PropertyTag>) => realEstateApi.createTag(data),
    onSuccess: () => {
      showSuccess("تگ ملک با موفقیت ایجاد شد");
      queryClient.invalidateQueries({ queryKey: ['property-tags'] });
      navigate("/real-estate/tags");
    },
    onError: (error: any) => {
      const errorData = error?.response?.data?.data;
      const errorMessage = errorData?.detail || 
                          error?.response?.data?.metaData?.message ||
                          "خطا در ایجاد تگ ملک";
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
    
    setErrors({});
    
    try {
      const validatedData = propertyTagFormSchema.parse(formData);
      createTagMutation.mutate(validatedData);
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

  return (
    <div className="space-y-6 pb-28 relative">

      <form id="tag-create-form" onSubmit={handleSubmit}>
        <CardWithIcon
          icon={Hash}
          title="اطلاعات تگ ملک"
          iconBgColor="bg-indigo"
          iconColor="stroke-indigo-2"
          borderColor="border-b-indigo-1"
          className="hover:shadow-lg transition-all duration-300"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="عنوان"
                htmlFor="title"
                required
                error={errors.title}
              >
                <Input
                  id="title"
                  value={formData.title || ""}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="عنوان تگ ملک"
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
                  value={formData.slug || ""}
                  onChange={(e) => handleInputChange("slug", e.target.value)}
                  placeholder="نامک"
                  required
                />
              </FormField>
            </div>

            <div className="mt-6 space-y-4">
              <div className="border border-green-1/40 bg-green-0/30 hover:border-green-1/60 transition-colors overflow-hidden">
                <Item variant="default" size="default" className="py-5">
                  <ItemContent>
                    <ItemTitle className="text-green-2">وضعیت فعال</ItemTitle>
                    <ItemDescription>
                      با غیرفعال شدن، تگ ملک از لیست مدیریت نیز مخفی می‌شود.
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
                      اگر غیرفعال باشد تگ در سایت نمایش داده نمی‌شود.
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
      </form>

      <div className="fixed bottom-0 left-0 right-0 lg:right-[20rem] z-50 border-t border-br bg-card shadow-lg transition-all duration-300 flex items-center justify-end gap-3 py-4 px-8">
        <Button
          type="button"
          onClick={() => {
            const form = document.getElementById('tag-create-form') as HTMLFormElement;
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
              ایجاد تگ ملک
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

