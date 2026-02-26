import { useState, lazy } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { AlertCircle, User, UserCircle, Share2 } from "lucide-react";
import { adminApi } from "@/api/admins/admins";
import { TabbedPageLayout } from "@/components/templates/TabbedPageLayout";
import { Alert, AlertDescription } from "@/components/elements/Alert";
import { msg } from "@/core/messages";
import { validatePassword } from "@/core/validation";
import { extractFieldErrors, handleFormApiError, notifyApiError, showSuccess } from "@/core/toast";
import { ApiError } from "@/types/api/apiError";
import type { Media } from "@/types/shared/media";
import type { UserWithProfile } from "@/types/auth/user";
import type { SocialMediaItem } from "@/types/shared/socialMedia";
import { SocialMediaArrayEditor } from "@/components/shared/SocialMediaArrayEditor";
import { mapUserFieldErrorKey, USER_CREATE_FIELD_MAP } from "@/components/users/validations/userApiError";
import { userFormSchema, type UserFormValues } from "@/components/users/validations/userSchema";

const BaseInfoTab = lazy(() => import("@/components/users/create/UserInfo"));
const ProfileTab = lazy(() => import("@/components/users/create/UserProfile"));

const userEditFormSchema = userFormSchema.extend({
  password: z
    .string()
    .superRefine((val, ctx) => {
      if (!val || val.trim() === "") return;
      const result = validatePassword(val);
      if (!result.isValid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: result.error || msg.validation("passwordRequired"),
        });
      }
    })
    .optional()
    .or(z.literal("")),
});

type UserEditFormValues = z.input<typeof userEditFormSchema>;

const USER_EDIT_TAB_BY_FIELD: Record<string, string> = {
  mobile: "base-info",
  email: "base-info",
  password: "base-info",
  full_name: "base-info",
  profile_first_name: "profile",
  profile_last_name: "profile",
  profile_birth_date: "profile",
  profile_national_id: "profile",
  profile_phone: "profile",
  profile_province_id: "profile",
  profile_city_id: "profile",
  profile_address: "profile",
  profile_bio: "profile",
  profile_picture: "profile",
  social_media: "social",
  "profile.social_media": "social",
};

function resolveEditUserErrorTab(fieldKeys: Iterable<string>): string | null {
  for (const key of fieldKeys) {
    const tab = USER_EDIT_TAB_BY_FIELD[key];
    if (tab) return tab;
  }
  return null;
}

interface EditUserFormProps {
  userData: UserWithProfile;
}

