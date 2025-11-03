"use client";

import React, { useState, lazy, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/api/admins/route";
import { extractFieldErrors, hasFieldErrors } from "@/core/config/errorHandler";
import { showSuccessToast, showErrorToast } from "@/core/config/errorHandler";
import { msg } from "@/core/messages/message";
// @ts-ignore - TypeScript caching issue, file exists
import { userFormSchema, userFormDefaults, UserFormValues } from "@/core/validations/userSchema";
import { Button } from "@/components/elements/Button";
import { Tabs, TabsList, TabsTrigger } from "@/components/elements/Tabs";
import { Skeleton } from "@/components/elements/Skeleton";
import { Loader2, Save, User, UserCircle } from "lucide-react";
import { Media } from "@/types/shared/media";

// Dynamic Imports با Next.js 15.5
const BaseInfoTab = lazy(() => import("@/components/users/create/BaseInfoTab"));
const ProfileTab = lazy(() => import("@/components/users/create/ProfileTab"));

export default function CreateUserPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<string>("base-info");
    const [editMode] = useState(true);
    const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);

    // React Hook Form با Zod validation
    const form = useForm<UserFormValues>({
        resolver: zodResolver(userFormSchema) as any,
        defaultValues: userFormDefaults as any,
        mode: "onSubmit", // Validation فقط موقع submit
    });

    const createUserMutation = useMutation({
        mutationFn: async (data: UserFormValues) => {
            // آماده کردن دیتا برای API - CORRECTED STRUCTURE
            const userDataToSubmit: Record<string, unknown> = {
                identifier: data.mobile, // ✅ تغییر از mobile به identifier
                full_name: data.full_name,
                password: data.password,
                is_active: true,
                is_staff: false,
                is_superuser: false,
                user_type: 'regular',
            };

            // Add email only if it's provided
            if (data.email) {
                userDataToSubmit.email = data.email;
            }

            // Add profile fields directly to the main object (not nested)
            if (data.profile_first_name) {
                userDataToSubmit.first_name = data.profile_first_name;
            }
            
            if (data.profile_last_name) {
                userDataToSubmit.last_name = data.profile_last_name;
            }
            
            if (data.profile_birth_date) {
                userDataToSubmit.birth_date = data.profile_birth_date;
            }
            
            if (data.profile_national_id) {
                userDataToSubmit.national_id = data.profile_national_id;
            }
            
            if (data.profile_phone) {
                userDataToSubmit.phone = data.profile_phone;
            }
            
            // Use province_id and city_id directly (they are already numbers)
            if (data.profile_province_id) {
                userDataToSubmit.province_id = data.profile_province_id;
            }
            
            if (data.profile_city_id) {
                userDataToSubmit.city_id = data.profile_city_id;
            }
            
            if (data.profile_address) {
                userDataToSubmit.address = data.profile_address;
            }
            
            if (data.profile_bio) {
                userDataToSubmit.bio = data.profile_bio;
            }

            // Add profile picture ID if selected
            if (selectedMedia?.id) {
                userDataToSubmit.profile_picture_id = selectedMedia.id;
            }

            return await adminApi.createUser(userDataToSubmit, undefined);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            showSuccessToast(msg.ui("created"));
            router.push("/users");
        },
        onError: (error: any) => {
            if (hasFieldErrors(error)) {
                const fieldErrors = extractFieldErrors(error);
                
                Object.entries(fieldErrors).forEach(([field, message]) => {
                    const fieldMap: Record<string, any> = {
                        'mobile': 'mobile',
                        'email': 'email',
                        'password': 'password',
                        'full_name': 'full_name',
                        'first_name': 'profile_first_name',
                        'last_name': 'profile_last_name',
                        'national_id': 'profile_national_id',
                        'phone': 'profile_phone',
                        'province_id': 'profile_province_id',
                        'city_id': 'profile_city_id',
                    };
                    
                    const formField = fieldMap[field] || field;
                    form.setError(formField as any, {
                        type: 'server',
                        message: message as string
                    });
                });
                
                showErrorToast(error, "لطفاً خطاهای فرم را بررسی کنید");
            } else {
                showErrorToast(error);
            }
        },
    });

    // Handler برای ذخیره فرم
    const handleSubmit = async () => {
        const isValid = await form.trigger();
        if (!isValid) return;
        
        const data = form.getValues();
        createUserMutation.mutate(data);
    };

    return (
        <Suspense fallback={
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-64 mt-2" />
                    </div>
                    <div className="flex gap-2">
                        <Skeleton className="h-10 w-24" />
                        <Skeleton className="h-10 w-20" />
                    </div>
                </div>
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-96 w-full" />
            </div>
        }>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1>ایجاد کاربر جدید</h1>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handleSubmit} disabled={createUserMutation.isPending}>
                            {createUserMutation.isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    در حال ذخیره...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    ذخیره
                                </>
                            )}
                        </Button>
                        <Button variant="outline" onClick={() => router.back()} disabled={createUserMutation.isPending}>
                            انصراف
                        </Button>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList>
                        <TabsTrigger value="base-info">
                            <User className="w-4 h-4" />
                            اطلاعات پایه
                        </TabsTrigger>
                        <TabsTrigger value="profile">
                            <UserCircle className="w-4 h-4" />
                            پروفایل
                        </TabsTrigger>
                    </TabsList>

                    <Suspense fallback={
                        <div>
                            <Skeleton className="w-full h-64" />
                            <Skeleton className="w-full h-64 mt-4" />
                        </div>
                    }>
                        {activeTab === "base-info" && (
                            <BaseInfoTab
                                form={form as any}
                                editMode={editMode}
                            />
                        )}
                        {activeTab === "profile" && (
                            <ProfileTab
                                form={form as any}
                                selectedMedia={selectedMedia}
                                setSelectedMedia={setSelectedMedia}
                                editMode={editMode}
                            />
                        )}
                    </Suspense>
                </Tabs>
            </div>
        </Suspense>
    );
}