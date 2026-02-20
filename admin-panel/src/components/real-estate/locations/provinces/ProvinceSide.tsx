import React, { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { realEstateApi } from "@/api/real-estate";
import { TaxonomyDrawer } from "@/components/templates/TaxonomyDrawer";
import { FormFieldInput } from "@/components/shared/FormField";
import { showError, showSuccess } from "@/core/toast";

interface ProvinceSideProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editId?: number | null;
}

export const ProvinceSide: React.FC<ProvinceSideProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editId,
}) => {
  const isEditMode = !!editId;
  const [form, setForm] = useState({ name: "", code: "" });

  const { data: provinceData, isLoading } = useQuery({
    queryKey: ["real-estate-province", editId],
    queryFn: () => realEstateApi.getProvinceById(editId!),
    enabled: isEditMode,
  });

  useEffect(() => {
    if (!isOpen) return;
    if (isEditMode && provinceData) {
      setForm({
        name: provinceData.name || "",
        code: String(provinceData.code || ""),
      });
      return;
    }
    if (!isEditMode) {
      setForm({ name: "", code: "" });
    }
  }, [isOpen, isEditMode, provinceData]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim(),
      };
      if (isEditMode) {
        return realEstateApi.updateProvince(editId!, payload);
      }
      return realEstateApi.createProvince(payload);
    },
    onSuccess: () => {
      showSuccess(isEditMode ? "استان با موفقیت بروزرسانی شد" : "استان با موفقیت ایجاد شد");
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (error) => showError(error),
  });

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.code.trim()) {
      showError("نام و کد استان الزامی است");
      return;
    }
    await saveMutation.mutateAsync();
  };

  return (
    <TaxonomyDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? "ویرایش استان" : "ایجاد استان"}
      onSubmit={handleSubmit}
      isPending={saveMutation.isPending}
      isSubmitting={saveMutation.isPending}
      formId="real-estate-province-drawer-form"
      submitButtonText={isEditMode ? "بروزرسانی" : "ایجاد"}
    >
      <div className="grid gap-5">
        <FormFieldInput
          label="نام استان"
          id="province_name"
          required
          value={form.name}
          disabled={isLoading}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="نام استان"
        />
        <FormFieldInput
          label="کد استان"
          id="province_code"
          required
          value={form.code}
          disabled={isLoading}
          onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
          placeholder="کد استان"
        />
      </div>
    </TaxonomyDrawer>
  );
};
