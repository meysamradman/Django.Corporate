import React, { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { realEstateApi } from "@/api/real-estate";
import { TaxonomyDrawer } from "@/components/templates/TaxonomyDrawer";
import { FormField, FormFieldInput } from "@/components/shared/FormField";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
import { showError, showSuccess } from "@/core/toast";

interface RegionSideProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editId?: number | null;
}

export const RegionSide: React.FC<RegionSideProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editId,
}) => {
  const isEditMode = !!editId;
  const [form, setForm] = useState({ name: "", code: "", slug: "", city_id: "" });

  const { data: cities = [] } = useQuery({
    queryKey: ["real-estate-cities-for-regions"],
    queryFn: () => realEstateApi.getCities(),
    staleTime: 60_000,
  });

  const { data: regionData, isLoading } = useQuery({
    queryKey: ["real-estate-region", editId],
    queryFn: () => realEstateApi.getRegionById(editId!),
    enabled: isEditMode,
  });

  useEffect(() => {
    if (!isOpen) return;
    if (isEditMode && regionData) {
      setForm({
        name: regionData.name || "",
        code: String(regionData.code || ""),
        slug: regionData.slug || "",
        city_id: regionData.city_id ? String(regionData.city_id) : "",
      });
      return;
    }
    if (!isEditMode) {
      setForm({ name: "", code: "", slug: "", city_id: "" });
    }
  }, [isOpen, isEditMode, regionData]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        code: Number(form.code),
        slug: form.slug.trim() || undefined,
        city_id: Number(form.city_id),
      };
      if (isEditMode) {
        return realEstateApi.updateRegion(editId!, payload);
      }
      return realEstateApi.createRegion(payload);
    },
    onSuccess: () => {
      showSuccess(isEditMode ? "منطقه با موفقیت بروزرسانی شد" : "منطقه با موفقیت ایجاد شد");
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (error) => showError(error),
  });

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.code.trim() || !form.city_id) {
      showError("نام، کد و شهر منطقه الزامی است");
      return;
    }
    if (Number.isNaN(Number(form.code))) {
      showError("کد منطقه باید عدد باشد");
      return;
    }
    await saveMutation.mutateAsync();
  };

  return (
    <TaxonomyDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? "ویرایش منطقه" : "ایجاد منطقه"}
      onSubmit={handleSubmit}
      isPending={saveMutation.isPending}
      isSubmitting={saveMutation.isPending}
      formId="real-estate-region-drawer-form"
      submitButtonText={isEditMode ? "بروزرسانی" : "ایجاد"}
    >
      <div className="grid gap-5">
        <FormFieldInput
          label="نام منطقه"
          id="region_name"
          required
          value={form.name}
          disabled={isLoading}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="نام منطقه"
        />
        <FormFieldInput
          label="کد منطقه"
          id="region_code"
          required
          value={form.code}
          disabled={isLoading}
          onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
          placeholder="کد منطقه (عدد)"
        />
        <FormFieldInput
          label="اسلاگ (اختیاری)"
          id="region_slug"
          value={form.slug}
          disabled={isLoading}
          onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
          placeholder="مثال: district-1"
        />
        <FormField label="شهر" htmlFor="region_city" required>
          <Select
            value={form.city_id}
            onValueChange={(value) => setForm((prev) => ({ ...prev, city_id: value }))}
            disabled={isLoading}
          >
            <SelectTrigger id="region_city">
              <SelectValue placeholder="انتخاب شهر" />
            </SelectTrigger>
            <SelectContent>
              {cities.map((city) => (
                <SelectItem key={city.id} value={String(city.id)}>
                  {city.name} - {city.province_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </div>
    </TaxonomyDrawer>
  );
};
