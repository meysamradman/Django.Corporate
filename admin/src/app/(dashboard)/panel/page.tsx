"use client";

import React, { useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { ProtectedButton } from '@/core/permissions';
import { Save, Loader2, Flag } from 'lucide-react';
import { Skeleton } from '@/components/elements/Skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/elements/Tabs";

// Panel Settings Skeleton
const PanelSettingsSkeleton = () => (
  <div className="space-y-6">
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  </div>
);

// Dynamic imports
const PanelSettingsForm = dynamic(
  () => import('@/components/panel/PanelSettingsForm').then(mod => ({ default: mod.default })),
  { 
    ssr: false,
    loading: () => <PanelSettingsSkeleton />
  }
) as React.ComponentType<{ ref?: React.Ref<PanelSettingsFormRef> }>;

const FeatureFlagsSection = dynamic(
  () => import("@/components/settings").then(mod => ({ default: mod.FeatureFlagsManagement })),
  { 
    ssr: false,
    loading: () => <PanelSettingsSkeleton />
  }
);

import type { PanelSettingsFormRef } from '@/components/panel/PanelSettingsForm';

export default function PanelSettingsPage() {
    const formRef = useRef<PanelSettingsFormRef>(null);
    const [activeTab, setActiveTab] = useState("panel");

    return (
        <div className="space-y-6 pb-28 relative">
            <div className="flex items-center justify-between">
                <h1 className="page-title">تنظیمات پنل</h1>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList>
                    <TabsTrigger value="panel">
                        <Save className="h-4 w-4" />
                        تنظیمات پنل
                    </TabsTrigger>
                    <TabsTrigger value="feature-flags">
                        <Flag className="h-4 w-4" />
                        Feature Flags
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="panel">
                    {activeTab === "panel" && <PanelSettingsForm ref={formRef} />}
                </TabsContent>

                <TabsContent value="feature-flags">
                    {activeTab === "feature-flags" && <FeatureFlagsSection />}
                </TabsContent>
            </Tabs>
            
            {activeTab === "panel" && (
                <div className="fixed bottom-0 left-0 right-0 lg:right-[20rem] z-50 border-t border-br bg-card shadow-lg transition-all duration-300 flex items-center justify-end gap-3 py-4 px-8">
                    <ProtectedButton 
                        onClick={() => formRef.current?.handleSubmit()}
                        permission="panel.manage"
                        size="lg"
                        disabled={formRef.current?.isSubmitting || !formRef.current?.hasChanges}
                    >
                        {formRef.current?.isSubmitting ? (
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
