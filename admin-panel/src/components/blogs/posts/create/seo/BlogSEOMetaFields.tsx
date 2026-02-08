import type { UseFormReturn, Path } from "react-hook-form";
import { FormFieldInput, FormFieldTextarea } from "@/components/shared/FormField";
import type { BlogFormValues } from "@/components/blogs/validations/blogSchema";
import type { ChangeEvent } from "react";

interface BlogSEOMetaFieldsProps {
    isFormApproach: boolean;
    form?: UseFormReturn<BlogFormValues>;
    editMode: boolean;
    metaTitleValue: string;
    metaDescriptionValue: string;
    canonicalUrlValue: string;
    robotsMetaValue: string;
    handleMetaTitleChange: (e: ChangeEvent<HTMLInputElement>) => void;
    handleMetaDescriptionChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
    handleCanonicalUrlChange: (e: ChangeEvent<HTMLInputElement>) => void;
    handleRobotsMetaChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export function BlogSEOMetaFields({
    isFormApproach,
    form,
    editMode,
    metaTitleValue,
    metaDescriptionValue,
    canonicalUrlValue,
    robotsMetaValue,
    handleMetaTitleChange,
    handleMetaDescriptionChange,
    handleCanonicalUrlChange,
    handleRobotsMetaChange
}: BlogSEOMetaFieldsProps) {
    const formState = isFormApproach ? form?.formState : { errors: {} };
    const register = isFormApproach ? form?.register : null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="lg:w-[35%] lg:max-w-[320px]">
                    {isFormApproach ? (
                        <FormFieldInput
                            label="عنوان متا (Meta Title)"
                            id="meta_title"
                            error={(formState?.errors as any)?.meta_title?.message}
                            placeholder="عنوان صفحه برای موتورهای جستجو"
                            maxLength={70}
                            disabled={!editMode}
                            description="حداکثر 70 کاراکتر توصیه می‌شود"
                            {...(register ? register("meta_title" as Path<BlogFormValues>, {
                                onChange: handleMetaTitleChange
                            }) : {})}
                        />
                    ) : (
                        <FormFieldInput
                            label="عنوان متا (Meta Title)"
                            id="meta_title"
                            error={(formState?.errors as any)?.meta_title?.message}
                            placeholder="عنوان صفحه برای موتورهای جستجو"
                            maxLength={70}
                            disabled={!editMode}
                            description="حداکثر 70 کاراکتر توصیه می‌شود"
                            value={metaTitleValue || ""}
                            onChange={handleMetaTitleChange}
                        />
                    )}
                </div>

                <div className="lg:flex-1 lg:min-w-0">
                    {isFormApproach ? (
                        <FormFieldTextarea
                            label="توضیحات متا (Meta Description)"
                            id="meta_description"
                            error={(formState?.errors as any)?.meta_description?.message}
                            placeholder="توضیحات صفحه برای موتورهای جستجو"
                            rows={5}
                            maxLength={160}
                            disabled={!editMode}
                            description="بین 120 تا 160 کاراکتر توصیه می‌شود"
                            {...(register ? register("meta_description" as Path<BlogFormValues>, {
                                onChange: handleMetaDescriptionChange
                            }) : {})}
                        />
                    ) : (
                        <FormFieldTextarea
                            label="توضیحات متا (Meta Description)"
                            id="meta_description"
                            error={(formState?.errors as any)?.meta_description?.message}
                            placeholder="توضیحات صفحه برای موتورهای جستجو"
                            rows={5}
                            maxLength={160}
                            disabled={!editMode}
                            description="بین 120 تا 160 کاراکتر توصیه می‌شود"
                            value={metaDescriptionValue || ""}
                            onChange={handleMetaDescriptionChange}
                        />
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {isFormApproach ? (
                    <FormFieldInput
                        label="آدرس کانونیکال (Canonical URL)"
                        id="canonical_url"
                        error={(formState?.errors as any)?.canonical_url?.message}
                        placeholder="https://example.com/blogs/item"
                        type="url"
                        disabled={!editMode}
                        {...(register ? register("canonical_url" as Path<BlogFormValues>, {
                            onChange: handleCanonicalUrlChange
                        }) : {})}
                    />
                ) : (
                    <FormFieldInput
                        label="آدرس کانونیکال (Canonical URL)"
                        id="canonical_url"
                        error={(formState?.errors as any)?.canonical_url?.message}
                        placeholder="https://example.com/blogs/item"
                        type="url"
                        disabled={!editMode}
                        value={canonicalUrlValue || ""}
                        onChange={handleCanonicalUrlChange}
                    />
                )}

                {isFormApproach ? (
                    <FormFieldInput
                        label="دستورالعمل ربات‌های جستجو (Robots Meta)"
                        id="robots_meta"
                        error={(formState?.errors as any)?.robots_meta?.message}
                        placeholder="index,follow"
                        disabled={!editMode}
                        {...(register ? register("robots_meta" as Path<BlogFormValues>, {
                            onChange: handleRobotsMetaChange
                        }) : {})}
                    />
                ) : (
                    <FormFieldInput
                        label="دستورالعمل ربات‌های جستجو (Robots Meta)"
                        id="robots_meta"
                        error={(formState?.errors as any)?.robots_meta?.message}
                        placeholder="index,follow"
                        disabled={!editMode}
                        value={robotsMetaValue || ""}
                        onChange={handleRobotsMetaChange}
                    />
                )}
            </div>
        </div>
    );
}
