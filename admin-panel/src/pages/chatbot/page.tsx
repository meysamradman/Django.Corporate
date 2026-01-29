import { lazy, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/elements/Tabs";
import { MessageSquare, Settings as SettingsIcon } from "lucide-react";
import { Skeleton } from "@/components/elements/Skeleton";
import { FAQSide } from "@/components/chatbot/FAQSide";
import { useQuery } from "@tanstack/react-query";
import { chatbotApi } from "@/api/chatbot/chatbot";
import type { FAQ } from "@/types/chatbot/chatbot";

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
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "faq";
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

  const { data: faqResponse } = useQuery({
    queryKey: ["faqs"],
    queryFn: () => chatbotApi.getFAQList(),
    enabled: action === "edit-faq",
  });

  const faqs = faqResponse?.data || [];
  const editingFAQ = editId ? faqs.find((f: FAQ) => f.id === editId) : null;

  return (
    <div className="space-y-6">
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

        <TabsContent value="faq">
          <Suspense fallback={<TabSkeleton />}>
            <FAQManagement />
          </Suspense>
        </TabsContent>

        <TabsContent value="settings">
          <Suspense fallback={<TabSkeleton />}>
            <ChatbotSettingsForm />
          </Suspense>
        </TabsContent>
      </Tabs>

      <FAQSide
        isOpen={action === "create-faq" || action === "edit-faq"}
        onClose={handleCloseSide}
        faq={editingFAQ}
      />
    </div>
  );
}
