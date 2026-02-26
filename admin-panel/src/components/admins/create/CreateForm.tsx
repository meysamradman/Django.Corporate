import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, useFormState } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, User } from "lucide-react";
import { adminApi } from "@/api/admins/admins";
import { extractFieldErrors, handleFormApiError, notifyApiError, showSuccess } from "@/core/toast";
import { msg } from "@/core/messages";
import { adminFormSchema, adminFormDefaults } from "@/components/admins/validations/adminSchema";
import type { AdminFormValues } from "@/components/admins/validations/adminSchema";
import { ADMIN_CREATE_FIELD_MAP, mapAdminFieldErrorKey } from "@/components/admins/validations/adminApiError";
import { Skeleton } from "@/components/elements/Skeleton";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import type { Media } from "@/types/shared/media";
import { TabbedPageLayout } from "@/components/templates/TabbedPageLayout";
import { useAdminRolesOptions } from "@/components/admins/hooks/useAdminRolesOptions";
import { useCreateAdminPageTabs } from "@/components/admins/hooks/useCreateAdminPageTabs";
import { ApiError } from "@/types/api/apiError";
import { Alert, AlertDescription } from "@/components/elements/Alert";
import type { SocialMediaItem } from "@/types/shared/socialMedia";

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

const ADMIN_CREATE_TAB_BY_FIELD: Record<string, string> = {
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

const resolveCreateAdminErrorTab = (fieldKeys: Iterable<string>): string | null => {
  for (const key of fieldKeys) {
    const tab = ADMIN_CREATE_TAB_BY_FIELD[key];
    if (tab) return tab;
  }
  return null;
};

export function CreateAdminForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("base-info");
  const [editMode] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [adminSocialMedia, setAdminSocialMedia] = useState<SocialMediaItem[]>([]);
  const [consultantSocialMedia, setConsultantSocialMedia] = useState<SocialMediaItem[]>([]);
  const [formAlert, setFormAlert] = useState<string | null>(null);

  const { roles, loadingRoles, rolesError } = useAdminRolesOptions();

  const form = useForm<AdminFormValues>({
    resolver: zodResolver(adminFormSchema),
    defaultValues: adminFormDefaults,
    mode: "onSubmit",
  });

  const { errors: formErrors } = useFormState({ control: form.control });
  const formErrorVersion = Object.keys(formErrors).sort().join("|");

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
        ...(data.role_id !== "none" && { role_id: Number(data.role_id) }),
        admin_role_type: data.admin_role_type || "admin",
      };

      if (Object.keys(profileData).length > 0) {
        profileData.social_media = adminSocialMedia
          .filter((item) => (item.name || "").trim() && (item.url || "").trim())
          .map((item, index) => ({
            id: item.id,
            name: item.name,
            url: item.url,
            icon: item.icon ?? item.icon_data?.id ?? null,
            order: item.order ?? index,
          }));
        adminDataToSubmit.profile = profileData;
      }

      if (selectedMedia?.id) {
        profileData.profile_picture = selectedMedia.id;
      }

      if (data.admin_role_type === "consultant") {
        if (data.license_number) adminDataToSubmit.license_number = data.license_number;
        if (data.license_expire_date) adminDataToSubmit.license_expire_date = data.license_expire_date;
        if (data.specialization) adminDataToSubmit.specialization = data.specialization;
        if (data.agency_id) adminDataToSubmit.agency_id = data.agency_id;
        if (typeof data.is_verified === "boolean") adminDataToSubmit.is_verified = data.is_verified;
        if (typeof data.show_in_team === "boolean") adminDataToSubmit.show_in_team = data.show_in_team;
        if (typeof data.team_order === "number") adminDataToSubmit.team_order = Math.max(0, data.team_order);
        if (data.meta_title) adminDataToSubmit.meta_title = data.meta_title;
        if (data.meta_description) adminDataToSubmit.meta_description = data.meta_description;
        if (data.meta_keywords) adminDataToSubmit.meta_keywords = data.meta_keywords;
        if (data.og_title) adminDataToSubmit.og_title = data.og_title;
        if (data.og_description) adminDataToSubmit.og_description = data.og_description;
        if (data.og_image_id) adminDataToSubmit.og_image_id = data.og_image_id;
      }

      return adminApi.createAdmin(adminDataToSubmit as any);
    },
    onSuccess: () => {
      setFormAlert(null);
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      showSuccess(msg.crud("created", { item: "ادمین" }));
      navigate("/admins");
    },
    onError: (error: unknown) => {
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
          dedupeKey: "admins-create-validation-error",
        });

        const tabWithError = resolveCreateAdminErrorTab(mappedFieldKeys);
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
        dedupeKey: "admins-create-system-error",
      });
    },
  });

  const handleSubmit = async () => {
    setFormAlert(null);
    form.clearErrors();
    const isValid = await form.trigger();
    if (!isValid) {
      const tabWithError = resolveCreateAdminErrorTab(Object.keys(form.formState.errors));
      if (tabWithError) {
        setActiveTab(tabWithError);
      }
      return;
    }

    createAdminMutation.mutate(form.getValues());
  };

  const handleTabChange = (nextTab: string) => {
    if (nextTab === activeTab) {
      return;
    }

    setFormAlert(null);
    setActiveTab(nextTab);
  };

  const { tabs } = useCreateAdminPageTabs({
    form,
    editMode,
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

  return (
    <div className="space-y-4">
      {formAlert ? (
        <Alert variant="destructive" className="border-red-1/50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{formAlert}</AlertDescription>
        </Alert>
      ) : null}

      <TabbedPageLayout
        title="افزودن ادمین"
        description="ایجاد ادمین جدید در سیستم"
        showHeader={false}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        tabs={tabs}
        onSave={handleSubmit}
        isSaving={createAdminMutation.isPending}
        skeleton={<TabSkeleton />}
      />
    </div>
  );
}
