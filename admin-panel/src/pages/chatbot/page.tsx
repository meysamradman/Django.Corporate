import { lazy, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/elements/Tabs";
import { MessageSquare, Settings as SettingsIcon } from "lucide-react";
import { Skeleton } from "@/components/elements/Skeleton";
import { DRAWER_IDS } from "@/components/shared/drawer/types";
import { useOpenDrawerFromUrlAction } from "@/components/shared/drawer/useOpenDrawerFromUrlAction";

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

const CHATBOT_DRAWER_ACTIONS = {
  "create-faq": { drawerId: DRAWER_IDS.CHATBOT_FAQ_FORM },
  "edit-faq": { drawerId: DRAWER_IDS.CHATBOT_FAQ_FORM, withEditId: true },
} as const;

export default function ChatbotSettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "faq";

  useOpenDrawerFromUrlAction({ searchParams, actionMap: CHATBOT_DRAWER_ACTIONS });

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

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
    </div>
  );
}
