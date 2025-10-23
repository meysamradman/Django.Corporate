"use client";

import React, { useState } from "react";
import { toast } from "@/components/elements/Sonner";
import { UserWithProfile } from "@/types/auth/user";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/elements/Tabs";
import { User, AlertCircle } from "lucide-react";
import { ProfileHeader } from "@/components/users/profile/ProfileHeader";
import { Skeleton } from "@/components/elements/Skeleton";
import { adminApi } from "@/api/admins/route";
import dynamic from "next/dynamic";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
// @ts-ignore - TypeScript caching issue, file exists
import { userFormSchema, UserFormValues } from "@/core/validations/userSchema";
import { Media } from "@/types/shared/media";

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

const BaseInfoTab = dynamic(
    () => import("@/components/users/create/BaseInfoTab").then((mod) => mod.default),
    { loading: () => <TabContentSkeleton />, ssr: false }
);

const ProfileTab = dynamic(
    () => import("@/components/users/create/ProfileTab").then((mod) => mod.default),
    { loading: () => <TabContentSkeleton />, ssr: false }
);

interface EditUserFormProps {
    userData: UserWithProfile;
}

export function EditUserForm({ userData }: EditUserFormProps) {
    const [activeTab, setActiveTab] = useState("base-info");
    const [editMode, setEditMode] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState<Media | null>(userData.profile?.profile_picture || null);

    // React Hook Form with Zod validation
    const form = useForm<UserFormValues>({
        resolver: zodResolver(userFormSchema) as any,
        defaultValues: {
            mobile: userData.mobile || "",
            email: userData.email || "",
            password: "",
            full_name: userData.full_name || "",
            profile_first_name: userData.profile?.first_name || "",
            profile_last_name: userData.profile?.last_name || "",
            profile_birth_date: userData.profile?.birth_date || "",
            profile_national_id: userData.profile?.national_id || "",
            profile_phone: userData.profile?.phone || "",
            profile_province: userData.profile?.province?.name || "",
            profile_city: userData.profile?.city?.name || "",
            profile_address: userData.profile?.address || "",
            profile_bio: userData.profile?.bio || "",
            profile_picture: userData.profile?.profile_picture || null,
        } as any,
        mode: "onSubmit", // Validation only on submit
    });

    const { watch, setValue } = form;
    const formData = watch();

    const [isSaving, setIsSaving] = useState(false);

    const handleInputChange = (field: string, value: string | any) => {
        if (field === "cancel") {
            setEditMode(false);
            return;
        }
        // This is handled by React Hook Form now
    };

    const handleSaveProfile = async () => {
        if (isSaving) return;
        
        setIsSaving(true);
        try {
            // Get form data
            const data = form.getValues();
            
            // Prepare data for API - with correct structure
            const updateData: Record<string, any> = {
                mobile: data.mobile,
                full_name: data.full_name,
                first_name: data.profile_first_name || "",
                last_name: data.profile_last_name || "",
                birth_date: data.profile_birth_date || null,
                national_id: data.profile_national_id || null,
                phone: data.profile_phone || null,
                address: data.profile_address || null,
                bio: data.profile_bio || null,
                profile_picture: selectedMedia?.id || null,
            };
            
            // Add email only if it's not empty
            if (data.email) {
                updateData.email = data.email;
            }
            
            // Add password only if it's provided
            if (data.password) {
                updateData.password = data.password;
            }
            
            // Add province and city only if they exist
            if (data.profile_province) {
                updateData.province = data.profile_province;
            }
            
            if (data.profile_city) {
                updateData.city = data.profile_city;
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
                formData={{
                    firstName: formData.profile_first_name || "",
                    lastName: formData.profile_last_name || "",
                    mobile: formData.mobile,
                    profileImage: selectedMedia,
                }} 
                onProfileImageChange={setSelectedMedia}
            />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList>
                    <TabsTrigger value="base-info">
                        <User className="w-4 h-4 me-2" />
                        اطلاعات پایه
                    </TabsTrigger>
                    <TabsTrigger value="profile">
                        <AlertCircle className="w-4 h-4 me-2" />
                        پروفایل
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="base-info">
                    <BaseInfoTab
                        form={form}
                        editMode={editMode}
                    />
                </TabsContent>

                <TabsContent value="profile">
                    <ProfileTab
                        form={form}
                        selectedMedia={selectedMedia}
                        setSelectedMedia={setSelectedMedia}
                        editMode={editMode}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}