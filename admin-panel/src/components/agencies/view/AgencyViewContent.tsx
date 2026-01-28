import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { realEstateApi } from '@/api/real-estate/properties';
import { Skeleton } from '@/components/elements/Skeleton';
import { ApiError } from '@/types/api/apiError';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/elements/Tabs';
import { Building2, ImageIcon, Settings2 } from 'lucide-react';
import { useState, lazy, Suspense } from 'react';
import { Button } from '@/components/elements/Button';

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

const BaseInfoTab = lazy(() => import('@/components/real-estate/agencies/view/AgencyInfo'));
const MediaTab = lazy(() => import('@/components/real-estate/agencies/view/AgencyMedia'));
const SettingsTab = lazy(() => import('@/components/real-estate/agencies/view/AgencySettings'));

interface AgencyViewContentProps {
    agencyId: string;
}

export default function AgencyViewContent({ agencyId }: AgencyViewContentProps) {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('base-info');

    const { data: agencyData, isLoading, error } = useQuery({
        queryKey: ['agency', agencyId],
        queryFn: () => realEstateApi.getAgencyById(Number(agencyId)),
        staleTime: 0,
        retry: (failureCount, requestError) => {
            if (requestError instanceof ApiError && requestError.response.AppStatusCode === 403) {
                return false;
            }
            return failureCount < 2;
        },
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
                <Button onClick={() => navigate('/admins/agencies')}>بازگشت به لیست</Button>
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
            <div className="rounded-lg border p-6">
                <div className="flex items-start gap-6">
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {agencyData.logo ? (
                            <img
                                src={agencyData.logo.file_url}
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
                                <Button
                                    variant="outline"
                                    onClick={() => navigate(`/admins/agencies/${agencyId}/edit`)}
                                >
                                    ویرایش
                                </Button>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 mt-4">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${agencyData.is_active ? 'bg-green-1' : 'bg-red-1'}`}></div>
                                <span className="text-sm font-medium">
                                    {agencyData.is_active ? 'فعال' : 'غیرفعال'}
                                </span>
                            </div>

                            {agencyData.is_verified && (
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-1"></div>
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

            <div className="flex justify-end">
                <Button onClick={() => navigate(`/admins/agencies/${agencyId}/edit`)}>
                    ویرایش آژانس
                </Button>
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
                        <BaseInfoTab agencyData={agencyData} />
                    </Suspense>
                </TabsContent>

                <TabsContent value="media">
                    <Suspense fallback={<TabContentSkeleton />}>
                        <MediaTab agencyData={agencyData} />
                    </Suspense>
                </TabsContent>

                <TabsContent value="settings">
                    <Suspense fallback={<TabContentSkeleton />}>
                        <SettingsTab agencyData={agencyData} />
                    </Suspense>
                </TabsContent>
            </Tabs>
        </div>
    );
}