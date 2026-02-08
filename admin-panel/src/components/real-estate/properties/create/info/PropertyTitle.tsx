
import { type ChangeEvent } from "react";
import type { UseFormReturn } from "react-hook-form";
import { FormFieldInput } from "@/components/shared/FormField";
import { formatSlug, generateSlug } from '@/core/slug/generate';
import type { PropertyFormValues } from "@/components/real-estate/validations/propertySchema";

interface PropertyTitleProps {
    form?: UseFormReturn<PropertyFormValues>;
    formData?: any;
    handleInputChange?: (field: string, value: any) => void;
    editMode: boolean;
    isFormApproach: boolean;
}

export function PropertyTitle({ form, formData, handleInputChange, editMode, isFormApproach }: PropertyTitleProps) {
    const { register, formState: { errors }, setValue } = isFormApproach && form
        ? form
        : { register: null, formState: { errors: {} as any }, setValue: null };

    const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (isFormApproach && setValue) {
            setValue("title", value, { shouldValidate: false });
            if (value) {
                const slug = generateSlug(value);
                setValue("slug", slug, { shouldValidate: false });
            }
        } else {
            handleInputChange?.("title", value);
            if (value && !formData?.slug) {
                const slug = generateSlug(value);
                handleInputChange?.("slug", slug);
            }
        }
    };

    const handleSlugChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const formattedSlug = formatSlug(value);
        if (isFormApproach && setValue) {
            setValue("slug", formattedSlug, { shouldValidate: false });
        } else {
            handleInputChange?.("slug", formattedSlug);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {isFormApproach ? (
                <>
                    <FormFieldInput
                        label="عنوان"
                        id="title"
                        required
                        placeholder="عنوان ملک"
                        disabled={!editMode}
                        error={errors.title?.message}
                        {...(register ? register("title") : {})}
                    />

                    <FormFieldInput
                        label="لینک (نامک)"
                        id="slug"
                        required
                        placeholder="نامک"
                        disabled={!editMode}
                        error={errors.slug?.message}
                        {...(register ? register("slug") : {})}
                    />
                </>
            ) : (
                <>
                    <FormFieldInput
                        label="عنوان"
                        id="title"
                        required
                        placeholder="عنوان ملک"
                        disabled={!editMode}
                        value={formData?.title || ""}
                        onChange={handleNameChange}
                        error={errors?.title}
                    />

                    <FormFieldInput
                        label="لینک (نامک)"
                        id="slug"
                        required
                        placeholder="نامک"
                        disabled={!editMode}
                        value={formData?.slug || ""}
                        onChange={handleSlugChange}
                        error={errors?.slug}
                    />
                </>
            )}
        </div>
    );
}
