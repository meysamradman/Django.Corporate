
import { type ChangeEvent } from "react";
import type { UseFormReturn } from "react-hook-form";
import { FormFieldTextarea } from "@/components/shared/FormField";
import type { PortfolioFormValues } from "@/components/portfolios/validations/portfolioSchema";

interface PortfolioShortDescProps {
    form?: UseFormReturn<PortfolioFormValues>;
    formData?: any;
    handleInputChange?: (field: string, value: any) => void;
    editMode: boolean;
    isFormApproach: boolean;
}

export function PortfolioShortDesc({ form, formData, handleInputChange, editMode, isFormApproach }: PortfolioShortDescProps) {
    const { register, formState: { errors } } = isFormApproach && form
        ? form
        : { register: null, formState: { errors: {} as any } };

    const handleShortDescriptionChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        if (!isFormApproach) {
            handleInputChange?.("short_description", value);
        }
    };

    return (
        <>
            {isFormApproach ? (
                <FormFieldTextarea
                    label="توضیحات کوتاه"
                    id="short_description"
                    error={errors.short_description?.message}
                    placeholder="یک توضیح کوتاه درباره نمونه‌کار... (حداکثر ۳۰۰ کاراکتر)"
                    rows={3}
                    disabled={!editMode}
                    maxLength={300}
                    {...(register ? register("short_description", {
                        onChange: handleShortDescriptionChange
                    }) : {})}
                />
            ) : (
                <FormFieldTextarea
                    label="توضیحات کوتاه"
                    id="short_description"
                    error={errors.short_description?.message}
                    placeholder="یک توضیح کوتاه درباره نمونه‌کار... (حداکثر ۳۰۰ کاراکتر)"
                    rows={3}
                    disabled={!editMode}
                    maxLength={300}
                    value={formData?.short_description || ""}
                    onChange={handleShortDescriptionChange}
                />
            )}
        </>
    );
}
