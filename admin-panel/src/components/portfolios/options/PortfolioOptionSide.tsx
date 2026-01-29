import React from "react";
import { portfolioApi } from "@/api/portfolios/portfolios";
import { TaxonomyDrawer } from "@/components/templates/TaxonomyDrawer";
import { useRealEstateTaxonomyForm } from "@/components/real-estate/hooks/useRealEstateTaxonomyForm";
import { portfolioOptionFormSchema, portfolioOptionFormDefaults, type PortfolioOptionFormValues } from "@/components/portfolios/validations/optionSchema";
import { FormFieldInput, FormFieldTextarea, FormFieldSwitch } from "@/components/shared/FormField";

interface PortfolioOptionSideProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    editId?: number | null;
}

export const PortfolioOptionSide: React.FC<PortfolioOptionSideProps> = ({
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
    } = useRealEstateTaxonomyForm<PortfolioOptionFormValues>({
        id: editId?.toString(),
        isEditMode,
        schema: portfolioOptionFormSchema,
        defaultValues: portfolioOptionFormDefaults,
        fetchQueryKey: isEditMode ? ["portfolio-option", editId] : undefined,
        fetchQueryFn: isEditMode ? () => portfolioApi.getOptionById(editId) : undefined,
        createMutationFn: (data) => portfolioApi.createOption(data),
        updateMutationFn: (id, data) => portfolioApi.updateOption(id, data),
        invalidateQueryKeys: [["portfolio-options"]],
        onSuccessRedirect: "/portfolios/options",
        onSuccess: () => {
            if (onSuccess) onSuccess();
            onClose();
        },
        itemLabel: "آپشن",
        titleFieldName: "name",
    });

    const { register, formState: { errors }, watch, setValue } = form;

    return (
        <TaxonomyDrawer
            isOpen={isOpen}
            onClose={onClose}
            title={isEditMode ? "ویرایش آپشن" : "ایجاد آپشن جدید"}
            onSubmit={handleSubmit}
            isPending={isPending}
            isSubmitting={isSubmitting}
            formId="portfolio-option-drawer-form"
            submitButtonText={isEditMode ? "بروزرسانی" : "ایجاد"}
        >
            <div className="space-y-6">
                <div className="grid gap-5">
                    <FormFieldInput
                        label="نام"
                        id="name"
                        required
                        error={errors.name?.message as string}
                        placeholder="نام آپشن را وارد کنید"
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

                    <FormFieldTextarea
                        label="توضیحات"
                        id="description"
                        error={errors.description?.message as string}
                        placeholder="توضیحات آپشن"
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
