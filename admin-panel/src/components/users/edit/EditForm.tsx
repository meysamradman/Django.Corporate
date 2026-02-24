import { useState, useEffect, lazy, Suspense } from "react";
import { notifyApiError, showSuccess } from "@/core/toast";
import type { UserWithProfile } from "@/types/auth/user";
import { User, KeyRound, AlertCircle, Share2 } from "lucide-react";
import { UserProfileHeader } from "@/components/users/profile/UserProfileHeader.tsx";
import { Skeleton } from "@/components/elements/Skeleton";
import { adminApi } from "@/api/admins/admins";
import { msg } from '@/core/messages';
import { ApiError } from "@/types/api/apiError";
import { Alert, AlertDescription } from "@/components/elements/Alert";
import { userEditSchema } from "@/components/users/validations/userEditSchema";
import { extractMappedUserFieldErrors, USER_EDIT_FIELD_MAP } from "@/components/users/validations/userApiError";
import type { SocialMediaItem } from "@/types/shared/socialMedia";
import { SocialMediaArrayEditor } from "@/components/shared/SocialMediaArrayEditor";
import { TabbedPageLayout } from "@/components/templates/TabbedPageLayout";

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

const USER_EDIT_TAB_BY_FIELD: Record<string, string> = {
    firstName: "account",
    lastName: "account",
    email: "account",
    mobile: "account",
    phone: "account",
    nationalId: "account",
    address: "account",
    province: "account",
    city: "account",
    bio: "account",
    birthDate: "account",
    social: "social",
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
    const [activeTab, setActiveTab] = useState("account");
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
    const [socialMediaItems, setSocialMediaItems] = useState<SocialMediaItem[]>(
        userData.profile?.social_media || []
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
            setSocialMediaItems(userData.profile?.social_media || []);
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

        const schemaResult = userEditSchema.safeParse(formData);
        if (!schemaResult.success) {
            const nextFieldErrors: Record<string, string> = {};
            schemaResult.error.issues.forEach((issue) => {
                const fieldKey = issue.path[0];
                if (typeof fieldKey === 'string' && !nextFieldErrors[fieldKey]) {
                    nextFieldErrors[fieldKey] = issue.message;
                }
            });
            setFieldErrors(nextFieldErrors);
            const tabWithError = resolveEditUserErrorTab(Object.keys(nextFieldErrors));
            if (tabWithError) {
                setActiveTab(tabWithError);
            }
            setFormAlert(msg.error('checkForm'));
            setIsSaving(false);
            return;
        }
        
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
                    social_media: socialMediaItems
                        .filter((item) => (item.name || '').trim() && (item.url || '').trim())
                        .map((item, index) => ({
                            id: item.id,
                            name: item.name,
                            url: item.url,
                            icon: item.icon ?? item.icon_data?.id ?? null,
                            order: item.order ?? index,
                        })),
                }
            };
            
            if (formData.email) {
                updateData.email = formData.email;
            }
            
                                    await adminApi.updateUserByType(userData.id, updateData, 'user');
                        showSuccess(msg.crud('updated', { item: 'پروفایل کاربر' }));
        } catch (error: unknown) {
                                    const { fieldErrors: newFieldErrors, nonFieldError: nonFieldMessage } = extractMappedUserFieldErrors(
                                        error,
                                        USER_EDIT_FIELD_MAP as unknown as Record<string, string>
                                    );

            if (Object.keys(newFieldErrors).length > 0) {
                setFieldErrors(newFieldErrors);
                const tabWithError = resolveEditUserErrorTab(Object.keys(newFieldErrors));
                if (tabWithError) {
                    setActiveTab(tabWithError);
                }

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
                    setFormAlert(error.response.message || msg.error('validation'));
                    return;
                }
            }

            notifyApiError(error, {
                fallbackMessage: msg.error('serverError'),
                dedupeKey: 'users-edit-system-error',
            });
        } finally {
            setIsSaving(false);
        }
    };
    
    const tabs = [
        {
            id: "account",
            label: "حساب کاربری",
            icon: <User className="w-4 h-4" />,
            content: (
                <AccountTab
                    user={userData}
                    formData={formData}
                    editMode={true}
                    setEditMode={() => {}}
                    handleInputChange={handleInputChange}
                    handleSaveProfile={handleSaveProfile}
                    isSaving={isSaving}
                    fieldErrors={fieldErrors}
                    onProvinceChange={handleProvinceChange}
                    onCityChange={handleCityChange}
                    userId={String(userData.id)}
                />
            ),
        },
        {
            id: "security",
            label: "گذرواژه",
            icon: <KeyRound className="w-4 h-4" />,
            content: <SecurityTab />,
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
    ];

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

            <Suspense fallback={<TabContentSkeleton />}>
                <TabbedPageLayout
                    title="ویرایش کاربر"
                    showHeader={false}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    tabs={tabs}
                    onSave={handleSaveProfile}
                    isSaving={isSaving}
                    saveLabel="ذخیره تغییرات"
                    skeleton={<TabContentSkeleton />}
                />
            </Suspense>
        </div>
    );
}
