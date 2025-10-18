"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { Input } from "@/components/elements/Input";
import { Label } from "@/components/elements/Label";
import { Textarea } from "@/components/elements/Textarea";
import { MediaSelector } from "@/components/media/selectors/MediaSelector";
import { Media } from "@/types/shared/media";
import { TabsContent } from "@/components/elements/Tabs";

interface SEOTabProps {
    formData: any;
    handleInputChange: (field: string, value: string | Media | null) => void;
    editMode: boolean;
}

export default function SEOTab({ formData, handleInputChange, editMode }: SEOTabProps) {
    const handleOGImageSelect = (media: Media | null) => {
        handleInputChange("og_image", media);
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
                            <div className="space-y-2">
                                <Label htmlFor="meta_title">عنوان متا (Meta Title)</Label>
                                <Input
                                    id="meta_title"
                                    value={formData.meta_title || ""}
                                    onChange={(e) => handleInputChange("meta_title", e.target.value)}
                                    disabled={!editMode}
                                    placeholder="عنوان صفحه برای موتورهای جستجو"
                                    maxLength={70}
                                />
                                <p className="text-xs text-muted-foreground">
                                    حداکثر 70 کاراکتر توصیه می‌شود
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="meta_description">توضیحات متا (Meta Description)</Label>
                                <Textarea
                                    id="meta_description"
                                    value={formData.meta_description || ""}
                                    onChange={(e) => handleInputChange("meta_description", e.target.value)}
                                    disabled={!editMode}
                                    placeholder="توضیحات صفحه برای موتورهای جستجو"
                                    rows={3}
                                    maxLength={300}
                                />
                                <p className="text-xs text-muted-foreground">
                                    بین 120 تا 160 کاراکتر توصیه می‌شود
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="og_title">عنوان Open Graph</Label>
                                <Input
                                    id="og_title"
                                    value={formData.og_title || ""}
                                    onChange={(e) => handleInputChange("og_title", e.target.value)}
                                    disabled={!editMode}
                                    placeholder="عنوان برای اشتراک‌گذاری در شبکه‌های اجتماعی"
                                    maxLength={70}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="og_description">توضیحات Open Graph</Label>
                                <Textarea
                                    id="og_description"
                                    value={formData.og_description || ""}
                                    onChange={(e) => handleInputChange("og_description", e.target.value)}
                                    disabled={!editMode}
                                    placeholder="توضیحات برای اشتراک‌گذاری در شبکه‌های اجتماعی"
                                    rows={3}
                                    maxLength={300}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>تصویر Open Graph</Label>
                            <MediaSelector
                                selectedMedia={formData.og_image || null}
                                onMediaSelect={handleOGImageSelect}
                                label="انتخاب تصویر Open Graph"
                                size="md"
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="canonical_url">آدرس کانونیکال (Canonical URL)</Label>
                                <Input
                                    id="canonical_url"
                                    value={formData.canonical_url || ""}
                                    onChange={(e) => handleInputChange("canonical_url", e.target.value)}
                                    disabled={!editMode}
                                    placeholder="https://example.com/portfolio/item"
                                    type="url"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="robots_meta">دستورالعمل ربات‌های جستجو (Robots Meta)</Label>
                                <Input
                                    id="robots_meta"
                                    value={formData.robots_meta || ""}
                                    onChange={(e) => handleInputChange("robots_meta", e.target.value)}
                                    disabled={!editMode}
                                    placeholder="index,follow"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </TabsContent>
    );
}