import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { showSuccess, showError } from '@/core/toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/elements/Tabs";
import { Building2, ImageIcon, Settings2 } from "lucide-react";
import { Skeleton } from "@/components/elements/Skeleton";
import { realEstateApi } from "@/api/real-estate/properties";
import { msg } from '@/core/messages';
import { useAuth } from "@/core/auth/AuthContext";
import { ApiError } from "@/types/api/apiError";
import { Button } from "@/components/elements/Button";
import { useNavigate } from "react-router-dom";
import { mediaService } from "@/components/media/services";
import type { Media } from "@/types/shared/media";

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

const BaseInfoTab = lazy(() => import("@/components/real-estate/agencies/edit/BaseInfoTab"));
const MediaTab = lazy(() => import("@/components/real-estate/agencies/edit/MediaTab"));
const SettingsTab = lazy(() => import("@/components/real-estate/agencies/edit/SettingsTab"));

interface EditAgencyFormProps {
    agencyId: string;
}

export function EditAgencyForm({ agencyId }: EditAgencyFormProps) {

    const [activeTab, setActiveTab] = useState("base-info");
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { user, refreshUser } = useAuth();

    const isNumericId = !Number.isNaN(Number(agencyId));
    const queryKey = ['agency', agencyId];

    const { data: agencyData, isLoading, error } = useQuery({
        queryKey,
        queryFn: () => {
            if (!isNumericId) {
                return Promise.reject(new Error("شناسه آژانس نامعتبر است"));
            }
            return realEstateApi.getAgencyById(Number(agencyId));
        },
        staleTime: 0,
        retry: (failureCount, requestError) => {
            if (requestError instanceof ApiError && requestError.response.AppStatusCode === 403) {
                return false;
            }
            return failureCount < 2;
        },
    });

    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        website: "",
        license_number: "",
        license_expire_date: "",
        city: null as number | null,
        province: null as number | null,
        description: "",
        address: "",
        is_active: true,
        is_verified: false,
        rating: 0,
        total_reviews: 0,
        meta_title: "",
        meta_description: "",
        og_title: "",
        og_description: "",
        logo: null as Media | null,
        cover_image: null as Media | null,
    });
    const [isSaving, setIsSaving] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const previousAgencyIdRef = useRef<number | undefined>(undefined);
    const previousEditModeRef = useRef<boolean>(false);

    useEffect(() => {
        if (!agencyData) return;

        const isFirstLoad = previousAgencyIdRef.current !== agencyData.id;
        const editModeChanged = previousEditModeRef.current && !editMode;

        if (isFirstLoad || editModeChanged) {
            setFormData(prev => {
                const currentLogoId = prev.logo?.id;
                const newLogoId = agencyData.logo?.id;
                const currentCoverId = prev.cover_image?.id;
                const newCoverId = agencyData.cover_image?.id;

                return {
                    name: agencyData.name || "",
                    phone: agencyData.phone || "",
                    email: agencyData.email || "",
                    website: agencyData.website || "",
                    license_number: agencyData.license_number || "",
                    license_expire_date: agencyData.license_expire_date || "",
                    city: agencyData.city || null,
                    province: agencyData.province || null,
                    description: agencyData.description || "",
                    address: agencyData.address || "",
                    is_active: agencyData.is_active ?? true,
                    is_verified: agencyData.is_verified ?? false,
                    rating: agencyData.rating || 0,
                    total_reviews: agencyData.total_reviews || 0,
                    meta_title: agencyData.meta_title || "",
                    meta_description: agencyData.meta_description || "",
                    og_title: agencyData.og_title || "",
                    og_description: agencyData.og_description || "",
                    logo: currentLogoId === newLogoId ? prev.logo : (agencyData.logo || null),
                    cover_image: currentCoverId === newCoverId ? prev.cover_image : (agencyData.cover_image || null),
                };
            });
            previousAgencyIdRef.current = agencyData.id;
        } else if (!editMode) {
            setFormData(prev => {
                const currentLogoId = prev.logo?.id;
                const newLogoId = agencyData.logo?.id;
                const currentCoverId = prev.cover_image?.id;
                const newCoverId = agencyData.cover_image?.id;
                const newLogoIsNull = !agencyData.logo;
                const currentLogoIsNull = !prev.logo;
                const newCoverIsNull = !agencyData.cover_image;
                const currentCoverIsNull = !prev.cover_image;

                let newData = { ...prev };

                if (currentLogoId !== newLogoId) {
                    newData.logo = agencyData.logo || null;
                }

                if (newLogoIsNull && !currentLogoIsNull) {
                    newData.logo = null;
                }

                if (currentCoverId !== newCoverId) {
                    newData.cover_image = agencyData.cover_image || null;
                }

                if (newCoverIsNull && !currentCoverIsNull) {
                    newData.cover_image = null;
                }

                return newData;
            });
        }

        previousEditModeRef.current = editMode;
    }, [agencyData, editMode]);

    const handleInputChange = (field: string, value: string | number | boolean | null | Media) => {
        if (field === "cancel") {
            setEditMode(false);
            return;
        }

        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        if (fieldErrors[field]) {
            setFieldErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleSaveProfile = async () => {
        if (isSaving) return;

        setIsSaving(true);
        setFieldErrors({});

        try {
            const profileData: Record<string, any> = {
                name: formData.name || null,
                phone: formData.phone || null,
                email: formData.email || null,
                website: formData.website || null,
                license_number: formData.license_number || null,
                license_expire_date: formData.license_expire_date || null,
                city: formData.city || null,
                province: formData.province || null,
                description: formData.description || null,
                address: formData.address || null,
                is_active: formData.is_active,
                is_verified: formData.is_verified,
                rating: formData.rating || 0,
                total_reviews: formData.total_reviews || 0,
                meta_title: formData.meta_title || null,
                meta_description: formData.meta_description || null,
                og_title: formData.og_title || null,
                og_description: formData.og_description || null,
            };

            if (formData.logo?.id) {
                profileData.logo_id = formData.logo.id;
            } else if (formData.logo === null) {
                profileData.logo_id = null;
            }

            if (formData.cover_image?.id) {
                profileData.cover_image_id = formData.cover_image.id;
            } else if (formData.cover_image === null) {
                profileData.cover_image_id = null;
            }

            if (!agencyData) {
                showError('اطلاعات آژانس یافت نشد');
                return;
            }

            await realEstateApi.updateAgency(agencyData.id, profileData);
            setEditMode(false);

            await queryClient.invalidateQueries({ queryKey: ['agency', agencyId] });
            await queryClient.refetchQueries({ queryKey: ['agency', agencyId] });

            await queryClient.invalidateQueries({ queryKey: ['agencies'] });

            showSuccess(msg.crud('updated', { item: 'آژانس' }));
        } catch (error: any) {
            if (error?.response?.errors) {
                const errorData = error.response.errors;
                const newFieldErrors: Record<string, string> = {};

                if (errorData.name) {
                    newFieldErrors.name = msg.validation('required', { field: 'نام آژانس' });
                }
                if (errorData.phone) {
                    newFieldErrors.phone = msg.validation('mobileInvalid');
                }
                if (errorData.email) {
                    newFieldErrors.email = msg.validation('emailInvalid');
                }
                if (errorData.license_number) {
                    newFieldErrors.license_number = msg.validation('required', { field: 'شماره پروانه' });
                }

                if (Object.keys(newFieldErrors).length > 0) {
                    setFieldErrors(newFieldErrors);
                    return;
                }
            }

            const errorMessage = msg.error('serverError');
            showError(errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    const handleGoToList = () => {
        navigate("/admins/agencies");
    };

    if (error) {
        const errorMessage =
            error instanceof ApiError
                ? error.response.message
                : error instanceof Error
                ? error.message
                : "خطا در دریافت اطلاعات آژانس";

        return (
            <div className="rounded-lg border p-6 text-center space-y-4">
                <p className="text-destructive">{errorMessage}</p>
                <Button onClick={handleGoToList}>بازگشت به لیست</Button>
            </div>
        );
    }

    if (isLoading || !agencyData) {
        return (
            <div className="space-y-6">
                <div className="rounded-lg border p-6">
                    <Skeleton className="h-32 w-full mb-4" />
                    <Skeleton className="h-8 w-1/3 mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                </div>
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <Skeleton className="h-10 w-32" />
                        <Skeleton className="h-10 w-32" />
                    </div>
                    <TabContentSkeleton />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Profile Header */}
            <div className="rounded-lg border p-6">
                <div className="flex items-start gap-6">
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {agencyData.logo ? (
                            <img
                                src={mediaService.getMediaUrlFromObject(agencyData.logo)}
                                alt={agencyData.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary/10">
                                <Building2 className="h-8 w-8 text-primary" />
                            </div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-foreground">{agencyData.name}</h1>
                                <p className="text-sm text-muted-foreground mt-1">
                                    آژانس املاک • ایجاد شده {new Date(agencyData.created_at).toLocaleDateString('fa-IR')}
                                </p>
                                {agencyData.city_name && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                        📍 {agencyData.city_name}
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-2">
                                {!editMode ? (
                                    <>
                                        <Button
                                            variant="outline"
                                            onClick={() => navigate(`/admins/agencies/${agencyId}/view`)}
                                        >
                                            مشاهده
                                        </Button>
                                        <Button
                                            onClick={() => setEditMode(true)}
                                        >
                                            ویرایش
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            variant="outline"
                                            onClick={() => handleInputChange("cancel", "")}
                                            disabled={isSaving}
                                        >
                                            انصراف
                                        </Button>
                                        <Button
                                            onClick={handleSaveProfile}
                                            disabled={isSaving}
                                        >
                                            {isSaving ? "در حال ذخیره..." : "ذخیره"}
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-4 mt-4">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${agencyData.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <span className="text-sm font-medium">
                                    {agencyData.is_active ? 'فعال' : 'غیرفعال'}
                                </span>
                            </div>

                            {agencyData.is_verified && (
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                    <span className="text-sm font-medium">تأیید شده</span>
                                </div>
                            )}

                            {agencyData.rating > 0 && (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm">⭐ {agencyData.rating}/5</span>
                                    <span className="text-sm text-muted-foreground">
                                        ({agencyData.total_reviews} نظر)
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList>
                    <TabsTrigger value="base-info">
                        <Building2 className="w-4 h-4" />
                        اطلاعات پایه
                    </TabsTrigger>
                    <TabsTrigger value="media">
                        <ImageIcon className="w-4 h-4" />
                        رسانه‌ها
                    </TabsTrigger>
                    <TabsTrigger value="settings">
                        <Settings2 className="w-4 h-4" />
                        تنظیمات پیشرفته
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="base-info">
                    <Suspense fallback={<TabContentSkeleton />}>
                        <BaseInfoTab
                            form={form}
                            editMode={editMode}
                            agencyData={agencyData}
                            fieldErrors={fieldErrors}
                            handleInputChange={handleInputChange}
                        />
                    </Suspense>
                </TabsContent>

                <TabsContent value="media">
                    <Suspense fallback={<TabContentSkeleton />}>
                        <MediaTab
                            selectedLogo={formData.logo}
                            setSelectedLogo={(media) => handleInputChange("logo", media)}
                            selectedCoverImage={formData.cover_image}
                            setSelectedCoverImage={(media) => handleInputChange("cover_image", media)}
                            editMode={editMode}
                        />
                    </Suspense>
                </TabsContent>

                <TabsContent value="settings">
                    <Suspense fallback={<TabContentSkeleton />}>
                        <SettingsTab
                            form={form}
                            editMode={editMode}
                            fieldErrors={fieldErrors}
                            handleInputChange={handleInputChange}
                        />
                    </Suspense>
                </TabsContent>
            </Tabs>
        </div>
    );
}
