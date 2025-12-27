import { useState, useEffect, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Button } from "@/components/elements/Button";
import { Input } from "@/components/elements/Input";
import { FormField } from "@/components/forms/FormField";
import { Switch } from "@/components/elements/Switch";
import { Item, ItemContent, ItemTitle, ItemDescription, ItemActions } from "@/components/elements/Item";
import { showError, showSuccess, showInfo } from "@/core/toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { realEstateApi } from "@/api/real-estate";
import type { PropertyLabel } from "@/types/real_estate/label/realEstateLabel";
import { Tag, Loader2, Save, List } from "lucide-react";
import { Skeleton } from "@/components/elements/Skeleton";

export default function EditPropertyLabelPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const labelId = Number(id);
  
  const [formData, setFormData] = useState({
    title: "",
    is_active: true,
  });

  const { data: label, isLoading, error } = useQuery({
    queryKey: ['property-label', labelId],
    queryFn: () => realEstateApi.getLabelById(labelId),
    enabled: !!labelId,
  });

  useEffect(() => {
    if (label) {
      setFormData({
        title: label.title || "",
        is_active: label.is_active,
      });
    }
  }, [label]);

  const updateLabelMutation = useMutation({
    mutationFn: (data: Partial<PropertyLabel>) => realEstateApi.partialUpdateLabel(labelId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-label', labelId] });
      queryClient.invalidateQueries({ queryKey: ['property-labels'] });
      showSuccess("برچسب ملک با موفقیت به‌روزرسانی شد");
      navigate("/real-estate/labels");
    },
    onError: (error: any) => {
      const errorData = error?.response?.data?.data;
      const errorMessage = errorData?.detail || 
                          error?.response?.data?.metaData?.message ||
                          "خطا در به‌روزرسانی برچسب ملک";
      showError(errorMessage);
    },
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (!label) return;
    
    const submitData: Partial<PropertyLabel> = {};
    
    if (formData.title !== label.title) {
      submitData.title = formData.title;
    }
    
    if (formData.is_active !== label.is_active) {
      submitData.is_active = formData.is_active;
    }
    
    if (Object.keys(submitData).length === 0) {
      showInfo("تغییری اعمال نشده است");
      return;
    }
    
    updateLabelMutation.mutate(submitData);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-28 relative">
        <PageHeader title="ویرایش برچسب ملک">
          <Button 
            variant="outline"
            onClick={() => navigate("/real-estate/labels")}
          >
            <List className="h-4 w-4" />
            نمایش لیست
          </Button>
        </PageHeader>

        <CardWithIcon
          icon={Tag}
          title="اطلاعات برچسب ملک"
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
      <div className="space-y-6">
        <PageHeader title="ویرایش برچسب ملک" />
        <div className="text-center py-8">
          <p className="text-red-1 mb-4">خطا در بارگذاری داده‌ها</p>
          <Button 
            onClick={() => navigate(-1)} 
            className="mt-4"
          >
            بازگشت
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-28 relative">
      <PageHeader title="ویرایش برچسب ملک">
        <Button 
          variant="outline"
          onClick={() => navigate("/real-estate/labels")}
        >
          <List className="h-4 w-4" />
          نمایش لیست
        </Button>
      </PageHeader>

      <form id="label-edit-form" onSubmit={handleSubmit}>
        <CardWithIcon
          icon={Tag}
          title="اطلاعات برچسب ملک"
          iconBgColor="bg-blue"
          iconColor="stroke-blue-2"
          borderColor="border-b-blue-1"
          className="hover:shadow-lg transition-all duration-300"
        >
          <div className="space-y-6">
            <FormField
              label="عنوان"
              htmlFor="title"
              required
            >
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="عنوان برچسب ملک"
                required
              />
            </FormField>

            <div className="mt-6 space-y-4">
              <div className="rounded-xl border border-green-1/40 bg-green-0/30 hover:border-green-1/60 transition-colors overflow-hidden">
                <Item variant="default" size="default" className="py-5">
                  <ItemContent>
                    <ItemTitle className="text-green-2">وضعیت فعال</ItemTitle>
                    <ItemDescription>
                      با غیرفعال شدن، برچسب ملک از لیست مدیریت نیز مخفی می‌شود.
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
            const form = document.getElementById('label-edit-form') as HTMLFormElement;
            if (form) form.requestSubmit();
          }}
          size="lg"
          disabled={updateLabelMutation.isPending}
        >
          {updateLabelMutation.isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              در حال به‌روزرسانی...
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              به‌روزرسانی برچسب ملک
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

