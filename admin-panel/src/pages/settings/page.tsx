import { lazy, Suspense, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Settings, Phone, Smartphone, Mail, Share2, GalleryHorizontal, Map as MapIcon } from "lucide-react";
import { Skeleton } from "@/components/elements/Skeleton";
import { useGlobalDrawerStore } from "@/components/shared/drawer/store";
import { DRAWER_IDS } from "@/components/shared/drawer/types";

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

export default function SettingsPage() {
    const openDrawer = useGlobalDrawerStore(state => state.open);
    const { tab } = useParams();
    const [searchParams] = useSearchParams();
    const activeTab = tab || "general";
    const action = searchParams.get("action");
    const id = searchParams.get("id");

    useEffect(() => {
        if (action === "edit-general") {
            openDrawer(DRAWER_IDS.SETTINGS_GENERAL_FORM);
        } else if (action === "create-phone") {
            openDrawer(DRAWER_IDS.SETTINGS_PHONE_FORM);
        } else if (action === "edit-phone" && id) {
            openDrawer(DRAWER_IDS.SETTINGS_PHONE_FORM, { editId: Number(id) });
        } else if (action === "create-mobile") {
            openDrawer(DRAWER_IDS.SETTINGS_MOBILE_FORM);
        } else if (action === "edit-mobile" && id) {
            openDrawer(DRAWER_IDS.SETTINGS_MOBILE_FORM, { editId: Number(id) });
        } else if (action === "create-email") {
            openDrawer(DRAWER_IDS.SETTINGS_EMAIL_FORM);
        } else if (action === "edit-email" && id) {
            openDrawer(DRAWER_IDS.SETTINGS_EMAIL_FORM, { editId: Number(id) });
        } else if (action === "create-social") {
            openDrawer(DRAWER_IDS.SETTINGS_SOCIAL_FORM);
        } else if (action === "edit-social" && id) {
            openDrawer(DRAWER_IDS.SETTINGS_SOCIAL_FORM, { editId: Number(id) });
        } else if (action === "create-slider") {
            openDrawer(DRAWER_IDS.SETTINGS_SLIDER_FORM);
        } else if (action === "edit-slider" && id) {
            openDrawer(DRAWER_IDS.SETTINGS_SLIDER_FORM, { editId: Number(id) });
        } else if (action === "edit-map") {
            openDrawer(DRAWER_IDS.SETTINGS_MAP_FORM);
        }
    }, [action, id, openDrawer]);

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
