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
import { Loader2, Save, Building2, UserCircle } from "lucide-react";
import type { Media } from "@/types/shared/media";
import * as z from "zod";
import { generateSlug, formatSlug } from '@/core/slug/generate';


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
    rating: z.number().min(0).max(5).optional(),
    total_reviews: z.number().min(0).optional(),
    meta_title: z.string().optional().nullable(),
    meta_description: z.string().optional().nullable(),
    og_title: z.string().optional().nullable(),
    og_description: z.string().optional().nullable(),
    canonical_url: z.string().optional().nullable(),
    robots_meta: z.string().optional().nullable(),
});

export type AgencyFormValues = z.infer<typeof agencySchema>;

export default function AdminsAgenciesCreatePage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<string>("base-info");
    const [editMode] = useState(true);
    const [selectedLogo, setSelectedLogo] = useState<Media | null>(null);

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
            rating: 0,
            total_reviews: 0,
            meta_title: "",
            meta_description: "",
            og_title: "",
            og_description: "",
        },
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
                agencyData.logo_id = selectedLogo.id;
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
                    <TabsTrigger value="base-info">
                        <Building2 className="w-4 h-4" />
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


