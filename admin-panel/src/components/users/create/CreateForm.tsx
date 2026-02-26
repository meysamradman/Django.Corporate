import { useState, lazy } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/api/admins/admins";
import { showSuccess, notifyApiError, extractFieldErrors, handleFormApiError } from "@/core/toast";
import { msg } from "@/core/messages";
import { userFormSchema, userFormDefaults, type UserFormValues } from "@/components/users/validations/userSchema";
import { USER_CREATE_FIELD_MAP, mapUserFieldErrorKey } from "@/components/users/validations/userApiError";
import { ApiError } from "@/types/api/apiError";
import { AlertCircle, User, UserCircle } from "lucide-react";
import type { Media } from "@/types/shared/media";
import { TabbedPageLayout } from "@/components/templates/TabbedPageLayout";
import { Alert, AlertDescription } from "@/components/elements/Alert";

const BaseInfoTab = lazy(() => import("@/components/users/create/UserInfo"));
const ProfileTab = lazy(() => import("@/components/users/create/UserProfile"));

const USER_CREATE_TAB_BY_FIELD: Record<string, string> = {
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
};

function resolveCreateUserErrorTab(fieldKeys: Iterable<string>): string | null {
    for (const key of fieldKeys) {
        const tab = USER_CREATE_TAB_BY_FIELD[key];
        if (tab) return tab;
    }
    return null;
}

export function CreateUserForm() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<string>("base-info");
    const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
    const [formAlert, setFormAlert] = useState<string | null>(null);

    const form = useForm<UserFormValues>({
        resolver: zodResolver(userFormSchema),
        defaultValues: userFormDefaults,
        mode: "onSubmit",
    });

    const createUserMutation = useMutation({
        mutationFn: async (data: UserFormValues) => {
            const fullName = data.full_name.trim();
            const nameParts = fullName.split(/\s+/).filter(Boolean);
            const derivedFirstName = nameParts[0] || "";
            const derivedLastName = nameParts.slice(1).join(" ");

            const userDataToSubmit: Record<string, unknown> = {
                identifier: data.mobile,
                password: data.password,
                is_active: data.is_active ?? true,
            };

            if (data.email) {
                userDataToSubmit.email = data.email;
            }

            userDataToSubmit.first_name = data.profile_first_name || derivedFirstName;
            userDataToSubmit.last_name = data.profile_last_name || derivedLastName || "";

            if (data.profile_birth_date) userDataToSubmit.birth_date = data.profile_birth_date;
            if (data.profile_national_id) userDataToSubmit.national_id = data.profile_national_id;
            if (data.profile_phone) userDataToSubmit.phone = data.profile_phone;
            if (data.profile_province_id) userDataToSubmit.province_id = data.profile_province_id;
            if (data.profile_city_id) userDataToSubmit.city_id = data.profile_city_id;
            if (data.profile_address) userDataToSubmit.address = data.profile_address;
            if (data.profile_bio) userDataToSubmit.bio = data.profile_bio;
            if (selectedMedia?.id) userDataToSubmit.profile_picture_id = selectedMedia.id;

            return await adminApi.createUser(userDataToSubmit);
        },
        onSuccess: () => {
            setFormAlert(null);
            queryClient.invalidateQueries({ queryKey: ["users"] });
            showSuccess(msg.crud("created", { item: "کاربر" }));
            navigate("/users");
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

                        const formField = mapUserFieldErrorKey(field, USER_CREATE_FIELD_MAP as unknown as Record<string, string>) as keyof UserFormValues;
                        mappedFieldKeys.push(String(formField));
                        form.setError(formField, {
                            type: "server",
                            message,
                        });
                    },
                    checkFormMessage: msg.error("checkForm"),
                    showToastForFieldErrors: false,
                    preferBackendMessage: false,
                    dedupeKey: "users-create-validation-error",
                });

                const tabWithError = resolveCreateUserErrorTab(mappedFieldKeys);
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
                dedupeKey: "users-create-system-error",
            });
        },
    });

    const handleSubmit = async () => {
        setFormAlert(null);
        form.clearErrors();
        const isValid = await form.trigger();
        if (!isValid) {
            const tabWithError = resolveCreateUserErrorTab(Object.keys(form.formState.errors));
            if (tabWithError) {
                setActiveTab(tabWithError);
            }
            return;
        }

        const data = form.getValues();
        createUserMutation.mutate(data);
    };

    const handleTabChange = (nextTab: string) => {
        if (nextTab === activeTab) {
            return;
        }
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
                title="افزودن کاربر"
                description="ایجاد کاربر جدید در سیستم"
                showHeader={false}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                onSave={handleSubmit}
                isSaving={createUserMutation.isPending}
                tabs={[
                    {
                        id: "base-info",
                        label: "اطلاعات پایه",
                        icon: <User className="w-4 h-4" />,
                        content: (
                            <BaseInfoTab
                                form={form}
                                editMode={true}
                            />
                        ),
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
                                editMode={true}
                            />
                        ),
                    },
                ]}
            />
        </div>
    );
}
