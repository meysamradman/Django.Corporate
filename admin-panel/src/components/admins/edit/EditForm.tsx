import { useEffect, useMemo, useState } from "react";
import { useForm, useFormState } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, User } from "lucide-react";
import { Skeleton } from "@/components/elements/Skeleton";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Alert, AlertDescription } from "@/components/elements/Alert";
import { TabbedPageLayout } from "@/components/templates/TabbedPageLayout";
import { adminApi } from "@/api/admins/admins";
import { useAuth } from "@/core/auth/AuthContext";
import { msg } from "@/core/messages";
import { extractFieldErrors, handleFormApiError, notifyApiError, showSuccess } from "@/core/toast";
import { useAdminRolesOptions } from "@/components/admins/hooks/useAdminRolesOptions";
import { useEditAdminPageTabs } from "../hooks/useEditAdminPageTabs";
import { ADMIN_CREATE_FIELD_MAP, mapAdminFieldErrorKey } from "@/components/admins/validations/adminApiError";
import { adminEditFormDefaults, adminEditFormSchema } from "../validations/adminEditSchema";
import type { AdminFormValues } from "@/components/admins/validations/adminSchema";
import type { Media } from "@/types/shared/media";
import type { SocialMediaItem } from "@/types/shared/socialMedia";
import { ApiError } from "@/types/api/apiError";

interface EditAdminFormProps {
    adminId: string;
    profileMode?: "admin" | "agent";
    viewOnly?: boolean;
}

