import { useState, useEffect, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Button } from "@/components/elements/Button";
import { Input } from "@/components/elements/Input";
import { FormField } from "@/components/forms/FormField";
import { Switch } from "@/components/elements/Switch";
import { Item, ItemContent, ItemTitle, ItemDescription, ItemActions } from "@/components/elements/Item";
import { showError, showSuccess, showInfo } from "@/core/toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { realEstateApi } from "@/api/real-estate";
import type { PropertyState } from "@/types/real_estate/state/realEstateState";
import { generateSlug, formatSlug } from '@/core/slug/generate';
import { propertyStateFormSchema } from "@/components/real-estate/validations/stateSchema";
import { Circle, Loader2, Save, Type } from "lucide-react";
import { Skeleton } from "@/components/elements/Skeleton";

export default function EditPropertyStatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const stateId = Number(id);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    usage_type: "",
    is_active: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: state, isLoading, error } = useQuery({
    queryKey: ['property-state', stateId],
    queryFn: () => realEstateApi.getStateById(stateId),
    enabled: !!stateId,
  });

  const { data: fieldOptions } = useQuery({
    queryKey: ['property-state-field-options'],
    queryFn: () => realEstateApi.getStateFieldOptions(),
  });

  useEffect(() => {
    if (state) {
      setFormData({
        title: state.title || "",
        slug: state.slug || "",
        usage_type: state.usage_type || "",
        is_active: state.is_active,
      });
    }
  }, [state]);

  const updateStateMutation = useMutation({
    mutationFn: (data: Partial<PropertyState>) => realEstateApi.partialUpdateState(stateId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-state', stateId] });
      queryClient.invalidateQueries({ queryKey: ['property-states'] });
      showSuccess("وضعیت ملک با موفقیت به‌روزرسانی شد");
      navigate("/real-estate/states");
    },
    onError: (error: any) => {
      const errorData = error?.response?.data?.data;
      const errorMessage = errorData?.detail ||
        error?.response?.data?.metaData?.message ||
        "خطا در به‌روزرسانی وضعیت ملک";
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

    if (!state) return;

    setErrors({});

    try {
      const validatedData = propertyStateFormSchema.parse(formData);
      
      const submitData: Partial<PropertyState> = {};

      if (validatedData.title !== state.title) {
        submitData.title = validatedData.title;
      }

      if (validatedData.slug !== state.slug) {
        submitData.slug = validatedData.slug;
      }

      if (validatedData.is_active !== state.is_active) {
        submitData.is_active = validatedData.is_active;
      }

      if (validatedData.usage_type !== state.usage_type) {
        submitData.usage_type = validatedData.usage_type;
      }

      if (Object.keys(submitData).length === 0) {
        showInfo("تغییری اعمال نشده است");
        return;
      }

      updateStateMutation.mutate(submitData);
    } catch (error: any) {
      if (error.errors) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err: any) => {
          if (err.path && err.path.length > 0) {
            fieldErrors[err.path[0]] = err.message;
          }
        });
        setErrors(fieldErrors);
        if (Object.keys(fieldErrors).length > 0) {
          const firstError = Object.values(fieldErrors)[0];
          showError(firstError);
        }
      } else {
        showError("خطا در اعتبارسنجی فرم");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-28 relative">

        <CardWithIcon
          icon={Circle}
          title="اطلاعات وضعیت ملک"
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

      <form id="state-edit-form" onSubmit={handleSubmit}>
        <CardWithIcon
          icon={Circle}
          title="اطلاعات وضعیت ملک"
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
                  placeholder="عنوان وضعیت ملک"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="نوع کاربری (سیستمی)"
                htmlFor="usage_type"
                required
                error={errors.usage_type}
              >
                <Select
                  value={formData.usage_type}
                  onValueChange={(value) => handleInputChange("usage_type", value)}
                >
                  <SelectTrigger id="usage_type">
                    <SelectValue placeholder="انتخاب نوع کاربری" />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldOptions?.usage_type.map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            <div className="mt-6 space-y-4">
              <div className="border border-green-1/40 bg-green-0/30 hover:border-green-1/60 transition-colors overflow-hidden">
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
            const form = document.getElementById('state-edit-form') as HTMLFormElement;
            if (form) form.requestSubmit();
          }}
          size="lg"
          disabled={updateStateMutation.isPending}
        >
          {updateStateMutation.isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              در حال به‌روزرسانی...
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              به‌روزرسانی وضعیت ملک
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

