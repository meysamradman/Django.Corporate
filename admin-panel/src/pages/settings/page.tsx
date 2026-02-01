import { lazy, Suspense } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import { Settings, Phone, Smartphone, Mail, Share2, GalleryHorizontal } from "lucide-react";
import { Skeleton } from "@/components/elements/Skeleton";
import {
    ContactPhoneSide,
    ContactMobileSide,
    ContactEmailSide,
    SocialMediaSide,
    SliderSide,
    GeneralSettingsSide
} from "@/components/settings";

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

export default function SettingsPage() {
    const { tab } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();

    const activeTab = tab || "general";

    const action = searchParams.get("action");
    const editId = searchParams.get("id") ? parseInt(searchParams.get("id")!) : null;

    const handleCloseSide = () => {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("action");
        newParams.delete("id");
        setSearchParams(newParams);
    };

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

            <ContactPhoneSide
                isOpen={action === "create-phone" || action === "edit-phone"}
                onClose={handleCloseSide}
                editId={action === "edit-phone" ? editId : null}
            />
            <ContactMobileSide
                isOpen={action === "create-mobile" || action === "edit-mobile"}
                onClose={handleCloseSide}
                editId={action === "edit-mobile" ? editId : null}
            />
            <ContactEmailSide
                isOpen={action === "create-email" || action === "edit-email"}
                onClose={handleCloseSide}
                editId={action === "edit-email" ? editId : null}
            />
            <SocialMediaSide
                isOpen={action === "create-social" || action === "edit-social"}
                onClose={handleCloseSide}
                editId={action === "edit-social" ? editId : null}
            />
            <SliderSide
                isOpen={action === "create-slider" || action === "edit-slider"}
                onClose={handleCloseSide}
                editId={action === "edit-slider" ? editId : null}
            />
            <GeneralSettingsSide
                isOpen={action === "edit-general"}
                onClose={handleCloseSide}
            />

        </div>
    );
}

