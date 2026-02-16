import React from "react";
import { useQuery } from "@tanstack/react-query";
import { portfolioApi } from "@/api/portfolios/portfolios";
import { TaxonomyDrawer } from "@/components/templates/TaxonomyDrawer";
import { useRealEstateTaxonomyForm } from "@/components/real-estate/hooks/useRealEstateTaxonomyForm";
import { portfolioCategoryFormSchema, portfolioCategoryFormDefaults, type PortfolioCategoryFormValues } from "@/components/portfolios/validations/categorySchema";
import { FormField, FormFieldInput, FormFieldTextarea, FormFieldSwitch } from "@/components/shared/FormField";
import { TreeSelect } from "@/components/elements/TreeSelect";
import { ImageSelector } from "@/components/media/selectors/ImageSelector";

interface PortfolioCategorySideProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    editId?: number | null;
}

export const PortfolioCategorySide: React.FC<PortfolioCategorySideProps> = ({
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
    } = useRealEstateTaxonomyForm<PortfolioCategoryFormValues>({
        id: editId?.toString(),
        isEditMode,
        schema: portfolioCategoryFormSchema,
        defaultValues: portfolioCategoryFormDefaults,
        fetchQueryKey: isEditMode ? ["portfolio-category", editId] : undefined,
        fetchQueryFn: isEditMode ? () => portfolioApi.getCategoryById(editId) : undefined,
        createMutationFn: (data) => portfolioApi.createCategory(data),
        updateMutationFn: (id, data) => portfolioApi.updateCategory(id, data),
        invalidateQueryKeys: [["portfolio-categories"]],
        onSuccessRedirect: "/portfolios/categories",
        onSuccess: () => {
            if (onSuccess) onSuccess();
            onClose();
        },
        itemLabel: "دسته‌بندی",
        titleFieldName: "name",
    });

    const { register, formState: { errors }, watch, setValue } = form;

    const { data: categories } = useQuery({
        queryKey: ["portfolio-categories-tree"],
        queryFn: () => portfolioApi.getCategories({ size: 100 }),
    });

    return (
        <TaxonomyDrawer
            isOpen={isOpen}
            onClose={onClose}
            title={isEditMode ? "ویرایش دسته‌بندی" : "ایجاد دسته‌بندی جدید"}
            onSubmit={handleSubmit}
            isPending={isPending}
            isSubmitting={isSubmitting}
            formId="portfolio-category-drawer-form"
            submitButtonText={isEditMode ? "بروزرسانی" : "ایجاد"}
        >
            <div className="space-y-6">
                <ImageSelector
                    selectedMedia={selectedMedia}
                    onMediaSelect={handleImageSelect}
                    loading={isEditMode && isLoading && !selectedMedia}
                    showRemoveButton={false}
                    size="sm"
                    context="portfolio"
                    placeholderColor="purple"
                    alt="تصویر دسته‌بندی"
                    className="mx-auto"
                />

                <div className="grid gap-5">
                    <FormFieldInput
                        label="نام"
                        id="name"
                        required
                        error={errors.name?.message as string}
                        placeholder="نام دسته‌بندی را وارد کنید"
                        {...register("name")}
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
                        label="دسته‌بندی والد"
                        htmlFor="parent_id"
                        error={errors.parent_id?.message as string}
                    >
                        <TreeSelect
                            data={categories?.data || []}
                            value={watch("parent_id")?.toString() || null}
                            onChange={(value) => setValue("parent_id", value ? parseInt(value) : null, { shouldValidate: true })}
                            placeholder="انتخاب دسته‌بندی والد (اختیاری)"
                            searchPlaceholder="جستجوی دسته‌بندی..."
                            emptyText="دسته‌بندی یافت نشد"
                        />
                    </FormField>

                    <FormFieldTextarea
                        label="توضیحات"
                        id="description"
                        error={errors.description?.message as string}
                        placeholder="توضیحات دسته‌بندی"
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
