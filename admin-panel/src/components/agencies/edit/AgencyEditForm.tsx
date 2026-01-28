import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { showSuccess, showError } from '@/core/toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/elements/Tabs";
import { Building2, FileText, Globe, Settings2 } from "lucide-react";
import { Skeleton } from "@/components/elements/Skeleton";
import { realEstateApi } from "@/api/real-estate/properties";
import { msg } from '@/core/messages';
import { ApiError } from "@/types/api/apiError";
import { Button } from "@/components/elements/Button";
import { useNavigate } from "react-router-dom";

const TabContentSkeleton = () => (
    <div className="mt-6 space-y-6">
        <div className="space-y-4 rounded-lg border p-6">
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="space-y-4 rounded-lg border p-6">
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
        </div>
    </div>
);

const AgencyInfoTab = lazy(() => import("@/components/agencies/profile/AgencyInfo").then((mod) => ({ default: mod.AgencyInfo })));
const AgencyDescriptionTab = lazy(() => import("@/components/agencies/profile/AgencyDescription").then((mod) => ({ default: mod.AgencyDescription })));
const AgencySEOTab = lazy(() => import("@/components/agencies/profile/AgencySEO").then((mod) => ({ default: mod.AgencySEO })));
const AgencySettingsTab = lazy(() => import("@/components/agencies/profile/AgencySettings").then((mod) => ({ default: mod.AgencySettings })));
const AgencyProfileHeader = lazy(() => import("@/components/agencies/profile/AgencyProfileHeader").then((mod) => ({ default: mod.AgencyProfileHeader })));

interface EditAgencyFormProps {
    agencyId: string;
}

