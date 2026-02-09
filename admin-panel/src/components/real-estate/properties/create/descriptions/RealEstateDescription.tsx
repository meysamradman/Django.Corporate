
import { lazy, Suspense } from "react";
import type { UseFormReturn } from "react-hook-form";
import { FormField } from "@/components/shared/FormField";
import type { PropertyFormValues } from "@/components/real-estate/validations/propertySchema";

const TipTapEditor = lazy(() =>
    import("@/components/shared/TipTapEditor").then(module => ({ default: module.TipTapEditor }))
);

interface RealEstateDescriptionProps {
    form?: UseFormReturn<PropertyFormValues>;
    formData?: any;
    handleInputChange?: (field: string, value: any) => void;
    editMode: boolean;
    isFormApproach: boolean;
}

export function RealEstateDescription({ form, formData, handleInputChange, isFormApproach }: RealEstateDescriptionProps) {
    const { formState: { errors }, watch, setValue } = isFormApproach && form
        ? form
        : { formState: { errors: {} as any }, watch: null, setValue: null };

    const descriptionValue = isFormApproach ? watch?.("description") : formData?.description;

    const handleDescriptionChange = (content: string) => {
        if (isFormApproach && setValue) {
            setValue("description", content, { shouldValidate: false });
        } else {
            handleInputChange?.("description", content);
        }
    };

    return (
        <div className="mt-6">
            <FormField
                label="توضیحات بلند"
                error={isFormApproach ? errors.description?.message : errors?.description}
            >
                <Suspense fallback={<div className="h-[200px] border rounded-md bg-gray-50 flex items-center justify-center text-gray-400">Loading Editor...</div>}>
                    <TipTapEditor
                        content={descriptionValue || ""}
                        onChange={handleDescriptionChange}
                        placeholder="توضیحات کامل ملک را وارد کنید... (اختیاری)"
                    />
                </Suspense>
            </FormField>
        </div>
    );
}
