"use client";

import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/elements/Card";
import { Button } from "@/components/elements/Button";
import { Media } from "@/types/shared/media";
import { TabsContent } from "@/components/elements/Tabs";
import { FormFieldInput, FormFieldTextarea } from "@/components/forms/FormField";
import { PortfolioFormValues } from "@/core/validations/portfolioSchema";
import { MediaLibraryModal } from "@/components/media/modals/MediaLibraryModal";
import { mediaService } from "@/components/media/services";
import NextImage from "next/image";
import { UploadCloud, X, AlertCircle } from "lucide-react";

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
    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
    
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
    const ogImageValue = isFormApproach ? watch?.("og_image") : formData?.og_image;

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
    
    const handleOgImageSelect = (media: Media | Media[] | null) => {
        const selected = Array.isArray(media) ? media[0] || null : media;
        
        if (isFormApproach) {
            setValue?.("og_image", selected, { shouldValidate: true });
        } else {
            handleInputChange?.("og_image", selected);
        }
        
        setIsMediaModalOpen(false);
    };

    const handleRemoveOgImage = () => {
        if (isFormApproach) {
            setValue?.("og_image", null, { shouldValidate: true });
        } else {
            handleInputChange?.("og_image", null);
        }
    };

    return (
        <TabsContent value="seo" className="mt-6">
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 min-w-0">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>اطلاعات SEO</CardTitle>
                                <CardDescription>تنظیمات بهینه‌سازی برای موتورهای جستجو</CardDescription>
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
                </div>

                <div className="w-full lg:w-[420px] lg:flex-shrink-0">
                    <Card className={`lg:sticky lg:top-6 ${(formState.errors as any)?.og_image ? 'border-red-500' : ''}`}>
                        <CardHeader>
                            <CardTitle>تصویر Open Graph</CardTitle>
                            <CardDescription>
                                این تصویر در هنگام اشتراک‌گذاری در شبکه‌های اجتماعی نمایش داده می‌شود.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {ogImageValue ? (
                                <div className="relative w-full aspect-video rounded-lg overflow-hidden group border">
                                    <NextImage
                                        src={mediaService.getMediaUrlFromObject(ogImageValue)}
                                        alt={ogImageValue.alt_text || "تصویر Open Graph"}
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => setIsMediaModalOpen(true)}
                                            className="mx-1"
                                            disabled={!editMode}
                                        >
                                            تغییر تصویر
                                        </Button>

                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={handleRemoveOgImage}
                                            className="mx-1"
                                            disabled={!editMode}
                                        >
                                            <X className="w-4 h-4" />
                                            حذف
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    onClick={() => editMode && setIsMediaModalOpen(true)}
                                    className={`relative flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors ${!editMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <UploadCloud className="w-12 h-12 text-muted-foreground" />
                                    <p className="mt-4 text-lg font-semibold">انتخاب تصویر Open Graph</p>
                                    <p className="mt-1 text-sm text-muted-foreground text-center">
                                        برای انتخاب از کتابخانه کلیک کنید
                                    </p>
                                </div>
                            )}
                            
                            {/* نمایش خطا */}
                            {(formState.errors as any)?.og_image?.message && (
                                <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 mt-3">
                                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>{String((formState.errors as any).og_image.message)}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
            
            <MediaLibraryModal
                isOpen={isMediaModalOpen}
                onClose={() => setIsMediaModalOpen(false)}
                onSelect={handleOgImageSelect}
                selectMultiple={false}
                initialFileType="image"
            />
        </TabsContent>
    );
}