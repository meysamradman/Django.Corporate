import { useRef, lazy, Suspense, type ComponentType, type Ref } from 'react';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';
import { useUIPermissions } from '@/core/permissions';
import { Save, Loader2, Flag, Image as ImageIcon, Database, Shield } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/elements/Tabs";

const PanelBrandingTab = lazy(() => import('@/components/panel/tabs/PanelBrandingTab').then(mod => ({ default: mod.default }))) as ComponentType<{ ref?: Ref<PanelBrandingTabRef> }>;
const PanelDatabaseTab = lazy(() => import('@/components/panel/tabs/PanelDatabaseTab').then(mod => ({ default: mod.PanelDatabaseTab })));
const FeatureFlagsTab = lazy(() => import('@/components/panel/tabs/FeatureFlagsTab').then(mod => ({ default: mod.FeatureFlagsTab })));
const IPManagementTab = lazy(() => import('@/components/panel/tabs/IPManagementTab').then(mod => ({ default: mod.IPManagementTab })));

import type { PanelBrandingTabRef } from '@/components/panel/tabs/PanelBrandingTab';

import { useSearchParams } from 'react-router-dom';

export default function PanelSettingsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const brandingFormRef = useRef<PanelBrandingTabRef>(null);

    const activeTab = searchParams.get('tab') || "branding";
    const setActiveTab = (tab: string) => {
        setSearchParams({ tab }, { replace: true });
    };

    const { canManagePanel } = useUIPermissions();

    return (
        <div className="space-y-6 pb-28 relative">
            <PageHeader title="تنظیمات پنل" />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList>
                    <TabsTrigger value="branding">
                        <ImageIcon className="h-4 w-4" />
                        لوگو و نام پنل
                    </TabsTrigger>
                    <TabsTrigger value="database">
                        <Database className="h-4 w-4" />
                        دیتابیس
                    </TabsTrigger>
                    <TabsTrigger value="feature-flags">
                        <Flag className="h-4 w-4" />
                        ویژگی‌های سیستم
                    </TabsTrigger>
                    {canManagePanel && (
                        <TabsTrigger value="ip-management">
                            <Shield className="h-4 w-4" />
                            مدیریت IP
                        </TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="branding">
                    {activeTab === "branding" && <PanelBrandingTab ref={brandingFormRef} />}
                </TabsContent>

                <TabsContent value="database">
                    {activeTab === "database" && (
                        <Suspense fallback={<div />}>
                            <PanelDatabaseTab />
                        </Suspense>
                    )}
                </TabsContent>

                <TabsContent value="feature-flags">
                    {activeTab === "feature-flags" && (
                        <Suspense fallback={<div className="p-8">Loading...</div>}>
                            <FeatureFlagsTab />
                        </Suspense>
                    )}
                </TabsContent>

                <TabsContent value="ip-management">
                    {activeTab === "ip-management" && (
                        <Suspense fallback={<div className="p-8">Loading...</div>}>
                            <IPManagementTab />
                        </Suspense>
                    )}
                </TabsContent>
            </Tabs>

            {activeTab === "branding" && canManagePanel && (  // 🔒 فقط Super Admin
                <div className="fixed bottom-0 left-0 right-0 lg:right-[20rem] z-50 border-t border-br bg-card shadow-lg transition-all duration-300 flex items-center justify-end gap-3 py-4 px-8">
                    <button
                        onClick={() => brandingFormRef.current?.handleSubmit()}
                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8"
                        disabled={brandingFormRef.current?.isSubmitting || !brandingFormRef.current?.hasChanges}
                    >
                        {brandingFormRef.current?.isSubmitting ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                در حال ذخیره...
                            </>
                        ) : (
                            <>
                                <Save className="h-5 w-5" />
                                ذخیره تغییرات
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
