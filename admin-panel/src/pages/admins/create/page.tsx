import React, { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/api/admins/admins";
import { roleApi } from "@/api/admins/roles/roles";
import type { Role } from "@/types/auth/permission";
import { extractFieldErrors, hasFieldErrors } from '@/core/toast';
import { showSuccess, showError } from '@/core/toast';
import { getCrud } from '@/core/messages';
import { adminFormSchema, adminFormDefaults } from "@/components/admins/validations/adminSchema";
import type { AdminFormValues } from "@/components/admins/validations/adminSchema";
import { Button } from "@/components/elements/Button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/elements/Tabs";
import { Skeleton } from "@/components/elements/Skeleton";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Loader2, Save, User, UserCircle, ShieldCheck, List } from "lucide-react";
import type { Media } from "@/types/shared/media";

// Tab Skeleton
const TabSkeleton = () => (
  <div className="mt-0 space-y-6">
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 min-w-0">
        <CardWithIcon
          icon={User}
          title="اطلاعات پایه"
          iconBgColor="bg-blue"
          iconColor="stroke-blue-2"
          borderColor="border-b-blue-1"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </CardWithIcon>
      </div>
    </div>
  </div>
);

// Dynamic imports
const BaseInfoTab = lazy(() => import("@/components/admins/create/BaseInfoTab"));
const ProfileTab = lazy(() => import("@/components/admins/create/ProfileTab"));
const PermissionsTab = lazy(() => import("@/components/admins/create/PermissionsTab"));

export default function CreateAdminPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<string>("base-info");
    const [editMode] = useState(true);
    const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);

    const [roles, setRoles] = useState<Role[]>([]);
    const [loadingRoles, setLoadingRoles] = useState(true);
    const [rolesError, setRolesError] = useState<string | null>(null);

    const form = useForm<AdminFormValues>({
        resolver: zodResolver(adminFormSchema) as any,
        defaultValues: adminFormDefaults as any,
        mode: "onSubmit",
    });

    const createAdminMutation = useMutation({
        mutationFn: async (data: AdminFormValues) => {
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
            (profileData as any).province_id = data.profile_province_id || null;
            (profileData as any).city_id = data.profile_city_id || null;
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

            return await adminApi.createAdmin(adminDataToSubmit as any, undefined);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admins'] });
            showSuccess(getCrud('created', { item: 'ادمین' }));
            navigate("/admins");
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
                
                showError(error, { customMessage: "لطفاً خطاهای فرم را بررسی کنید" });
            } else {
                showError(error);
            }
        },
    });

    useEffect(() => {
        const fetchRoles = async () => {
            setLoadingRoles(true);
            setRolesError(null);
            try {
                const fetchedRoles = await roleApi.getAllRoles();
                setRoles(fetchedRoles);
            } catch (error) {
                setRolesError('بارگذاری نقش‌ها ناموفق بود.');
                showError(error, { customMessage: 'بارگذاری نقش‌ها ناموفق بود' });
            } finally {
                setLoadingRoles(false);
            }
        };
        fetchRoles();
    }, []);

    const handleSubmit = async () => {
        const isValid = await form.trigger();
        if (!isValid) return;
        
        const data = form.getValues();
        createAdminMutation.mutate(data);
    };

    return (
        <div className="space-y-6 pb-28 relative">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="page-title">ایجاد ادمین جدید</h1>
                </div>
                <div className="flex gap-2">
                    <Button 
                        variant="outline"
                        onClick={() => navigate("/admins")}
                    >
                        <List className="h-4 w-4" />
                        نمایش لیست
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

                <TabsContent value="base-info">
                    <Suspense fallback={<TabSkeleton />}>
                        <BaseInfoTab
                            form={form as any}
                            editMode={editMode}
                        />
                    </Suspense>
                </TabsContent>
                <TabsContent value="profile">
                    <Suspense fallback={<TabSkeleton />}>
                        <ProfileTab
                            form={form as any}
                            selectedMedia={selectedMedia}
                            setSelectedMedia={setSelectedMedia}
                            editMode={editMode}
                        />
                    </Suspense>
                </TabsContent>
                <TabsContent value="permissions">
                    <Suspense fallback={<TabSkeleton />}>
                        <PermissionsTab
                            form={form as any}
                            roles={roles}
                            loadingRoles={loadingRoles}
                            rolesError={rolesError}
                            editMode={editMode}
                        />
                    </Suspense>
                </TabsContent>
            </Tabs>

            {editMode && (
                <div className="fixed bottom-0 left-0 right-0 lg:right-[20rem] z-50 border-t border-br bg-card shadow-lg transition-all duration-300 flex items-center justify-end gap-3 py-4 px-8">
                    <Button 
                        onClick={handleSubmit} 
                        size="lg"
                        disabled={createAdminMutation.isPending}
                    >
                        {createAdminMutation.isPending ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                در حال ذخیره...
                            </>
                        ) : (
                            <>
                                <Save className="h-5 w-5" />
                                ذخیره
                            </>
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}