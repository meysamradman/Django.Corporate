"use client";

import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/elements/Button";
import { Input } from "@/components/elements/Input";
import { Label } from "@/components/elements/Label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import LogoUploader from "@/app/(dashboard)/settings/panel/LogoUploader";
import { settingsApi, GeneralSettings } from "@/api/settings/general/route";
import { toast } from "@/components/elements/Sonner";
import { Media } from "@/types/shared/media";
import { Save, Loader2, FileText, Image as ImageIcon } from "lucide-react";

export interface GeneralSettingsFormRef {
    handleSave: () => void;
}

export const GeneralSettingsForm = forwardRef<GeneralSettingsFormRef>((props, ref) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<GeneralSettings | null>(null);
    
    const [siteName, setSiteName] = useState("");
    const [copyrightText, setCopyrightText] = useState("");
    const [copyrightLink, setCopyrightLink] = useState("");
    
    const [logoImage, setLogoImage] = useState<Media | null>(null);
    const [faviconImage, setFaviconImage] = useState<Media | null>(null);
    const [enamadImage, setEnamadImage] = useState<Media | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const data = await settingsApi.getGeneralSettings();
            setSettings(data);
            
            setSiteName(data.site_name || "");
            setCopyrightText(data.copyright_text || "");
            setCopyrightLink(data.copyright_link || "");
            
            if (data.logo_image_data) {
                setLogoImage(convertImageMediaToMedia(data.logo_image_data));
            }
            if (data.favicon_image_data) {
                setFaviconImage(convertImageMediaToMedia(data.favicon_image_data));
            }
            if (data.enamad_image_data) {
                setEnamadImage(convertImageMediaToMedia(data.enamad_image_data));
            }
        } catch (error: any) {
            console.error("Error fetching settings:", error);
            const errorMessage = error?.message || error?.response?.message || "خطا در دریافت تنظیمات";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const convertImageMediaToMedia = (imageMedia: any): Media => {
        return {
            id: imageMedia.id,
            public_id: imageMedia.public_id,
            title: imageMedia.title || "",
            file_url: imageMedia.file_url,
            file_size: imageMedia.file_size,
            mime_type: imageMedia.mime_type,
            alt_text: imageMedia.alt_text || "",
            is_active: imageMedia.is_active,
            created_at: imageMedia.created_at,
            updated_at: imageMedia.updated_at,
            created_by: null,
            updated_by: null,
            media_type: imageMedia.media_type || "image",
            cover_image: null,
        };
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            
            const updateData: any = {
                site_name: siteName,
                copyright_text: copyrightText,
                copyright_link: copyrightLink || null,
            };

            if (logoImage) {
                updateData.logo_image = logoImage.id;
            } else if (settings?.logo_image && !logoImage) {
                updateData.logo_image = null;
            }

            if (faviconImage) {
                updateData.favicon_image = faviconImage.id;
            } else if (settings?.favicon_image && !faviconImage) {
                updateData.favicon_image = null;
            }

            if (enamadImage) {
                updateData.enamad_image = enamadImage.id;
            } else if (settings?.enamad_image && !enamadImage) {
                updateData.enamad_image = null;
            }

            await settingsApi.updateGeneralSettings(updateData);
            toast.success("تنظیمات با موفقیت به‌روزرسانی شد");
            await fetchSettings();
        } catch (error) {
            console.error("Error updating settings:", error);
            toast.error("خطا در به‌روزرسانی تنظیمات");
        } finally {
            setSaving(false);
        }
    };

    useImperativeHandle(ref, () => ({
        handleSave: () => {
            if (!siteName.trim()) {
                toast.error("نام سیستم الزامی است");
                return;
            }
            handleSave();
        }
    }));

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card className="hover:shadow-lg transition-all duration-300 border-b-4 border-b-blue-500">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-100 rounded-xl shadow-sm">
                            <FileText className="w-5 h-5 stroke-blue-600" />
                        </div>
                        <CardTitle>اطلاعات پایه</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="site_name">نام سیستم</Label>
                            <Input
                                id="site_name"
                                value={siteName}
                                onChange={(e) => setSiteName(e.target.value)}
                                placeholder="نام سیستم یا برند"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="copyright_text">متن کپی رایت</Label>
                            <Input
                                id="copyright_text"
                                value={copyrightText}
                                onChange={(e) => setCopyrightText(e.target.value)}
                                placeholder="تمام حقوق محفوظ است © ۱۴۰۴"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="copyright_link">لینک کپی رایت</Label>
                            <Input
                                id="copyright_link"
                                value={copyrightLink}
                                onChange={(e) => setCopyrightLink(e.target.value)}
                                placeholder="https://example.com"
                                type="url"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="hover:shadow-lg transition-all duration-300 border-b-4 border-b-green-500">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-green-100 rounded-xl shadow-sm">
                                <ImageIcon className="w-5 h-5 stroke-green-600" />
                            </div>
                            <CardTitle>لوگو</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4 text-sm">
                            لوگوی اصلی وب‌سایت که در بالای صفحات نمایش داده می‌شود
                        </p>
                        <LogoUploader
                            label="لوگو"
                            selectedMedia={logoImage}
                            onMediaSelect={setLogoImage}
                            size="md"
                            showLabel={false}
                        />
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-all duration-300 border-b-4 border-b-purple-500">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-purple-100 rounded-xl shadow-sm">
                                <ImageIcon className="w-5 h-5 stroke-purple-600" />
                            </div>
                            <CardTitle>فاویکون</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4 text-sm">
                            آیکون کوچک که در تب مرورگر نمایش داده می‌شود
                        </p>
                        <LogoUploader
                            label="فاویکون"
                            selectedMedia={faviconImage}
                            onMediaSelect={setFaviconImage}
                            size="md"
                            showLabel={false}
                        />
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-all duration-300 border-b-4 border-b-orange-500">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-orange-100 rounded-xl shadow-sm">
                                <ImageIcon className="w-5 h-5 stroke-orange-600" />
                            </div>
                            <CardTitle>اینماد</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4 text-sm">
                            تصویر نماد اعتماد الکترونیکی (اینماد)
                        </p>
                        <LogoUploader
                            label="اینماد"
                            selectedMedia={enamadImage}
                            onMediaSelect={setEnamadImage}
                            size="md"
                            showLabel={false}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
});

