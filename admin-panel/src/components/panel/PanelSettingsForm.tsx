import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/elements/Form";
import { Input } from "@/components/elements/Input";
import { Card, CardContent, CardHeader } from "@/components/elements/Card";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { ImageSelector } from "@/components/media/selectors/ImageSelector";
import { usePanelSettings, useUpdatePanelSettings } from './hooks/usePanelSettings';
import { showSuccess } from '@/core/toast';
import { Skeleton } from "@/components/elements/Skeleton";
import type { Media } from '@/types/shared/media';
import { ProtectedButton, useUIPermissions } from '@/components/admins/permissions';
import { 
    FileText,
    Database,
    Download
} from 'lucide-react';
import { downloadDatabaseExport } from '@/api/panel/panel';

const formSchema = z.object({
    panel_title: z.string().min(1, "عنوان پنل الزامی است.").max(100),
});

type FormValues = z.infer<typeof formSchema>;

export interface PanelSettingsFormRef {
    isSubmitting: boolean;
    hasChanges: boolean;
    handleSubmit: () => void;
}

const PanelSettingsForm = forwardRef<PanelSettingsFormRef>((_props, ref) => {
    const { data: panelSettings, isLoading: isLoadingSettings } = usePanelSettings();
    const { mutateAsync: updateSettings, isPending: isSubmitting } = useUpdatePanelSettings();
    
    const { canManagePanel: _canManagePanel } = useUIPermissions();
    
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

            // Handle logo
            const currentLogo = panelSettings?.logo_detail || panelSettings?.logo;
            const logoChanged = selectedLogo?.id !== currentLogo?.id;
            const logoWasRemoved = !selectedLogo && currentLogo;
            
            if (selectedLogo?.id) {
                formData.append('logo', selectedLogo.id.toString());
            } else if (logoWasRemoved || logoDeleted) {
                formData.append('remove_logo', 'true');
            }

            // Handle favicon
            const currentFavicon = panelSettings?.favicon_detail || panelSettings?.favicon;
            const faviconChanged = selectedFavicon?.id !== currentFavicon?.id;
            const faviconWasRemoved = !selectedFavicon && currentFavicon;
            
            if (selectedFavicon?.id) {
                formData.append('favicon', selectedFavicon.id.toString());
            } else if (faviconWasRemoved || faviconDeleted) {
                formData.append('remove_favicon', 'true');
            }

            let hasChanges = false;
            for (const _ of formData.entries()) {
                hasChanges = true;
                break;
            }

            if (!hasChanges) {
                showSuccess("تغییری یافت نشد.");
                return;
            }

            await updateSettings(formData);

            setLogoDeleted(false);
            setFaviconDeleted(false);

        } catch (error) {
        }
    };

    const watchedTitle = form.watch('panel_title');
    
    const hasChanges = watchedTitle !== (panelSettings?.panel_title || "") ||
                      selectedLogo !== (panelSettings?.logo_detail || panelSettings?.logo || null) || 
                      selectedFavicon !== (panelSettings?.favicon_detail || panelSettings?.favicon || null) || 
                      logoDeleted || faviconDeleted;

    useImperativeHandle(ref, () => ({
        isSubmitting,
        hasChanges,
        handleSubmit: () => {
            const formElement = document.getElementById('panel-settings-form') as HTMLFormElement;
            if (formElement) formElement.requestSubmit();
        }
    }));

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
            <form id="panel-settings-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {brandingCards.map((card) => (
                        <Card
                            key={card.key}
                            className={`text-center transition-transform duration-300 hover:-translate-y-1 border-b-4 ${card.borderClass}`}
                        >
                            <CardContent className="flex flex-col items-center gap-5 py-8">
                                <div className="flex justify-center">
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

                <CardWithIcon
                    icon={Database}
                    title="پشتیبان‌گیری دیتابیس"
                    iconBgColor="bg-green"
                    iconColor="stroke-green-2"
                    borderColor="border-b-green-1"
                    className="hover:shadow-lg transition-all duration-300"
                    headerClassName="pb-3"
                >
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <p className="text-font-s">
                                می‌توانید یک نسخه پشتیبان کامل از تمام داده‌های دیتابیس PostgreSQL را به صورت فایل SQL استاندارد دانلود کنید.
                            </p>
                            <p className="text-xs text-font-s/80">
                                این فایل SQL قابل استفاده در هر سرور PostgreSQL دیگر است و شامل تمام جداول، داده‌ها، ساختارها و روابط می‌شود.
                            </p>
                        </div>
                        <ProtectedButton
                            onClick={async () => {
                                try {
                                    await downloadDatabaseExport();
                                } catch (error) {
                                }
                            }}
                            permission="panel.manage"
                            variant="outline"
                            className="w-full gap-2"
                        >
                            <Download className="h-5 w-5" />
                            دانلود پشتیبان دیتابیس (SQL)
                        </ProtectedButton>
                    </div>
                </CardWithIcon>

            </form>
        </Form>
    );
});

PanelSettingsForm.displayName = "PanelSettingsForm";

export default PanelSettingsForm;

