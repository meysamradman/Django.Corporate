import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { showSuccess, showError } from '@/core/toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/elements/Tabs";
import { User, KeyRound, Share2, Settings2, Building2, Home } from "lucide-react";
import { ProfileHeader } from "@/components/admins/profile/ProfileHeader";
import { Skeleton } from "@/components/elements/Skeleton";
import { adminApi } from "@/api/admins/admins";
import { msg } from '@/core/messages';
import { useAuth } from "@/core/auth/AuthContext";
import { ApiError } from "@/types/api/apiError";
import { Button } from "@/components/elements/Button";
import { useNavigate } from "react-router-dom";
import { usePermission } from "@/core/permissions";

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

const AccountTab = lazy(() => import("@/components/admins/profile/Account.tsx").then((mod) => ({ default: mod.Account })));
const SecurityTab = lazy(() => import("@/components/admins/profile/Security.tsx").then((mod) => ({ default: mod.Security })));
const SocialTab = lazy(() => import("@/components/admins/profile/Social.tsx").then((mod) => ({ default: mod.Social })));
const AdvancedSettingsTab = lazy(() => import("@/components/admins/profile/AdvancedSettings.tsx").then((mod) => ({ default: mod.AdvancedSettings })));
const ConsultantTab = lazy(() => import("@/components/admins/profile/Consultant.tsx").then((mod) => ({ default: mod.Consultant })));
const AgentPropertiesTab = lazy(() => import("@/components/admins/profile/AgentProperties.tsx").then((mod) => ({ default: mod.AgentProperties })));
const AdminPropertiesTab = lazy(() => import("@/components/admins/profile/Properties.tsx").then((mod) => ({ default: mod.Properties })));

interface EditAdminFormProps {
    adminId: string;
}

