import { useQuery } from "@tanstack/react-query";
import { settingsApi } from "@/api/settings/settings";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Button } from "@/components/elements/Button";
import { Settings, Edit, Globe, Copyright, Link as LinkIcon } from "lucide-react";
import { Skeleton } from "@/components/elements/Skeleton";
import { MediaImage } from "@/components/media/base/MediaImage";
import { useGlobalDrawerStore } from "@/components/shared/drawer/store";
import { DRAWER_IDS } from "@/components/shared/drawer/types";

export function GeneralSettingsForm() {
    const openDrawer = useGlobalDrawerStore(state => state.open);

    const { data: settings, isLoading } = useQuery({
        queryKey: ["general-settings"],
        queryFn: () => settingsApi.getGeneralSettings(),
    });

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-[400px] w-full rounded-2xl" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <CardWithIcon
                icon={Settings}
                title="تنظیمات عمومی سایت"
                iconBgColor="bg-blue"
                iconColor="stroke-blue-2"
                cardBorderColor="border-b-primary"
                headerClassName="pb-4"
                titleExtra={
                    <Button onClick={() => openDrawer(DRAWER_IDS.SETTINGS_GENERAL_FORM)} className="h-9 px-4 rounded-xl shadow-sm">
                        <Edit className="h-4 w-4" />
                        ویرایش تنظیمات
                    </Button>
                }
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-4">
                    <div className="md:col-span-1 space-y-6">
                        <div className="flex flex-col items-center p-6 bg-bg/40 rounded-3xl border border-muted/5 space-y-4">
                            <span className="text-xs font-bold text-font-s bg-muted/10 px-3 py-1 rounded-full">لوگوی اصلی</span>
                            <div className="h-32 w-full bg-card rounded-2xl border border-dashed flex items-center justify-center overflow-hidden shadow-inner">
                                {settings?.logo_image_data ? (
                                    <MediaImage
                                        media={settings.logo_image_data as any}
                                        alt="Logo"
                                        className="h-full w-full object-contain p-4"
                                    />
                                ) : (
                                    <Globe className="h-10 w-10 text-muted/30" />
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col items-center p-4 bg-bg/40 rounded-3xl border border-muted/5 space-y-3">
                                <span className="text-[10px] font-bold text-font-s">فاوآیکون</span>
                                <div className="h-16 w-16 bg-card rounded-xl border border-dashed flex items-center justify-center overflow-hidden">
                                    {settings?.favicon_image_data ? (
                                        <MediaImage
                                            media={settings.favicon_image_data as any}
                                            alt="Favicon"
                                            className="h-full w-full object-contain p-2"
                                        />
                                    ) : (
                                        <Globe className="h-6 w-6 text-muted/30" />
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col items-center p-4 bg-bg/40 rounded-3xl border border-muted/5 space-y-3">
                                <span className="text-[10px] font-bold text-font-s">اینماد</span>
                                <div className="h-16 w-16 bg-card rounded-xl border border-dashed flex items-center justify-center overflow-hidden">
                                    {settings?.enamad_image_data ? (
                                        <MediaImage
                                            media={settings.enamad_image_data as any}
                                            alt="Enamad"
                                            className="h-full w-full object-contain p-1"
                                        />
                                    ) : (
                                        <Globe className="h-6 w-6 text-muted/30" />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-2 space-y-6">
                        <div className="grid gap-6">
                            <DetailItem
                                icon={<Globe className="h-5 w-5" />}
                                label="عنوان وب‌سایت"
                                value={settings?.site_name}
                            />
                            <DetailItem
                                icon={<Copyright className="h-5 w-5" />}
                                label="متن کپی‌رایت"
                                value={settings?.copyright_text}
                            />
                            <DetailItem
                                icon={<LinkIcon className="h-5 w-5" />}
                                label="لینک کپی‌رایت"
                                value={settings?.copyright_link}
                                isUrl
                            />
                        </div>

                        <div className="mt-8 p-6 bg-primary/5 rounded-3xl border border-primary/10">
                            <p className="text-xs text-font-s leading-relaxed">
                                این تنظیمات بخش‌های اصلی قالب وب‌سایت شما از جمله تایتل بار، فوتر و متا تگ‌های اصلی را تحت تاثیر قرار می‌دهند. برای تغییر این موارد روی دکمه ویرایش کلیک کنید.
                            </p>
                        </div>
                    </div>
                </div>
            </CardWithIcon>
        </div>
    );
}

function DetailItem({ icon, label, value, isUrl }: { icon: React.ReactNode, label: string, value?: string | null, isUrl?: boolean }) {
    return (
        <div className="flex items-start gap-4 group p-4 hover:bg-bg/40 rounded-2xl transition-all border border-transparent hover:border-muted/10">
            <div className="flex-none h-10 w-10 flex items-center justify-center bg-muted/10 rounded-xl text-primary group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <div className="flex-1 space-y-1">
                <span className="text-xs font-bold text-font-s block uppercase tracking-wider">{label}</span>
                {isUrl && value ? (
                    <a href={value} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                        {value}
                    </a>
                ) : (
                    <span className="text-sm font-semibold text-font-p">{value || "تنظیم نشده"}</span>
                )}
            </div>
        </div>
    );
}
