"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from "@/components/elements/Sonner";
import { AdminWithProfile } from "@/types/auth/admin";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/elements/Tabs";
import { User, KeyRound, Share2, Settings2 } from "lucide-react";
import { ProfileHeader } from "@/components/admins/profile/ProfileHeader";
import { Skeleton } from "@/components/elements/Skeleton";
import { adminApi } from "@/api/admins/route";
import dynamic from "next/dynamic";
import { getErrorMessage, getUIMessage, getValidationMessage } from "@/core/messages/message";
import { useAuth } from "@/core/auth/AuthContext";
import { ApiError } from "@/types/api/apiError";
import { Button } from "@/components/elements/Button";
import { useRouter } from "next/navigation";

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

const AccountTab = dynamic(
    () => import("@/components/admins/profile/AccountTab").then((mod) => mod.AccountTab),
    { loading: () => <TabContentSkeleton />, ssr: false }
);

const SecurityTab = dynamic(
    () => import("@/components/admins/profile/SecurityTab").then((mod) => mod.SecurityTab),
    { loading: () => <TabContentSkeleton />, ssr: false }
);

const SocialTab = dynamic(
    () => import("@/components/admins/profile/SocialTab").then((mod) => mod.SocialTab),
    { loading: () => <TabContentSkeleton />, ssr: false }
);

const AdvancedSettingsTab = dynamic(
    () => import("@/components/admins/profile/AdvancedSettingsTab").then((mod) => mod.AdvancedSettingsTab),
    { loading: () => <TabContentSkeleton />, ssr: false }
);


interface EditAdminFormProps {
    adminId: string;
}


