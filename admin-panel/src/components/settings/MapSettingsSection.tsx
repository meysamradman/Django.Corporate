import { useQuery } from "@tanstack/react-query";
import { settingsApi } from "@/api/settings/settings";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Button } from "@/components/elements/Button";
import { Map as MapIcon, Edit, Key, MousePointer2 } from "lucide-react";
import { Skeleton } from "@/components/elements/Skeleton";
import { useGlobalDrawerStore } from "@/components/shared/drawer/store";
import { DRAWER_IDS } from "@/components/shared/drawer/types";

export function MapSettingsSection() {
    const openDrawer = useGlobalDrawerStore(state => state.open);

    const { data: settings, isLoading } = useQuery({
        queryKey: ["map-settings"],
        queryFn: () => settingsApi.getMapSettings(),
    });

    const neshanMapKey = settings?.configs?.neshan?.map_key || import.meta.env.VITE_NESHAN_MAP_KEY || null;

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-100 w-full rounded-2xl" />
            </div>
        );
    }

    const providerDisplay = settings?.provider === 'google_maps'
        ? 'Google Maps'
        : settings?.provider === 'neshan'
            ? 'Neshan (Iranian)'
            : 'Leaflet / OpenStreetMap';

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <CardWithIcon
                icon={MapIcon}
                title="تنظیمات نقشه"
                iconBgColor="bg-blue"
                iconColor="stroke-blue-2"
                cardBorderColor="border-b-blue-1"
                headerClassName="pb-4"
                titleExtra={
                    <Button onClick={() => openDrawer(DRAWER_IDS.SETTINGS_MAP_FORM)} className="h-9 px-4 rounded-xl shadow-sm">
                        <Edit className="h-4 w-4" />
                        ویرایش تنظیمات نقشه
                    </Button>
                }
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
                    <div className="space-y-6">
                        <DetailItem
                            icon={<MousePointer2 className="h-5 w-5" />}
                            label="سرویس‌دهنده پیش‌فرض"
                            value={providerDisplay}
                        />
                    </div>

                    <div className="space-y-6">
                        {settings?.provider === 'google_maps' && (
                            <div className="grid gap-4">
                                <DetailItem
                                    icon={<Key className="h-5 w-5" />}
                                    label="Google Maps API Key"
                                    value={settings.configs?.google_maps?.api_key}
                                    isSecret
                                />
                                <DetailItem
                                    icon={<Key className="h-5 w-5" />}
                                    label="Google Maps Map ID"
                                    value={settings.configs?.google_maps?.map_id}
                                />
                            </div>
                        )}
                        {settings?.provider === 'leaflet' && (
                            <div className="p-4 bg-muted/5 rounded-2xl border border-muted/10">
                                <p className="text-xs text-font-s leading-relaxed">
                                    سرویس Leaflet به صورت رایگان و بدون نیاز به کلید API عمل می‌کند.
                                </p>
                            </div>
                        )}
                        {settings?.provider === 'neshan' && (
                            <div className="grid gap-4">
                                <DetailItem
                                    icon={<Key className="h-5 w-5" />}
                                    label="Neshan Web Map Key"
                                    value={neshanMapKey}
                                    isSecret
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-8 p-6 bg-blue/5 rounded-3xl border border-blue/10">
                    <p className="text-xs text-font-s leading-relaxed">
                        این تنظیمات تعیین می‌کند که در پنل مدیریت و کل وب‌سایت، از کدام سرویس نقشه استفاده شود.
                    </p>
                </div>
            </CardWithIcon>
        </div>
    );
}

function DetailItem({ icon, label, value, isSecret }: { icon: React.ReactNode, label: string, value?: string | null, isSecret?: boolean }) {
    const displayValue = isSecret && value ? "••••••••••••••••" : (value || "تنظیم نشده");

    return (
        <div className="flex items-start gap-4 group p-4 hover:bg-bg/40 rounded-2xl transition-all border border-transparent hover:border-muted/10">
            <div className="flex-none h-10 w-10 flex items-center justify-center bg-muted/10 rounded-xl text-blue group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <div className="flex-1 space-y-1">
                <span className="text-xs font-bold text-font-s block uppercase tracking-wider">{label}</span>
                <span className="text-sm font-semibold text-font-p">{displayValue}</span>
            </div>
        </div>
    );
}
