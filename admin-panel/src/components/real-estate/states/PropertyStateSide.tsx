import React from "react";
import { realEstateApi } from "@/api/real-estate";
import { TaxonomyDrawer } from "@/components/templates/TaxonomyDrawer";
import { useRealEstateTaxonomyForm } from "@/components/real-estate/hooks/useRealEstateTaxonomyForm";
import { propertyStateFormSchema, propertyStateFormDefaults, type PropertyStateFormValues } from "@/components/real-estate/validations/stateSchema";
import { FormField, FormFieldInput, FormFieldSwitch } from "@/components/shared/FormField";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";

interface PropertyStateSideProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    editId?: number | null;
}

export const PropertyStateSide: React.FC<PropertyStateSideProps> = ({
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
    } = useRealEstateTaxonomyForm<PropertyStateFormValues>({
        id: editId?.toString(),
        isEditMode,
        schema: propertyStateFormSchema,
        defaultValues: propertyStateFormDefaults,
        fetchQueryKey: isEditMode ? ["property-state", editId] : undefined,
        fetchQueryFn: isEditMode ? () => realEstateApi.getStateById(editId!) : undefined,
        createMutationFn: (data) => realEstateApi.createState(data),
        updateMutationFn: (id, data) => realEstateApi.updateState(id, data),
        invalidateQueryKeys: [["property-states"]],
        onSuccessRedirect: "/real-estate/states",
        onSuccess: () => {
            if (onSuccess) onSuccess();
            onClose();
        },
        itemLabel: "وضعیت ملک",
        titleFieldName: "title",
    });

    const { register, formState: { errors }, watch, setValue } = form;

    return (
        <TaxonomyDrawer
            isOpen={isOpen}
            onClose={onClose}
            title={isEditMode ? "ویرایش وضعیت ملک" : "ایجاد وضعیت ملک جدید"}
            onSubmit={handleSubmit}
            isPending={isPending}
            isSubmitting={isSubmitting}
            formId="property-state-drawer-form"
            submitButtonText={isEditMode ? "بروزرسانی" : "ایجاد"}
        >
            <div className="space-y-6">
                <div className="grid gap-5">
                    <FormFieldInput
                        label="عنوان"
                        id="title"
                        required
                        error={errors.title?.message as string}
                        placeholder="عنوان وضعیت را وارد کنید (مثال: فروشی)"
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
                        label="نوع کاربری"
                        htmlFor="usage_type"
                        required
                        error={errors.usage_type?.message as string}
                    >
                        <Select
                            value={watch("usage_type")}
                            onValueChange={(value) => setValue("usage_type", value, { shouldValidate: true })}
                        >
                            <SelectTrigger id="usage_type">
                                <SelectValue placeholder="انتخاب نوع کاربری" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="sale">فروش</SelectItem>
                                <SelectItem value="rent">اجاره</SelectItem>
                                <SelectItem value="mortgage">رهن</SelectItem>
                                <SelectItem value="presale">پیش‌فروش</SelectItem>
                                <SelectItem value="exchange">معاوضه</SelectItem>
                            </SelectContent>
                        </Select>
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
