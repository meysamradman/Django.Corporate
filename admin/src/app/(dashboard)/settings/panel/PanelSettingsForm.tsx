'use client';

import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/elements/Button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/elements/Form";
import { Input } from "@/components/elements/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { Separator } from "@/components/elements/Separator";
import LogoUploader from './LogoUploader';
import { usePanelSettings, useUpdatePanelSettings } from '@/core/hooks/useAdminData';
import { showSuccessToast } from '@/core/config/errorHandler';
import { Skeleton } from "@/components/elements/Skeleton";
import { Media } from '@/types/shared/media';
import { PanelSettings } from '@/types/settings/panelSettings';
import { 
    Image as ImageIcon, 
    Palette, 
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
        if (media) {
            setLogoDeleted(false);
        }
    };

    const handleFaviconSelect = (media: Media | null) => {
        setSelectedFavicon(media);
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
            console.error("Submission error caught in component:", error);
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

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="hover:shadow-lg transition-all duration-300 border-b-4 border-b-blue-500">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-blue-100 rounded-xl shadow-sm">
                                    <ImageIcon className="w-5 h-5 stroke-blue-600" />
                                </div>
                                <CardTitle>لوگوی پنل</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground mb-4">
                                لوگوی اصلی پنل مدیریتی که در منوی کناری و بالای صفحه نمایش داده می‌شود
                            </p>
                            <LogoUploader
                                label="لوگوی پنل"
                                selectedMedia={selectedLogo}
                                onMediaSelect={handleLogoSelect}
                                size="md"
                            />
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-all duration-300 border-b-4 border-b-purple-500">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-purple-100 rounded-xl shadow-sm">
                                    <Palette className="w-5 h-5 stroke-purple-600" />
                                </div>
                                <CardTitle>فاویکون پنل</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground mb-4">
                                آیکون کوچک که در تب مرورگر نمایش داده می‌شود
                            </p>
                            <LogoUploader
                                label="فاویکون پنل"
                                selectedMedia={selectedFavicon}
                                onMediaSelect={handleFaviconSelect}
                                size="md"
                            />
                        </CardContent>
                    </Card>
                </div>

                <Card className="hover:shadow-lg transition-all duration-300 border-b-4 border-b-green-500">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-green-100 rounded-xl shadow-sm">
                                <FileText className="w-5 h-5 stroke-green-600" />
                            </div>
                            <CardTitle>اطلاعات پنل</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4">
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
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button 
                        type="submit" 
                        disabled={isSubmitting || !hasChanges}
                        className="min-w-[120px]"
                    >
                        <Save className="w-4 h-4 me-2" />
                        {isSubmitting ? "در حال ذخیره..." : "ذخیره تغییرات"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

