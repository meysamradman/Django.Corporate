import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, useFormState } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/elements/Button";
import { Alert, AlertDescription } from "@/components/elements/Alert";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Skeleton } from "@/components/elements/Skeleton";
import { TabbedPageLayout } from "@/components/templates/TabbedPageLayout";
import { realEstateApi } from "@/api/real-estate";
import { msg } from "@/core/messages";
import { notifyApiError, showSuccess } from "@/core/toast";
import { ApiError } from "@/types/api/apiError";
import type { Media } from "@/types/shared/media";
import type { SocialMediaItem } from "@/types/shared/socialMedia";
import { generateSlug, formatSlug } from "@/core/slug/generate";
import { agencyFormSchema, agencyFormDefaults, type AgencyFormValues } from "@/components/real-estate/validations/agencySchema";
import { AGENCY_FIELD_MAP, extractMappedAgencyFieldErrors } from "@/components/real-estate/validations/agencyApiError";
import { useEditAgencyPageTabs } from "../hooks/useEditAgencyPageTabs";

interface EditAgencyFormProps {
    agencyId: string;
}

const TabSkeleton = () => (
    <div className="mt-0 space-y-6">
        <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 min-w-0">
                <CardWithIcon
                    icon={Building2}
                    title="اطلاعات پایه"
                    iconBgColor="bg-blue"
                    iconColor="stroke-blue-2"
                    cardBorderColor="border-b-blue-1"
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
                    </div>
                </CardWithIcon>
            </div>
        </div>
    </div>
);

const AGENCY_EDIT_TAB_BY_FIELD: Record<string, string> = {
    name: "account",
    slug: "account",
    phone: "account",
    email: "account",
    website: "profile",
    license_number: "account",
    license_expire_date: "account",
    city: "profile",
    province: "profile",
    description: "profile",
    address: "profile",
    is_active: "account",
    rating: "settings",
    total_reviews: "settings",
    profile_picture: "profile",
    meta_title: "seo",
    meta_description: "seo",
    og_title: "seo",
    og_description: "seo",
    canonical_url: "seo",
    robots_meta: "seo",
    social_media: "social",
    "social_media.name": "social",
    "social_media.url": "social",
    "social_media.order": "social",
};

const resolveAgencyEditErrorTab = (fieldKeys: Iterable<string>): string | null => {
    for (const key of fieldKeys) {
        const tab = AGENCY_EDIT_TAB_BY_FIELD[key];
        if (tab) return tab;
    }
    return null;
};

export function EditAgencyForm({ agencyId }: EditAgencyFormProps) {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState("account");
    const [selectedProfilePicture, setSelectedProfilePicture] = useState<Media | null>(null);
    const [socialMediaItems, setSocialMediaItems] = useState<SocialMediaItem[]>([]);
    const [formAlert, setFormAlert] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const isNumericId = !Number.isNaN(Number(agencyId));
    const queryKey = ["agency", agencyId];

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
            rating: Number(agencyData.rating || 0),
            total_reviews: Number(agencyData.total_reviews || 0),
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
            form.setValue("name", value);
            form.setValue("slug", generateSlug(value));
            return;
        }

        if (field === "slug" && typeof value === "string") {
            form.setValue("slug", formatSlug(value));
            return;
        }

        form.setValue(field as keyof AgencyFormValues, value as never);
    };

    const handleSave = async () => {
        if (isSaving || !agencyData) return;

        setFormAlert(null);
        form.clearErrors();

        const isValid = await form.trigger();
        if (!isValid) {
            const tabWithError = resolveAgencyEditErrorTab(Object.keys(form.formState.errors));
            if (tabWithError) {
                setActiveTab(tabWithError);
            }
            return;
        }

        setIsSaving(true);

        try {
            const data = form.getValues();
            const payload: Record<string, unknown> = {
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
                rating: Number(data.rating || 0),
                total_reviews: Number(data.total_reviews || 0),
                meta_title: data.meta_title || null,
                meta_description: data.meta_description || null,
                og_title: data.og_title || null,
                og_description: data.og_description || null,
                canonical_url: data.canonical_url || null,
                robots_meta: data.robots_meta || null,
                social_media: socialMediaItems
                    .filter((item) => (item.name || "").trim() && (item.url || "").trim())
                    .map((item, index) => ({
                        id: item.id,
                        name: item.name,
                        url: item.url,
                        icon: item.icon ?? item.icon_data?.id ?? null,
                        order: item.order ?? index,
                    })),
            };

            if (selectedProfilePicture?.id) {
                payload.profile_picture = selectedProfilePicture.id;
            } else if (selectedProfilePicture === null) {
                payload.profile_picture = null;
            }

            await realEstateApi.updateAgency(agencyData.id, payload);

            await queryClient.invalidateQueries({ queryKey });
            await queryClient.invalidateQueries({ queryKey: ["agencies"] });

            showSuccess(msg.crud("updated", { item: "آژانس" }));
            navigate("/admins/agencies");
        } catch (error: unknown) {
            const { fieldErrors, nonFieldError } = extractMappedAgencyFieldErrors(
                error,
                AGENCY_FIELD_MAP as unknown as Record<string, string>
            );

            if (Object.keys(fieldErrors).length > 0) {
                Object.entries(fieldErrors).forEach(([field, message]) => {
                    form.setError(field as keyof AgencyFormValues, {
                        type: "server",
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
                setFormAlert(error.response.message || msg.error("validation"));
                return;
            }

            notifyApiError(error, {
                fallbackMessage: msg.error("serverError"),
                preferBackendMessage: false,
                dedupeKey: "agencies-edit-system-error",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleTabChange = (nextTab: string) => {
        if (nextTab === activeTab) {
            return;
        }
        setFormAlert(null);
        setActiveTab(nextTab);
    };

    const { tabs } = useEditAgencyPageTabs({
        form,
        selectedMedia: selectedProfilePicture,
        setSelectedMedia: setSelectedProfilePicture,
        socialMediaItems,
        onSocialMediaChange: setSocialMediaItems,
        onFieldChange: handleInputChange,
    });

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
                <Button onClick={() => navigate("/admins/agencies")}>بازگشت به لیست</Button>
            </div>
        );
    }

    if (isLoading || !agencyData) {
        return <TabSkeleton />;
    }

    return (
        <div className="space-y-4">
            {formAlert ? (
                <Alert variant="destructive" className="border-red-1/50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{formAlert}</AlertDescription>
                </Alert>
            ) : null}

            <TabbedPageLayout
                title="ویرایش آژانس"
                description="مدیریت اطلاعات آژانس"
                showHeader={false}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                tabs={tabs}
                onSave={handleSave}
                isSaving={isSaving}
                saveLabel="ذخیره تغییرات"
                skeleton={<TabSkeleton />}
            />
        </div>
    );
}
