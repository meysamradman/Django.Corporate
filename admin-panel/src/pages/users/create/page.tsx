import { useState, lazy } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/api/admins/admins";
import { extractFieldErrors, hasFieldErrors } from '@/core/toast';
import { showSuccess, showError } from '@/core/toast';
import { msg } from '@/core/messages';
import { userFormSchema, userFormDefaults, type UserFormValues } from "@/components/users/validations/userSchema";
import { User, UserCircle } from "lucide-react";
import type { Media } from "@/types/shared/media";
import { TabbedPageLayout } from "@/components/templates/TabbedPageLayout";

const BaseInfoTab = lazy(() => import("@/components/users/create/UserInfo"));
const ProfileTab = lazy(() => import("@/components/users/create/UserProfile"));

export default function CreateUserPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<string>("base-info");
    const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);

    const form = useForm<UserFormValues>({
        resolver: zodResolver(userFormSchema),
        defaultValues: userFormDefaults,
        mode: "onSubmit",
    });

    const createUserMutation = useMutation({
        mutationFn: async (data: UserFormValues) => {
            const userDataToSubmit: Record<string, unknown> = {
                identifier: data.mobile,
                full_name: data.full_name,
                password: data.password,
                is_active: data.is_active ?? true,
                is_staff: false,
                is_superuser: false,
                user_type: 'regular',
            };

            if (data.email) {
                userDataToSubmit.email = data.email;
            }

            const profileData: Record<string, any> = {};

            if (data.profile_first_name) profileData.first_name = data.profile_first_name;
            if (data.profile_last_name) profileData.last_name = data.profile_last_name;
            if (data.profile_birth_date) profileData.birth_date = data.profile_birth_date;
            if (data.profile_national_id) profileData.national_id = data.profile_national_id;
            if (data.profile_phone) profileData.phone = data.profile_phone;
            if (data.profile_province_id) profileData.province = data.profile_province_id;
            if (data.profile_city_id) profileData.city = data.profile_city_id;
            if (data.profile_address) profileData.address = data.profile_address;
            if (data.profile_bio) profileData.bio = data.profile_bio;

            if (selectedMedia?.id) {
                profileData.profile_picture = selectedMedia.id;
            }

            if (Object.keys(profileData).length > 0) {
                userDataToSubmit.profile = profileData;
            }

            return await adminApi.createUser(userDataToSubmit);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            showSuccess(msg.crud('created', { item: 'کاربر' }));
            navigate("/users");
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
                    form.setError(formField as keyof UserFormValues, {
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

    const handleSubmit = async () => {
        const isValid = await form.trigger();
        if (!isValid) return;

        const data = form.getValues();
        createUserMutation.mutate(data);
    };

    return (
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
    );
}
