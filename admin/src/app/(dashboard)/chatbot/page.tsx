"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/elements/Tabs";
import { MessageSquare, Settings as SettingsIcon } from "lucide-react";
import { Skeleton } from "@/components/elements/Skeleton";

// Tab Skeleton
const TabSkeleton = () => (
  <div className="space-y-6">
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  </div>
);

// Dynamic imports
const FAQManagement = dynamic(
  () => import("@/components/chatbot/FAQManagement").then(mod => ({ default: mod.FAQManagement })),
  { 
    ssr: false,
    loading: () => <TabSkeleton />
  }
);

const ChatbotSettingsForm = dynamic(
  () => import("@/components/chatbot/ChatbotSettingsForm").then(mod => ({ default: mod.ChatbotSettingsForm })),
  { 
    ssr: false,
    loading: () => <TabSkeleton />
  }
);

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

