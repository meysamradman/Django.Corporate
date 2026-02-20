import React, { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { realEstateApi } from "@/api/real-estate";
import { TaxonomyDrawer } from "@/components/templates/TaxonomyDrawer";
import { FormField, FormFieldInput } from "@/components/shared/FormField";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
import { showError, showSuccess } from "@/core/toast";

interface CitySideProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editId?: number | null;
}

export const CitySide: React.FC<CitySideProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editId,
}) => {
  const isEditMode = !!editId;
  const [form, setForm] = useState({ name: "", code: "", province_id: "" });

  const { data: provinces = [] } = useQuery({
    queryKey: ["real-estate-provinces"],
    queryFn: realEstateApi.getProvinces,
    staleTime: 60_000,
  });

  const { data: cityData, isLoading } = useQuery({
    queryKey: ["real-estate-city", editId],
    queryFn: () => realEstateApi.getCityById(editId!),
    enabled: isEditMode,
  });

  useEffect(() => {
    if (!isOpen) return;
    if (isEditMode && cityData) {
      setForm({
        name: cityData.name || "",
        code: String(cityData.code || ""),
        province_id: cityData.province_id ? String(cityData.province_id) : "",
      });
      return;
    }
    if (!isEditMode) {
      setForm({ name: "", code: "", province_id: "" });
    }
  }, [isOpen, isEditMode, cityData]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim(),
        province_id: Number(form.province_id),
      };
      if (isEditMode) {
        return realEstateApi.updateCity(editId!, payload);
      }
      return realEstateApi.createCity(payload);
    },
    onSuccess: () => {
      showSuccess(isEditMode ? "شهر با موفقیت بروزرسانی شد" : "شهر با موفقیت ایجاد شد");
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (error) => showError(error),
  });

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.code.trim() || !form.province_id) {
      showError("نام، کد و استان شهر الزامی است");
      return;
    }
    await saveMutation.mutateAsync();
  };

  return (
    <TaxonomyDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? "ویرایش شهر" : "ایجاد شهر"}
      onSubmit={handleSubmit}
      isPending={saveMutation.isPending}
      isSubmitting={saveMutation.isPending}
      formId="real-estate-city-drawer-form"
      submitButtonText={isEditMode ? "بروزرسانی" : "ایجاد"}
    >
      <div className="grid gap-5">
        <FormFieldInput
          label="نام شهر"
          id="city_name"
          required
          value={form.name}
          disabled={isLoading}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="نام شهر"
        />
        <FormFieldInput
          label="کد شهر"
          id="city_code"
          required
          value={form.code}
          disabled={isLoading}
          onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
          placeholder="کد شهر"
        />
        <FormField label="استان" htmlFor="city_province" required>
          <Select
            value={form.province_id}
            onValueChange={(value) => setForm((prev) => ({ ...prev, province_id: value }))}
            disabled={isLoading}
          >
            <SelectTrigger id="city_province">
              <SelectValue placeholder="انتخاب استان" />
            </SelectTrigger>
            <SelectContent>
              {provinces.map((province) => (
                <SelectItem key={province.id} value={String(province.id)}>
                  {province.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </div>
    </TaxonomyDrawer>
  );
};
