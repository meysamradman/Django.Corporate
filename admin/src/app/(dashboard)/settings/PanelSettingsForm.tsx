'use client';

import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/elements/Button";
import { Form } from "@/components/elements/Form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { Separator } from "@/components/elements/Separator";
import LogoUploader from './LogoUploader';
import { usePanelSettings, useUpdatePanelSettings } from '@/core/hooks/useAdminData';
import { showSuccessToast } from '@/core/config/errorHandler';
import { Skeleton } from "@/components/elements/Skeleton";
import { Media } from '@/types/shared/media';
import { PanelSettings } from '@/types/settings/panelSettings';

// Define Zod schema for form validation
const formSchema = z.object({
    panel_title: z.string().min(1, "عنوان پنل الزامی است.").max(100),
    // Files are handled separately
});

type FormValues = z.infer<typeof formSchema>;

export default function PanelSettingsForm() {
    const { data: panelSettings, isLoading: isLoadingSettings } = usePanelSettings();
    const { mutateAsync: updateSettings, isPending: isSubmitting } = useUpdatePanelSettings();
    
    const [selectedLogo, setSelectedLogo] = useState<Media | null>(null);
    const [selectedFavicon, setSelectedFavicon] = useState<Media | null>(null);
    
    // Track file deletions
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
            // Set initial media
            setSelectedLogo(panelSettings.logo_detail || panelSettings.logo || null);
            setSelectedFavicon(panelSettings.favicon_detail || panelSettings.favicon || null);
            // Reset deletion states when new data comes from server
            setLogoDeleted(false);
            setFaviconDeleted(false);
        }
    }, [panelSettings, form]);

    // Custom handlers for media operations
    const handleLogoSelect = (media: Media | null) => {
        setSelectedLogo(media);
        if (media) {
            setLogoDeleted(false); // Reset deletion if new media selected
        }
    };

    const handleFaviconSelect = (media: Media | null) => {
        setSelectedFavicon(media);
        if (media) {
            setFaviconDeleted(false); // Reset deletion if new media selected
        }
    };

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        try {
            const formData = new FormData();
            
            // Add title if changed (but we removed this field, so skip it)
            // if (data.panel_title !== panelSettings?.panel_title) {
            //     formData.append('panel_title', data.panel_title);
            // }

            // Handle logo
            if (selectedLogo?.id) {
                formData.append('logo', selectedLogo.id.toString());
            }
            if (logoDeleted) {
                formData.append('remove_logo', 'true');
            }

            // Handle favicon
            if (selectedFavicon?.id) {
                formData.append('favicon', selectedFavicon.id.toString());
            }
            if (faviconDeleted) {
                formData.append('remove_favicon', 'true');
            }

            let hasChanges = false;
            // Check if FormData has entries
            for (const _ of formData.entries()) {
                hasChanges = true;
                break;
            }

            if (!hasChanges) {
                showSuccessToast("تغییری یافت نشد.");
                return;
            }

            await updateSettings(formData);

            // Reset states after successful submission
            setLogoDeleted(false);
            setFaviconDeleted(false);

        } catch (error) {
            console.error("Submission error caught in component:", error);
        }
    };

    // Check if there are changes to enable submit button
    const hasChanges = selectedLogo !== (panelSettings?.logo_detail || panelSettings?.logo || null) || 
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>تنظیمات پنل</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium">لوگوی پنل</h3>
                            <LogoUploader
                                label="لوگوی پنل"
                                selectedMedia={selectedLogo}
                                onMediaSelect={handleLogoSelect}
                                size="md"
                            />
                        </div>

                        <Separator className="my-4" />

                        <div className="space-y-4">
                            <h3 className="text-sm font-medium">فاویکون پنل</h3>
                            <LogoUploader
                                label="فاویکون پنل"
                                selectedMedia={selectedFavicon}
                                onMediaSelect={handleFaviconSelect}
                                size="md"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Button type="submit" disabled={isSubmitting || !hasChanges}>
                    {isSubmitting ? "در حال ذخیره..." : "ذخیره تغییرات"}
                </Button>
            </form>
        </Form>
    );
}