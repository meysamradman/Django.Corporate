import { useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { Button } from "@/components/elements/Button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/elements/Tabs";
import { Skeleton } from "@/components/elements/Skeleton";
import { showError, showSuccess } from "@/core/toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { realEstateApi } from "@/api/real-estate/properties";
import type { PropertyAgent } from "@/types/real_estate/agent/propertyAgent";
import { FileText, Loader2, Save, List } from "lucide-react";
import { AgentCreateSidebar } from "@/components/real-estate/agents/create/AgentCreateSidebar";

const TabSkeleton = () => (
  <div className="mt-0 space-y-6">
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

const BaseInfoTab = lazy(() => import("@/components/real-estate/agents/edit/BaseInfoTab"));

export default function CreateAgentPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("account");
  const [editMode] = useState(true);
  
  const [formData, setFormData] = useState<Partial<PropertyAgent>>({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    license_number: "",
    bio: "",
    specialization: "",
    experience_years: null,
    city: null,
    province: null,
    address: "",
    is_active: true,
    is_verified: false,
  });

  const createAgentMutation = useMutation({
    mutationFn: (data: Partial<PropertyAgent>) => realEstateApi.createAgent(data),
    onSuccess: () => {
      showSuccess("مشاور با موفقیت ایجاد شد");
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      navigate("/real-estate/agents");
    },
    onError: (error: any) => {
      const errorData = error?.response?.data?.data;
      const errorMessage = errorData?.detail || 
                          error?.response?.data?.metaData?.message ||
                          "خطا در ایجاد مشاور";
      showError(errorMessage);
    },
  });

  const handleInputChange = (field: keyof PropertyAgent, value: string | boolean | number | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!formData.first_name || !formData.last_name) {
      showError("نام و نام خانوادگی الزامی است");
      return;
    }
    
    createAgentMutation.mutate(formData);
  };

  return (
    <div className="space-y-6 pb-28 relative">
      <PageHeader title="ایجاد مشاور جدید">
        <>
          <Button 
            variant="outline"
            onClick={() => navigate("/real-estate/agents")}
          >
            <List className="h-4 w-4" />
            نمایش لیست
          </Button>
        </>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
        <div className="lg:col-span-2">
          <AgentCreateSidebar formData={formData} />
        </div>

        <div className="lg:col-span-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList>
              <TabsTrigger value="account">
                <FileText className="h-4 w-4" />
                اطلاعات پایه
              </TabsTrigger>
            </TabsList>

            <TabsContent value="account">
              <Suspense fallback={<TabSkeleton />}>
                <BaseInfoTab 
                  formData={formData}
                  handleInputChange={handleInputChange}
                  editMode={editMode}
                />
              </Suspense>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {editMode && (
        <div className="fixed bottom-0 left-0 right-0 lg:right-[20rem] z-50 border-t border-br bg-card shadow-lg transition-all duration-300 flex items-center justify-end gap-3 py-4 px-8">
          <Button 
            onClick={() => navigate("/real-estate/agents")} 
            variant="outline" 
            size="lg"
          >
            انصراف
          </Button>
          <Button 
            onClick={handleSave} 
            size="lg"
            disabled={createAgentMutation.isPending}
          >
            {createAgentMutation.isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                در حال ایجاد...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                ایجاد مشاور
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

