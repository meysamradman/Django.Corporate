import { useState, useEffect, lazy, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/api/admins/admins";
import { roleApi } from "@/api/admins/roles/roles";
import type { Role } from "@/types/auth/permission";
import { extractFieldErrors, hasFieldErrors } from '@/core/toast';
import { showSuccess, showError } from '@/core/toast';
import { msg } from '@/core/messages';
import { adminFormSchema, adminFormDefaults } from "@/components/admins/validations/adminSchema";
import type { AdminFormValues } from "@/components/admins/validations/adminSchema";
import { Skeleton } from "@/components/elements/Skeleton";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { User, UserCircle, ShieldCheck, Building2 } from "lucide-react";
import type { Media } from "@/types/shared/media";
import { UserFormLayout, type UserFormTab } from "@/components/page-patterns/UserFormLayout";

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

const BaseInfoTab = lazy(() => import("@/components/admins/create/Info"));
const ProfileTab = lazy(() => import("@/components/admins/create/Profile"));
const PermissionsTab = lazy(() => import("@/components/admins/create/Permissions"));
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
        resolver: zodResolver(adminFormSchema),
        defaultValues: adminFormDefaults,
        mode: "onSubmit",
    });

    const createAdminMutation = useMutation({
        mutationFn: async (data: AdminFormValues) => {
            const profileData: Record<string, any> = {};

            profileData.first_name = data.profile_first_name || null;
            profileData.last_name = data.profile_last_name || null;
            profileData.birth_date = data.profile_birth_date || null;
            profileData.national_id = data.profile_national_id || null;
            profileData.phone = data.profile_phone || null;
            profileData.province = data.profile_province_id || null;
            profileData.city = data.profile_city_id || null;
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
                profileData.profile_picture = selectedMedia.id;
            }

            if (data.admin_role_type === "consultant") {
                const agentProfile: Record<string, unknown> = {};
                if (data.license_number) agentProfile.license_number = data.license_number;
                if (data.license_expire_date) agentProfile.license_expire_date = data.license_expire_date;
                if (data.specialization) agentProfile.specialization = data.specialization;
                if (data.agency_id) agentProfile.agency_id = data.agency_id;
                if (typeof data.is_verified === 'boolean') agentProfile.is_verified = data.is_verified;

                if (data.meta_title) agentProfile.meta_title = data.meta_title;
                if (data.meta_description) agentProfile.meta_description = data.meta_description;
                if (data.meta_keywords) agentProfile.meta_keywords = data.meta_keywords;
                if (data.og_title) agentProfile.og_title = data.og_title;
                if (data.og_description) agentProfile.og_description = data.og_description;
                if (data.og_image_id) agentProfile.og_image_id = data.og_image_id;

                if (Object.keys(agentProfile).length > 0) {
                    adminDataToSubmit.agent_profile = agentProfile;
                }
            }

            return await adminApi.createAdmin(adminDataToSubmit as any);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admins'] });
            showSuccess(msg.crud('created', { item: 'ادمین' }));
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
                    form.setError(formField as keyof AdminFormValues, {
                        type: 'server',
                        message: message as string
                    });
                });

                showError(error, { customMessage: "لطفاً خطاهای فرم را بررسی کنید" });
            }
            else {
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

    const tabs: UserFormTab[] = useMemo(() => [
        {
            id: "base-info",
            label: "اطلاعات پایه",
            icon: <User className="w-4 h-4" />,
            content: <BaseInfoTab form={form} editMode={editMode} />
        },
        {
            id: "profile",
            label: "پروفایل",
            icon: <UserCircle className="w-4 h-4" />,
            content: (
                <ProfileTab
                    form={form}
                    selectedMedia={selectedMedia}
                    setSelectedMedia={setSelectedMedia}
                    editMode={editMode}
                />
            )
        },
        {
            id: "consultant",
            label: "اطلاعات مشاور",
            icon: <Building2 className="w-4 h-4" />,
            isVisible: form.watch("admin_role_type") === "consultant",
            content: <ConsultantFields form={form} isEdit={false} />
        },
        {
            id: "permissions",
            label: "دسترسی‌ها",
            icon: <ShieldCheck className="w-4 h-4" />,
            content: (
                <PermissionsTab
                    form={form}
                    roles={roles}
                    loadingRoles={loadingRoles}
                    rolesError={rolesError}
                    editMode={editMode}
                />
            )
        }
    ], [form, editMode, selectedMedia, setSelectedMedia, roles, loadingRoles, rolesError, form.watch("admin_role_type")]);

    return (
        <UserFormLayout
            title="افزودن ادمین"
            description="ایجاد ادمین جدید در سیستم"
            activeTab={activeTab}
            onTabChange={setActiveTab}
            tabs={tabs}
            onSave={handleSubmit}
            isSaving={createAdminMutation.isPending}
            skeleton={<TabSkeleton />}
        />
    );
}
