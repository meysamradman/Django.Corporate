import { useState, useEffect, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Button } from "@/components/elements/Button";
import { Input } from "@/components/elements/Input";
import { FormField, FormFieldTextarea } from "@/components/forms/FormField";
import { Switch } from "@/components/elements/Switch";
import { Item, ItemContent, ItemTitle, ItemDescription, ItemActions } from "@/components/elements/Item";
import { showError, showSuccess, showInfo } from "@/core/toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { realEstateApi } from "@/api/real-estate";
import type { PropertyTag } from "@/types/real_estate/tags/realEstateTag";
import { Hash, Loader2, Save } from "lucide-react";
import { Skeleton } from "@/components/elements/Skeleton";
import { generateSlug, formatSlug } from '@/core/slug/generate';
import { propertyTagFormSchema } from '@/components/real-estate/validations/tagSchema';

export default function EditPropertyTagPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const tagId = Number(id);
  
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    is_active: true,
    is_public: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: tag, isLoading, error } = useQuery({
    queryKey: ['property-tag', tagId],
    queryFn: () => realEstateApi.getTagById(tagId),
    enabled: !!tagId,
  });

  useEffect(() => {
    if (tag) {
      setFormData({
        title: tag.title || "",
        slug: tag.slug || "",
        description: tag.description || "",
        is_active: tag.is_active ?? true,
        is_public: tag.is_public ?? true,
      });
    }
  }, [tag]);

  const updateTagMutation = useMutation({
    mutationFn: (data: Partial<PropertyTag>) => realEstateApi.partialUpdateTag(tagId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-tag', tagId] });
      queryClient.invalidateQueries({ queryKey: ['property-tags'] });
      showSuccess("تگ ملک با موفقیت به‌روزرسانی شد");
      navigate("/real-estate/tags");
    },
    onError: (error: any) => {
      const errorData = error?.response?.data?.data;
      const errorMessage = errorData?.detail || 
                          error?.response?.data?.metaData?.message ||
                          "خطا در به‌روزرسانی تگ ملک";
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
    
    if (!tag) return;
    
    setErrors({});
    
    try {
      const validatedData = propertyTagFormSchema.parse(formData);
      
      const submitData: Partial<PropertyTag> = {};
      
      if (validatedData.title !== tag.title) {
        submitData.title = validatedData.title;
      }
      
      if (validatedData.slug !== tag.slug) {
        submitData.slug = validatedData.slug;
      }
      
      if (validatedData.description !== (tag.description || "")) {
        submitData.description = validatedData.description || "";
      }
      
      if (validatedData.is_active !== (tag.is_active ?? true)) {
        submitData.is_active = validatedData.is_active;
      }
      
      if (validatedData.is_public !== (tag.is_public ?? true)) {
        submitData.is_public = validatedData.is_public;
      }
      
      if (Object.keys(submitData).length === 0) {
        showInfo("تغییری اعمال نشده است");
        return;
      }
      
      updateTagMutation.mutate(submitData);
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

  if (isLoading) {
    return (
      <div className="space-y-6 pb-28 relative">

        <CardWithIcon
          icon={Hash}
          title="اطلاعات تگ ملک"
          iconBgColor="bg-blue"
          iconColor="stroke-blue-2"
          borderColor="border-b-blue-1"
        >
          <div className="space-y-6">
            <Skeleton className="h-10 w-full" />
          </div>
        </CardWithIcon>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-1 mb-4">خطا در بارگذاری داده‌ها</p>
        <Button 
          onClick={() => navigate(-1)} 
          className="mt-4"
        >
          بازگشت
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-28 relative">

      <form id="tag-edit-form" onSubmit={handleSubmit}>
        <CardWithIcon
          icon={Hash}
          title="اطلاعات تگ ملک"
          iconBgColor="bg-blue"
          iconColor="stroke-blue-2"
          borderColor="border-b-blue-1"
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
                  value={formData.title}
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
                  value={formData.slug}
                  onChange={(e) => handleInputChange("slug", e.target.value)}
                  placeholder="نامک"
                  required
                />
              </FormField>
            </div>

            <FormFieldTextarea
              label="توضیحات"
              id="description"
              placeholder="توضیحات تگ ملک (اختیاری)"
              rows={4}
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
            />

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
            const form = document.getElementById('tag-edit-form') as HTMLFormElement;
            if (form) form.requestSubmit();
          }}
          size="lg"
          disabled={updateTagMutation.isPending}
        >
          {updateTagMutation.isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              در حال به‌روزرسانی...
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              به‌روزرسانی تگ ملک
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

