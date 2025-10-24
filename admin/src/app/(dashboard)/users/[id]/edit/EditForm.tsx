"use client";

import React, { useState } from "react";
import { toast } from "@/components/elements/Sonner";
import { UserWithProfile } from "@/types/auth/user";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/elements/Tabs";
import { User, AlertCircle, Shield } from "lucide-react";
import { ProfileHeader } from "@/components/users/profile/ProfileHeader";
import { Skeleton } from "@/components/elements/Skeleton";
import { adminApi } from "@/api/admins/route";
import dynamic from "next/dynamic";
import { Media } from "@/types/shared/media";

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
    const [selectedProvinceId, setSelectedProvinceId] = useState<number | null>(
        userData.profile?.province?.id || null
    );
    const [selectedCityId, setSelectedCityId] = useState<number | null>(
        userData.profile?.city?.id || null
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
            const updateData: Record<string, any> = {
                mobile: formData.mobile,
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
            };
            
            if (formData.email) {
                updateData.email = formData.email;
            }
            
            await adminApi.updateUser(userData.id, updateData);
            
            toast.success("پروفایل کاربر با موفقیت به‌روزرسانی شد");
            setEditMode(false);
        } catch (error) {
            toast.error("خطا در ذخیره پروفایل. لطفاً دوباره تلاش کنید.");
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
                        <User className="w-4 h-4 me-2" />
                        حساب کاربری
                    </TabsTrigger>
                    <TabsTrigger value="security">
                        <Shield className="w-4 h-4 me-2" />
                        امنیت
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