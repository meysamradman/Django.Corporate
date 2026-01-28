import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Input } from "@/components/elements/Input";
import { Label } from "@/components/elements/Label";
import { Card, CardContent } from "@/components/elements/Card";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { ImageSelector } from "@/components/media/selectors/ImageSelector";
import { settingsApi } from "@/api/settings/settings";
import type { GeneralSettings } from "@/types/settings/generalSettings";
import { showError } from "@/core/toast";
import type { Media } from "@/types/shared/media";
import { FileText } from "lucide-react";
import { Skeleton } from "@/components/elements/Skeleton";

export interface GeneralSettingsFormRef {
    handleSave: () => void;
    saving: boolean;
}

export const GeneralSettingsForm = forwardRef<GeneralSettingsFormRef>((_props, ref) => {
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
                setLogoImage(data.logo_image_data);
            }
            if (data.favicon_image_data) {
                setFaviconImage(data.favicon_image_data);
            }
            if (data.enamad_image_data) {
                setEnamadImage(data.enamad_image_data);
            }
        } catch (error: any) {
            if (error?.response?.AppStatusCode && error.response.AppStatusCode !== 404) {
                showError("خطا در بارگذاری تنظیمات");
            }
        } finally {
            setLoading(false);
        }
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
            await fetchSettings();
        } catch (error) {
        } finally {
            setSaving(false);
        }
    };

    useImperativeHandle(ref, () => ({
        handleSave: () => {
            if (!siteName.trim()) {
                showError("عنوان الزامی است");
                return;
            }
            handleSave();
        },
        saving
    }));

    if (loading) {
        return (
            <div className="space-y-6">
                <CardWithIcon
                    icon={FileText}
                    title="اطلاعات پایه"
                    iconBgColor="bg-blue"
                    iconColor="stroke-blue-2"
                    borderColor="border-b-blue-1"
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </div>
                </CardWithIcon>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="border-b-4">
                            <CardContent className="flex flex-col items-center gap-5 py-8">
                                <Skeleton className="h-32 w-32 rounded-lg" />
                                <Skeleton className="h-5 w-24" />
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    const imageCards = [
        {
            key: "logo",
            title: "لوگو",
            subtitle: logoImage?.title || "تصویری انتخاب نشده است",
            description: "لوگوی اصلی وب‌سایت که در بالای صفحات نمایش داده می‌شود",
            accent: "from-emerald-1/25 via-emerald-1/15 to-transparent",
            iconWrapper: "bg-emerald",
            iconColor: "stroke-emerald-2",
            statusColor: "bg-emerald-1",
            borderClass: "border-b-emerald-1",
            selectedMedia: logoImage,
            onSelect: setLogoImage,
        },
        {
            key: "favicon",
            title: "فاویکون",
            subtitle: faviconImage?.title || "فاویکونی انتخاب نشده است",
            description: "آیکون کوچک که در تب مرورگر نمایش داده می‌شود",
            accent: "from-purple-1/25 via-purple-1/15 to-transparent",
            iconWrapper: "bg-purple",
            iconColor: "stroke-purple-2",
            statusColor: "bg-purple-1",
            borderClass: "border-b-purple-1",
            selectedMedia: faviconImage,
            onSelect: setFaviconImage,
        },
        {
            key: "enamad",
            title: "اینماد",
            subtitle: enamadImage?.title || "تصویر اینماد انتخاب نشده است",
            description: "تصویر نماد اعتماد الکترونیکی (اینماد)",
            accent: "from-amber-1/25 via-amber-1/15 to-transparent",
            iconWrapper: "bg-amber",
            iconColor: "stroke-amber-2",
            statusColor: "bg-amber-1",
            borderClass: "border-b-amber-1",
            selectedMedia: enamadImage,
            onSelect: setEnamadImage,
        },
    ];

    return (
        <div className="space-y-6">
            <CardWithIcon
                icon={FileText}
                title="اطلاعات پایه"
                iconBgColor="bg-blue"
                iconColor="stroke-blue-2"
                borderColor="border-b-blue-1"
                className="hover:shadow-lg transition-all duration-300"
                headerClassName="pb-3"
            >
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
            </CardWithIcon>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {imageCards.map((card) => (
                    <Card
                        key={card.key}
                        className={`relative overflow-hidden text-center transition-transform duration-300 hover:-translate-y-1 border-b-4 ${card.borderClass}`}
                    >
                        <CardContent className="flex flex-col items-center gap-5 py-8">
                            <div className="flex justify-center w-full">
                                <ImageSelector
                                    selectedMedia={card.selectedMedia}
                                    onMediaSelect={card.onSelect}
                                    size="md"
                                    context="media_library"
                                    alt={card.title}
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="text-base font-semibold text-foreground">
                                    {card.title}
                                </div>
                                <p className="text-sm text-font-s">
                                    {card.subtitle}
                                </p>
                            </div>
                            <p className="text-xs leading-relaxed text-font-s/80">
                                {card.description}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
});

