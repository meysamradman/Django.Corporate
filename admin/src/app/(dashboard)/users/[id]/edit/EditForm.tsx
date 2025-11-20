"use client";

import React, { useState, useEffect } from "react";
import { toast } from "@/components/elements/Sonner";
import { UserWithProfile } from "@/types/auth/user";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/elements/Tabs";
import { User, KeyRound } from "lucide-react";
import { ProfileHeader } from "@/components/users/profile/ProfileHeader";
import { Skeleton } from "@/components/elements/Skeleton";
import { adminApi } from "@/api/admins/route";
import dynamic from "next/dynamic";
import { Media } from "@/types/shared/media";
import { getErrorMessage, getUIMessage, getValidationMessage } from "@/core/messages/message";

// اینجا دیگه نیاز به form و validation نداریم چون مثل ادمین‌ها کار می‌کنیم
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

// بیا tabs رو مثل ادمین‌ها dynamic import کنیم
const AccountTab = dynamic(
    () => import("@/components/users/profile/AccountTab").then((mod) => ({ default: mod.AccountTab })),
    { loading: () => <TabContentSkeleton />, ssr: false }
);

const SecurityTab = dynamic(
    () => import("@/components/users/profile/SecurityTab").then((mod) => ({ default: mod.SecurityTab })),
    { loading: () => <TabContentSkeleton />, ssr: false }
);

interface EditUserFormProps {
    userData: UserWithProfile;
}

export function EditUserForm({ userData }: EditUserFormProps) {
    const [activeTab, setActiveTab] = useState("account");
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        firstName: userData.profile?.first_name || "",
        lastName: userData.profile?.last_name || "",
        email: userData.email || "",
        mobile: userData.mobile || "",
        phone: userData.profile?.phone || "",
        nationalId: userData.profile?.national_id || "",
        address: userData.profile?.address || "",
        province: userData.profile?.province?.name || "",
        city: userData.profile?.city?.name || "",
        bio: userData.profile?.bio || "",
        profileImage: userData.profile?.profile_picture || null,
        birthDate: userData.profile?.birth_date || "",
    });
    const [isSaving, setIsSaving] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [selectedProvinceId, setSelectedProvinceId] = useState<number | null>(
        userData.profile?.province?.id || null
    );
    const [selectedCityId, setSelectedCityId] = useState<number | null>(
        userData.profile?.city?.id || null
    );

    // Initialize formData when userData is loaded
    useEffect(() => {
        if (userData) {
            setFormData({
                firstName: userData.profile?.first_name || "",
                lastName: userData.profile?.last_name || "",
                email: userData.email || "",
                mobile: userData.mobile || "",
                phone: userData.profile?.phone || "",
                nationalId: userData.profile?.national_id || "",
                address: userData.profile?.address || "",
                province: userData.profile?.province?.name || "",
                city: userData.profile?.city?.name || "",
                bio: userData.profile?.bio || "",
                profileImage: userData.profile?.profile_picture || null,
                birthDate: userData.profile?.birth_date || "",
            });
            setSelectedProvinceId(userData.profile?.province?.id || null);
            setSelectedCityId(userData.profile?.city?.id || null);
        }
    }, [userData?.id]); // Only initialize once when userData first loads

    // Sync formData with userData changes (especially after profile update)
    useEffect(() => {
        if (!userData) return;
        
                // Update profile image if it changed in userData
        if (userData.profile?.profile_picture?.id !== formData.profileImage?.id) {
            setFormData(prev => ({
                ...prev,
                profileImage: userData.profile?.profile_picture || null
            }));
                    }
    }, [userData?.profile?.profile_picture?.id]);

    const handleInputChange = (field: string, value: string | any) => {
        if (field === "cancel") {
            setEditMode(false);
            return;
        }
        setFormData(prev => ({ ...prev, [field]: value }));
        
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
            const updateData: Record<string, any> = {
                mobile: formData.mobile,
                profile: {
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    birth_date: formData.birthDate || null,
                    national_id: formData.nationalId || null,
                    phone: formData.phone || null,
                    address: formData.address || null,
                    bio: formData.bio || null,
                    profile_picture: formData.profileImage?.id || null,
                    province: selectedProvinceId,
                    city: selectedCityId,
                }
            };
            
            if (formData.email) {
                updateData.email = formData.email;
            }
            
                                    const result = await adminApi.updateUserByType(userData.id, updateData, 'user');
                        toast.success(getUIMessage('userProfileUpdated'));
            setEditMode(false);
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
            const errorMessage = getValidationMessage('userProfileUpdateFailed');
            toast.error(errorMessage);
        } finally {
            setIsSaving(false);
        }
    };
    
    return (
        <div className="space-y-6">
            <ProfileHeader 
                user={userData} 
                formData={formData}
                onProfileImageChange={(media) => handleInputChange("profileImage", media)}
            />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList>
                    <TabsTrigger value="account">
                        <User className="w-4 h-4" />
                        حساب کاربری
                    </TabsTrigger>
                    <TabsTrigger value="security">
                        <KeyRound className="w-4 h-4" />
                        گذرواژه
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="account">
                    <AccountTab
                        user={userData}
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
            </Tabs>
        </div>
    );
}