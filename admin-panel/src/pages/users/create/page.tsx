import { useState, lazy } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/api/admins/admins";
import { showSuccess, notifyApiError, extractFieldErrors } from '@/core/toast';
import { msg } from '@/core/messages';
import { userFormSchema, userFormDefaults, type UserFormValues } from "@/components/users/validations/userSchema";
import { ApiError } from "@/types/api/apiError";
import { AlertCircle, User, UserCircle } from "lucide-react";
import type { Media } from "@/types/shared/media";
import { TabbedPageLayout } from "@/components/templates/TabbedPageLayout";
import { Alert, AlertDescription } from "@/components/elements/Alert";

const BaseInfoTab = lazy(() => import("@/components/users/create/UserInfo"));
const ProfileTab = lazy(() => import("@/components/users/create/UserProfile"));

export default function CreateUserPage() {
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
            queryClient.invalidateQueries({ queryKey: ['users'] });
            showSuccess(msg.crud('created', { item: 'کاربر' }));
            navigate("/users");
        },
        onError: (error: unknown) => {
            setFormAlert(null);

            const fieldMap: Record<string, keyof UserFormValues> = {
                identifier: 'mobile',
                mobile: 'mobile',
                email: 'email',
                password: 'password',
                full_name: 'full_name',
                first_name: 'profile_first_name',
                last_name: 'profile_last_name',
                national_id: 'profile_national_id',
                phone: 'profile_phone',
                province_id: 'profile_province_id',
                city_id: 'profile_city_id',
            };

            const fieldErrors = extractFieldErrors(error);
            const nonFieldMessage = fieldErrors.non_field_errors;
            const { non_field_errors, ...fieldOnlyErrors } = fieldErrors;

            if (Object.keys(fieldOnlyErrors).length > 0) {
                Object.entries(fieldOnlyErrors).forEach(([field, message]) => {
                    const formField = fieldMap[field] || (field as keyof UserFormValues);
                    form.setError(formField, {
                        type: 'server',
                        message,
                    });
                });

                if (nonFieldMessage) {
                    setFormAlert(nonFieldMessage);
                }
                return;
            }

            if (nonFieldMessage) {
                if (nonFieldMessage.includes('موبایل') || nonFieldMessage.includes('شماره')) {
                    form.setError('mobile', {
                        type: 'server',
                        message: nonFieldMessage,
                    });
                    return;
                }

                if (nonFieldMessage.includes('ایمیل')) {
                    form.setError('email', {
                        type: 'server',
                        message: nonFieldMessage,
                    });
                    return;
                }

                setFormAlert(nonFieldMessage);
                return;
            }

            if (error instanceof ApiError) {
                const statusCode = error.response.AppStatusCode;

                const nonFieldErrors = error.response.errors?.non_field_errors;
                if (nonFieldErrors && nonFieldErrors.length > 0 && statusCode < 500) {
                    setFormAlert(nonFieldErrors[0]);
                    return;
                }

                if (statusCode < 500) {
                    setFormAlert(error.response.message || 'خطا در ایجاد کاربر');
                    return;
                }
            }

            notifyApiError(error, {
                fallbackMessage: 'خطای سیستمی در ایجاد کاربر',
                dedupeKey: 'users-create-system-error',
            });
        },
    });

    const handleSubmit = async () => {
        setFormAlert(null);
        const isValid = await form.trigger();
        if (!isValid) return;

        const data = form.getValues();
        createUserMutation.mutate(data);
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
                activeTab={activeTab}
                onTabChange={setActiveTab}
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
