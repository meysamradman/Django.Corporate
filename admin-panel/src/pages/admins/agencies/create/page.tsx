import { useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { realEstateApi } from "@/api/real-estate/properties";
import { showSuccess, showError } from '@/core/toast';
import { getCrud } from '@/core/messages';
import { Button } from "@/components/elements/Button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/elements/Tabs";
import { Skeleton } from "@/components/elements/Skeleton";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Loader2, Save, Building2, UserCircle, Search } from "lucide-react";
import type { Media } from "@/types/shared/media";
import { generateSlug, formatSlug } from '@/core/slug/generate';
import { agencyFormSchema, agencyFormDefaults, type AgencyFormValues } from '@/components/real-estate/validations/agencySchema';


const TabSkeleton = () => (
    <div className="mt-0 space-y-6">
        <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 min-w-0">
                <CardWithIcon
                    icon={Building2}
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
                    </div>
                </CardWithIcon>
            </div>
        </div>
    </div>
);

const BaseInfoTab = lazy(() => import("@/components/real-estate/agencies/edit/BaseInfoTab"));
const ProfileTab = lazy(() => import("@/components/real-estate/agencies/create/ProfileTab"));
const SEOTab = lazy(() => import("@/components/real-estate/agencies/edit/SEOTab"));

export default function AdminsAgenciesCreatePage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<string>("account");
    const [editMode] = useState(true);
    const [selectedLogo, setSelectedLogo] = useState<Media | null>(null);

    const form = useForm<AgencyFormValues>({
        resolver: zodResolver(agencyFormSchema) as any,
        defaultValues: agencyFormDefaults,
        mode: "onSubmit",
    });

    // ✅ Auto-generate slug from name
    const handleInputChange = (field: string, value: any) => {
        if (field === "name" && typeof value === "string") {
            const generatedSlug = generateSlug(value);
            form.setValue("name", value);
            form.setValue("slug", generatedSlug);
        } else if (field === "slug" && typeof value === "string") {
            const formattedSlug = formatSlug(value);
            form.setValue("slug", formattedSlug);
        } else {
            form.setValue(field as any, value);
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

            // Backend will auto-generate slug from name
            // No need to send slug explicitly

            if (selectedLogo?.id) {
                agencyData.profile_picture = selectedLogo.id;
            }

            return await realEstateApi.createAgency(agencyData as any);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agencies'] });
            showSuccess(getCrud('created', { item: 'آژانس' }));
            navigate("/admins/agencies");
        },
        onError: (error: any) => {
            if (error?.response?.errors) {
                const fieldErrors = error.response.errors;

                Object.entries(fieldErrors).forEach(([field, message]) => {
                    const fieldMap: Record<string, any> = {
                        'name': 'name',
                        'phone': 'phone',
                        'email': 'email',
                        'license_number': 'license_number',
                        'city': 'city',
                        'province': 'province',
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
        createAgencyMutation.mutate(data);
    };

    return (
        <div className="space-y-6">

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                </TabsList>

                <TabsContent value="account">
                    <Suspense fallback={<TabSkeleton />}>
                        <BaseInfoTab
                            form={form as any}
                            editMode={editMode}
                            handleInputChange={handleInputChange}
                        />
                    </Suspense>
                </TabsContent>

                <TabsContent value="profile">
                    <Suspense fallback={<TabSkeleton />}>
                        <ProfileTab
                            form={form as any}
                            selectedMedia={selectedLogo}
                            setSelectedMedia={setSelectedLogo}
                            editMode={editMode}
                        />
                    </Suspense>
                </TabsContent>

                <TabsContent value="seo">
                    <Suspense fallback={<TabSkeleton />}>
                        <SEOTab
                            form={form as any}
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
                        disabled={createAgencyMutation.isPending}
                    >
                        {createAgencyMutation.isPending ? (
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


