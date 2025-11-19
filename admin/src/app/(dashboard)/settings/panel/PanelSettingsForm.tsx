'use client';

import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/elements/Button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/elements/Form";
import { Input } from "@/components/elements/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import LogoUploader from './LogoUploader';
import { usePanelSettings, useUpdatePanelSettings } from '@/core/hooks/useAdminData';
import { showSuccessToast } from '@/core/config/errorHandler';
import { Skeleton } from "@/components/elements/Skeleton";
import { Media } from '@/types/shared/media';
import { PanelSettings } from '@/types/settings/panelSettings';
import { ProtectedButton, useUIPermissions } from '@/core/permissions';
import { 
    Image as ImageIcon, 
    FileText,
    Save
} from 'lucide-react';

const formSchema = z.object({
    panel_title: z.string().min(1, "عنوان پنل الزامی است.").max(100),
});

type FormValues = z.infer<typeof formSchema>;

export default function PanelSettingsForm() {
    const { data: panelSettings, isLoading: isLoadingSettings } = usePanelSettings();
    const { mutateAsync: updateSettings, isPending: isSubmitting } = useUpdatePanelSettings();
    
    // 🚀 Pre-computed permission flag
    const { canManagePanel } = useUIPermissions();
    
    const [selectedLogo, setSelectedLogo] = useState<Media | null>(null);
    const [selectedFavicon, setSelectedFavicon] = useState<Media | null>(null);
    
    const [logoDeleted, setLogoDeleted] = useState<boolean>(false);
    const [faviconDeleted, setFaviconDeleted] = useState<boolean>(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        values: {
            panel_title: panelSettings?.panel_title || ""
        },
    });

    useEffect(() => {
        if (panelSettings) {
            form.reset({ panel_title: panelSettings.panel_title || "" });
            setSelectedLogo(panelSettings.logo_detail || panelSettings.logo || null);
            setSelectedFavicon(panelSettings.favicon_detail || panelSettings.favicon || null);
            setLogoDeleted(false);
            setFaviconDeleted(false);
        }
    }, [panelSettings, form]);

    const handleLogoSelect = (media: Media | null) => {
        setSelectedLogo(media);
        setLogoDeleted(!media);
        if (media) {
            setLogoDeleted(false);
        }
    };

    const handleFaviconSelect = (media: Media | null) => {
        setSelectedFavicon(media);
        setFaviconDeleted(!media);
        if (media) {
            setFaviconDeleted(false);
        }
    };

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        try {
            const formData = new FormData();
            
            if (data.panel_title !== panelSettings?.panel_title) {
                formData.append('panel_title', data.panel_title);
            }

            if (selectedLogo?.id) {
                formData.append('logo', selectedLogo.id.toString());
            }
            if (logoDeleted) {
                formData.append('remove_logo', 'true');
            }

            if (selectedFavicon?.id) {
                formData.append('favicon', selectedFavicon.id.toString());
            }
            if (faviconDeleted) {
                formData.append('remove_favicon', 'true');
            }

            let hasChanges = false;
            for (const _ of formData.entries()) {
                hasChanges = true;
                break;
            }

            if (!hasChanges) {
                showSuccessToast("تغییری یافت نشد.");
                return;
            }

            await updateSettings(formData);

            setLogoDeleted(false);
            setFaviconDeleted(false);

        } catch (error) {
            // Error in submission
        }
    };

    const watchedTitle = form.watch('panel_title');
    
    const hasChanges = watchedTitle !== (panelSettings?.panel_title || "") ||
                      selectedLogo !== (panelSettings?.logo_detail || panelSettings?.logo || null) || 
                      selectedFavicon !== (panelSettings?.favicon_detail || panelSettings?.favicon || null) || 
                      logoDeleted || faviconDeleted;

    if (isLoadingSettings) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/4" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-10 w-24" />
                </CardContent>
            </Card>
        );
    }

    const brandingCards = [
        {
            key: "logo",
            title: "لوگوی پنل",
            subtitle: selectedLogo?.title || "لوگویی انتخاب نشده است",
            description: "لوگوی اصلی که در سایدبار و صفحات کلیدی نمایش داده می‌شود",
            accent: "from-blue-1/30 via-blue-1/10 to-transparent",
            statusColor: "bg-blue-1",
            borderClass: "border-b-blue-1",
            selectedMedia: selectedLogo,
            onSelect: handleLogoSelect,
        },
        {
            key: "favicon",
            title: "فاویکون",
            subtitle: selectedFavicon?.title || "فاویکونی انتخاب نشده است",
            description: "آیکون کوچک تب مرورگر برای شناسایی سریع برند شما",
            accent: "from-purple-1/30 via-purple-1/10 to-transparent",
            statusColor: "bg-purple-1",
            borderClass: "border-b-purple-1",
            selectedMedia: selectedFavicon,
            onSelect: handleFaviconSelect,
        },
    ];

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {brandingCards.map((card) => (
                        <Card
                            key={card.key}
                            className={`text-center transition-transform duration-300 hover:-translate-y-1 border-b-4 ${card.borderClass}`}
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
                                    <p className="text-sm text-font-s">
                                        {card.subtitle}
                                    </p>
                                </div>
                                <p className="text-xs leading-relaxed text-font-s/80 max-w-sm">
                                    {card.description}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <CardWithIcon
                    icon={FileText}
                    title="اطلاعات پنل"
                    iconBgColor="bg-blue"
                    iconColor="stroke-blue-2"
                    borderColor="border-b-blue-1"
                    className="hover:shadow-lg transition-all duration-300"
                    headerClassName="pb-3"
                >
                        <p className="text-font-s mb-4">
                            عنوان پنل که در بالای صفحه و در تب مرورگر نمایش داده می‌شود
                        </p>
                        <FormField
                            control={form.control}
                            name="panel_title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>عنوان پنل</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            placeholder="عنوان پنل مدیریتی"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                </CardWithIcon>

                <div className="flex justify-end">
                    <ProtectedButton 
                        type="submit" 
                        permission="panel.manage"
                        disabled={isSubmitting || !hasChanges}
                        className="min-w-[120px]"
                        showDenyToast={true}
                        denyMessage="شما دسترسی لازم برای مدیریت تنظیمات پنل را ندارید"
                    >
                        <Save className="w-4 h-4 me-2" />
                        {isSubmitting ? "در حال ذخیره..." : "ذخیره تغییرات"}
                    </ProtectedButton>
                </div>
            </form>
        </Form>
    );
}

