import React from "react";
import { realEstateApi } from "@/api/real-estate";
import { TaxonomyDrawer } from "@/components/templates/TaxonomyDrawer";
import { useRealEstateTaxonomyForm } from "@/components/real-estate/hooks/useRealEstateTaxonomyForm";
import { listingTypeFormSchema, listingTypeFormDefaults, type ListingTypeFormValues } from "@/components/real-estate/validations/listingTypesSchema";
import { FormField, FormFieldInput, FormFieldTextarea, FormFieldSwitch } from "@/components/shared/FormField";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
import { ImageSelector } from "@/components/media/selectors/ImageSelector";

interface PropertyListingTypesSideProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    editId?: number | null;
}

export const PropertyListingTypesSide: React.FC<PropertyListingTypesSideProps> = ({
    isOpen,
    onClose,
    onSuccess,
    editId,
}) => {
    const isEditMode = !!editId;
    const [usageTypeOptions, setUsageTypeOptions] = React.useState<[string, string][]>([]);

    const {
        form,
        selectedMedia,
        handleImageSelect,
        handleSubmit,
        isLoading,
        isPending,
        isSubmitting,
    } = useRealEstateTaxonomyForm<ListingTypeFormValues>({
        id: editId?.toString(),
        isEditMode,
        schema: listingTypeFormSchema,
        defaultValues: listingTypeFormDefaults,
        fetchQueryKey: isEditMode ? ["listing-type", editId] : undefined,
        fetchQueryFn: isEditMode ? () => realEstateApi.getListingTypeById(editId!) : undefined,
        createMutationFn: (data) => realEstateApi.createListingType(data),
        updateMutationFn: (id, data) => realEstateApi.updateListingType(id, data),
        invalidateQueryKeys: [["listing-types"]],
        onSuccessRedirect: "/real-estate/listing-types",
        onSuccess: () => {
            if (onSuccess) onSuccess();
            onClose();
        },
        itemLabel: "نوع معامله ملک",
        titleFieldName: "title",
    });

    const { register, formState: { errors }, watch, setValue } = form;

    React.useEffect(() => {
        let isMounted = true;

        const loadFieldOptions = async () => {
            try {
                const options = await realEstateApi.getListingTypeFieldOptions();
                if (isMounted) {
                    setUsageTypeOptions(options?.usage_type || []);
                }
            } catch {
                if (isMounted) {
                    setUsageTypeOptions([]);
                }
            }
        };

        loadFieldOptions();
        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <TaxonomyDrawer
            isOpen={isOpen}
            onClose={onClose}
            title={isEditMode ? "ویرایش نوع معامله ملک" : "ایجاد نوع معامله ملک"}
            onSubmit={handleSubmit}
            isPending={isPending}
            isSubmitting={isSubmitting}
            formId="listing-type-drawer-form"
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
                    placeholderColor="primary"
                    alt="تصویر نوع معامله ملک"
                    className="mx-auto"
                />

                <div className="grid gap-5">
                    <FormFieldInput
                        label="عنوان"
                        id="title"
                        required
                        error={errors.title?.message as string}
                        placeholder="عنوان نوع معامله را وارد کنید (مثال: فروشی)"
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
                        label="توضیحات کوتاه"
                        id="short_description"
                        error={errors.short_description?.message as string}
                        placeholder="توضیحات کوتاه نوع معامله ملک"
                        rows={3}
                        maxLength={255}
                        {...register("short_description")}
                    />

                    <FormField
                        label="نوع کاربری"
                        htmlFor="usage_type"
                        required
                        error={errors.usage_type?.message as string}
                    >
                        <Select
                            value={watch("usage_type") || ""}
                            onValueChange={(value) => setValue("usage_type", value, { shouldValidate: true, shouldDirty: true })}
                        >
                            <SelectTrigger id="usage_type">
                                <SelectValue placeholder="انتخاب نوع کاربری" />
                            </SelectTrigger>
                            <SelectContent>
                                {usageTypeOptions.map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                ))}
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