export function EditAdminForm({ adminId }: EditAdminFormProps) {

    const [activeTab, setActiveTab] = useState("account");
    const queryClient = useQueryClient();
    const router = useRouter();
    const { user, refreshUser } = useAuth();
    
    // Fetch admin data with React Query for automatic updates
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
        staleTime: 0, // Always fetch fresh data
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
    });
    const [isSaving, setIsSaving] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [selectedProvinceId, setSelectedProvinceId] = useState<number | null>(null);
    const [selectedCityId, setSelectedCityId] = useState<number | null>(null);

    // Initialize formData when adminData is loaded
    useEffect(() => {
        if (adminData) {
            setFormData({
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
                profileImage: adminData.profile?.profile_picture || null,
                birthDate: adminData.profile?.birth_date || "",
            });
            setSelectedProvinceId(adminData.profile?.province?.id || null);
            setSelectedCityId(adminData.profile?.city?.id || null);
        }
    }, [adminData?.id]); // Only initialize once when adminData first loads

    // Sync formData with adminData changes after successful update (only when not in edit mode)
    useEffect(() => {
        if (!adminData || editMode) return; // Don't sync if in edit mode to prevent overwriting user's changes
        
        // Sync all form fields with adminData after refetch
        setFormData(prev => ({
            ...prev,
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
            profileImage: adminData.profile?.profile_picture || null,
            birthDate: adminData.profile?.birth_date || "",
        }));
        setSelectedProvinceId(adminData.profile?.province?.id || null);
        setSelectedCityId(adminData.profile?.city?.id || null);
    }, [adminData, editMode]); // Sync when adminData changes and not in edit mode

    const handleInputChange = (field: string, value: string | any) => {
        if (field === "cancel") {
            setEditMode(false);
            return;
        }
        
                setFormData(prev => {
            const newData = { ...prev, [field]: value };
                        return newData;
        });
        
        // پاک کردن خطای فیلد وقتی کاربر شروع به تایپ می‌کند
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
        handleInputChange("city", ""); // Reset city when province changes
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
        setFieldErrors({}); // پاک کردن خطاهای قبلی
        
        try {
            // آماده کردن دیتا برای API - با profile object و validation
            const profileData: Record<string, any> = {
                profile: {
                    first_name: formData.firstName || null,
                    last_name: formData.lastName || null,
                    phone: formData.phone || null,
                    address: formData.address || null,
                    province: selectedProvinceId || null, // ID بجای نام
                    city: selectedCityId || null, // ID بجای نام
                    bio: formData.bio || null,
                    national_id: formData.nationalId && formData.nationalId.trim() !== '' ? formData.nationalId : null,
                    profile_picture: formData.profileImage?.id || null,
                    birth_date: formData.birthDate || null, // Add birth_date field
                }
            };
            
            // اضافه کردن فیلدهای user (email, mobile) در سطح اصلی
            if (formData.email) {
                profileData.email = formData.email;
            }
            
            if (formData.mobile) {
                profileData.mobile = formData.mobile;
            }
            
            
                                    if (!adminData) {
                toast.error('اطلاعات ادمین یافت نشد');
                return;
            }
            
            const result = await adminApi.updateUserByType(adminData.id, profileData, 'admin');
                        // Close edit mode first to allow formData sync
            setEditMode(false);
            
            // Invalidate React Query cache for this admin
            await queryClient.invalidateQueries({ queryKey: ['admin', adminId] });
            await queryClient.refetchQueries({ queryKey: ['admin', adminId] });
            
            // Invalidate general admin profile queries
            await queryClient.invalidateQueries({ queryKey: ['admin-profile'] });
            await queryClient.invalidateQueries({ queryKey: ['current-admin-profile'] });
            
            // If user is editing their own profile, refresh AuthContext to update sidebar
            if (user?.id && (isMeRoute || Number(adminId) === user.id)) {
                await refreshUser();
                            }
            
            toast.success(getUIMessage('adminProfileUpdated'));
        } catch (error: any) {
            // بررسی خطاهای فیلدها
            if (error?.response?.errors) {
                const errorData = error.response.errors;
                const newFieldErrors: Record<string, string> = {};
                
                // بررسی خطاهای فیلدهای خاص
                if (errorData.mobile) {
                    newFieldErrors.mobile = getValidationMessage('auth_mobile_invalid');
                }
                if (errorData.email) {
                    newFieldErrors.email = getValidationMessage('auth_email_invalid');
                }
                if (errorData.profile?.national_id) {
                    // بررسی نوع خطای کد ملی
                    if (errorData.profile.national_id.includes('تکراری') || errorData.profile.national_id.includes('قبلاً')) {
                        newFieldErrors.nationalId = getValidationMessage('national_id_exists');
                    } else if (errorData.profile.national_id.includes('10 رقم') || errorData.profile.national_id.includes('طول')) {
                        newFieldErrors.nationalId = getValidationMessage('nationalIdLength');
                    } else {
                        newFieldErrors.nationalId = getValidationMessage('nationalIdInvalid');
                    }
                }
                if (errorData.profile?.first_name) {
                    newFieldErrors.firstName = getValidationMessage('first_name_required');
                }
                if (errorData.profile?.last_name) {
                    newFieldErrors.lastName = getValidationMessage('last_name_required');
                }
                
                // بررسی خطاهای کلی
                if (errorData.detail) {
                    // اگر خطای کلی وجود داشت، آن را در toast نمایش بده
                    toast.error(errorData.detail);
                    return;
                }
                
                // اگر خطاهای فیلد وجود داشت، آنها را نمایش بده
                if (Object.keys(newFieldErrors).length > 0) {
                    setFieldErrors(newFieldErrors);
                    return; // از نمایش toast جلوگیری کن
                }
            }
            
            // نمایش پیام خطای کلی
            const errorMessage = getValidationMessage('adminProfileUpdateFailed');
            toast.error(errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    const handleGoToOwnProfile = () => {
        router.push("/admins/me/edit");
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

    // Show loading state while data is being fetched
    if (isLoading || !adminData) {
        return (
            <div className="space-y-6">
                <div className="rounded-lg border p-6">
                    <Skeleton className="h-32 w-full mb-4" />
                    <Skeleton className="h-8 w-1/3 mb-2" />
                    <Skeleton className="h-4 w-2/3" />
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
            />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList>
                    <TabsTrigger value="account">
                        <User className="w-4 h-4 me-2" />
                        حساب کاربری
                    </TabsTrigger>
                    <TabsTrigger value="security">
                        <KeyRound className="w-4 h-4 me-2" />
                        گذرواژه
                    </TabsTrigger>
                    <TabsTrigger value="social">
                        <Share2 className="w-4 h-4 me-2" />
                        شبکه‌های اجتماعی
                    </TabsTrigger>
                    <TabsTrigger value="advanced_settings">
                        <Settings2 className="w-4 h-4 me-2" />
                        تنظیمات پیشرفته
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="account">
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
                    />
                </TabsContent>

                <TabsContent value="security">
                    <SecurityTab />
                </TabsContent>

                <TabsContent value="social">
                    <SocialTab
                        formData={formData}
                        editMode={editMode}
                        handleInputChange={handleInputChange}
                        handleSaveProfile={handleSaveProfile}
                    />
                </TabsContent>

                <TabsContent value="advanced_settings">
                    <AdvancedSettingsTab admin={adminData} />
                </TabsContent>
            </Tabs>
        </div>
    );
}