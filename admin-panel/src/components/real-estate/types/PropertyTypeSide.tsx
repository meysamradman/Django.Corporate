import React from "react";
import { useQuery } from "@tanstack/react-query";
import { realEstateApi } from "@/api/real-estate";
import { TaxonomyDrawer } from "@/components/templates/TaxonomyDrawer";
import { useRealEstateTaxonomyForm } from "@/components/real-estate/hooks/useRealEstateTaxonomyForm";
import { propertyTypeFormSchema, propertyTypeFormDefaults, type PropertyTypeFormValues } from "@/components/real-estate/validations/typeSchema";
import { FormField, FormFieldInput, FormFieldTextarea, FormFieldSwitch } from "@/components/shared/FormField";
import { TreeSelect } from "@/components/elements/TreeSelect";
import { ImageSelector } from "@/components/media/selectors/ImageSelector";

interface PropertyTypeSideProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    editId?: number | null;
}

export const PropertyTypeSide: React.FC<PropertyTypeSideProps> = ({
    isOpen,
    onClose,
    onSuccess,
    editId,
}) => {
    const isEditMode = !!editId;

    const {
        form,
        selectedMedia,
        handleImageSelect,
        handleSubmit,
        isPending,
        isSubmitting,
    } = useRealEstateTaxonomyForm<PropertyTypeFormValues>({
        id: editId?.toString(),
        isEditMode,
        schema: propertyTypeFormSchema,
        defaultValues: propertyTypeFormDefaults,
        fetchQueryKey: isEditMode ? ["property-type", editId] : undefined,
        fetchQueryFn: isEditMode ? () => realEstateApi.getTypeById(editId!) : undefined,
        createMutationFn: (data) => realEstateApi.createType(data),
        updateMutationFn: (id, data) => realEstateApi.updateType(id, data),
        invalidateQueryKeys: [["property-types"], ["property-types-tree"]],
        onSuccessRedirect: "/real-estate/types",
        onSuccess: () => {
            if (onSuccess) onSuccess();
            onClose();
        },
        itemLabel: "نوع ملک",
        titleFieldName: "title",
    });

    const { register, formState: { errors }, watch, setValue } = form;

    const { data: types } = useQuery({
        queryKey: ["property-types-tree"],
        queryFn: () => realEstateApi.getTypes({ size: 100 }),
    });

    return (
        <TaxonomyDrawer
            isOpen={isOpen}
            onClose={onClose}
            title={isEditMode ? "ویرایش نوع ملک" : "ایجاد نوع ملک جدید"}
            onSubmit={handleSubmit}
            isPending={isPending}
            isSubmitting={isSubmitting}
            formId="property-type-drawer-form"
            submitButtonText={isEditMode ? "بروزرسانی" : "ایجاد"}
        >
            <div className="space-y-6">
                <ImageSelector
                    selectedMedia={selectedMedia}
                    onMediaSelect={handleImageSelect}
                    size="sm"
                    context="real_estate"
                    placeholderColor="primary"
                    alt="تصویر نوع ملک"
                    className="mx-auto"
                />

                <div className="grid gap-5">
                    <FormFieldInput
                        label="عنوان"
                        id="title"
                        required
                        error={errors.title?.message as string}
                        placeholder="عنوان نوع ملک را وارد کنید"
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

                    <FormField
                        label="نوع والد"
                        htmlFor="parent_id"
                        error={errors.parent_id?.message as string}
                    >
                        <TreeSelect
                            data={(types?.data || []).map((type: any) => ({
                                ...type,
                                name: type.name || type.title || "",
                            }))}
                            value={watch("parent_id")?.toString() || null}
                            onChange={(value) => setValue("parent_id", value ? parseInt(value) : null, { shouldValidate: true })}
                            placeholder="انتخاب نوع والد (اختیاری)"
                            searchPlaceholder="جستجوی نوع ملک..."
                            emptyText="نوع ملک یافت نشد"
                        />
                    </FormField>

                    <FormFieldInput
                        label="ترتیب نمایش"
                        id="display_order"
                        type="number"
                        error={errors.display_order?.message as string}
                        placeholder="0"
                        {...register("display_order", { valueAsNumber: true })}
                    />

                    <FormFieldTextarea
                        label="توضیحات"
                        id="description"
                        error={errors.description?.message as string}
                        placeholder="توضیحات نوع ملک"
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
                </div>
            </div>
        </TaxonomyDrawer>
    );
};
