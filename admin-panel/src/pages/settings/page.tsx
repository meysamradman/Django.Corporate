import { lazy, Suspense } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Settings, Phone, Smartphone, Mail, Share2, GalleryHorizontal, Map as MapIcon } from "lucide-react";
import { Skeleton } from "@/components/elements/Skeleton";
import { DRAWER_IDS } from "@/components/shared/drawer/types";
import { useOpenDrawerFromUrlAction } from "@/components/shared/drawer/useOpenDrawerFromUrlAction";

const TabSkeleton = () => (
    <div className="space-y-6">
        <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
        </div>
    </div>
);

const GeneralSettingsForm = lazy(() => import("@/components/settings").then(mod => ({ default: mod.GeneralSettingsForm })));
const ContactPhonesSection = lazy(() => import("@/components/settings").then(mod => ({ default: mod.ContactPhones })));
const ContactMobilesSection = lazy(() => import("@/components/settings").then(mod => ({ default: mod.ContactMobiles })));
const ContactEmailsSection = lazy(() => import("@/components/settings").then(mod => ({ default: mod.ContactEmails })));
const SocialMediaSection = lazy(() => import("@/components/settings").then(mod => ({ default: mod.SocialMediaSection })));
const SlidersSection = lazy(() => import("@/components/settings").then(mod => ({ default: mod.SlidersSection })));
const MapSettingsSection = lazy(() => import("@/components/settings").then(mod => ({ default: mod.MapSettingsSection })));

const SETTINGS_DRAWER_ACTIONS = {
    "edit-general": { drawerId: DRAWER_IDS.SETTINGS_GENERAL_FORM },
    "create-phone": { drawerId: DRAWER_IDS.SETTINGS_PHONE_FORM },
    "edit-phone": { drawerId: DRAWER_IDS.SETTINGS_PHONE_FORM, withEditId: true },
    "create-mobile": { drawerId: DRAWER_IDS.SETTINGS_MOBILE_FORM },
    "edit-mobile": { drawerId: DRAWER_IDS.SETTINGS_MOBILE_FORM, withEditId: true },
    "create-email": { drawerId: DRAWER_IDS.SETTINGS_EMAIL_FORM },
    "edit-email": { drawerId: DRAWER_IDS.SETTINGS_EMAIL_FORM, withEditId: true },
    "create-social": { drawerId: DRAWER_IDS.SETTINGS_SOCIAL_FORM },
    "edit-social": { drawerId: DRAWER_IDS.SETTINGS_SOCIAL_FORM, withEditId: true },
    "create-slider": { drawerId: DRAWER_IDS.SETTINGS_SLIDER_FORM },
    "edit-slider": { drawerId: DRAWER_IDS.SETTINGS_SLIDER_FORM, withEditId: true },
    "edit-map": { drawerId: DRAWER_IDS.SETTINGS_MAP_FORM },
} as const;

export default function SettingsPage() {
    const { tab } = useParams();
    const [searchParams] = useSearchParams();
    const activeTab = tab || "general";

    useOpenDrawerFromUrlAction({ searchParams, actionMap: SETTINGS_DRAWER_ACTIONS });

    return (
        <div className="space-y-6 pb-28 relative">

            {activeTab === "general" && (
                <div className="space-y-6">
                    <div className="flex items-center gap-2 pb-4 border-b">
                        <Settings className="w-6 h-6 text-primary" />
                        <h1 className="text-xl font-bold">تنظیمات عمومی</h1>
                    </div>
                    <Suspense fallback={<TabSkeleton />}>
                        <GeneralSettingsForm />
                    </Suspense>
                </div>
            )}

            {activeTab === "phones" && (
                <div className="space-y-6">
                    <div className="flex items-center gap-2 pb-4 border-b">
                        <Phone className="w-6 h-6 text-primary" />
                        <h1 className="text-xl font-bold">شماره‌های تماس</h1>
                    </div>
                    <Suspense fallback={<TabSkeleton />}>
                        <ContactPhonesSection />
                    </Suspense>
                </div>
            )}

            {activeTab === "mobiles" && (
                <div className="space-y-6">
                    <div className="flex items-center gap-2 pb-4 border-b">
                        <Smartphone className="w-6 h-6 text-primary" />
                        <h1 className="text-xl font-bold">شماره‌های موبایل</h1>
                    </div>
                    <Suspense fallback={<TabSkeleton />}>
                        <ContactMobilesSection />
                    </Suspense>
                </div>
            )}

            {activeTab === "emails" && (
                <div className="space-y-6">
                    <div className="flex items-center gap-2 pb-4 border-b">
                        <Mail className="w-6 h-6 text-primary" />
                        <h1 className="text-xl font-bold">ایمیل‌های ارتباطی</h1>
                    </div>
                    <Suspense fallback={<TabSkeleton />}>
                        <ContactEmailsSection />
                    </Suspense>
                </div>
            )}

            {activeTab === "social" && (
                <div className="space-y-6">
                    <div className="flex items-center gap-2 pb-4 border-b">
                        <Share2 className="w-6 h-6 text-primary" />
                        <h1 className="text-xl font-bold">شبکه‌های اجتماعی</h1>
                    </div>
                    <Suspense fallback={<TabSkeleton />}>
                        <SocialMediaSection />
                    </Suspense>
                </div>
            )}

            {activeTab === "sliders" && (
                <div className="space-y-6">
                    <div className="flex items-center gap-2 pb-4 border-b">
                        <GalleryHorizontal className="w-6 h-6 text-primary" />
                        <h1 className="text-xl font-bold">مدیریت اسلایدرها</h1>
                    </div>
                    <Suspense fallback={<TabSkeleton />}>
                        <SlidersSection />
                    </Suspense>
                </div>
            )}

            {activeTab === "map" && (
                <div className="space-y-6">
                    <div className="flex items-center gap-2 pb-4 border-b">
                        <MapIcon className="w-6 h-6 text-primary" />
                        <h1 className="text-xl font-bold">تنظیمات نقشه</h1>
                    </div>
                    <Suspense fallback={<TabSkeleton />}>
                        <MapSettingsSection />
                    </Suspense>
                </div>
            )}
        </div>
    );
}