const TabSkeleton = () => (
    <div className="mt-0 space-y-6">
        <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 min-w-0">
                <CardWithIcon
                    icon={User}
                    title="اطلاعات پایه"
                    iconBgColor="bg-blue"
                    iconColor="stroke-blue-2"
                    cardBorderColor="border-b-blue-1"
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

const ADMIN_EDIT_TAB_BY_FIELD: Record<string, string> = {
    mobile: "base-info",
    email: "base-info",
    password: "base-info",
    full_name: "base-info",
    admin_role_type: "base-info",
    profile_first_name: "profile",
    profile_last_name: "profile",
    profile_birth_date: "profile",
    profile_national_id: "profile",
    profile_phone: "profile",
    profile_province_id: "profile",
    profile_city_id: "profile",
    profile_address: "profile",
    profile_department: "profile",
    profile_position: "profile",
    profile_bio: "profile",
    profile_notes: "profile",
    profile_picture: "profile",
    license_number: "consultant",
    license_expire_date: "consultant",
    specialization: "consultant",
    agency_id: "consultant",
    is_verified: "consultant",
    show_in_team: "consultant",
    team_order: "consultant",
    bio: "consultant",
    meta_title: "consultant",
    meta_description: "consultant",
    meta_keywords: "consultant",
    og_title: "consultant",
    og_description: "consultant",
    og_image_id: "consultant",
    role_id: "permissions",
    is_superuser: "permissions",
    is_active: "permissions",
    social_media: "social",
    "profile.social_media": "social",
    "agent_profile.social_media": "social",
};

const resolveEditAdminErrorTab = (fieldKeys: Iterable<string>): string | null => {
    for (const key of fieldKeys) {
        const tab = ADMIN_EDIT_TAB_BY_FIELD[key];
        if (tab) return tab;
    }
    return null;
};

export function EditAdminForm({ adminId, profileMode = "admin", viewOnly = false }: EditAdminFormProps) {
    const [activeTab, setActiveTab] = useState<string>("base-info");
    const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
    const [adminSocialMedia, setAdminSocialMedia] = useState<SocialMediaItem[]>([]);
    const [consultantSocialMedia, setConsultantSocialMedia] = useState<SocialMediaItem[]>([]);
    const [formAlert, setFormAlert] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const location = useLocation();
    const { user, refreshUser } = useAuth();

    const isMeRoute = adminId === "me";
    const isAgentRoute = location.pathname.includes("/agents/");
    const isAgentMode = profileMode === "agent" || isAgentRoute;
    const isNumericId = !Number.isNaN(Number(adminId));
    const queryKey = ["admin", isMeRoute ? "me" : adminId];

    const canManageAccess = useMemo(
        () => Boolean(user?.is_superuser) && !viewOnly,
        [user?.is_superuser, viewOnly]
    );
    const lockRoleType = isAgentMode;
    const canChangeRoleType = canManageAccess && !lockRoleType;

    const { data: adminData, isLoading, error } = useQuery({
        queryKey,
        queryFn: () => {
            if (isMeRoute) {
                return adminApi.getCurrentAdminManagedProfile();
            }
            if (!isNumericId) {
                return Promise.reject(new Error("شناسه ادمین نامعتبر است"));
            }
            return adminApi.getAdminById(Number(adminId));
        },
        staleTime: 0,
        retry: (failureCount, requestError) => {
            if (requestError instanceof ApiError && requestError.response.AppStatusCode === 403) {
                return false;
            }
            return failureCount < 2;
        },
    });

    const form = useForm<AdminFormValues, any, AdminFormValues>({
        resolver: zodResolver(adminEditFormSchema) as any,
        defaultValues: adminEditFormDefaults,
        mode: "onSubmit",
    });

    const { errors: formErrors } = useFormState({ control: form.control });
    const formErrorVersion = Object.keys(formErrors).sort().join("|");

    useEffect(() => {
        if (!adminData) return;

        const roleId =
            typeof adminData.role_id === "number"
                ? adminData.role_id
                : adminData.roles?.[0]?.id;

        const nextValues: AdminFormValues = {
            ...adminEditFormDefaults,
            mobile: adminData.mobile || "",
            email: adminData.email || "",
            password: "",
            full_name: adminData.full_name || "",
            is_active: adminData.is_active ?? true,
            is_superuser: adminData.is_superuser ?? false,
            role_id: roleId ? String(roleId) : "none",
            admin_role_type: adminData.user_role_type === "consultant" ? "consultant" : "admin",
            profile_first_name: adminData.profile?.first_name || "",
            profile_last_name: adminData.profile?.last_name || "",
            profile_birth_date: adminData.profile?.birth_date || "",
            profile_national_id: adminData.profile?.national_id || "",
            profile_phone: adminData.profile?.phone || "",
            profile_province_id: adminData.profile?.province?.id ?? null,
            profile_city_id: adminData.profile?.city?.id ?? null,
            profile_address: adminData.profile?.address || "",
            profile_bio: adminData.profile?.bio || "",
            profile_picture: adminData.profile?.profile_picture || null,
            license_number: adminData.agent_profile?.license_number || "",
            license_expire_date: adminData.agent_profile?.license_expire_date || "",
            specialization: adminData.agent_profile?.specialization || "",
            agency_id:
                (typeof adminData.agent_profile?.agency === "object"
                    ? adminData.agent_profile?.agency?.id
                    : adminData.agent_profile?.agency) || null,
            bio: adminData.agent_profile?.bio || "",
            is_verified: adminData.agent_profile?.is_verified || false,
            show_in_team: adminData.agent_profile?.show_in_team || false,
            team_order: adminData.agent_profile?.team_order ?? 0,
            meta_title: adminData.agent_profile?.meta_title || "",
            meta_description: adminData.agent_profile?.meta_description || "",
            meta_keywords: adminData.agent_profile?.meta_keywords || "",
            og_title: adminData.agent_profile?.og_title || "",
            og_description: adminData.agent_profile?.og_description || "",
            og_image_id: adminData.agent_profile?.og_image?.id || null,
            og_image: adminData.agent_profile?.og_image || null,
        };

        form.reset(nextValues);
        setSelectedMedia(adminData.profile?.profile_picture || null);
        setAdminSocialMedia(adminData.profile?.social_media || []);
        setConsultantSocialMedia(adminData.agent_profile?.social_media || []);
    }, [adminData, form]);

    const { roles, loadingRoles, rolesError } = useAdminRolesOptions();

    const handleTabChange = (nextTab: string) => {
        if (nextTab === activeTab) {
            return;
        }
        setFormAlert(null);
        setActiveTab(nextTab);
    };

    const handleSave = async () => {
        if (viewOnly || isSaving || !adminData) return;

        setFormAlert(null);
        form.clearErrors();

        const isValid = await form.trigger();
        if (!isValid) {
            const tabWithError = resolveEditAdminErrorTab(Object.keys(form.formState.errors));
            if (tabWithError) {
                setActiveTab(tabWithError);
            }
            return;
        }

        const data = form.getValues();
        const effectiveRoleType = canChangeRoleType
            ? data.admin_role_type || "admin"
            : lockRoleType
                ? "consultant"
                : adminData.user_role_type === "consultant"
                    ? "consultant"
                    : "admin";

        const profileData: Record<string, unknown> = {
            first_name: data.profile_first_name || null,
            last_name: data.profile_last_name || null,
            birth_date: data.profile_birth_date || null,
            national_id: data.profile_national_id || null,
            phone: data.profile_phone || null,
            province: data.profile_province_id || null,
            city: data.profile_city_id || null,
            address: data.profile_address || null,
            department: data.profile_department || null,
            position: data.profile_position || null,
            bio: data.profile_bio || null,
            notes: data.profile_notes || null,
            profile_picture: selectedMedia?.id || null,
            social_media: adminSocialMedia
                .filter((item) => (item.name || "").trim() && (item.url || "").trim())
                .map((item, index) => ({
                    id: item.id,
                    name: item.name,
                    url: item.url,
                    icon: item.icon ?? item.icon_data?.id ?? null,
                    order: item.order ?? index,
                })),
        };

        const updatePayload: Record<string, unknown> = {
            mobile: data.mobile,
            email: data.email || undefined,
            full_name: data.full_name || undefined,
            profile: profileData,
        };

        if (data.password && data.password.trim()) {
            updatePayload.password = data.password;
        }

        if (canManageAccess) {
            updatePayload.admin_role_type = effectiveRoleType;
            updatePayload.is_active = data.is_active ?? true;
            updatePayload.is_superuser = effectiveRoleType === "consultant" ? false : data.is_superuser;
            updatePayload.role_id = data.role_id;
        }

        if (effectiveRoleType === "consultant") {
            const agentProfile: Record<string, unknown> = {
                license_number: data.license_number || null,
                license_expire_date: data.license_expire_date || null,
                specialization: data.specialization || null,
                agency_id: data.agency_id || null,
                bio: data.bio || null,
                meta_title: data.meta_title || null,
                meta_description: data.meta_description || null,
                meta_keywords: data.meta_keywords || null,
                og_title: data.og_title || null,
                og_description: data.og_description || null,
                og_image_id: data.og_image_id || null,
                social_media: consultantSocialMedia
                    .filter((item) => (item.name || "").trim() && (item.url || "").trim())
                    .map((item, index) => ({
                        id: item.id,
                        name: item.name,
                        url: item.url,
                        icon: item.icon ?? item.icon_data?.id ?? null,
                        order: item.order ?? index,
                    })),
            };
            if (canManageAccess) {
                agentProfile.is_verified = data.is_verified || false;
                agentProfile.show_in_team = data.show_in_team || false;
                agentProfile.team_order = typeof data.team_order === "number" ? Math.max(0, data.team_order) : 0;
            }

            updatePayload.agent_profile = agentProfile;
        }

        try {
            setIsSaving(true);
            await adminApi.updateUserByType(adminData.id, updatePayload, "admin");

            await queryClient.invalidateQueries({ queryKey });
            await queryClient.invalidateQueries({ queryKey: ["admins"] });
            await queryClient.invalidateQueries({ queryKey: ["agents"] });
            await queryClient.invalidateQueries({ queryKey: ["admin-profile"] });
            await queryClient.invalidateQueries({ queryKey: ["current-admin-profile"] });

            if (user?.id && (isMeRoute || Number(adminId) === user.id)) {
                await refreshUser();
            }

            showSuccess(msg.crud("updated", { item: "پروفایل ادمین" }));
        } catch (error: unknown) {
            setFormAlert(null);

            const fieldErrors = extractFieldErrors(error);
            if (Object.keys(fieldErrors).length > 0) {
                const mappedFieldKeys: string[] = [];

                handleFormApiError(error, {
                    setFieldError: (field, message) => {
                        if (field === "non_field_errors") {
                            setFormAlert(message);
                            return;
                        }

                        const formField = mapAdminFieldErrorKey(
                            field,
                            ADMIN_CREATE_FIELD_MAP as unknown as Record<string, string>
                        ) as keyof AdminFormValues;

                        mappedFieldKeys.push(String(formField));
                        form.setError(formField, {
                            type: "server",
                            message,
                        });
                    },
                    checkFormMessage: msg.error("checkForm"),
                    showToastForFieldErrors: false,
                    preferBackendMessage: false,
                    dedupeKey: "admins-edit-validation-error",
                });

                const tabWithError = resolveEditAdminErrorTab(mappedFieldKeys);
                if (tabWithError) {
                    setActiveTab(tabWithError);
                }
                return;
            }

            if (error instanceof ApiError) {
                const statusCode = error.response.AppStatusCode;
                if (statusCode < 500) {
                    setFormAlert(error.response.message || msg.error("validation"));
                    return;
                }
            }

            notifyApiError(error, {
                fallbackMessage: msg.error("serverError"),
                preferBackendMessage: false,
                dedupeKey: "admins-edit-system-error",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const { tabs } = useEditAdminPageTabs({
        form,
        canManageAccess,
        lockRoleType,
        selectedMedia,
        setSelectedMedia,
        roles,
        loadingRoles,
        rolesError,
        formErrorVersion,
        adminSocialMedia,
        consultantSocialMedia,
        onAdminSocialMediaChange: setAdminSocialMedia,
        onConsultantSocialMediaChange: setConsultantSocialMedia,
    });

    if (error) {
        const errorMessage =
            error instanceof ApiError
                ? error.response.message
                : error instanceof Error
                    ? error.message
                    : "خطا در دریافت اطلاعات ادمین";

        return (
            <div className="rounded-lg border p-6 text-center space-y-4">
                <p className="text-destructive">{errorMessage}</p>
                <button
                    type="button"
                    onClick={() => navigate(isAgentMode ? "/agents/me/edit" : "/admins/me/edit")}
                    className="inline-flex items-center justify-center rounded-md border border-br bg-card px-4 py-2 text-sm text-font-p hover:bg-bg"
                >
                    پروفایل من
                </button>
            </div>
        );
    }

    if (isLoading || !adminData) {
        return <TabSkeleton />;
    }

    return (
        <div className="space-y-4">
            {formAlert ? (
                <Alert variant="destructive" className="border-red-1/50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{formAlert}</AlertDescription>
                </Alert>
            ) : null}

            <TabbedPageLayout
                title={isAgentMode ? "ویرایش مشاور" : "ویرایش ادمین"}
                description={isAgentMode ? "مدیریت اطلاعات مشاور" : "مدیریت اطلاعات ادمین"}
                showHeader={false}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                tabs={tabs}
                onSave={handleSave}
                isSaving={isSaving}
                saveLabel="ذخیره تغییرات"
                isLoading={false}
                skeleton={<TabSkeleton />}
            />
        </div>
    );
}
