import { useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/api/admins/admins";
import { extractFieldErrors, hasFieldErrors } from '@/core/toast';
import { showSuccess, showError } from '@/core/toast';
import { getCrud } from '@/core/messages';
import { userFormSchema, userFormDefaults, type UserFormValues } from "@/components/users/validations/userSchema";
import { Button } from "@/components/elements/Button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/elements/Tabs";
import { Skeleton } from "@/components/elements/Skeleton";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Loader2, Save, User, UserCircle } from "lucide-react";
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

const BaseInfoTab = lazy(() => import("@/components/users/create/BaseInfoTab"));
const ProfileTab = lazy(() => import("@/components/users/create/ProfileTab"));

export default function CreateUserPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<string>("base-info");
    const [editMode] = useState(true);
    const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);

    const form = useForm<UserFormValues>({
        resolver: zodResolver(userFormSchema) as any,
        defaultValues: userFormDefaults as any,
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

            if (data.profile_first_name) {
                userDataToSubmit.first_name = data.profile_first_name;
            }
            
            if (data.profile_last_name) {
                userDataToSubmit.last_name = data.profile_last_name;
            }
            
            if (data.profile_birth_date) {
                userDataToSubmit.birth_date = data.profile_birth_date;
            }
            
            if (data.profile_national_id) {
                userDataToSubmit.national_id = data.profile_national_id;
            }
            
            if (data.profile_phone) {
                userDataToSubmit.phone = data.profile_phone;
            }
            
            if (data.profile_province_id) {
                userDataToSubmit.province_id = data.profile_province_id;
            }
            
            if (data.profile_city_id) {
                userDataToSubmit.city_id = data.profile_city_id;
            }
            
            if (data.profile_address) {
                userDataToSubmit.address = data.profile_address;
            }
            
            if (data.profile_bio) {
                userDataToSubmit.bio = data.profile_bio;
            }

            if (selectedMedia?.id) {
                userDataToSubmit.profile_picture_id = selectedMedia.id;
            }

            return await adminApi.createUser(userDataToSubmit);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            showSuccess(getCrud('created', { item: 'کاربر' }));
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

    const handleSubmit = async () => {
        const isValid = await form.trigger();
        if (!isValid) return;
        
        const data = form.getValues();
        createUserMutation.mutate(data);
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
            </Tabs>

            {editMode && (
                <div className="fixed bottom-0 left-0 right-0 lg:right-[20rem] z-50 border-t border-br bg-card shadow-lg transition-all duration-300 flex items-center justify-end gap-3 py-4 px-8">
                    <Button 
                        onClick={handleSubmit} 
                        size="lg"
                        disabled={createUserMutation.isPending}
                    >
                        {createUserMutation.isPending ? (
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