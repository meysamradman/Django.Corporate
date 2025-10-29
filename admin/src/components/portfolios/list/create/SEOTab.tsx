"use client";

import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { MediaSelector } from "@/components/media/selectors/MediaSelector";
import { Media } from "@/types/shared/media";
import { TabsContent } from "@/components/elements/Tabs";
import { FormFieldInput, FormFieldTextarea } from "@/components/forms/FormField";
import { PortfolioFormValues } from "@/core/validations/portfolioSchema";

// Props interface for react-hook-form approach (create page)
interface SEOTabFormProps {
    form: UseFormReturn<PortfolioFormValues>;
    editMode: boolean;
}

// Props interface for manual state approach (edit page)
interface SEOTabManualProps {
    formData: any;
    handleInputChange: (field: string, value: any) => void;
    editMode: boolean;
}

// Union type for both approaches
type SEOTabProps = SEOTabFormProps | SEOTabManualProps;

export default function SEOTab(props: SEOTabProps) {
    // Check which approach is being used
    const isFormApproach = 'form' in props;
    
    // Get form state based on approach
    const formState = isFormApproach ? props.form.formState : { errors: {} };
    const register = isFormApproach ? props.form.register : null;
    const watch = isFormApproach ? props.form.watch : null;
    const setValue = isFormApproach ? props.form.setValue : null;
    
    // For manual approach, use props directly
    const {
        formData,
        handleInputChange,
        editMode
    } = isFormApproach ? {} as any : props;
    
    // Watch values for form approach
    const metaTitleValue = isFormApproach ? watch?.("meta_title") : formData?.meta_title;
    const metaDescriptionValue = isFormApproach ? watch?.("meta_description") : formData?.meta_description;
    const ogTitleValue = isFormApproach ? watch?.("og_title") : formData?.og_title;
    const ogDescriptionValue = isFormApproach ? watch?.("og_description") : formData?.og_description;
    const canonicalUrlValue = isFormApproach ? watch?.("canonical_url") : formData?.canonical_url;
    const robotsMetaValue = isFormApproach ? watch?.("robots_meta") : formData?.robots_meta;

    // Handle input changes for manual approach
    const handleMetaTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (isFormApproach) {
            // For form approach, let react-hook-form handle it
        } else {
            handleInputChange?.("meta_title", value);
        }
    };

    const handleMetaDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        if (isFormApproach) {
            // For form approach, let react-hook-form handle it
        } else {
            handleInputChange?.("meta_description", value);
        }
    };

    const handleOgTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (isFormApproach) {
            // For form approach, let react-hook-form handle it
        } else {
            handleInputChange?.("og_title", value);
        }
    };

    const handleOgDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        if (isFormApproach) {
            // For form approach, let react-hook-form handle it
        } else {
            handleInputChange?.("og_description", value);
        }
    };

    const handleCanonicalUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (isFormApproach) {
            // For form approach, let react-hook-form handle it
        } else {
            handleInputChange?.("canonical_url", value);
        }
    };

    const handleRobotsMetaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (isFormApproach) {
            // For form approach, let react-hook-form handle it
        } else {
            handleInputChange?.("robots_meta", value);
        }
    };

    return (
        <TabsContent value="seo" className="mt-6">
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>اطلاعات SEO</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {isFormApproach ? (
                                <FormFieldInput
                                    label="عنوان متا (Meta Title)"
                                    id="meta_title"
                                    error={(formState.errors as any)?.meta_title?.message}
                                    placeholder="عنوان صفحه برای موتورهای جستجو"
                                    maxLength={70}
                                    disabled={!editMode}
                                    description="حداکثر 70 کاراکتر توصیه می‌شود"
                                    {...(register as any)?.("meta_title", {
                                        onChange: handleMetaTitleChange
                                    })}
                                />
                            ) : (
                                <FormFieldInput
                                    label="عنوان متا (Meta Title)"
                                    id="meta_title"
                                    error={(formState.errors as any)?.meta_title?.message}
                                    placeholder="عنوان صفحه برای موتورهای جستجو"
                                    maxLength={70}
                                    disabled={!editMode}
                                    description="حداکثر 70 کاراکتر توصیه می‌شود"
                                    value={metaTitleValue || ""}
                                    onChange={handleMetaTitleChange}
                                />
                            )}
                            
                            {isFormApproach ? (
                                <FormFieldTextarea
                                    label="توضیحات متا (Meta Description)"
                                    id="meta_description"
                                    error={(formState.errors as any)?.meta_description?.message}
                                    placeholder="توضیحات صفحه برای موتورهای جستجو"
                                    rows={3}
                                    maxLength={160}
                                    disabled={!editMode}
                                    description="بین 120 تا 160 کاراکتر توصیه می‌شود"
                                    {...(register as any)?.("meta_description", {
                                        onChange: handleMetaDescriptionChange
                                    })}
                                />
                            ) : (
                                <FormFieldTextarea
                                    label="توضیحات متا (Meta Description)"
                                    id="meta_description"
                                    error={(formState.errors as any)?.meta_description?.message}
                                    placeholder="توضیحات صفحه برای موتورهای جستجو"
                                    rows={3}
                                    maxLength={160}
                                    disabled={!editMode}
                                    description="بین 120 تا 160 کاراکتر توصیه می‌شود"
                                    value={metaDescriptionValue || ""}
                                    onChange={handleMetaDescriptionChange}
                                />
                            )}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {isFormApproach ? (
                                <FormFieldInput
                                    label="عنوان Open Graph"
                                    id="og_title"
                                    error={(formState.errors as any)?.og_title?.message}
                                    placeholder="عنوان برای اشتراک‌گذاری در شبکه‌های اجتماعی"
                                    maxLength={70}
                                    disabled={!editMode}
                                    {...(register as any)?.("og_title", {
                                        onChange: handleOgTitleChange
                                    })}
                                />
                            ) : (
                                <FormFieldInput
                                    label="عنوان Open Graph"
                                    id="og_title"
                                    error={(formState.errors as any)?.og_title?.message}
                                    placeholder="عنوان برای اشتراک‌گذاری در شبکه‌های اجتماعی"
                                    maxLength={70}
                                    disabled={!editMode}
                                    value={ogTitleValue || ""}
                                    onChange={handleOgTitleChange}
                                />
                            )}
                            
                            {isFormApproach ? (
                                <FormFieldTextarea
                                    label="توضیحات Open Graph"
                                    id="og_description"
                                    error={(formState.errors as any)?.og_description?.message}
                                    placeholder="توضیحات برای اشتراک‌گذاری در شبکه‌های اجتماعی"
                                    rows={3}
                                    maxLength={160}
                                    disabled={!editMode}
                                    {...(register as any)?.("og_description", {
                                        onChange: handleOgDescriptionChange
                                    })}
                                />
                            ) : (
                                <FormFieldTextarea
                                    label="توضیحات Open Graph"
                                    id="og_description"
                                    error={(formState.errors as any)?.og_description?.message}
                                    placeholder="توضیحات برای اشتراک‌گذاری در شبکه‌های اجتماعی"
                                    rows={3}
                                    maxLength={160}
                                    disabled={!editMode}
                                    value={ogDescriptionValue || ""}
                                    onChange={handleOgDescriptionChange}
                                />
                            )}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {isFormApproach ? (
                                <FormFieldInput
                                    label="آدرس کانونیکال (Canonical URL)"
                                    id="canonical_url"
                                    error={(formState.errors as any)?.canonical_url?.message}
                                    placeholder="https://example.com/portfolio/item"
                                    type="url"
                                    disabled={!editMode}
                                    {...(register as any)?.("canonical_url", {
                                        onChange: handleCanonicalUrlChange
                                    })}
                                />
                            ) : (
                                <FormFieldInput
                                    label="آدرس کانونیکال (Canonical URL)"
                                    id="canonical_url"
                                    error={(formState.errors as any)?.canonical_url?.message}
                                    placeholder="https://example.com/portfolio/item"
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
                                    error={(formState.errors as any)?.robots_meta?.message}
                                    placeholder="index,follow"
                                    disabled={!editMode}
                                    {...(register as any)?.("robots_meta", {
                                        onChange: handleRobotsMetaChange
                                    })}
                                />
                            ) : (
                                <FormFieldInput
                                    label="دستورالعمل ربات‌های جستجو (Robots Meta)"
                                    id="robots_meta"
                                    error={(formState.errors as any)?.robots_meta?.message}
                                    placeholder="index,follow"
                                    disabled={!editMode}
                                    value={robotsMetaValue || ""}
                                    onChange={handleRobotsMetaChange}
                                />
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </TabsContent>
    );
}