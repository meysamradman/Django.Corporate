import React from "react";
import { useQuery } from "@tanstack/react-query";
import { blogApi } from "@/api/blogs/blogs";
import { TaxonomyDrawer } from "@/components/templates/TaxonomyDrawer";
import { useRealEstateTaxonomyForm } from "@/components/real-estate/hooks/useRealEstateTaxonomyForm";
import { blogCategoryFormSchema, blogCategoryFormDefaults, type BlogCategoryFormValues } from "@/components/blogs/validations/categorySchema";
import { FormField, FormFieldInput, FormFieldTextarea, FormFieldSwitch } from "@/components/shared/FormField";
import { TreeSelect } from "@/components/elements/TreeSelect";
import { ImageSelector } from "@/components/media/selectors/ImageSelector";

interface BlogCategorySideProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    editId?: number | null;
}

export const BlogCategorySide: React.FC<BlogCategorySideProps> = ({
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
    } = useRealEstateTaxonomyForm<BlogCategoryFormValues>({
        id: editId?.toString(),
        isEditMode,
        schema: blogCategoryFormSchema,
        defaultValues: blogCategoryFormDefaults,
        fetchQueryKey: isEditMode ? ["blog-category", editId] : undefined,
        fetchQueryFn: isEditMode ? () => blogApi.getCategoryById(editId) : undefined,
        createMutationFn: (data) => blogApi.createCategory(data),
        updateMutationFn: (id, data) => blogApi.updateCategory(id, data),
        invalidateQueryKeys: [["blog-categories"]],
        onSuccessRedirect: "/blogs/categories", // Fallback if no onSuccess
        onSuccess: () => {
            if (onSuccess) onSuccess();
            onClose();
        },
        itemLabel: "دسته‌بندی",
        titleFieldName: "name",
    });

    const { register, formState: { errors }, watch, setValue } = form;

    const { data: categories } = useQuery({
        queryKey: ["blog-categories-tree"],
        queryFn: () => blogApi.getCategories({ size: 100 }),
    });

    return (
        <TaxonomyDrawer
            isOpen={isOpen}
            onClose={onClose}
            title={isEditMode ? "ویرایش دسته‌بندی" : "ایجاد دسته‌بندی جدید"}
            onSubmit={handleSubmit}
            isPending={isPending}
            isSubmitting={isSubmitting}
            formId="blog-category-drawer-form"
            submitButtonText={isEditMode ? "بروزرسانی" : "ایجاد"}
        >
            <div className="space-y-6">
                <ImageSelector
                    selectedMedia={selectedMedia}
                    onMediaSelect={handleImageSelect}
                    size="sm"
                    context="blog"
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
