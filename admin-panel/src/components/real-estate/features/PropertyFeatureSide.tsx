import React from "react";
import { realEstateApi } from "@/api/real-estate/properties";
import { TaxonomyDrawer } from "@/components/templates/TaxonomyDrawer";
import { useRealEstateTaxonomyForm } from "@/components/real-estate/hooks/useRealEstateTaxonomyForm";
import { propertyFeatureFormSchema, propertyFeatureFormDefaults, type PropertyFeatureFormValues } from "@/components/real-estate/validations/featureSchema";
import { FormFieldInput, FormFieldSwitch } from "@/components/shared/FormField";
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
        autoSlug: false, // Features don't have slug in the schema shown
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
                    size="sm"
                    context="real-estate"
                    placeholderColor="indigo"
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
                        label="گروه"
                        id="group"
                        error={errors.group?.message as string}
                        placeholder="نام گروه (اختیاری)"
                        {...register("group")}
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