export function EditAgencyForm({ agencyId }: EditAgencyFormProps) {

    const [activeTab, setActiveTab] = useState("info");
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const { data: agencyData, isLoading, error } = useQuery({
        queryKey: ['agency', agencyId],
        queryFn: () => realEstateApi.getAgencyById(Number(agencyId)),
        staleTime: 0,
        retry: (failureCount: number, requestError: any) => {
            if (requestError instanceof ApiError && requestError.response.AppStatusCode === 403) {
                return false;
            }
            return failureCount < 2;
        },
    });

    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        license_number: "",
        license_expire_date: "",
        phone: "",
        email: "",
        website: "",
        province: "",
        city: "",
        address: "",
        logo: null as any,
        cover_image: null as any,
        description: "",
        rating: "",
        is_verified: false,
        is_active: true,
    });
    const [isSaving, setIsSaving] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [selectedProvinceId, setSelectedProvinceId] = useState<number | null>(null);
    const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
    const previousAgencyIdRef = useRef<number | undefined>(undefined);
    const previousEditModeRef = useRef<boolean>(false);

    useEffect(() => {
        if (!agencyData) return;
        
        const isFirstLoad = previousAgencyIdRef.current !== agencyData.id;
        const editModeChanged = previousEditModeRef.current && !editMode;
        
        if (isFirstLoad || editModeChanged) {
            setFormData(prev => {
                const currentLogoId = prev.logo?.id;
                const newLogoId = agencyData.logo?.id;
                
                return {
                    name: agencyData.name || "",
                    license_number: agencyData.license_number || "",
                    license_expire_date: agencyData.license_expire_date || "",
                    phone: agencyData.phone || "",
                    email: agencyData.email || "",
                    website: agencyData.website || "",
                    province: agencyData.province_name || "",
                    city: agencyData.city_name || "",
                    address: agencyData.address || "",
                    logo: currentLogoId === newLogoId ? prev.logo : (agencyData.logo || null),
                    cover_image: agencyData.cover_image || null,
                    description: agencyData.description || "",
                    rating: agencyData.rating ? String(agencyData.rating) : "",
                    is_verified: agencyData.is_verified || false,
                    is_active: agencyData.is_active !== undefined ? agencyData.is_active : true,
                };
            });
            setSelectedProvinceId(agencyData.province || null);
            setSelectedCityId(agencyData.city || null);
            previousAgencyIdRef.current = agencyData.id;
        } else if (!editMode) {
            setFormData(prev => {
                const currentLogoId = prev.logo?.id;
                const newLogoId = agencyData.logo?.id;
                const newLogoIsNull = !agencyData.logo;
                const currentLogoIsNull = !prev.logo;
                
                if (currentLogoId !== newLogoId || (newLogoIsNull && !currentLogoIsNull)) {
                    return {
                        ...prev,
                        logo: agencyData.logo || null,
                        cover_image: agencyData.cover_image || null,
                    };
                }
                
                return prev;
            });
        }
        
        previousEditModeRef.current = editMode;
    }, [agencyData, editMode]);

    const handleInputChange = (field: string, value: string | any) => {
        if (field === "cancel") {
            setEditMode(false);
            return;
        }
        
        setFormData(prev => {
            const newData = { ...prev, [field]: value };
            return newData;
        });
        
        if (fieldErrors[field]) {
            setFieldErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleProvinceChange = (provinceName: string, provinceId: number) => {
        handleInputChange("province", provinceName);
        handleInputChange("city", "");
        setSelectedProvinceId(provinceId);
        setSelectedCityId(null);
    };

    const handleCityChange = (cityName: string, cityId: number) => {
        handleInputChange("city", cityName);
        setSelectedCityId(cityId);
    };

    const handleSaveProfile = async () => {
        if (isSaving) return;
        
        setIsSaving(true);
        setFieldErrors({});
        
        try {
            const updateData: Record<string, any> = {
                name: formData.name || null,
                license_number: formData.license_number || null,
                license_expire_date: formData.license_expire_date || null,
                phone: formData.phone || null,
                email: formData.email || null,
                website: formData.website || null,
                province: selectedProvinceId || null,
                city: selectedCityId || null,
                address: formData.address || null,
                logo: formData.logo?.id || null,
                cover_image: formData.cover_image?.id || null,
                description: formData.description || null,
                rating: formData.rating ? Number(formData.rating) : null,
                is_verified: formData.is_verified,
                is_active: formData.is_active,
            };
            
            if (!agencyData) {
                showError('اطلاعات آژانس یافت نشد');
                return;
            }
            
            await realEstateApi.updateAgency(agencyData.id, updateData);
            setEditMode(false);
            
            await queryClient.invalidateQueries({ queryKey: ['agency', agencyId] });
            await queryClient.refetchQueries({ queryKey: ['agency', agencyId] });
            await queryClient.invalidateQueries({ queryKey: ['agencies'] });
            
            showSuccess(msg.crud('updated', { item: 'آژانس' }));
        } catch (error: any) {
            if (error?.response?.errors) {
                const errorData = error.response.errors;
                const newFieldErrors: Record<string, string> = {};
                
                if (errorData.email) {
                    newFieldErrors.email = msg.validation('emailInvalid');
                }
                if (errorData.phone) {
                    newFieldErrors.phone = 'شماره تلفن نامعتبر است';
                }
                if (errorData.license_number) {
                    newFieldErrors.license_number = 'شماره پروانه نامعتبر یا تکراری است';
                }
                if (errorData.name) {
                    newFieldErrors.name = msg.validation('required', { field: 'نام آژانس' });
                }
                
                if (errorData.detail) {
                    showError(errorData.detail);
                    return;
                }
                
                if (Object.keys(newFieldErrors).length > 0) {
                    setFieldErrors(newFieldErrors);
                    return;
                }
            }
            
            const errorMessage = msg.error('serverError');
            showError(errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    const handleGoToList = () => {
        navigate("/admins/agencies");
    };

    if (error) {
        const errorMessage =
            error instanceof ApiError
                ? error.response.message
                : error instanceof Error
                ? error.message
                : "خطا در دریافت اطلاعات آژانس";

        return (
            <div className="rounded-lg border p-6 text-center space-y-4">
                <p className="text-destructive">{errorMessage}</p>
                <Button onClick={handleGoToList}>بازگشت به لیست</Button>
            </div>
        );
    }

    if (isLoading || !agencyData) {
        return (
            <div className="space-y-6">
                <div className="rounded-lg border p-6">
                    <Skeleton className="h-32 w-full mb-4" />
                    <Skeleton className="h-8 w-1/3 mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                </div>
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <Skeleton className="h-10 w-32" />
                        <Skeleton className="h-10 w-32" />
                        <Skeleton className="h-10 w-32" />
                        <Skeleton className="h-10 w-32" />
                    </div>
                    <TabContentSkeleton />
                </div>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <Suspense fallback={<TabContentSkeleton />}>
                <AgencyProfileHeader 
                    agency={agencyData} 
                    formData={{
                        name: formData.name,
                        phone: formData.phone,
                        logo: formData.logo,
                    }}
                    onLogoChange={(media: any) => handleInputChange("logo", media)}
                    agencyId={agencyId}
                />
            </Suspense>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList>
                    <TabsTrigger value="info">
                        <Building2 className="w-4 h-4" />
                        اطلاعات آژانس
                    </TabsTrigger>
                    <TabsTrigger value="description">
                        <FileText className="w-4 h-4" />
                        توضیحات
                    </TabsTrigger>
                    <TabsTrigger value="seo">
                        <Globe className="w-4 h-4" />
                        سئو
                    </TabsTrigger>
                    <TabsTrigger value="settings">
                        <Settings2 className="w-4 h-4" />
                        تنظیمات
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="info">
                    <Suspense fallback={<TabContentSkeleton />}>
                        <AgencyInfoTab
                            agency={agencyData}
                            formData={formData}
                            editMode={editMode}
                            setEditMode={setEditMode}
                            handleInputChange={handleInputChange}
                            handleSaveProfile={handleSaveProfile}
                            isSaving={isSaving}
                            fieldErrors={fieldErrors}
                            onProvinceChange={handleProvinceChange}
                            onCityChange={handleCityChange}
                            agencyId={agencyId}
                        />
                    </Suspense>
                </TabsContent>

                <TabsContent value="description">
                    <Suspense fallback={<TabContentSkeleton />}>
                        <AgencyDescriptionTab
                            formData={formData}
                            editMode={editMode}
                            handleInputChange={handleInputChange}
                            handleSaveProfile={handleSaveProfile}
                            isSaving={isSaving}
                        />
                    </Suspense>
                </TabsContent>

                <TabsContent value="seo">
                    <Suspense fallback={<TabContentSkeleton />}>
                        <AgencySEOTab
                            formData={formData}
                            editMode={editMode}
                            handleInputChange={handleInputChange}
                        />
                    </Suspense>
                </TabsContent>

                <TabsContent value="settings">
                    <Suspense fallback={<TabContentSkeleton />}>
                        <AgencySettingsTab 
                            agency={agencyData}
                            formData={formData}
                            handleInputChange={handleInputChange}
                        />
                    </Suspense>
                </TabsContent>
            </Tabs>
        </div>
    );
}
