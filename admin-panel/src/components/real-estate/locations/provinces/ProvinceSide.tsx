import React, { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { realEstateApi } from "@/api/real-estate";
import { TaxonomyDrawer } from "@/components/templates/TaxonomyDrawer";
import { FormFieldInput } from "@/components/shared/FormField";
import { Button } from "@/components/elements/Button";
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
  const [form, setForm] = useState({ name: "", code: "", slug: "", latitude: "", longitude: "", coordinates: "" });

  const normalizeCoordinateText = (value: string) => {
    return String(value || "")
      .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
      .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
      .replace(/،/g, ",")
      .trim();
  };

  const parseCombinedCoordinates = (value: string): { lat: number; lng: number } | null => {
    const normalized = normalizeCoordinateText(value);
    if (!normalized) return null;

    const parts = normalized.split(",").map((part) => part.trim()).filter(Boolean);
    if (parts.length !== 2) return null;

    const lat = Number(parts[0]);
    const lng = Number(parts[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  };

  const applyCombinedCoordinates = () => {
    if (!form.coordinates.trim()) return;

    const parsed = parseCombinedCoordinates(form.coordinates);
    if (!parsed) {
      showError("فرمت مختصات معتبر نیست. مثال: 35.6892, 51.3890");
      return;
    }

    if (parsed.lat < -90 || parsed.lat > 90) {
      showError("عرض جغرافیایی باید بین -90 تا 90 باشد");
      return;
    }

    if (parsed.lng < -180 || parsed.lng > 180) {
      showError("طول جغرافیایی باید بین -180 تا 180 باشد");
      return;
    }

    setForm((prev) => ({
      ...prev,
      latitude: parsed.lat.toString(),
      longitude: parsed.lng.toString(),
      coordinates: `${parsed.lat}, ${parsed.lng}`,
    }));
  };

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
        slug: provinceData.slug || "",
        latitude: provinceData.latitude !== null && provinceData.latitude !== undefined ? String(provinceData.latitude) : "",
        longitude: provinceData.longitude !== null && provinceData.longitude !== undefined ? String(provinceData.longitude) : "",
        coordinates: provinceData.latitude !== null && provinceData.latitude !== undefined && provinceData.longitude !== null && provinceData.longitude !== undefined
          ? `${provinceData.latitude}, ${provinceData.longitude}`
          : "",
      });
      return;
    }
    if (!isEditMode) {
      setForm({ name: "", code: "", slug: "", latitude: "", longitude: "", coordinates: "" });
    }
  }, [isOpen, isEditMode, provinceData]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim(),
        slug: form.slug.trim() || undefined,
        latitude: form.latitude.trim() === "" ? null : Number(form.latitude),
        longitude: form.longitude.trim() === "" ? null : Number(form.longitude),
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
        <FormFieldInput
          label="اسلاگ (اختیاری)"
          id="province_slug"
          value={form.slug}
          disabled={isLoading}
          onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
          placeholder="مثال: tehran"
        />
        <div className="space-y-2">
          <FormFieldInput
            label="مختصات ترکیبی (اختیاری)"
            id="province_coordinates"
            value={form.coordinates}
            disabled={isLoading}
            onChange={(e) => setForm((prev) => ({ ...prev, coordinates: e.target.value }))}
            placeholder="35.6892, 51.3890"
          />
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-font-s">از گوگل مپ مستقیم `lat, lng` کپی کن و اعمال بزن.</p>
            <Button type="button" size="sm" variant="outline" onClick={applyCombinedCoordinates} disabled={isLoading || !form.coordinates.trim()}>
              اعمال مختصات
            </Button>
          </div>
        </div>
        <FormFieldInput
          label="عرض جغرافیایی (اختیاری)"
          id="province_latitude"
          value={form.latitude}
          disabled={isLoading}
          onChange={(e) => setForm((prev) => ({ ...prev, latitude: e.target.value }))}
          placeholder="مثال: 35.6892"
        />
        <FormFieldInput
          label="طول جغرافیایی (اختیاری)"
          id="province_longitude"
          value={form.longitude}
          disabled={isLoading}
          onChange={(e) => setForm((prev) => ({ ...prev, longitude: e.target.value }))}
          placeholder="مثال: 51.3890"
        />
      </div>
    </TaxonomyDrawer>
  );
};
