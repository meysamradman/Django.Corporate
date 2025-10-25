"use client";

import React, { useState } from "react";
import { toast } from "@/components/elements/Sonner";
import { AdminWithProfile } from "@/types/auth/admin";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/elements/Tabs";
import { User, AlertCircle, Share2, Settings2 } from "lucide-react";
import { ProfileHeader } from "@/components/admins/profile/ProfileHeader";
import { Skeleton } from "@/components/elements/Skeleton";
import { adminApi } from "@/api/admins/route";
import dynamic from "next/dynamic";

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
    adminData: AdminWithProfile;
}


export function EditAdminForm({ adminData }: EditAdminFormProps) {

    const [activeTab, setActiveTab] = useState("account");
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
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
        birthDate: adminData.profile?.birth_date || "", // Add birthDate field
    });
    const [isSaving, setIsSaving] = useState(false);
    const [selectedProvinceId, setSelectedProvinceId] = useState<number | null>(
        adminData.profile?.province?.id || null
    );
    const [selectedCityId, setSelectedCityId] = useState<number | null>(
        adminData.profile?.city?.id || null
    );


    const handleInputChange = (field: string, value: string | any) => {
        if (field === "cancel") {
            setEditMode(false);
            return;
        }
        setFormData(prev => ({ ...prev, [field]: value }));
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
            
            
            console.log('Sending admin update data:', profileData);
            console.log('Admin ID:', adminData.id);
            
            const result = await adminApi.updateUserByType(adminData.id, profileData, 'admin');
            console.log('Admin update result:', result);
            
            toast.success("پروفایل با موفقیت به‌روزرسانی شد");
            setEditMode(false);
        } catch (error) {
            console.error('Admin update error:', error);
            console.error('Admin error details:', {
                message: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined
            });
            
            // Log full error object for debugging
            if (error && typeof error === 'object') {
                console.error('Full error object:', error);
                if ('response' in error && error.response) {
                    console.error('Error response:', error.response);
                }
            }
            
            // Handle specific validation errors
            let errorMessage = "خطا در ذخیره پروفایل. لطفاً دوباره تلاش کنید.";
            
            if (error && typeof error === 'object' && 'response' in error && error.response) {
                const response = error.response as any;
                if (response.errors) {
                    // Handle national_id duplicate error
                    if (response.errors.profile && response.errors.profile.national_id) {
                        errorMessage = "کد ملی وارد شده قبلاً برای ادمین دیگری استفاده شده است.";
                    }
                    // Handle other validation errors
                    else if (response.errors.profile) {
                        const profileErrors = response.errors.profile;
                        if (profileErrors.birth_date) {
                            errorMessage = "تاریخ تولد نمی‌تواند در آینده باشد.";
                        } else if (profileErrors.national_id) {
                            errorMessage = "کد ملی باید 10 رقم باشد.";
                        }
                    }
                }
            }
            
            toast.error(errorMessage);
        } finally {
            setIsSaving(false);
        }
    };
    
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
                        <AlertCircle className="w-4 h-4 me-2" />
                        امنیت
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