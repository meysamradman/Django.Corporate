"use client";

import React, { useState, useEffect, lazy, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/api/admins/route";
import { roleApi } from "@/api/roles/route";
import { Role } from "@/types/auth/permission";
import { extractFieldErrors, hasFieldErrors } from "@/core/config/errorHandler";
import { showSuccessToast, showErrorToast } from "@/core/config/errorHandler";
import { msg } from "@/core/messages/message";
import { adminFormSchema, adminFormDefaults, AdminFormValues } from "@/core/validations/adminSchema";
import { Button } from "@/components/elements/Button";
import { Tabs, TabsList, TabsTrigger } from "@/components/elements/Tabs";
import { Skeleton } from "@/components/elements/Skeleton";
import { Loader2, Save, User, UserCircle, ShieldCheck } from "lucide-react";
import { Media } from "@/types/shared/media";

// Dynamic Imports با Next.js 15.5
const BaseInfoTab = lazy(() => import("@/components/admins/create/BaseInfoTab"));
const ProfileTab = lazy(() => import("@/components/admins/create/ProfileTab"));
const PermissionsTab = lazy(() => import("@/components/admins/create/PermissionsTab"));

export default function CreateAdminPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<string>("base-info");
    const [editMode] = useState(true);
    const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);

    const [roles, setRoles] = useState<Role[]>([]);
    const [loadingRoles, setLoadingRoles] = useState(true);
    const [rolesError, setRolesError] = useState<string | null>(null);

    // React Hook Form با Zod validation
    const form = useForm<AdminFormValues>({
        resolver: zodResolver(adminFormSchema) as any,
        defaultValues: adminFormDefaults as any,
        mode: "onSubmit", // Validation فقط موقع submit
    });

    const createAdminMutation = useMutation({
        mutationFn: async (data: AdminFormValues) => {
            // آماده کردن دیتا برای API
            const profileData: Partial<{
                first_name: string | null;
                last_name: string | null;
                birth_date: string | null;
                national_id: string | null;
                phone: string | null;
                province: string | null;
                city: string | null;
                address: string | null;
                department: string | null;
                position: string | null;
                bio: string | null;
                notes: string | null;
            }> = {};
            
            profileData.first_name = data.profile_first_name || null;
            profileData.last_name = data.profile_last_name || null;
            profileData.birth_date = data.profile_birth_date || null;
            profileData.national_id = data.profile_national_id || null;
            profileData.phone = data.profile_phone || null;
            profileData.province_id = data.profile_province_id || null;
            profileData.city_id = data.profile_city_id || null;
            profileData.address = data.profile_address || null;
            profileData.department = data.profile_department || null;
            profileData.position = data.profile_position || null;
            profileData.bio = data.profile_bio || null;
            profileData.notes = data.profile_notes || null;

            const adminDataToSubmit: Record<string, unknown> = {
                mobile: data.mobile,
                email: data.email || undefined,
                full_name: data.full_name || undefined,
                password: data.password,
                is_active: true,
                is_superuser: data.is_superuser,
                ...(data.role_id !== 'none' && { role_id: Number(data.role_id) }),
            };

            if (Object.keys(profileData).length > 0) {
                adminDataToSubmit.profile = profileData;
            }
            
            if (selectedMedia?.id) {
                adminDataToSubmit.profile_picture_id = selectedMedia.id;
            }

            return await adminApi.createAdmin(adminDataToSubmit, undefined);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admins'] });
            showSuccessToast(msg.ui("created"));
            router.push("/admins");
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
                        'role_id': 'role_id',
                        'profile.first_name': 'profile_first_name',
                        'profile.last_name': 'profile_last_name',
                        'profile.national_id': 'profile_national_id',
                        'profile.phone': 'profile_phone',
                        'profile.province_id': 'profile_province_id',
                        'profile.city_id': 'profile_city_id',
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

    useEffect(() => {
        const fetchRoles = async () => {
            setLoadingRoles(true);
            setRolesError(null);
            try {
                const response = await roleApi.getRoleList({ is_active: true });
                
                let fetchedRoles: Role[] = [];
                
                if (response.data && Array.isArray(response.data)) {
                    fetchedRoles = response.data;
                } else if (response.data && typeof response.data === 'object' && 'results' in response.data && Array.isArray((response.data as any).results)) {
                    fetchedRoles = (response.data as any).results;
                } else if (response && Array.isArray(response)) {
                    fetchedRoles = response;
                } else {
                    fetchedRoles = [];
                }
                
                setRoles(fetchedRoles);
            } catch (error) {
                setRolesError('بارگذاری نقش‌ها ناموفق بود.');
                showErrorToast(error, 'بارگذاری نقش‌ها ناموفق بود');
            } finally {
                setLoadingRoles(false);
            }
        };
        fetchRoles();
    }, []);

    // Handler برای ذخیره فرم
    const handleSubmit = async () => {
        const isValid = await form.trigger();
        if (!isValid) return;
        
        const data = form.getValues();
        createAdminMutation.mutate(data);
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
                        <h1 className="text-2xl font-bold tracking-tight">ایجاد ادمین جدید</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            ایجاد حساب کاربری جدید برای دسترسی به پنل مدیریت
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handleSubmit} disabled={createAdminMutation.isPending}>
                            {createAdminMutation.isPending ? (
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
                        <Button variant="outline" onClick={() => router.back()} disabled={createAdminMutation.isPending}>
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
                        <TabsTrigger value="permissions">
                            <ShieldCheck className="w-4 h-4" />
                            دسترسی‌ها
                        </TabsTrigger>
                    </TabsList>

                    <Suspense fallback={
                        <div className="mt-6">
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
                        {activeTab === "permissions" && (
                            <PermissionsTab
                                form={form as any}
                                roles={roles}
                                loadingRoles={loadingRoles}
                                rolesError={rolesError}
                                editMode={editMode}
                            />
                        )}
                    </Suspense>
                </Tabs>
            </div>
        </Suspense>
    );
}