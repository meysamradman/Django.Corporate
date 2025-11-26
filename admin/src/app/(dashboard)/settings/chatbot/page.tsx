"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/elements/Tabs";
import { MessageSquare, Settings as SettingsIcon } from "lucide-react";
import { FAQManagement } from "./components/FAQManagement";
import { ChatbotSettingsForm } from "./components/ChatbotSettingsForm";

export default function ChatbotSettingsPage() {
  const [activeTab, setActiveTab] = useState("faq");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">تنظیمات چت‌بات</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="faq">
            <MessageSquare className="h-4 w-4" />
            سوالات متداول
          </TabsTrigger>
          <TabsTrigger value="settings">
            <SettingsIcon className="h-4 w-4" />
            تنظیمات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="faq" className="mt-6">
          <FAQManagement />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <ChatbotSettingsForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}

