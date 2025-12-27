import { useState, useEffect, lazy, Suspense } from "react";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { showSuccess, showError } from '@/core/toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/elements/Tabs";
import { Building2, ImageIcon, Settings2 } from "lucide-react";
import { Skeleton } from "@/components/elements/Skeleton";
import { realEstateApi } from "@/api/real-estate/properties";
import { msg } from '@/core/messages';
import { ApiError } from "@/types/api/apiError";
import { Button } from "@/components/elements/Button";
import { useNavigate } from "react-router-dom";
import { mediaService } from "@/components/media/services";
import type { Media } from "@/types/shared/media";
import * as z from "zod";

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

const agencySchema = z.object({
    name: z.string().min(1, "نام آژانس لازم است"),
    slug: z.string().optional().nullable(),
    phone: z.string().min(1, "شماره موبایل لازم است"),
    email: z.string().email("ایمیل معتبر وارد کنید").optional().or(z.literal("")),
    website: z.string().url("وب‌سایت معتبر وارد کنید").optional().or(z.literal("")),
    license_number: z.string().optional().nullable(),
    license_expire_date: z.string().optional().nullable(),
    city: z.number().int().optional().nullable(),
    province: z.number().int().optional().nullable(),
    description: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    is_active: z.boolean().optional(),
    is_verified: z.boolean().optional(),
    rating: z.number().min(0).max(5).optional(),
    total_reviews: z.number().min(0).optional(),
    meta_title: z.string().optional().nullable(),
    meta_description: z.string().optional().nullable(),
    og_title: z.string().optional().nullable(),
    og_description: z.string().optional().nullable(),
});

export type AgencyFormValues = z.infer<typeof agencySchema>;

interface EditAgencyFormProps {
    agencyId: string;
}

export function EditAgencyForm({ agencyId }: EditAgencyFormProps) {

    const [activeTab, setActiveTab] = useState("base-info");
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [editMode, setEditMode] = useState(false);
    const [selectedLogo, setSelectedLogo] = useState<Media | null>(null);
    const [selectedCoverImage, setSelectedCoverImage] = useState<Media | null>(null);
    const [isSaving, setIsSaving] = useState(false);

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

    const form = useForm<AgencyFormValues>({
        resolver: zodResolver(agencySchema) as any,
        defaultValues: {
            name: "",
            slug: "",
            phone: "",
            email: "",
            website: "",
            license_number: "",
            license_expire_date: "",
            city: null,
            province: null,
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
        },
        mode: "onSubmit",
    });

    useEffect(() => {
        if (!agencyData) return;

        form.reset({
            name: agencyData.name || "",
            slug: agencyData.slug || "",
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
        });

        setSelectedLogo(agencyData.logo || null);
        setSelectedCoverImage(agencyData.cover_image || null);
    }, [agencyData, form]);

    const handleSaveProfile = async () => {
        if (isSaving) return;

        const isValid = await form.trigger();
        if (!isValid) return;

        setIsSaving(true);

        try {
            const data = form.getValues();
            const profileData: Record<string, any> = {
                name: data.name,
                slug: data.slug || null,
                phone: data.phone,
                email: data.email || null,
                website: data.website || null,
                license_number: data.license_number || null,
                license_expire_date: data.license_expire_date || null,
                city: data.city || null,
                province: data.province || null,
                description: data.description || null,
                address: data.address || null,
                is_active: data.is_active,
                is_verified: data.is_verified,
                rating: data.rating || 0,
                total_reviews: data.total_reviews || 0,
                meta_title: data.meta_title || null,
                meta_description: data.meta_description || null,
                og_title: data.og_title || null,
                og_description: data.og_description || null,
            };

            // Backend will auto-regenerate slug from name if name changes
            // No need to send slug explicitly

            if (selectedLogo?.id) {
                profileData.logo_id = selectedLogo.id;
            } else if (selectedLogo === null) {
                profileData.logo_id = null;
            }

            if (selectedCoverImage?.id) {
                profileData.cover_image_id = selectedCoverImage.id;
            } else if (selectedCoverImage === null) {
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

                Object.entries(errorData).forEach(([field, message]) => {
                    form.setError(field as any, {
                        type: 'server',
                        message: message as string
                    });
                });

                showError("لطفاً خطاهای فرم را بررسی کنید");
            } else {
                const errorMessage = msg.error('serverError');
                showError(errorMessage);
            }
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
                                            onClick={() => setEditMode(false)}
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

                            {(agencyData.rating ?? 0) > 0 && (
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
                            form={form as any}
                            editMode={editMode}
                            agencyData={agencyData}
                        />
                    </Suspense>
                </TabsContent>

                <TabsContent value="media">
                    <Suspense fallback={<TabContentSkeleton />}>
                        <MediaTab
                            selectedLogo={selectedLogo}
                            setSelectedLogo={setSelectedLogo}
                            selectedCoverImage={selectedCoverImage}
                            setSelectedCoverImage={setSelectedCoverImage}
                            editMode={editMode}
                        />
                    </Suspense>
                </TabsContent>

                <TabsContent value="settings">
                    <Suspense fallback={<TabContentSkeleton />}>
                        <SettingsTab
                            form={form as any}
                            editMode={editMode}
                        />
                    </Suspense>
                </TabsContent>
            </Tabs>
        </div>
    );
}
