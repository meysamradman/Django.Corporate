import { useRef, useState, lazy, Suspense, type ComponentType, type Ref } from 'react';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';
import { ProtectedButton } from '@/components/admins/permissions';
import { Save, Loader2, Flag, Image as ImageIcon, Database } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/elements/Tabs";

const PanelBrandingTab = lazy(() => import('@/components/panel/tabs/PanelBrandingTab').then(mod => ({ default: mod.default }))) as ComponentType<{ ref?: Ref<PanelBrandingTabRef> }>;
const PanelDatabaseTab = lazy(() => import('@/components/panel/tabs/PanelDatabaseTab').then(mod => ({ default: mod.PanelDatabaseTab })));
const FeatureFlagsTab = lazy(() => import('@/components/panel/tabs/FeatureFlagsTab').then(mod => ({ default: mod.FeatureFlagsTab })));

import type { PanelBrandingTabRef } from '@/components/panel/tabs/PanelBrandingTab';

export default function PanelSettingsPage() {
    const brandingFormRef = useRef<PanelBrandingTabRef>(null);
    const [activeTab, setActiveTab] = useState("branding");

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
                </TabsList>

                <TabsContent value="branding">
                    {activeTab === "branding" && <PanelBrandingTab ref={brandingFormRef} />}
                </TabsContent>

                <TabsContent value="database">
                    {activeTab === "database" && (
                        <Suspense fallback={<div className="p-8">Loading...</div>}>
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
            </Tabs>
            
            {activeTab === "branding" && (
                <div className="fixed bottom-0 left-0 right-0 lg:right-[20rem] z-50 border-t border-br bg-card shadow-lg transition-all duration-300 flex items-center justify-end gap-3 py-4 px-8">
                    <ProtectedButton 
                        onClick={() => brandingFormRef.current?.handleSubmit()}
                        permission="panel.manage"
                        size="lg"
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
                    </ProtectedButton>
                </div>
            )}
        </div>
    );
}
