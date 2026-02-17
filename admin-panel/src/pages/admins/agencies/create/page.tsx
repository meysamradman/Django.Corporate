import { useState, lazy } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useFormState } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { realEstateApi } from "@/api/real-estate";
import { extractFieldErrors, handleFormApiError, notifyApiError, showSuccess } from '@/core/toast';
import { msg } from '@/core/messages';
import { AlertCircle, Building2, UserCircle, Search } from "lucide-react";
import { Share2 } from "lucide-react";
import type { Media } from "@/types/shared/media";
import type { SocialMediaItem } from "@/types/shared/socialMedia";
import { generateSlug, formatSlug } from '@/core/slug/generate';
import { agencyFormSchema, agencyFormDefaults, type AgencyFormValues } from '@/components/real-estate/validations/agencySchema';
import { AGENCY_FIELD_MAP, mapAgencyFieldErrorKey } from '@/components/real-estate/validations/agencyApiError';
import { TabbedPageLayout } from "@/components/templates/TabbedPageLayout";
import { ApiError } from "@/types/api/apiError";
import { Alert, AlertDescription } from "@/components/elements/Alert";
import { SocialMediaArrayEditor } from "@/components/shared/SocialMediaArrayEditor";

const BaseInfoTab = lazy(() => import("@/components/real-estate/agencies/edit/AgencyInfo"));
const ProfileTab = lazy(() => import("@/components/real-estate/agencies/create/AgencyProfile"));
const SEOTab = lazy(() => import("@/components/real-estate/agencies/edit/AgencySEO"));

