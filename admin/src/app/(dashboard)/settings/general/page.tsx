"use client";

import React, { useState, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/elements/Tabs";
import { ProtectedButton, useUIPermissions } from '@/core/permissions';
import { Settings, Phone, Smartphone, Mail, Share2, Save } from "lucide-react";
import {
    GeneralSettingsForm,
    ContactPhonesSection,
    ContactMobilesSection,
    ContactEmailsSection,
    SocialMediaSection,
} from "@/components/settings";

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState("general");
    const generalFormRef = useRef<{ handleSave: () => void }>(null);
    
    // 🚀 Pre-computed permission flag
    const { canManageSettings } = useUIPermissions();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="page-title">تنظیمات سیستم</h1>
                {activeTab === "general" && (
                    <ProtectedButton
                        onClick={() => generalFormRef.current?.handleSave()}
                        permission="settings.manage"
                        showDenyToast={true}
                        denyMessage="شما دسترسی لازم برای مدیریت تنظیمات عمومی را ندارید"
                    >
                        <Save className="mr-2 h-4 w-4" />
                        ذخیره تنظیمات
                    </ProtectedButton>
                )}
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList>
                    <TabsTrigger value="general">
                        <Settings className="h-4 w-4 me-2" />
                        تنظیمات عمومی
                    </TabsTrigger>
                    <TabsTrigger value="phones">
                        <Phone className="h-4 w-4 me-2" />
                        شماره تماس
                    </TabsTrigger>
                    <TabsTrigger value="mobiles">
                        <Smartphone className="h-4 w-4 me-2" />
                        موبایل
                    </TabsTrigger>
                    <TabsTrigger value="emails">
                        <Mail className="h-4 w-4 me-2" />
                        ایمیل
                    </TabsTrigger>
                    <TabsTrigger value="social">
                        <Share2 className="h-4 w-4 me-2" />
                        شبکه‌های اجتماعی
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="general">
                    <GeneralSettingsForm ref={generalFormRef} />
                </TabsContent>

                <TabsContent value="phones">
                    <ContactPhonesSection />
                </TabsContent>

                <TabsContent value="mobiles">
                    <ContactMobilesSection />
                </TabsContent>

                <TabsContent value="emails">
                    <ContactEmailsSection />
                </TabsContent>

                <TabsContent value="social">
                    <SocialMediaSection />
                </TabsContent>
            </Tabs>
        </div>
    );
}

