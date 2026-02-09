
import { type ChangeEvent } from "react";
import type { UseFormReturn } from "react-hook-form";
import { FormFieldTextarea } from "@/components/shared/FormField";
import type { PropertyFormValues } from "@/components/real-estate/validations/propertySchema";

interface RealEstateShortDescProps {
    form?: UseFormReturn<PropertyFormValues>;
    formData?: any;
    handleInputChange?: (field: string, value: any) => void;
    editMode: boolean;
    isFormApproach: boolean;
}

export function RealEstateShortDesc({ form, formData, handleInputChange, editMode, isFormApproach }: RealEstateShortDescProps) {
    const { register, formState: { errors }, setValue } = isFormApproach && form
        ? form
        : { register: null, formState: { errors: {} as any }, setValue: null };

    const handleShortDescriptionChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        if (isFormApproach && setValue) {
            setValue("short_description", e.target.value, { shouldValidate: false });
        } else {
            handleInputChange?.("short_description", e.target.value);
        }
    };

    return (
        <div className="mt-6">
            {isFormApproach ? (
                <FormFieldTextarea
                    label="توضیحات کوتاه"
                    id="short_description"
                    placeholder="یک توضیح کوتاه درباره ملک... (حداکثر ۳۰۰ کاراکتر)"
                    rows={3}
                    disabled={!editMode}
                    maxLength={300}
                    error={errors.short_description?.message}
                    {...(register ? register("short_description") : {})}
                />
            ) : (
                <FormFieldTextarea
                    label="توضیحات کوتاه"
                    id="short_description"
                    placeholder="یک توضیح کوتاه درباره ملک... (حداکثر ۳۰۰ کاراکتر)"
                    rows={3}
                    disabled={!editMode}
                    maxLength={300}
                    value={formData?.short_description || ""}
                    onChange={handleShortDescriptionChange}
                    error={errors?.short_description}
                />
            )}
        </div>
    );
}
