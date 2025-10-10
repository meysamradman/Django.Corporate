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
            // آماده کردن دیتا برای API - با ID ها بجای نام
            const profileData = {
                first_name: formData.firstName,
                last_name: formData.lastName,
                phone: formData.phone,
                address: formData.address,
                province: selectedProvinceId, // ID بجای نام
                city: selectedCityId, // ID بجای نام
                bio: formData.bio,
                national_id: formData.nationalId,
                profile_picture: formData.profileImage?.id || null,
            };
            
            
            await adminApi.updateProfile(profileData);
            
            toast.success("پروفایل با موفقیت به‌روزرسانی شد");
            setEditMode(false);
        } catch (error) {
            console.error('Error saving profile:', error);
            toast.error("خطا در ذخیره پروفایل. لطفاً دوباره تلاش کنید.");
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
