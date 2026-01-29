import { useState, lazy } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { realEstateApi } from "@/api/real-estate/properties";
import { showSuccess, showError, extractFieldErrors, hasFieldErrors } from '@/core/toast';
import { msg } from '@/core/messages';
import { Building2, UserCircle, Search } from "lucide-react";
import type { Media } from "@/types/shared/media";
import { generateSlug, formatSlug } from '@/core/slug/generate';
import { agencyFormSchema, agencyFormDefaults, type AgencyFormValues } from '@/components/real-estate/validations/agencySchema';
import { TabbedPageLayout } from "@/components/page-patterns/TabbedPageLayout";

const BaseInfoTab = lazy(() => import("@/components/real-estate/agencies/edit/AgencyInfo"));
const ProfileTab = lazy(() => import("@/components/real-estate/agencies/create/AgencyProfile"));
const SEOTab = lazy(() => import("@/components/real-estate/agencies/edit/AgencySEO"));

export default function AdminsAgenciesCreatePage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<string>("account");
    const [selectedLogo, setSelectedLogo] = useState<Media | null>(null);

    const form = useForm<AgencyFormValues>({
        resolver: zodResolver(agencyFormSchema),
        defaultValues: agencyFormDefaults,
        mode: "onSubmit",
    });

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
            };

            if (selectedLogo?.id) {
                agencyData.profile_picture = selectedLogo.id;
            }

            return await realEstateApi.createAgency(agencyData as any);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agencies'] });
            showSuccess(msg.crud('created', { item: 'آژانس' }));
            navigate("/admins/agencies");
        },
        onError: (error: any) => {
            if (hasFieldErrors(error)) {
                const fieldErrors = extractFieldErrors(error);

                Object.entries(fieldErrors).forEach(([field, message]) => {
                    const fieldMap: Record<string, any> = {
                        'name': 'name',
                        'phone': 'phone',
                        'email': 'email',
                        'license_number': 'license_number',
                        'city': 'city',
                        'province': 'province',
                        'slug': 'slug',
                    };

                    const formField = fieldMap[field] || field;
                    form.setError(formField as keyof AgencyFormValues, {
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
        createAgencyMutation.mutate(data);
    };

    return (
        <TabbedPageLayout
            title="افزودن آژانس"
            activeTab={activeTab}
            onTabChange={setActiveTab}
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
            ]}
        />
    );
}