export default function AdminsAgenciesCreatePage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<string>("account");
    const [selectedLogo, setSelectedLogo] = useState<Media | null>(null);
    const [socialMediaItems, setSocialMediaItems] = useState<SocialMediaItem[]>([]);
    const [formAlert, setFormAlert] = useState<string | null>(null);

    const AGENCY_CREATE_TAB_BY_FIELD: Record<string, string> = {
        name: 'account',
        slug: 'account',
        phone: 'account',
        email: 'account',
        website: 'account',
        license_number: 'account',
        license_expire_date: 'account',
        city: 'account',
        province: 'account',
        profile_picture: 'profile',
        description: 'profile',
        address: 'profile',
        is_active: 'profile',
        rating: 'profile',
        total_reviews: 'profile',
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

    const resolveAgencyCreateErrorTab = (fieldKeys: Iterable<string>): string | null => {
        for (const key of fieldKeys) {
            const tab = AGENCY_CREATE_TAB_BY_FIELD[key];
            if (tab) return tab;
        }
        return null;
    };

    const form = useForm<AgencyFormValues>({
        resolver: zodResolver(agencyFormSchema),
        defaultValues: agencyFormDefaults,
        mode: "onSubmit",
    });

    useFormState({ control: form.control });

    const handleInputChange = (field: string, value: any) => {
        if (field === "name" && typeof value === "string") {
            const generatedSlug = generateSlug(value);
            form.setValue("name", value);
            form.setValue("slug", generatedSlug);
        } else if (field === "slug" && typeof value === "string") {
            const formattedSlug = formatSlug(value);
            form.setValue("slug", formattedSlug);
        } else {
            form.setValue(field as keyof AgencyFormValues, value);
        }
    };

    const createAgencyMutation = useMutation({
        mutationFn: async (data: AgencyFormValues) => {
            const agencyData: Record<string, unknown> = {
                name: data.name,
                slug: data.slug || undefined,
                phone: data.phone,
                email: data.email || undefined,
                website: data.website || undefined,
                license_number: data.license_number || undefined,
                license_expire_date: data.license_expire_date || undefined,
                city: data.city || undefined,
                province: data.province || undefined,
                description: data.description || undefined,
                address: data.address || undefined,
                is_active: data.is_active ?? true,
                rating: data.rating || 0,
                total_reviews: data.total_reviews || 0,
                meta_title: data.meta_title || undefined,
                meta_description: data.meta_description || undefined,
                og_title: data.og_title || undefined,
                og_description: data.og_description || undefined,
                social_media: socialMediaItems
                    .filter((item) => (item.name || '').trim() && (item.url || '').trim())
                    .map((item, index) => ({
                        name: item.name,
                        url: item.url,
                        icon: item.icon ?? item.icon_data?.id ?? null,
                        order: item.order ?? index,
                    })),
            };

            if (selectedLogo?.id) {
                agencyData.profile_picture = selectedLogo.id;
            }

            return await realEstateApi.createAgency(agencyData as any);
        },
        onSuccess: () => {
            setFormAlert(null);
            queryClient.invalidateQueries({ queryKey: ['agencies'] });
            showSuccess(msg.crud('created', { item: 'آژانس' }));
            navigate("/admins/agencies");
        },
        onError: (error: unknown) => {
            setFormAlert(null);

            const fieldErrors = extractFieldErrors(error);
            if (Object.keys(fieldErrors).length > 0) {
                const mappedFieldKeys: string[] = [];

                handleFormApiError(error, {
                    setFieldError: (field, message) => {
                        if (field === 'non_field_errors') {
                            setFormAlert(message);
                            return;
                        }

                        const formField = mapAgencyFieldErrorKey(
                            field,
                            AGENCY_FIELD_MAP as unknown as Record<string, string>
                        ) as keyof AgencyFormValues;

                        mappedFieldKeys.push(String(formField));
                        form.setError(formField, {
                            type: 'server',
                            message,
                        });
                    },
                    checkFormMessage: msg.error('checkForm'),
                    showToastForFieldErrors: false,
                    preferBackendMessage: false,
                    dedupeKey: 'agencies-create-validation-error',
                });

                const tabWithError = resolveAgencyCreateErrorTab(mappedFieldKeys);
                if (tabWithError) {
                    setActiveTab(tabWithError);
                }
                return;
            }

            if (error instanceof ApiError && error.response.AppStatusCode < 500) {
                setFormAlert(error.response.message || msg.error('validation'));
                return;
            }

            notifyApiError(error, {
                fallbackMessage: msg.error('serverError'),
                preferBackendMessage: false,
                dedupeKey: 'agencies-create-system-error',
            });
        },
    });

    const handleSubmit = async () => {
        setFormAlert(null);
        form.clearErrors();
        const isValid = await form.trigger();
        if (!isValid) {
            const tabWithError = resolveAgencyCreateErrorTab(Object.keys(form.formState.errors));
            if (tabWithError) {
                setActiveTab(tabWithError);
            }
            return;
        }

        const data = form.getValues();
        createAgencyMutation.mutate(data);
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
                title="افزودن آژانس"
                activeTab={activeTab}
                onTabChange={handleTabChange}
                onSave={handleSubmit}
                isSaving={createAgencyMutation.isPending}
                tabs={[
                    {
                        id: "account",
                        label: "اطلاعات پایه",
                        icon: <Building2 className="h-4 w-4" />,
                        content: (
                            <BaseInfoTab
                                form={form}
                                editMode={true}
                                handleInputChange={handleInputChange}
                            />
                        ),
                    },
                    {
                        id: "profile",
                        label: "پروفایل",
                        icon: <UserCircle className="h-4 w-4" />,
                        content: (
                            <ProfileTab
                                form={form}
                                selectedMedia={selectedLogo}
                                setSelectedMedia={setSelectedLogo}
                                editMode={true}
                            />
                        ),
                    },
                    {
                        id: "seo",
                        label: "سئو",
                        icon: <Search className="h-4 w-4" />,
                        content: (
                            <SEOTab
                                form={form}
                                editMode={true}
                            />
                        ),
                    },
                    {
                        id: "social",
                        label: "شبکه‌های اجتماعی",
                        icon: <Share2 className="h-4 w-4" />,
                        content: (
                            <div className="rounded-lg border p-6">
                                <SocialMediaArrayEditor
                                    items={socialMediaItems}
                                    onChange={setSocialMediaItems}
                                />
                            </div>
                        ),
                    },
                ]}
            />
        </div>
    );
}

