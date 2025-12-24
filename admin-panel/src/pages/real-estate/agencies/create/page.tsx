import { useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { Button } from "@/components/elements/Button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/elements/Tabs";
import { Skeleton } from "@/components/elements/Skeleton";
import { showError, showSuccess } from "@/core/toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { realEstateApi } from "@/api/real-estate/properties";
import type { RealEstateAgency } from "@/types/real_estate/agency/realEstateAgency";
import { FileText, Loader2, Save, List } from "lucide-react";
import { AgencyCreateSidebar } from "@/components/real-estate/agencies/create/AgencyCreateSidebar";

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

const BaseInfoTab = lazy(() => import("@/components/real-estate/agencies/edit/BaseInfoTab"));

export default function CreateAgencyPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("account");
  const [editMode] = useState(true);
  
  const [formData, setFormData] = useState<Partial<RealEstateAgency>>({
    name: "",
    description: "",
    phone: "",
    email: "",
    website: "",
    license_number: "",
    city: null,
    province: null,
    address: "",
    is_active: true,
    is_verified: false,
  });

  const createAgencyMutation = useMutation({
    mutationFn: (data: Partial<RealEstateAgency>) => realEstateApi.createAgency(data),
    onSuccess: () => {
      showSuccess("آژانس با موفقیت ایجاد شد");
      queryClient.invalidateQueries({ queryKey: ['agencies'] });
      navigate("/real-estate/agencies");
    },
    onError: (error: any) => {
      const errorData = error?.response?.data?.data;
      const errorMessage = errorData?.detail || 
                          error?.response?.data?.metaData?.message ||
                          "خطا در ایجاد آژانس";
      showError(errorMessage);
    },
  });

  const handleInputChange = (field: keyof RealEstateAgency, value: string | boolean | number | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!formData.name) {
      showError("نام آژانس الزامی است");
      return;
    }
    
    createAgencyMutation.mutate(formData);
  };

  return (
    <div className="space-y-6 pb-28 relative">
      <PageHeader title="ایجاد آژانس جدید">
        <>
          <Button 
            variant="outline"
            onClick={() => navigate("/real-estate/agencies")}
          >
            <List className="h-4 w-4" />
            نمایش لیست
          </Button>
        </>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
        <div className="lg:col-span-2">
          <AgencyCreateSidebar formData={formData} />
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
            onClick={() => navigate("/real-estate/agencies")} 
            variant="outline" 
            size="lg"
          >
            انصراف
          </Button>
          <Button 
            onClick={handleSave} 
            size="lg"
            disabled={createAgencyMutation.isPending}
          >
            {createAgencyMutation.isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                در حال ایجاد...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                ایجاد آژانس
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

