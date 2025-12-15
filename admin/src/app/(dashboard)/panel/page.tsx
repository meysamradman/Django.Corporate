"use client";

import React, { useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { ProtectedButton } from '@/core/permissions';
import { Save, Loader2, Flag, Image as ImageIcon, Database } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/elements/Tabs";

const PanelBrandingTab = dynamic(
  () => import('@/components/panel/tabs/PanelBrandingTab').then(mod => ({ default: mod.default })),
  { 
    ssr: false,
  }
) as React.ComponentType<{ ref?: React.Ref<PanelBrandingTabRef> }>;

const PanelDatabaseTab = dynamic(
  () => import('@/components/panel/tabs/PanelDatabaseTab').then(mod => ({ default: mod.PanelDatabaseTab })),
  { 
    ssr: false,
  }
);

const FeatureFlagsTab = dynamic(
  () => import('@/components/panel/tabs/FeatureFlagsTab').then(mod => ({ default: mod.FeatureFlagsTab })),
  { 
    ssr: false,
  }
);

import type { PanelBrandingTabRef } from '@/components/panel/tabs/PanelBrandingTab';

export default function PanelSettingsPage() {
    const brandingFormRef = useRef<PanelBrandingTabRef>(null);
    const [activeTab, setActiveTab] = useState("branding");

    return (
        <div className="space-y-6 pb-28 relative">
            <div className="flex items-center justify-between">
                <h1 className="page-title">تنظیمات پنل</h1>
            </div>

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
                    {activeTab === "database" && <PanelDatabaseTab />}
                </TabsContent>

                <TabsContent value="feature-flags">
                    {activeTab === "feature-flags" && <FeatureFlagsTab />}
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
