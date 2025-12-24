import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger } from "@/components/elements/Tabs";
import { Button } from "@/components/elements/Button";
import { FileText, Edit2 } from "lucide-react";
import { showError } from '@/core/toast';
import { Skeleton } from "@/components/elements/Skeleton";
import { realEstateApi } from "@/api/real-estate/properties";
import { AgentSidebar } from "@/components/real-estate/agents/view/AgentSidebar";
import { AgentOverviewTab } from "@/components/real-estate/agents/view/AgentOverviewTab";

export default function AgentViewPage() {
  const params = useParams();
  const navigate = useNavigate();
  const agentId = params?.id as string;
  const [activeTab, setActiveTab] = useState("overview");

  const { data: agentData, isLoading, error } = useQuery({
    queryKey: ["agent", agentId],
    queryFn: () => realEstateApi.getAgentById(Number(agentId)),
    staleTime: 0,
    enabled: !!agentId,
  });

  if (!agentId) {
    return (
      <div className="space-y-6">
        <PageHeader title="نمایش مشاور" />
        <div className="text-center py-8">
          <p className="text-destructive">شناسه مشاور یافت نشد</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="اطلاعات مشاور">
          <>
            <Button disabled>
              <Edit2 />
              ویرایش مشاور
            </Button>
          </>
        </PageHeader>
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-2">
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
          <div className="lg:col-span-4 space-y-6">
            <div className="flex gap-2">
              <Skeleton className="h-10 w-32" />
            </div>
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !agentData) {
    return (
      <div className="space-y-6">
        <PageHeader title="نمایش مشاور" />
        <div className="rounded-lg border p-6">
          <div className="text-center py-8">
            <p className="text-red-1 mb-4">خطا در بارگذاری اطلاعات مشاور</p>
            <p className="text-font-s">
              لطفاً دوباره تلاش کنید یا با مدیر سیستم تماس بگیرید.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="اطلاعات مشاور">
        <>
          <Button
            onClick={() => navigate(`/real-estate/agents/${agentId}/edit`)}
          >
            <Edit2 />
            ویرایش مشاور
          </Button>
        </>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
        <div className="lg:col-span-2">
          <AgentSidebar agent={agentData} />
        </div>

        <div className="lg:col-span-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList>
              <TabsTrigger value="overview">
                <FileText className="h-4 w-4" />
                مرور کلی
              </TabsTrigger>
            </TabsList>

            <AgentOverviewTab agent={agentData} />
          </Tabs>
        </div>
      </div>
    </div>
  );
}

