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
import type { PropertyState } from "@/types/real_estate/state/propertyState";
import { Circle, Loader2, Save, List } from "lucide-react";
import { Skeleton } from "@/components/elements/Skeleton";

export default function EditPropertyStatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const stateId = Number(id);
  
  const [formData, setFormData] = useState({
    title: "",
    is_active: true,
  });

  const { data: state, isLoading, error } = useQuery({
    queryKey: ['property-state', stateId],
    queryFn: () => realEstateApi.getStateById(stateId),
    enabled: !!stateId,
  });

  useEffect(() => {
    if (state) {
      setFormData({
        title: state.title || "",
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
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (!state) return;
    
    const submitData: Partial<PropertyState> = {};
    
    if (formData.title !== state.title) {
      submitData.title = formData.title;
    }
    
    if (formData.is_active !== state.is_active) {
      submitData.is_active = formData.is_active;
    }
    
    if (Object.keys(submitData).length === 0) {
      showInfo("تغییری اعمال نشده است");
      return;
    }
    
    updateStateMutation.mutate(submitData);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-28 relative">
        <PageHeader title="ویرایش وضعیت ملک">
          <Button 
            variant="outline"
            onClick={() => navigate("/real-estate/states")}
          >
            <List className="h-4 w-4" />
            نمایش لیست
          </Button>
        </PageHeader>

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
      <div className="space-y-6">
        <PageHeader title="ویرایش وضعیت ملک" />
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
      <PageHeader title="ویرایش وضعیت ملک">
        <Button 
          variant="outline"
          onClick={() => navigate("/real-estate/states")}
        >
          <List className="h-4 w-4" />
          نمایش لیست
        </Button>
      </PageHeader>

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

