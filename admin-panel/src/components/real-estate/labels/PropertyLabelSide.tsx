import React from "react";
import { realEstateApi } from "@/api/real-estate/properties";
import { TaxonomyDrawer } from "@/components/templates/TaxonomyDrawer";
import { useRealEstateTaxonomyForm } from "@/components/real-estate/hooks/useRealEstateTaxonomyForm";
import { propertyLabelFormSchema, propertyLabelFormDefaults, type PropertyLabelFormValues } from "@/components/real-estate/validations/labelSchema";
import { FormFieldInput, FormFieldSwitch } from "@/components/shared/FormField";

interface PropertyLabelSideProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    editId?: number | null;
}

export const PropertyLabelSide: React.FC<PropertyLabelSideProps> = ({
    isOpen,
    onClose,
    onSuccess,
    editId,
}) => {
    const isEditMode = !!editId;

    const {
        form,
        handleSubmit,
        isPending,
        isSubmitting,
    } = useRealEstateTaxonomyForm<PropertyLabelFormValues>({
        id: editId?.toString(),
        isEditMode,
        schema: propertyLabelFormSchema,
        defaultValues: propertyLabelFormDefaults,
        fetchQueryKey: isEditMode ? ["property-label", editId] : undefined,
        fetchQueryFn: isEditMode ? () => realEstateApi.getLabelById(editId!) : undefined,
        createMutationFn: (data) => realEstateApi.createLabel(data),
        updateMutationFn: (id, data) => realEstateApi.updateLabel(id, data),
        invalidateQueryKeys: [["property-labels"]],
        onSuccessRedirect: "/real-estate/labels",
        onSuccess: () => {
            if (onSuccess) onSuccess();
            onClose();
        },
        itemLabel: "برچسب",
        titleFieldName: "title",
    });

    const { register, formState: { errors }, watch, setValue } = form;

    return (
        <TaxonomyDrawer
            isOpen={isOpen}
            onClose={onClose}
            title={isEditMode ? "ویرایش برچسب" : "ایجاد برچسب جدید"}
            onSubmit={handleSubmit}
            isPending={isPending}
            isSubmitting={isSubmitting}
            formId="property-label-drawer-form"
            submitButtonText={isEditMode ? "بروزرسانی" : "ایجاد"}
        >
            <div className="space-y-6">
                <div className="grid gap-5">
                    <FormFieldInput
                        label="عنوان"
                        id="title"
                        required
                        error={errors.title?.message as string}
                        placeholder="عنوان برچسب را وارد کنید"
                        {...register("title")}
                    />

                    <FormFieldInput
                        label="نامک"
                        id="slug"
                        required
                        error={errors.slug?.message as string}
                        placeholder="نامک یکتا"
                        {...register("slug")}
                    />
                </div>
            </div>

            <div className="pt-4 space-y-4">
                <div className="flex items-center gap-2 px-1">
                    <div className="w-1 h-3.5 bg-primary rounded-full" />
                    <h4 className="text-[12px] font-black text-font-p opacity-90 uppercase tracking-tight">تنظیمات نمایش</h4>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <FormFieldSwitch
                        label="وضعیت فعال"
                        checked={!!watch("is_active")}
                        onCheckedChange={(checked: boolean) => setValue("is_active", checked)}
                    />
                </div>
            </div>
        </TaxonomyDrawer>
    );
};