export function EditUserForm({ userData }: EditUserFormProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("base-info");
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(userData.profile?.profile_picture || null);
  const [socialMediaItems, setSocialMediaItems] = useState<SocialMediaItem[]>(userData.profile?.social_media || []);
  const [formAlert, setFormAlert] = useState<string | null>(null);

  const form = useForm<UserEditFormValues>({
    resolver: zodResolver(userEditFormSchema),
    defaultValues: {
      mobile: userData.mobile || "",
      email: userData.email || "",
      password: "",
      full_name:
        userData.full_name ||
        [userData.profile?.first_name, userData.profile?.last_name].filter(Boolean).join(" ").trim(),
      profile_first_name: userData.profile?.first_name || "",
      profile_last_name: userData.profile?.last_name || "",
      profile_birth_date: userData.profile?.birth_date || "",
      profile_national_id: userData.profile?.national_id || "",
      profile_phone: userData.profile?.phone || "",
      profile_province_id: userData.profile?.province?.id || null,
      profile_city_id: userData.profile?.city?.id || null,
      profile_address: userData.profile?.address || "",
      profile_bio: userData.profile?.bio || "",
      profile_picture: userData.profile?.profile_picture || null,
      is_active: userData.is_active ?? true,
    } as UserEditFormValues,
    mode: "onSubmit",
  });
  const uiForm = form as unknown as UseFormReturn<UserFormValues>;

  const editUserMutation = useMutation({
    mutationFn: async (data: UserEditFormValues) => {
      const fullName = data.full_name.trim();
      const nameParts = fullName.split(/\s+/).filter(Boolean);
      const derivedFirstName = nameParts[0] || "";
      const derivedLastName = nameParts.slice(1).join(" ");

      const updatePayload: Record<string, unknown> = {
        mobile: data.mobile,
        is_active: data.is_active ?? true,
        profile: {
          first_name: data.profile_first_name || derivedFirstName,
          last_name: data.profile_last_name || derivedLastName || "",
          birth_date: data.profile_birth_date || null,
          national_id: data.profile_national_id || null,
          phone: data.profile_phone || null,
          province: data.profile_province_id || null,
          city: data.profile_city_id || null,
          address: data.profile_address || null,
          bio: data.profile_bio || null,
          profile_picture: selectedMedia?.id || null,
          social_media: socialMediaItems
            .filter((item) => (item.name || "").trim() && (item.url || "").trim())
            .map((item, index) => ({
              id: item.id,
              name: item.name,
              url: item.url,
              icon: item.icon ?? item.icon_data?.id ?? null,
              order: item.order ?? index,
            })),
        },
      };

      if (data.email) {
        updatePayload.email = data.email;
      }

      if (data.password && data.password.trim()) {
        updatePayload.password = data.password.trim();
      }

      return adminApi.updateUserByType(userData.id, updatePayload, "user");
    },
    onSuccess: async () => {
      setFormAlert(null);
      await queryClient.invalidateQueries({ queryKey: ["user", String(userData.id)] });
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      showSuccess(msg.crud("updated", { item: "پروفایل کاربر" }));
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

            const formField = mapUserFieldErrorKey(
              field,
              USER_CREATE_FIELD_MAP as unknown as Record<string, string>
            ) as keyof UserEditFormValues;

            mappedFieldKeys.push(String(formField));
            form.setError(formField, {
              type: "server",
              message,
            });
          },
          checkFormMessage: msg.error("checkForm"),
          showToastForFieldErrors: false,
          preferBackendMessage: false,
          dedupeKey: "users-edit-validation-error",
        });

        const tabWithError = resolveEditUserErrorTab(mappedFieldKeys);
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
        dedupeKey: "users-edit-system-error",
      });
    },
  });

  const handleSubmit = async () => {
    setFormAlert(null);
    form.clearErrors();
    const isValid = await form.trigger();
    if (!isValid) {
      const tabWithError = resolveEditUserErrorTab(Object.keys(form.formState.errors));
      if (tabWithError) {
        setActiveTab(tabWithError);
      }
      return;
    }
    editUserMutation.mutate(form.getValues());
  };

  const handleTabChange = (nextTab: string) => {
    if (nextTab === activeTab) return;
    setFormAlert(null);
    setActiveTab(nextTab);
  };

  return (
    <div className="space-y-4">
      {formAlert ? (
        <Alert variant="destructive" className="border-red-1/50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{formAlert}</AlertDescription>
        </Alert>
      ) : null}

      <TabbedPageLayout
        title="ویرایش کاربر"
        description="مدیریت اطلاعات کاربر"
        showHeader={false}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onSave={handleSubmit}
        isSaving={editUserMutation.isPending}
        saveLabel="ذخیره تغییرات"
        tabs={[
          {
            id: "base-info",
            label: "اطلاعات پایه",
            icon: <User className="w-4 h-4" />,
            content: <BaseInfoTab form={uiForm} editMode={true} />,
          },
          {
            id: "profile",
            label: "پروفایل",
            icon: <UserCircle className="w-4 h-4" />,
            content: (
              <ProfileTab
                form={uiForm}
                selectedMedia={selectedMedia}
                setSelectedMedia={setSelectedMedia}
                editMode={true}
              />
            ),
          },
          {
            id: "social",
            label: "شبکه‌های اجتماعی",
            icon: <Share2 className="w-4 h-4" />,
            content: (
              <div className="rounded-lg border p-6">
                <SocialMediaArrayEditor
                  items={socialMediaItems}
                  onChange={setSocialMediaItems}
                  canEdit={true}
                />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
