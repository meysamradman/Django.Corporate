import { useState, useEffect, lazy, Suspense } from "react";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from "react-hook-form";
import { useFormState } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { notifyApiError, showSuccess } from '@/core/toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/elements/Tabs";
import { AlertCircle, Building2, Search, Loader2, Save, Share2, UserCircle, Mail, Phone, MapPin, Clock, Star, CheckCircle2, XCircle } from "lucide-react";
import { Skeleton } from "@/components/elements/Skeleton";
import { realEstateApi } from "@/api/real-estate";
import { msg } from '@/core/messages';
import { ApiError } from "@/types/api/apiError";
import { Button } from "@/components/elements/Button";
import { useNavigate } from "react-router-dom";
import type { Media } from "@/types/shared/media";
import { MediaLibraryModal } from "@/components/media/modals/MediaLibraryModal";
import { generateSlug, formatSlug } from '@/core/slug/generate';
import { agencyFormSchema, agencyFormDefaults, type AgencyFormValues } from '@/components/real-estate/validations/agencySchema';
import { AGENCY_FIELD_MAP, extractMappedAgencyFieldErrors } from '@/components/real-estate/validations/agencyApiError';
import { Alert, AlertDescription } from "@/components/elements/Alert";
import type { SocialMediaItem } from "@/types/shared/socialMedia";
import { SocialMediaArrayEditor } from "@/components/shared/SocialMediaArrayEditor";
import { AgencyProfileHeader } from "@/components/real-estate/agencies/profile/AgencyProfileHeader";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Switch } from "@/components/elements/Switch";
import { Item, ItemContent, ItemTitle, ItemDescription, ItemActions } from "@/components/elements/Item";

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

const BaseInfoTab = lazy(() => import("@/components/real-estate/agencies/edit/AgencyInfo"));
const ProfileTab = lazy(() => import("@/components/real-estate/agencies/create/AgencyProfile"));
const SEOTab = lazy(() => import("@/components/real-estate/agencies/edit/AgencySEO"));

interface EditAgencyFormProps {
    agencyId: string;
}

