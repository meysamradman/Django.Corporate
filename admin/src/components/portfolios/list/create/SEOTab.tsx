"use client";

import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { MediaSelector } from "@/components/media/selectors/MediaSelector";
import { Media } from "@/types/shared/media";
import { TabsContent } from "@/components/elements/Tabs";
import { FormFieldInput, FormFieldTextarea } from "@/components/forms/FormField";
import { PortfolioFormValues } from "@/core/validations/portfolioSchema";

interface SEOTabProps {
    form: UseFormReturn<PortfolioFormValues>;
    editMode: boolean;
}

export default function SEOTab({ form, editMode }: SEOTabProps) {
    const { register, formState: { errors }, watch, setValue } = form;

    return (
        <TabsContent value="seo" className="mt-6">
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>اطلاعات SEO</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <FormFieldInput
                                label="عنوان متا (Meta Title)"
                                id="meta_title"
                                error={errors.meta_title?.message}
                                placeholder="عنوان صفحه برای موتورهای جستجو"
                                maxLength={70}
                                disabled={!editMode}
                                description="حداکثر 70 کاراکتر توصیه می‌شود"
                                {...register("meta_title")}
                            />
                            
                            <FormFieldTextarea
                                label="توضیحات متا (Meta Description)"
                                id="meta_description"
                                error={errors.meta_description?.message}
                                placeholder="توضیحات صفحه برای موتورهای جستجو"
                                rows={3}
                                maxLength={160}
                                disabled={!editMode}
                                description="بین 120 تا 160 کاراکتر توصیه می‌شود"
                                {...register("meta_description")}
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <FormFieldInput
                                label="عنوان Open Graph"
                                id="og_title"
                                error={errors.og_title?.message}
                                placeholder="عنوان برای اشتراک‌گذاری در شبکه‌های اجتماعی"
                                maxLength={70}
                                disabled={!editMode}
                                {...register("og_title")}
                            />
                            
                            <FormFieldTextarea
                                label="توضیحات Open Graph"
                                id="og_description"
                                error={errors.og_description?.message}
                                placeholder="توضیحات برای اشتراک‌گذاری در شبکه‌های اجتماعی"
                                rows={3}
                                maxLength={160}
                                disabled={!editMode}
                                {...register("og_description")}
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <FormFieldInput
                                label="آدرس کانونیکال (Canonical URL)"
                                id="canonical_url"
                                error={errors.canonical_url?.message}
                                placeholder="https://example.com/portfolio/item"
                                type="url"
                                disabled={!editMode}
                                {...register("canonical_url")}
                            />
                            
                            <FormFieldInput
                                label="دستورالعمل ربات‌های جستجو (Robots Meta)"
                                id="robots_meta"
                                error={errors.robots_meta?.message}
                                placeholder="index,follow"
                                disabled={!editMode}
                                {...register("robots_meta")}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </TabsContent>
    );
}