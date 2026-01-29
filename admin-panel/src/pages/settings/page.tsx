import { lazy, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/elements/Tabs";
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
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get("tab") || "general";
    const action = searchParams.get("action");
    const editId = searchParams.get("id") ? parseInt(searchParams.get("id")!) : null;

    const setActiveTab = (tab: string) => {
        setSearchParams({ tab });
    };

    const handleCloseSide = () => {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("action");
        newParams.delete("id");
        setSearchParams(newParams);
    };

    return (
        <div className="space-y-6 pb-28 relative">

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList>
                    <TabsTrigger value="general">
                        <Settings className="h-4 w-4" />
                        تنظیمات عمومی
                    </TabsTrigger>
                    <TabsTrigger value="phones">
                        <Phone className="h-4 w-4" />
                        شماره تماس
                    </TabsTrigger>
                    <TabsTrigger value="mobiles">
                        <Smartphone className="h-4 w-4" />
                        موبایل
                    </TabsTrigger>
                    <TabsTrigger value="emails">
                        <Mail className="h-4 w-4" />
                        ایمیل
                    </TabsTrigger>
                    <TabsTrigger value="social">
                        <Share2 className="h-4 w-4" />
                        شبکه‌های اجتماعی
                    </TabsTrigger>
                    <TabsTrigger value="sliders">
                        <GalleryHorizontal className="h-4 w-4" />
                        اسلایدرها
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="general">
                    {activeTab === "general" && (
                        <Suspense fallback={<TabSkeleton />}>
                            <GeneralSettingsForm />
                        </Suspense>
                    )}
                </TabsContent>

                <TabsContent value="phones">
                    {activeTab === "phones" && (
                        <Suspense fallback={<TabSkeleton />}>
                            <ContactPhonesSection />
                        </Suspense>
                    )}
                </TabsContent>

                <TabsContent value="mobiles">
                    {activeTab === "mobiles" && (
                        <Suspense fallback={<TabSkeleton />}>
                            <ContactMobilesSection />
                        </Suspense>
                    )}
                </TabsContent>

                <TabsContent value="emails">
                    {activeTab === "emails" && (
                        <Suspense fallback={<TabSkeleton />}>
                            <ContactEmailsSection />
                        </Suspense>
                    )}
                </TabsContent>

                <TabsContent value="social">
                    {activeTab === "social" && (
                        <Suspense fallback={<TabSkeleton />}>
                            <SocialMediaSection />
                        </Suspense>
                    )}
                </TabsContent>

                <TabsContent value="sliders">
                    {activeTab === "sliders" && (
                        <Suspense fallback={<TabSkeleton />}>
                            <SlidersSection />
                        </Suspense>
                    )}
                </TabsContent>
            </Tabs>

            {/* Sidebar Components Trigged by URL */}
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

