
import { type ChangeEvent, lazy, Suspense } from "react";
import type { UseFormReturn } from "react-hook-form";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { FileText } from "lucide-react";
import { FormFieldInput, FormFieldTextarea, FormField } from "@/components/shared/FormField";
import { formatSlug, generateSlug } from '@/core/slug/generate';
import type { PropertyFormValues } from "@/components/real-estate/validations/propertySchema";

const TipTapEditor = lazy(() =>
    import("@/components/shared/TipTapEditor").then(module => ({ default: module.TipTapEditor }))
);

interface PropertyContentProps {
    form?: UseFormReturn<PropertyFormValues>;
    formData?: any;
    handleInputChange?: (field: string, value: any) => void;
    editMode: boolean;
    isFormApproach: boolean;
}

export function PropertyContent({ form, formData, handleInputChange, editMode, isFormApproach }: PropertyContentProps) {
    const { register, formState: { errors }, watch, setValue } = isFormApproach && form
        ? form
        : { register: null, formState: { errors: {} as any }, watch: null, setValue: null };

    const descriptionValue = isFormApproach ? watch?.("description") : formData?.description;

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

    const handleShortDescriptionChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        if (isFormApproach && setValue) {
            setValue("short_description", e.target.value, { shouldValidate: false });
        } else {
            handleInputChange?.("short_description", e.target.value);
        }
    };

    const handleDescriptionChange = (content: string) => {
        if (isFormApproach && setValue) {
            setValue("description", content, { shouldValidate: false });
        } else {
            handleInputChange?.("description", content);
        }
    };

    return (
        <CardWithIcon
            icon={FileText}
            title="محتوا و توضیحات"
            iconBgColor="bg-blue"
            iconColor="stroke-blue-2"
            borderColor="border-b-blue-1"
        >
            <div className="space-y-6">
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

                {isFormApproach ? (
                    <>
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

                        <FormField
                            label="توضیحات بلند"
                            error={errors.description?.message}
                        >
                            <Suspense fallback={<div className="h-[200px] border rounded-md bg-gray-50 flex items-center justify-center text-gray-400">Loading Editor...</div>}>
                                <TipTapEditor
                                    content={descriptionValue || ""}
                                    onChange={handleDescriptionChange}
                                    placeholder="توضیحات کامل ملک را وارد کنید... (اختیاری)"
                                />
                            </Suspense>
                        </FormField>
                    </>
                ) : (
                    <>
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

                        <FormField
                            label="توضیحات بلند"
                            error={errors?.description}
                        >
                            <Suspense fallback={<div className="h-[200px] border rounded-md bg-gray-50 flex items-center justify-center text-gray-400">Loading Editor...</div>}>
                                <TipTapEditor
                                    content={formData?.description || ""}
                                    onChange={handleDescriptionChange}
                                    placeholder="توضیحات کامل ملک را وارد کنید... (اختیاری)"
                                />
                            </Suspense>
                        </FormField>
                    </>
                )}
            </div>
        </CardWithIcon>
    );
}
