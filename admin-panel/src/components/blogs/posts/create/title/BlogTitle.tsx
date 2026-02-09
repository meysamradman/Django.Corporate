
import { type ChangeEvent } from "react";
import type { UseFormReturn } from "react-hook-form";
import { FormFieldInput } from "@/components/shared/FormField";
import { formatSlug, generateSlug } from '@/core/slug/generate';
import type { BlogFormValues } from "@/components/blogs/validations/blogSchema";

interface BlogTitleProps {
    form?: UseFormReturn<BlogFormValues>;
    formData?: any;
    handleInputChange?: (field: string, value: any) => void;
    editMode: boolean;
    isFormApproach: boolean;
}

export function BlogTitle({ form, formData, handleInputChange, editMode, isFormApproach }: BlogTitleProps) {
    const { register, formState: { errors }, setValue } = isFormApproach && form
        ? form
        : { register: null, formState: { errors: {} as any }, setValue: null };

    const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (isFormApproach && setValue) {
            setValue("name", value, { shouldValidate: true });
            if (value) {
                const slug = generateSlug(value);
                setValue("slug", slug, { shouldValidate: true });
            }
        } else {
            handleInputChange?.("name", value);
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
            setValue("slug", formattedSlug, { shouldValidate: true });
        } else {
            handleInputChange?.("slug", formattedSlug);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {isFormApproach ? (
                <>
                    <FormFieldInput
                        label="نام"
                        id="name"
                        required
                        error={errors.name?.message}
                        placeholder="نام وبلاگ"
                        disabled={!editMode}
                        {...(register ? register("name", {
                            onChange: handleNameChange
                        }) : {})}
                    />

                    <FormFieldInput
                        label="لینک (نامک)"
                        id="slug"
                        required
                        error={errors.slug?.message}
                        placeholder="نامک"
                        disabled={!editMode}
                        {...(register ? register("slug", {
                            onChange: handleSlugChange
                        }) : {})}
                    />
                </>
            ) : (
                <>
                    <FormFieldInput
                        label="نام"
                        id="name"
                        required
                        error={errors.name?.message}
                        placeholder="نام وبلاگ"
                        disabled={!editMode}
                        value={formData?.name || ""}
                        onChange={handleNameChange}
                    />

                    <FormFieldInput
                        label="لینک (نامک)"
                        id="slug"
                        required
                        error={errors.slug?.message}
                        placeholder="نامک"
                        disabled={!editMode}
                        value={formData?.slug || ""}
                        onChange={handleSlugChange}
                    />
                </>
            )}
        </div>
    );
}
