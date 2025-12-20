import React, { useState, lazy, Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/elements/Tabs";
import { MessageSquare, Settings as SettingsIcon } from "lucide-react";
import { Skeleton } from "@/components/elements/Skeleton";

const TabSkeleton = () => (
  <div className="space-y-6">
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  </div>
);

const FAQManagement = lazy(() => import("@/components/chatbot/FAQManagement").then(mod => ({ default: mod.FAQManagement })));
const ChatbotSettingsForm = lazy(() => import("@/components/chatbot/ChatbotSettingsForm").then(mod => ({ default: mod.ChatbotSettingsForm })));

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
          <Suspense fallback={<TabSkeleton />}>
            <FAQManagement />
          </Suspense>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <Suspense fallback={<TabSkeleton />}>
            <ChatbotSettingsForm />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}