export function EditAdminForm({ adminId }: EditAdminFormProps) {

    const [activeTab, setActiveTab] = useState("account");
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { user, refreshUser } = useAuth();
    const { hasPermission } = usePermission();

    const isMeRoute = adminId === "me";
    const isNumericId = !Number.isNaN(Number(adminId));
    const queryKey = ['admin', isMeRoute ? 'me' : adminId];

    const { data: adminData, isLoading, error } = useQuery({
        queryKey,
        queryFn: () => {
            if (isMeRoute) {
                return adminApi.getCurrentAdminManagedProfile();
            }
            if (!isNumericId) {
                return Promise.reject(new Error("شناسه ادمین نامعتبر است"));
            }
            return adminApi.getAdminById(Number(adminId));
        },
        staleTime: 0,
        retry: (failureCount, requestError) => {
            if (requestError instanceof ApiError && requestError.response.AppStatusCode === 403) {
                return false;
            }
            return failureCount < 2;
        },
    });

    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        mobile: "",
        phone: "",
        nationalId: "",
        address: "",
        province: "",
        city: "",
        bio: "",
        profileImage: null as any,
        birthDate: "",
        license_number: "",
        license_expire_date: "",
        specialization: "",
        agency_id: null as number | null,
        agent_bio: "",
        is_verified: false,
        meta_title: "",
        meta_description: "",
        meta_keywords: "",
        og_title: "",
        og_description: "",
        og_image: null as any,
        og_image_id: null as number | null,
    });
    const [isSaving, setIsSaving] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [selectedProvinceId, setSelectedProvinceId] = useState<number | null>(null);
    const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
    const previousAdminIdRef = useRef<number | undefined>(undefined);
    const previousEditModeRef = useRef<boolean>(false);

    useEffect(() => {
        if (!adminData) return;

        const isFirstLoad = previousAdminIdRef.current !== adminData.id;
        const editModeChanged = previousEditModeRef.current && !editMode;

        if (isFirstLoad || editModeChanged) {
            setFormData(prev => {
                const currentImageId = prev.profileImage?.id;
                const newImageId = adminData.profile?.profile_picture?.id;

                return {
                    firstName: adminData.profile?.first_name || "",
                    lastName: adminData.profile?.last_name || "",
                    email: adminData.email || "",
                    mobile: adminData.mobile || "",
                    phone: adminData.profile?.phone || "",
                    nationalId: adminData.profile?.national_id || "",
                    address: adminData.profile?.address || "",
                    province: adminData.profile?.province?.name || "",
                    city: adminData.profile?.city?.name || "",
                    bio: adminData.profile?.bio || "",
                    profileImage: currentImageId === newImageId ? prev.profileImage : (adminData.profile?.profile_picture || null),
                    birthDate: adminData.profile?.birth_date || "",
                    license_number: adminData.agent_profile?.license_number || "",
                    license_expire_date: adminData.agent_profile?.license_expire_date || "",
                    specialization: adminData.agent_profile?.specialization || "",
                    agency_id: (typeof adminData.agent_profile?.agency === 'object' ? adminData.agent_profile?.agency?.id : adminData.agent_profile?.agency) || null,
                    agent_bio: adminData.agent_profile?.bio || "",
                    is_verified: adminData.agent_profile?.is_verified || false,
                    meta_title: adminData.agent_profile?.meta_title || "",
                    meta_description: adminData.agent_profile?.meta_description || "",
                    meta_keywords: adminData.agent_profile?.meta_keywords || "",
                    og_title: adminData.agent_profile?.og_title || "",
                    og_description: adminData.agent_profile?.og_description || "",
                    og_image: adminData.agent_profile?.og_image || null,
                    og_image_id: adminData.agent_profile?.og_image?.id || null,
                };
            });
            setSelectedProvinceId(adminData.profile?.province?.id || null);
            setSelectedCityId(adminData.profile?.city?.id || null);
            previousAdminIdRef.current = adminData.id;
        } else if (!editMode) {
            setFormData(prev => {
                const currentImageId = prev.profileImage?.id;
                const newImageId = adminData.profile?.profile_picture?.id;
                const newImageIsNull = !adminData.profile?.profile_picture;
                const currentImageIsNull = !prev.profileImage;

                if (currentImageId !== newImageId) {
                    return {
                        ...prev,
                        profileImage: adminData.profile?.profile_picture || null,
                    };
                }

                if (newImageIsNull && !currentImageIsNull) {
                    return {
                        ...prev,
                        profileImage: null,
                    };
                }

                return prev;
            });
        }

        previousEditModeRef.current = editMode;
    }, [adminData, editMode]);

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
            const profileData: Record<string, any> = {
                profile: {
                    first_name: formData.firstName || null,
                    last_name: formData.lastName || null,
                    phone: formData.phone || null,
                    address: formData.address || null,
                    province: selectedProvinceId || null,
                    city: selectedCityId || null,
                    bio: formData.bio || null,
                    national_id: formData.nationalId && formData.nationalId.trim() !== '' ? formData.nationalId : null,
                    profile_picture: formData.profileImage?.id || null,
                    birth_date: formData.birthDate || null,
                }
            };

            if (formData.email) {
                profileData.email = formData.email;
            }

            if (formData.mobile) {
                profileData.mobile = formData.mobile;
            }

            if (adminData?.user_role_type === 'consultant') {
                profileData.agent_profile = {
                    license_number: formData.license_number || null,
                    license_expire_date: formData.license_expire_date || null,
                    specialization: formData.specialization || null,
                    agency_id: formData.agency_id || null,
                    bio: formData.agent_bio || null,
                    is_verified: formData.is_verified || false,
                    meta_title: formData.meta_title || null,
                    meta_description: formData.meta_description || null,
                    meta_keywords: formData.meta_keywords || null,
                    og_title: formData.og_title || null,
                    og_description: formData.og_description || null,
                    og_image_id: formData.og_image_id || null,
                };
            }

            if (!adminData) {
                showError('اطلاعات ادمین یافت نشد');
                return;
            }

            await adminApi.updateUserByType(adminData.id, profileData, 'admin');
            setEditMode(false);

            await queryClient.invalidateQueries({ queryKey: ['admin', adminId] });
            await queryClient.refetchQueries({ queryKey: ['admin', adminId] });

            await queryClient.invalidateQueries({ queryKey: ['admin-profile'] });
            await queryClient.invalidateQueries({ queryKey: ['current-admin-profile'] });

            if (user?.id && (isMeRoute || Number(adminId) === user.id)) {
                await refreshUser();
            }

            showSuccess(msg.crud('updated', { item: 'پروفایل ادمین' }));
        } catch (error: any) {
            if (error?.response?.errors) {
                const errorData = error.response.errors;
                const newFieldErrors: Record<string, string> = {};

                if (errorData.mobile) {
                    newFieldErrors.mobile = msg.validation('mobileInvalid');
                }
                if (errorData.email) {
                    newFieldErrors.email = msg.validation('emailInvalid');
                }
                if (errorData.profile?.national_id) {
                    if (errorData.profile.national_id.includes('تکراری') || errorData.profile.national_id.includes('قبلاً')) {
                        newFieldErrors.nationalId = msg.validation('nationalIdInvalid');
                    } else if (errorData.profile.national_id.includes('10 رقم') || errorData.profile.national_id.includes('طول')) {
                        newFieldErrors.nationalId = msg.validation('nationalIdLength');
                    } else {
                        newFieldErrors.nationalId = msg.validation('nationalIdInvalid');
                    }
                }
                if (errorData.profile?.first_name) {
                    newFieldErrors.firstName = msg.validation('required', { field: 'نام' });
                }
                if (errorData.profile?.last_name) {
                    newFieldErrors.lastName = msg.validation('required', { field: 'نام خانوادگی' });
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

    const handleGoToOwnProfile = () => {
        navigate("/admins/me/edit");
    };

    if (error) {
        const errorMessage =
            error instanceof ApiError
                ? error.response.message
                : error instanceof Error
                    ? error.message
                    : "خطا در دریافت اطلاعات ادمین";

        return (
            <div className="rounded-lg border p-6 text-center space-y-4">
                <p className="text-destructive">{errorMessage}</p>
                <Button onClick={handleGoToOwnProfile}>پروفایل من</Button>
            </div>
        );
    }

    if (isLoading || !adminData) {
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
            <ProfileHeader
                admin={adminData}
                formData={formData}
                onProfileImageChange={(media) => handleInputChange("profileImage", media)}
                adminId={adminId}
            />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList>
                    <TabsTrigger value="account">
                        <User className="w-4 h-4" />
                        حساب کاربری
                    </TabsTrigger>
                    {adminData.user_role_type === 'consultant' && (
                        <TabsTrigger value="consultant">
                            <Building2 className="w-4 h-4" />
                            اطلاعات مشاور
                        </TabsTrigger>
                    )}
                    {adminData.user_role_type === 'consultant' && adminData.agent_profile?.id && hasPermission("real_estate.property.read") && (
                        <TabsTrigger value="agent-properties">
                            <Home className="w-4 h-4" />
                            املاک مشاور
                        </TabsTrigger>
                    )}
                    {adminData.user_role_type !== 'consultant' && hasPermission("real_estate.property.read") && (
                        <TabsTrigger value="properties">
                            <Home className="w-4 h-4" />
                            املاک
                        </TabsTrigger>
                    )}
                    <TabsTrigger value="security">
                        <KeyRound className="w-4 h-4" />
                        گذرواژه
                    </TabsTrigger>
                    <TabsTrigger value="social">
                        <Share2 className="w-4 h-4" />
                        شبکه‌های اجتماعی
                    </TabsTrigger>
                    <TabsTrigger value="advanced_settings">
                        <Settings2 className="w-4 h-4" />
                        تنظیمات پیشرفته
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="account">
                    <Suspense fallback={<TabContentSkeleton />}>
                        <AccountTab
                            admin={adminData}
                            formData={formData}
                            editMode={editMode}
                            setEditMode={setEditMode}
                            handleInputChange={handleInputChange}
                            handleSaveProfile={handleSaveProfile}
                            isSaving={isSaving}
                            fieldErrors={fieldErrors}
                            onProvinceChange={handleProvinceChange}
                            onCityChange={handleCityChange}
                            adminId={adminId}
                        />
                    </Suspense>
                </TabsContent>

                {adminData.user_role_type === 'consultant' && (
                    <TabsContent value="consultant">
                        <Suspense fallback={<TabContentSkeleton />}>
                            <ConsultantTab
                                admin={adminData}
                                formData={formData}
                                editMode={editMode}
                                handleInputChange={handleInputChange}
                                handleSaveProfile={handleSaveProfile}
                                isSaving={isSaving}
                                fieldErrors={fieldErrors}
                            />
                        </Suspense>
                    </TabsContent>
                )}
                {adminData.user_role_type === 'consultant' && adminData.agent_profile?.id && hasPermission("real_estate.property.read") && (
                    <TabsContent value="agent-properties">
                        <Suspense fallback={<TabContentSkeleton />}>
                            <AgentPropertiesTab admin={adminData} />
                        </Suspense>
                    </TabsContent>
                )}
                {adminData.user_role_type !== 'consultant' && hasPermission("real_estate.property.read") && (
                    <TabsContent value="properties">
                        <Suspense fallback={<TabContentSkeleton />}>
                            <AdminPropertiesTab admin={adminData} />
                        </Suspense>
                    </TabsContent>
                )}

                <TabsContent value="security">
                    <Suspense fallback={<TabContentSkeleton />}>
                        <SecurityTab />
                    </Suspense>
                </TabsContent>

                <TabsContent value="social">
                    <Suspense fallback={<TabContentSkeleton />}>
                        <SocialTab
                            formData={formData}
                            editMode={editMode}
                            handleInputChange={handleInputChange}
                            handleSaveProfile={handleSaveProfile}
                        />
                    </Suspense>
                </TabsContent>

                <TabsContent value="advanced_settings">
                    <Suspense fallback={<TabContentSkeleton />}>
                        <AdvancedSettingsTab admin={adminData} />
                    </Suspense>
                </TabsContent>
            </Tabs>
        </div>
    );
}