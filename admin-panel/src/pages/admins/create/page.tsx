import { useState, useEffect, lazy, Suspense } from "react";
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
import { Loader2, Save, User, UserCircle, ShieldCheck, Building2 } from "lucide-react";
import type { Media } from "@/types/shared/media";

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

const BaseInfoTab = lazy(() => import("@/components/admins/create/BaseInfoTab"));
const ProfileTab = lazy(() => import("@/components/admins/create/ProfileTab"));
const PermissionsTab = lazy(() => import("@/components/admins/create/PermissionsTab"));
const ConsultantFields = lazy(() => import("@/components/admins/ConsultantFields"));

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
                is_active: data.is_active ?? true,
                is_superuser: data.is_superuser,
                ...(data.role_id !== 'none' && { role_id: Number(data.role_id) }),
                admin_role_type: data.admin_role_type || "admin",
            };

            if (Object.keys(profileData).length > 0) {
                adminDataToSubmit.profile = profileData;
            }
            
            if (selectedMedia?.id) {
                adminDataToSubmit.profile_picture_id = selectedMedia.id;
            }
            
            // اضافه کردن فیلدهای مشاور املاک
            if (data.admin_role_type === "consultant") {
                if (data.license_number) adminDataToSubmit.license_number = data.license_number;
                if (data.license_expire_date) adminDataToSubmit.license_expire_date = data.license_expire_date;
                if (data.specialization) adminDataToSubmit.specialization = data.specialization;
                if (data.agency_id) adminDataToSubmit.agency_id = data.agency_id;
                if (typeof data.is_verified === 'boolean') adminDataToSubmit.is_verified = data.is_verified;
                        
                // فیلدهای SEO
                if (data.meta_title) adminDataToSubmit.meta_title = data.meta_title;
                if (data.meta_description) adminDataToSubmit.meta_description = data.meta_description;
                if (data.meta_keywords) adminDataToSubmit.meta_keywords = data.meta_keywords;
                if (data.og_title) adminDataToSubmit.og_title = data.og_title;
                if (data.og_description) adminDataToSubmit.og_description = data.og_description;
                if (data.og_image_id) adminDataToSubmit.og_image_id = data.og_image_id;
                if (data.twitter_card) adminDataToSubmit.twitter_card = data.twitter_card;
            }

            return await adminApi.createAdmin(adminDataToSubmit as any);
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
                    {form.watch("admin_role_type") === "consultant" && (
                        <TabsTrigger value="consultant">
                            <Building2 className="w-4 h-4" />
                            اطلاعات مشاور
                        </TabsTrigger>
                    )}
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
                {form.watch("admin_role_type") === "consultant" && (
                    <TabsContent value="consultant">
                        <Suspense fallback={<TabSkeleton />}>
                            <ConsultantFields
                                form={form as any}
                                isEdit={false}
                            />
                        </Suspense>
                    </TabsContent>
                )}
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