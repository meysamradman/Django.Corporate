import React from "react";
import { realEstateApi } from "@/api/real-estate";
import { TaxonomyDrawer } from "@/components/templates/TaxonomyDrawer";
import { useRealEstateTaxonomyForm } from "@/components/real-estate/hooks/useRealEstateTaxonomyForm";
import { propertyTagFormSchema, propertyTagFormDefaults, type PropertyTagFormValues } from "@/components/real-estate/validations/tagSchema";
import { FormFieldInput, FormFieldTextarea, FormFieldSwitch } from "@/components/shared/FormField";

interface PropertyTagSideProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    editId?: number | null;
}

export const PropertyTagSide: React.FC<PropertyTagSideProps> = ({
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
    } = useRealEstateTaxonomyForm<PropertyTagFormValues>({
        id: editId?.toString(),
        isEditMode,
        schema: propertyTagFormSchema,
        defaultValues: propertyTagFormDefaults,
        fetchQueryKey: isEditMode ? ["property-tag", editId] : undefined,
        fetchQueryFn: isEditMode ? () => realEstateApi.getTagById(editId!) : undefined,
        createMutationFn: (data) => realEstateApi.createTag(data),
        updateMutationFn: (id, data) => realEstateApi.updateTag(id, data),
        invalidateQueryKeys: [["property-tags"]],
        onSuccessRedirect: "/real-estate/tags",
        onSuccess: () => {
            if (onSuccess) onSuccess();
            onClose();
        },
        itemLabel: "تگ",
        titleFieldName: "title",
    });

    const { register, formState: { errors }, watch, setValue } = form;

    return (
        <TaxonomyDrawer
            isOpen={isOpen}
            onClose={onClose}
            title={isEditMode ? "ویرایش تگ" : "ایجاد تگ جدید"}
            onSubmit={handleSubmit}
            isPending={isPending}
            isSubmitting={isSubmitting}
            formId="property-tag-drawer-form"
            submitButtonText={isEditMode ? "بروزرسانی" : "ایجاد"}
        >
            <div className="space-y-6">
                <div className="grid gap-5">
                    <FormFieldInput
                        label="عنوان"
                        id="title"
                        required
                        error={errors.title?.message as string}
                        placeholder="عنوان تگ را وارد کنید"
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

                    <FormFieldTextarea
                        label="توضیحات"
                        id="description"
                        error={errors.description?.message as string}
                        placeholder="توضیحات تگ"
                        rows={3}
                        {...register("description")}
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

                    <FormFieldSwitch
                        label="نمایش عمومی"
                        checked={!!watch("is_public")}
                        onCheckedChange={(checked: boolean) => setValue("is_public", checked)}
                    />
                </div>
            </div>
        </TaxonomyDrawer>
    );
};
