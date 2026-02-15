import { useState, useEffect, lazy, Suspense } from "react";
import { extractFieldErrors, notifyApiError, showSuccess } from "@/core/toast";
import type { UserWithProfile } from "@/types/auth/user";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/elements/Tabs";
import { User, KeyRound, AlertCircle } from "lucide-react";
import { UserProfileHeader } from "@/components/users/profile/UserProfileHeader.tsx";
import { Skeleton } from "@/components/elements/Skeleton";
import { adminApi } from "@/api/admins/admins";
import { msg } from '@/core/messages';
import { ApiError } from "@/types/api/apiError";
import { Alert, AlertDescription } from "@/components/elements/Alert";

const TabContentSkeleton = () => (
    <div className="mt-6 space-y-6">
        <div className="space-y-4 rounded-lg border p-6">
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="space-y-4 rounded-lg border p-6">
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
        </div>
    </div>
);

const AccountTab = lazy(() => import("@/components/users/profile/UserAccount.tsx").then((mod) => ({ default: mod.UserAccount })));
const SecurityTab = lazy(() => import("@/components/users/profile/UserSecurity.tsx").then((mod) => ({ default: mod.UserSecurity })));

interface EditUserFormProps {
    userData: UserWithProfile;
}

export function EditUserForm({ userData }: EditUserFormProps) {
    const [activeTab, setActiveTab] = useState("account");
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        firstName: userData.profile?.first_name || "",
        lastName: userData.profile?.last_name || "",
        email: userData.email || "",
        mobile: userData.mobile || "",
        phone: userData.profile?.phone || "",
        nationalId: userData.profile?.national_id || "",
        address: userData.profile?.address || "",
        province: userData.profile?.province?.name || "",
        city: userData.profile?.city?.name || "",
        bio: userData.profile?.bio || "",
        profileImage: userData.profile?.profile_picture || null,
        birthDate: userData.profile?.birth_date || "",
    });
    const [isSaving, setIsSaving] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [formAlert, setFormAlert] = useState<string | null>(null);
    const [selectedProvinceId, setSelectedProvinceId] = useState<number | null>(
        userData.profile?.province?.id || null
    );
    const [selectedCityId, setSelectedCityId] = useState<number | null>(
        userData.profile?.city?.id || null
    );

    useEffect(() => {
        if (userData) {
            setFormData({
                firstName: userData.profile?.first_name || "",
                lastName: userData.profile?.last_name || "",
                email: userData.email || "",
                mobile: userData.mobile || "",
                phone: userData.profile?.phone || "",
                nationalId: userData.profile?.national_id || "",
                address: userData.profile?.address || "",
                province: userData.profile?.province?.name || "",
                city: userData.profile?.city?.name || "",
                bio: userData.profile?.bio || "",
                profileImage: userData.profile?.profile_picture || null,
                birthDate: userData.profile?.birth_date || "",
            });
            setSelectedProvinceId(userData.profile?.province?.id || null);
            setSelectedCityId(userData.profile?.city?.id || null);
        }
    }, [userData?.id]);

    useEffect(() => {
        if (!userData) return;
        
        if (userData.profile?.profile_picture?.id !== formData.profileImage?.id) {
            setFormData(prev => ({
                ...prev,
                profileImage: userData.profile?.profile_picture || null
            }));
                    }
    }, [userData?.profile?.profile_picture?.id]);

    const handleInputChange = (field: string, value: string | any) => {
        if (field === "cancel") {
            setEditMode(false);
            return;
        }
        setFormData(prev => ({ ...prev, [field]: value }));
        
        if (fieldErrors[field]) {
            setFieldErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleProvinceChange = (provinceName: string, provinceId: number) => {
        handleInputChange("province", provinceName);
        handleInputChange("city", "");
        setSelectedProvinceId(provinceId);
        setSelectedCityId(null);
    };

    const handleCityChange = (cityName: string, cityId: number) => {
        handleInputChange("city", cityName);
        setSelectedCityId(cityId);
    };

    const handleSaveProfile = async () => {
        if (isSaving) return;
        
        setIsSaving(true);
        setFieldErrors({});
        setFormAlert(null);
        
        try {
            const updateData: Record<string, any> = {
                mobile: formData.mobile,
                profile: {
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    birth_date: formData.birthDate || null,
                    national_id: formData.nationalId || null,
                    phone: formData.phone || null,
                    address: formData.address || null,
                    bio: formData.bio || null,
                    profile_picture: formData.profileImage?.id || null,
                    province: selectedProvinceId,
                    city: selectedCityId,
                }
            };
            
            if (formData.email) {
                updateData.email = formData.email;
            }
            
                                    await adminApi.updateUserByType(userData.id, updateData, 'user');
                        showSuccess(msg.crud('updated', { item: 'پروفایل کاربر' }));
            setEditMode(false);
        } catch (error: unknown) {
            const extractedFieldErrors = extractFieldErrors(error);
            const nonFieldMessage = extractedFieldErrors.non_field_errors;
            const { non_field_errors, ...fieldOnlyErrors } = extractedFieldErrors;

            const fieldMap: Record<string, string> = {
                mobile: 'mobile',
                email: 'email',
                first_name: 'firstName',
                last_name: 'lastName',
                national_id: 'nationalId',
                phone: 'phone',
                province_id: 'province',
                city_id: 'city',
                address: 'address',
                bio: 'bio',
                birth_date: 'birthDate',
            };

            const newFieldErrors: Record<string, string> = {};
            Object.entries(fieldOnlyErrors).forEach(([key, message]) => {
                const normalizedKey = key.startsWith('profile.') ? key.replace('profile.', '') : key;
                const mappedKey = fieldMap[normalizedKey] || normalizedKey;
                newFieldErrors[mappedKey] = message;
            });

            if (Object.keys(newFieldErrors).length > 0) {
                setFieldErrors(newFieldErrors);

                if (nonFieldMessage) {
                    setFormAlert(nonFieldMessage);
                }
                return;
            }

            if (nonFieldMessage) {
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
                    setFormAlert(error.response.message || 'خطا در به‌روزرسانی پروفایل');
                    return;
                }
            }

            notifyApiError(error, {
                fallbackMessage: 'خطای سیستمی در به‌روزرسانی پروفایل',
                dedupeKey: 'users-edit-system-error',
            });
        } finally {
            setIsSaving(false);
        }
    };
    
    return (
        <div className="space-y-6">
            {formAlert ? (
                <Alert variant="destructive" className="border-red-1/50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{formAlert}</AlertDescription>
                </Alert>
            ) : null}

            <UserProfileHeader
                user={userData} 
                formData={formData}
                onProfileImageChange={(media) => handleInputChange("profileImage", media)}
            />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList>
                    <TabsTrigger value="account">
                        <User className="w-4 h-4" />
                        حساب کاربری
                    </TabsTrigger>
                    <TabsTrigger value="security">
                        <KeyRound className="w-4 h-4" />
                        گذرواژه
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="account">
                    <Suspense fallback={<TabContentSkeleton />}>
                        <AccountTab
                            user={userData}
                            formData={formData}
                            editMode={editMode}
                            setEditMode={setEditMode}
                            handleInputChange={handleInputChange}
                            handleSaveProfile={handleSaveProfile}
                            isSaving={isSaving}
                            fieldErrors={fieldErrors}
                            onProvinceChange={handleProvinceChange}
                            onCityChange={handleCityChange}
                            userId={String(userData.id)}
                        />
                    </Suspense>
                </TabsContent>

                <TabsContent value="security">
                    <Suspense fallback={<TabContentSkeleton />}>
                        <SecurityTab />
                    </Suspense>
                </TabsContent>
            </Tabs>
        </div>
    );
}