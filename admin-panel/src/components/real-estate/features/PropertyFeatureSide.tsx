import React from "react";
import { useQuery } from "@tanstack/react-query";
import { realEstateApi } from "@/api/real-estate";
import { TaxonomyDrawer } from "@/components/templates/TaxonomyDrawer";
import { useRealEstateTaxonomyForm } from "@/components/real-estate/hooks/useRealEstateTaxonomyForm";
import { propertyFeatureFormSchema, propertyFeatureFormDefaults, type PropertyFeatureFormValues } from "@/components/real-estate/validations/featureSchema";
import { FormField, FormFieldInput, FormFieldSwitch } from "@/components/shared/FormField";
import { TreeSelect } from "@/components/elements/TreeSelect";
import { ImageSelector } from "@/components/media/selectors/ImageSelector";

interface PropertyFeatureSideProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    editId?: number | null;
}

export const PropertyFeatureSide: React.FC<PropertyFeatureSideProps> = ({
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
        isLoading,
        isPending,
        isSubmitting,
    } = useRealEstateTaxonomyForm<PropertyFeatureFormValues>({
        id: editId?.toString(),
        isEditMode,
        schema: propertyFeatureFormSchema,
        defaultValues: propertyFeatureFormDefaults,
        fetchQueryKey: isEditMode ? ["property-feature", editId] : undefined,
        fetchQueryFn: isEditMode ? () => realEstateApi.getFeatureById(editId!) : undefined,
        createMutationFn: (data) => realEstateApi.createFeature(data),
        updateMutationFn: (id, data) => realEstateApi.updateFeature(id, data),
        invalidateQueryKeys: [["property-features"]],
        onSuccessRedirect: "/real-estate/features",
        onSuccess: () => {
            if (onSuccess) onSuccess();
            onClose();
        },
        itemLabel: "ویژگی ملک",
        titleFieldName: "title",
    });

    const { data: features } = useQuery({
        queryKey: ["property-features-tree"],
        queryFn: () => realEstateApi.getFeatures({ size: 200, is_active: true }),
    });

    const { register, formState: { errors }, watch, setValue } = form;

    return (
        <TaxonomyDrawer
            isOpen={isOpen}
            onClose={onClose}
            title={isEditMode ? "ویرایش ویژگی ملک" : "ایجاد ویژگی ملک جدید"}
            onSubmit={handleSubmit}
            isPending={isPending}
            isSubmitting={isSubmitting}
            formId="property-feature-drawer-form"
            submitButtonText={isEditMode ? "بروزرسانی" : "ایجاد"}
        >
            <div className="space-y-6">
                <ImageSelector
                    selectedMedia={selectedMedia}
                    onMediaSelect={handleImageSelect}
                    loading={isEditMode && isLoading && !selectedMedia}
                    showRemoveButton={false}
                    size="sm"
                    context="real_estate"
                    placeholderColor="purple"
                    alt="آیکون ویژگی"
                    className="mx-auto"
                />

                <div className="grid gap-5">
                    <FormFieldInput
                        label="عنوان"
                        id="title"
                        required
                        error={errors.title?.message as string}
                        placeholder="عنوان ویژگی را وارد کنید (مثال: پارکینگ)"
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

                    <FormFieldInput
                        label="گروه"
                        id="group"
                        error={errors.group?.message as string}
                        placeholder="نام گروه (اختیاری)"
                        {...register("group")}
                    />

                    <FormField
                        label="ویژگی والد"
                        htmlFor="parent_id"
                        error={errors.parent_id?.message as string}
                    >
                        <TreeSelect
                            data={(features?.data || [])
                                .filter((feature: any) => Number(feature.id) !== Number(editId || 0))
                                .map((feature: any) => ({
                                    ...feature,
                                    name: feature.name || feature.title || "",
                                }))}
                            value={watch("parent_id")?.toString() || null}
                            onChange={(value) => setValue("parent_id", value ? parseInt(value) : null, { shouldValidate: true })}
                            placeholder="انتخاب ویژگی والد (اختیاری)"
                            searchPlaceholder="جستجوی ویژگی..."
                            emptyText="ویژگی یافت نشد"
                        />
                    </FormField>
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
