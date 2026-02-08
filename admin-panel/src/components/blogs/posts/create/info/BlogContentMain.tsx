import { type ChangeEvent } from "react";
import type { UseFormReturn } from "react-hook-form";
import { FormFieldInput, FormFieldTextarea } from "@/components/shared/FormField";
import { formatSlug, generateSlug } from '@/core/slug/generate';
import type { BlogFormValues } from "@/components/blogs/validations/blogSchema";

interface BlogContentMainProps {
    form?: UseFormReturn<BlogFormValues>;
    formData?: any;
    handleInputChange?: (field: string, value: any) => void;
    editMode: boolean;
    isFormApproach: boolean;
}

export function BlogContentMain({ form, formData, handleInputChange, editMode, isFormApproach }: BlogContentMainProps) {
    const { register, formState: { errors }, setValue } = isFormApproach && form
        ? form
        : { register: null, formState: { errors: {} as any }, setValue: null };

    const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (!isFormApproach) {
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
            setValue("slug", formattedSlug);
        } else {
            handleInputChange?.("slug", formattedSlug);
        }
    };

    const handleShortDescriptionChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        if (!isFormApproach) {
            handleInputChange?.("short_description", value);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {isFormApproach ? (
                    <FormFieldInput
                        label="نام"
                        id="name"
                        required
                        error={errors.name?.message}
                        placeholder="نام وبلاگ"
                        disabled={!editMode}
                        {...(register ? register("name") : {})}
                    />
                ) : (
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
                )}

                {isFormApproach ? (
                    <FormFieldInput
                        label="لینک (نامک)"
                        id="slug"
                        required
                        error={errors.slug?.message}
                        placeholder="نامک"
                        disabled={!editMode}
                        {...(register ? register("slug", {
                            onChange: (e) => {
                                const formattedSlug = formatSlug(e.target.value);
                                e.target.value = formattedSlug;
                                setValue("slug", formattedSlug);
                            }
                        }) : {})}
                    />
                ) : (
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
                )}
            </div>

            {isFormApproach ? (
                <FormFieldTextarea
                    label="توضیحات کوتاه"
                    id="short_description"
                    error={errors.short_description?.message}
                    placeholder="یک توضیح کوتاه درباره وبلاگ... (حداکثر ۳۰۰ کاراکتر)"
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
                    placeholder="یک توضیح کوتاه درباره وبلاگ... (حداکثر ۳۰۰ کاراکتر)"
                    rows={3}
                    disabled={!editMode}
                    maxLength={300}
                    value={formData?.short_description || ""}
                    onChange={handleShortDescriptionChange}
                />
            )}
        </div>
    );
}
