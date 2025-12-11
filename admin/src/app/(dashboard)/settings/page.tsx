"use client";

import React, { useState, useRef } from "react";
import dynamic from "next/dynamic";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/elements/Tabs";
import { ProtectedButton, useUIPermissions } from '@/core/permissions';
import { Settings, Phone, Smartphone, Mail, Share2, Save, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/elements/Skeleton";

// Tab Skeleton
const TabSkeleton = () => (
  <div className="space-y-6">
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  </div>
);

// Dynamic imports
const GeneralSettingsForm = dynamic(
  () => import("@/components/settings").then(mod => ({ default: mod.GeneralSettingsForm })),
  { 
    ssr: false,
    loading: () => <TabSkeleton />
  }
);

const ContactPhonesSection = dynamic(
  () => import("@/components/settings").then(mod => ({ default: mod.ContactPhonesSection })),
  { 
    ssr: false,
    loading: () => <TabSkeleton />
  }
);

const ContactMobilesSection = dynamic(
  () => import("@/components/settings").then(mod => ({ default: mod.ContactMobilesSection })),
  { 
    ssr: false,
    loading: () => <TabSkeleton />
  }
);

const ContactEmailsSection = dynamic(
  () => import("@/components/settings").then(mod => ({ default: mod.ContactEmailsSection })),
  { 
    ssr: false,
    loading: () => <TabSkeleton />
  }
);

const SocialMediaSection = dynamic(
  () => import("@/components/settings").then(mod => ({ default: mod.SocialMediaSection })),
  { 
    ssr: false,
    loading: () => <TabSkeleton />
  }
);

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState("general");
    const generalFormRef = useRef<{ handleSave: () => void; saving: boolean }>(null);
    
    const { canManageSettings } = useUIPermissions();

    return (
        <div className="space-y-6 pb-28 relative">
            <div className="flex items-center justify-between">
                <h1 className="page-title">تنظیمات سیستم</h1>
            </div>

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
                </TabsList>

                <TabsContent value="general">
                    {activeTab === "general" && <GeneralSettingsForm ref={generalFormRef} />}
                </TabsContent>

                <TabsContent value="phones">
                    {activeTab === "phones" && <ContactPhonesSection />}
                </TabsContent>

                <TabsContent value="mobiles">
                    {activeTab === "mobiles" && <ContactMobilesSection />}
                </TabsContent>

                <TabsContent value="emails">
                    {activeTab === "emails" && <ContactEmailsSection />}
                </TabsContent>

                <TabsContent value="social">
                    {activeTab === "social" && <SocialMediaSection />}
                </TabsContent>
            </Tabs>

            {activeTab === "general" && canManageSettings && (
                <div className="fixed bottom-0 left-0 right-0 lg:right-[20rem] z-50 border-t border-br bg-card shadow-lg transition-all duration-300 flex items-center justify-end gap-3 py-4 px-8">
                    <ProtectedButton
                        onClick={() => generalFormRef.current?.handleSave()}
                        permission="settings.manage"
                        size="lg"
                        disabled={generalFormRef.current?.saving}
                    >
                        {generalFormRef.current?.saving ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                در حال ذخیره...
                            </>
                        ) : (
                            <>
                                <Save className="h-5 w-5" />
                                ذخیره تنظیمات
                            </>
                        )}
                    </ProtectedButton>
                </div>
            )}
        </div>
    );
}

