import { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/elements/Button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/elements/Tabs";
import { Skeleton } from "@/components/elements/Skeleton";
import { 
  Loader2, Save, List, FileText, Edit2
} from "lucide-react";
import { realEstateApi } from "@/api/real-estate/properties";
import { showError, showSuccess } from '@/core/toast';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { RealEstateAgency } from "@/types/real_estate/agency/realEstateAgency";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";

const TabSkeleton = () => (
  <div className="mt-0 space-y-6">
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 min-w-0">
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
      <div className="w-full lg:w-[420px] lg:flex-shrink-0">
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </div>
  </div>
);

const BaseInfoTab = lazy(() => import("@/components/real-estate/agencies/edit/BaseInfoTab"));

export default function AgencyEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("account");
  const [editMode, setEditMode] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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

  const { data: agency, isLoading, error } = useQuery({
    queryKey: ["agency", id],
    queryFn: () => realEstateApi.getAgencyById(Number(id)),
    enabled: !!id,
  });

  useEffect(() => {
    if (agency) {
      setFormData({
        name: agency.name || "",
        description: agency.description || "",
        phone: agency.phone || "",
        email: agency.email || "",
        website: agency.website || "",
        license_number: agency.license_number || "",
        city: agency.city || null,
        province: agency.province || null,
        address: agency.address || "",
        is_active: agency.is_active ?? true,
        is_verified: agency.is_verified ?? false,
      });
    }
  }, [agency]);

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<RealEstateAgency>) => {
      return await realEstateApi.updateAgency(Number(id), data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency', id] });
      queryClient.invalidateQueries({ queryKey: ['agencies'] });
      showSuccess("آژانس با موفقیت به‌روزرسانی شد");
      navigate(`/real-estate/agencies/${id}/view`);
    },
    onError: (error) => {
      showError(error, { customMessage: "خطا در به‌روزرسانی آژانس" });
    },
  });

  const handleInputChange = (field: keyof RealEstateAgency, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateMutation.mutateAsync(formData);
    } catch (error) {
      // Error handled in mutation
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-28 relative">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">ویرایش آژانس</h1>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              disabled
              onClick={() => navigate("/real-estate/agencies")}
            >
              <List className="h-4 w-4" />
              نمایش لیست
            </Button>
            <Button disabled>
              <Edit2 />
              ویرایش
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="account">
              <FileText className="h-4 w-4" />
              اطلاعات پایه
            </TabsTrigger>
          </TabsList>
          <TabSkeleton />
        </Tabs>
      </div>
    );
  }

  if (error || !agency) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="page-title">ویرایش آژانس</h1>
        </div>
        <div className="text-center py-8">
          <p className="text-destructive">خطا در بارگذاری اطلاعات آژانس</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-28 relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">ویرایش آژانس</h1>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => navigate("/real-estate/agencies")}
          >
            <List className="h-4 w-4" />
            نمایش لیست
          </Button>
          {!editMode && (
            <Button onClick={() => setEditMode(true)}>
              <Edit2 />
              ویرایش
            </Button>
          )}
        </div>
      </div>

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

      {editMode && (
        <div className="fixed bottom-0 left-0 right-0 lg:right-[20rem] z-50 border-t border-br bg-card shadow-lg transition-all duration-300 flex items-center justify-end gap-3 py-4 px-8">
          <Button 
            onClick={() => navigate(`/real-estate/agencies/${id}/view`)} 
            variant="outline" 
            size="lg"
          >
            انصراف
          </Button>
          <Button 
            onClick={handleSave} 
            size="lg"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                در حال ذخیره...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                ذخیره تغییرات
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