export function EditAgencyForm({ agencyId }: EditAgencyFormProps) {
    const toNumberOrZero = (value: unknown): number => {
        if (typeof value === 'number' && Number.isFinite(value)) return value;
        if (typeof value === 'string') {
            const parsed = Number(value);
            if (Number.isFinite(parsed)) return parsed;
        }
        return 0;
    };

    const [activeTab, setActiveTab] = useState("account");
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [editMode] = useState(true);
    const [selectedProfilePicture, setSelectedProfilePicture] = useState<Media | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
    const [formAlert, setFormAlert] = useState<string | null>(null);
    const [socialMediaItems, setSocialMediaItems] = useState<SocialMediaItem[]>([]);

    const AGENCY_EDIT_TAB_BY_FIELD: Record<string, string> = {
        name: 'account',
        slug: 'account',
        phone: 'account',
        email: 'account',
        website: 'account',
        license_number: 'account',
        license_expire_date: 'account',
        city: 'profile',
        province: 'profile',
        description: 'profile',
        address: 'profile',
        is_active: 'profile',
        rating: 'profile',
        total_reviews: 'profile',
        profile_picture: 'profile',
        meta_title: 'seo',
        meta_description: 'seo',
        og_title: 'seo',
        og_description: 'seo',
        canonical_url: 'seo',
        robots_meta: 'seo',
        social_media: 'social',
        'social_media.name': 'social',
        'social_media.url': 'social',
        'social_media.order': 'social',
    };

    const resolveAgencyEditErrorTab = (fieldKeys: Iterable<string>): string | null => {
        for (const key of fieldKeys) {
            const tab = AGENCY_EDIT_TAB_BY_FIELD[key];
            if (tab) return tab;
        }
        return null;
    };

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
        resolver: zodResolver(agencyFormSchema),
        defaultValues: agencyFormDefaults,
        mode: "onSubmit",
    });

    useFormState({ control: form.control });

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
            rating: toNumberOrZero(agencyData.rating),
            total_reviews: toNumberOrZero(agencyData.total_reviews),
            meta_title: agencyData.meta_title || "",
            meta_description: agencyData.meta_description || "",
            og_title: agencyData.og_title || "",
            og_description: agencyData.og_description || "",
            canonical_url: agencyData.canonical_url || "",
            robots_meta: agencyData.robots_meta || "",
        });

        setSelectedProfilePicture((agencyData as any).profile_picture || (agencyData as any).logo || null);
        setSocialMediaItems((agencyData as any).social_media || []);
    }, [agencyData, form]);

    const handleInputChange = (field: string, value: string | boolean | number | null) => {
        if (field === "name" && typeof value === "string") {
            const generatedSlug = generateSlug(value);
            form.setValue("slug", generatedSlug);
        } else if (field === "slug" && typeof value === "string") {
            const formattedSlug = formatSlug(value);
            form.setValue("slug", formattedSlug);
        } else {
            form.setValue(field as keyof AgencyFormValues, value);
        }
    };

    const handleImageSelect = (media: Media | Media[] | null) => {
        const selected = Array.isArray(media) ? media[0] || null : media;
        setSelectedProfilePicture(selected);
        setIsMediaModalOpen(false);
    };

    const handleSave = async () => {
        if (isSaving) return;

        setFormAlert(null);
        form.clearErrors();
        const isValid = await form.trigger();
        if (!isValid) {
            const tabWithError = resolveAgencyEditErrorTab(Object.keys(form.formState.errors));
            if (tabWithError) {
                setActiveTab(tabWithError);
            }
            setFormAlert(msg.error('checkForm'));
            return;
        }

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
                rating: toNumberOrZero(data.rating),
                total_reviews: toNumberOrZero(data.total_reviews),
                meta_title: data.meta_title || null,
                meta_description: data.meta_description || null,
                og_title: data.og_title || null,
                og_description: data.og_description || null,
                canonical_url: data.canonical_url || null,
                robots_meta: data.robots_meta || null,
                social_media: socialMediaItems
                    .filter((item) => (item.name || '').trim() && (item.url || '').trim())
                    .map((item, index) => ({
                        id: item.id,
                        name: item.name,
                        url: item.url,
                        icon: item.icon ?? item.icon_data?.id ?? null,
                        order: item.order ?? index,
                    })),
            };

            if (selectedProfilePicture?.id) {
                profileData.profile_picture = selectedProfilePicture.id;
            } else if (selectedProfilePicture === null) {
                profileData.profile_picture = null;
            }

            if (!agencyData) {
                setFormAlert('اطلاعات آژانس یافت نشد');
                return;
            }

            await realEstateApi.updateAgency(agencyData.id, profileData);

            await queryClient.invalidateQueries({ queryKey: ['agency', agencyId] });
            await queryClient.refetchQueries({ queryKey: ['agency', agencyId] });
            await queryClient.invalidateQueries({ queryKey: ['agencies'] });

            showSuccess(msg.crud('updated', { item: 'آژانس' }));
            navigate("/admins/agencies");
        } catch (error: unknown) {
            const { fieldErrors, nonFieldError } = extractMappedAgencyFieldErrors(
                error,
                AGENCY_FIELD_MAP as unknown as Record<string, string>
            );

            if (Object.keys(fieldErrors).length > 0) {
                Object.entries(fieldErrors).forEach(([field, message]) => {
                    form.setError(field as keyof AgencyFormValues, {
                        type: 'server',
                        message,
                    });
                });

                const tabWithError = resolveAgencyEditErrorTab(Object.keys(fieldErrors));
                if (tabWithError) {
                    setActiveTab(tabWithError);
                }

                if (nonFieldError) {
                    setFormAlert(nonFieldError);
                }
                return;
            }

            if (nonFieldError) {
                setFormAlert(nonFieldError);
                return;
            }

            if (error instanceof ApiError && error.response.AppStatusCode < 500) {
                setFormAlert(error.response.message || msg.error('validation'));
                return;
            }

            notifyApiError(error, {
                fallbackMessage: msg.error('serverError'),
                preferBackendMessage: false,
                dedupeKey: 'agencies-edit-system-error',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleGoToList = () => {
        navigate("/admins/agencies");
    };

    const handleTabChange = (nextTab: string) => {
        if (nextTab === activeTab) {
            return;
        }

        setFormAlert(null);
        setActiveTab(nextTab);
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

    const currentName = form.watch("name") || agencyData.name || "وارد نشده";
    const currentPhone = form.watch("phone") || agencyData.phone || "وارد نشده";
    const currentEmail = form.watch("email") || agencyData.email || "وارد نشده";
    const currentCity = agencyData.city_name || "وارد نشده";
    const currentRating = String(form.watch("rating") ?? agencyData.rating ?? "-");
    const currentIsActive = (form.watch("is_active") ?? agencyData.is_active) === true;

    return (
        <>
            {formAlert ? (
                <Alert variant="destructive" className="border-red-1/50 mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{formAlert}</AlertDescription>
                </Alert>
            ) : null}

            <AgencyProfileHeader
                agency={agencyData}
                selectedLogo={selectedProfilePicture}
                onLogoChange={setSelectedProfilePicture}
                agencyId={agencyId}
            />

            <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
                <div className="lg:col-span-2 space-y-6 lg:sticky lg:top-6 h-fit transition-all duration-300">
                    <CardWithIcon
                        icon={Building2}
                        title="اطلاعات آژانس"
                        iconBgColor="bg-blue"
                        iconColor="stroke-blue-2"
                        cardBorderColor="border-b-blue-1"
                        className="border-0 shadow-md hover:shadow-xl transition-all duration-300 relative overflow-hidden bg-linear-to-br from-card via-card to-muted/30 before:absolute before:right-0 before:top-0 before:h-full before:w-1 before:bg-linear-to-b before:from-blue-1 before:via-blue-1 before:to-blue-1"
                        contentClassName="pt-4 pb-4"
                    >
                        <div className="space-y-5">
                            <div className="space-y-0 [&>div:not(:last-child)]:border-b">
                                <div className="flex items-center justify-between gap-3 py-3">
                                    <div className="flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-font-s shrink-0" />
                                        <label>نام آژانس:</label>
                                    </div>
                                    <div className="flex-1 ms-2 text-left min-w-0 overflow-hidden">
                                        <span className="text-font-p">{currentName}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between gap-3 py-3">
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-font-s shrink-0" />
                                        <label>تلفن:</label>
                                    </div>
                                    <p className="text-font-p text-left">{currentPhone}</p>
                                </div>

                                <div className="flex items-center justify-between gap-3 py-3">
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-font-s shrink-0" />
                                        <label>ایمیل:</label>
                                    </div>
                                    <div className="flex-1 ms-2 text-left min-w-0 overflow-hidden">
                                        <span className="text-font-p break-all">{currentEmail}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between gap-3 py-3">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-font-s shrink-0" />
                                        <label>شهر:</label>
                                    </div>
                                    <p className="text-font-p text-left">{currentCity}</p>
                                </div>

                                <div className="flex items-center justify-between gap-3 py-3">
                                    <div className="flex items-center gap-2">
                                        <Star className="w-4 h-4 text-font-s shrink-0" />
                                        <label>رتبه:</label>
                                    </div>
                                    <p className="text-font-p text-left">{currentRating}</p>
                                </div>

                                {agencyData.created_at ? (
                                    <div className="flex items-center justify-between gap-3 py-3">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-font-s shrink-0" />
                                            <label>تاریخ ایجاد:</label>
                                        </div>
                                        <p className="text-font-p text-left">{new Date(agencyData.created_at).toLocaleDateString("fa-IR")}</p>
                                    </div>
                                ) : null}

                                <div className="py-4 space-y-3">
                                    <div className="rounded-xl border border-green-1/40 bg-green-0/30 hover:border-green-1/60 transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md">
                                        <Item variant="default" size="default" className="py-3">
                                            <ItemContent>
                                                <ItemTitle className="text-green-2 text-sm font-bold">وضعیت فعال</ItemTitle>
                                                <ItemDescription className="text-xs">نمایش آژانس در لیست و امکان استفاده.</ItemDescription>
                                            </ItemContent>
                                            <ItemActions>
                                                <Switch
                                                    checked={currentIsActive}
                                                    onCheckedChange={(checked) => handleInputChange("is_active", checked)}
                                                    disabled={isSaving}
                                                />
                                            </ItemActions>
                                        </Item>
                                    </div>

                                    <div>
                                        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs ${currentIsActive ? "bg-green text-green-1" : "bg-yellow text-yellow-1"}`}>
                                            {currentIsActive ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                                            {currentIsActive ? "فعال" : "غیرفعال"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardWithIcon>
                </div>

                <div className="lg:col-span-4">
                    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                        <TabsList>
                            <TabsTrigger value="account">
                                <Building2 className="h-4 w-4" />
                                اطلاعات پایه
                            </TabsTrigger>
                            <TabsTrigger value="profile">
                                <UserCircle className="h-4 w-4" />
                                پروفایل
                            </TabsTrigger>
                            <TabsTrigger value="seo">
                                <Search className="h-4 w-4" />
                                سئو
                            </TabsTrigger>
                            <TabsTrigger value="social">
                                <Share2 className="h-4 w-4" />
                                شبکه‌های اجتماعی
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="account" className="mt-0">
                            <Suspense fallback={<TabContentSkeleton />}>
                                <BaseInfoTab
                                    form={form}
                                    editMode={editMode}
                                    agencyData={agencyData}
                                    handleInputChange={handleInputChange}
                                />
                            </Suspense>
                        </TabsContent>

                        <TabsContent value="profile" className="mt-0">
                            <Suspense fallback={<TabContentSkeleton />}>
                                <ProfileTab
                                    form={form}
                                    selectedMedia={selectedProfilePicture}
                                    setSelectedMedia={setSelectedProfilePicture}
                                    editMode={editMode}
                                />
                            </Suspense>
                        </TabsContent>

                        <TabsContent value="seo" className="mt-0">
                            <Suspense fallback={<TabContentSkeleton />}>
                                <SEOTab
                                    form={form}
                                    editMode={editMode}
                                />
                            </Suspense>
                        </TabsContent>

                        <TabsContent value="social" className="mt-0">
                            <div className="rounded-lg border p-6">
                                <SocialMediaArrayEditor
                                    items={socialMediaItems}
                                    onChange={setSocialMediaItems}
                                />
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            <MediaLibraryModal
                isOpen={isMediaModalOpen}
                onClose={() => setIsMediaModalOpen(false)}
                onSelect={handleImageSelect}
                selectMultiple={false}
                initialFileType="image"
                showTabs={true}
                context="media_library"
            />

            <div className="fixed bottom-0 left-0 right-0 lg:right-80 z-50 border-t border-br bg-card shadow-lg transition-all duration-300 flex items-center justify-end gap-3 py-4 px-8">
                <Button
                    type="button"
                    onClick={handleSave}
                    size="lg"
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            در حال ذخیره...
                        </>
                    ) : (
                        <>
                            <Save className="h-5 w-5" />
                            ذخیره تغییرات
                        </>
                    )}
                </Button>
            </div>
        </>
    );
}
