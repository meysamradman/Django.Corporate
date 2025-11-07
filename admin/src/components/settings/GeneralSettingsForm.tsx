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
                toast.error("عنوان الزامی است");
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

    const imageCards = [
        {
            key: "logo",
            title: "لوگو",
            subtitle: logoImage?.title || "تصویری انتخاب نشده است",
            description: "لوگوی اصلی وب‌سایت که در بالای صفحات نمایش داده می‌شود",
            accent: "from-emerald-500/25 via-emerald-400/15 to-transparent",
            iconWrapper: "bg-emerald-100",
            iconColor: "stroke-emerald-600",
            statusColor: "bg-emerald-500",
            borderClass: "border-b-emerald-500",
            selectedMedia: logoImage,
            onSelect: setLogoImage,
        },
        {
            key: "favicon",
            title: "فاویکون",
            subtitle: faviconImage?.title || "فاویکونی انتخاب نشده است",
            description: "آیکون کوچک که در تب مرورگر نمایش داده می‌شود",
            accent: "from-violet-500/25 via-violet-400/15 to-transparent",
            iconWrapper: "bg-violet-100",
            iconColor: "stroke-violet-600",
            statusColor: "bg-violet-500",
            borderClass: "border-b-violet-500",
            selectedMedia: faviconImage,
            onSelect: setFaviconImage,
        },
        {
            key: "enamad",
            title: "اینماد",
            subtitle: enamadImage?.title || "تصویر اینماد انتخاب نشده است",
            description: "تصویر نماد اعتماد الکترونیکی (اینماد)",
            accent: "from-amber-500/25 via-amber-400/15 to-transparent",
            iconWrapper: "bg-amber-100",
            iconColor: "stroke-amber-600",
            statusColor: "bg-amber-500",
            borderClass: "border-b-amber-500",
            selectedMedia: enamadImage,
            onSelect: setEnamadImage,
        },
    ];

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
                            <Label htmlFor="site_name">عنوان</Label>
                            <Input
                                id="site_name"
                                value={siteName}
                                onChange={(e) => setSiteName(e.target.value)}
                                placeholder="عنوان سایت یا برند"
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
                {imageCards.map((card) => (
                    <Card
                        key={card.key}
                        className={`relative overflow-hidden text-center transition-transform duration-300 hover:-translate-y-1 border-b-4 ${card.borderClass}`}
                    >
                        <CardContent className="flex flex-col items-center gap-5 py-8">
                            <LogoUploader
                                label={card.title}
                                selectedMedia={card.selectedMedia}
                                onMediaSelect={card.onSelect}
                                size="md"
                                showLabel={false}
                                className="w-full"
                                statusColor={card.statusColor}
                                accentGradient={card.accent}
                            />
                            <div className="space-y-2">
                                <div className="text-base font-semibold text-foreground">
                                    {card.title}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {card.subtitle}
                                </p>
                            </div>
                            <p className="text-xs leading-relaxed text-muted-foreground/80">
                                {card.description}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
});

