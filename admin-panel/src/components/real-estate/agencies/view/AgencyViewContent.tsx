import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { realEstateApi } from '@/api/real-estate/properties';
import { Card } from '@/components/elements/Card';
import { Button } from '@/components/elements/Button';
import { Badge } from '@/components/elements/Badge';
import { Skeleton } from '@/components/elements/Skeleton';
import { Building2, Mail, Phone, MapPin, Calendar, Star, CheckCircle, Edit } from 'lucide-react';
import { ApiError } from '@/types/api/apiError';
import { mediaService } from '@/components/media/services';
import type { Media } from '@/types/shared/media';

const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
        return new Date(dateString).toLocaleDateString('fa-IR');
    } catch {
        return dateString;
    }
};

interface AgencyViewContentProps {
    agencyId: string;
}

export default function AgencyViewContent({ agencyId }: AgencyViewContentProps) {
    const navigate = useNavigate();
    const isNumericId = !Number.isNaN(Number(agencyId));

    const { data: agencyData, isLoading, error } = useQuery({
        queryKey: ['agency', agencyId],
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

    if (isLoading || !agencyData) {
        return (
            <div className="space-y-6">
                <Card className="p-6">
                    <Skeleton className="h-32 w-full mb-4" />
                    <Skeleton className="h-6 w-1/3 mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                </Card>
            </div>
        );
    }

    if (error) {
        const errorMessage =
            error instanceof ApiError
                ? error.response.message
                : error instanceof Error
                ? error.message
                : "خطا در دریافت اطلاعات آژانس";

        return (
            <Card className="p-6 text-center">
                <p className="text-destructive">{errorMessage}</p>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-shrink-0">
                        {agencyData.logo?.file_url ? (
                            <img
                                src={mediaService.getMediaUrlFromObject(agencyData.logo as unknown as Media)}
                                alt={agencyData.name}
                                className="w-32 h-32 rounded-lg object-cover border-4 border-blue-2"
                            />
                        ) : (
                            <div className="w-32 h-32 rounded-lg bg-blue-0 border-4 border-blue-2 flex items-center justify-center">
                                <Building2 className="w-16 h-16 text-blue-2" />
                            </div>
                        )}
                    </div>

                    <div className="flex-1">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-font-p mb-2">
                                    {agencyData.name}
                                </h2>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {agencyData.is_verified && (
                                        <Badge variant="blue" className="flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3" />
                                            تأیید شده
                                        </Badge>
                                    )}
                                    {agencyData.is_active ? (
                                        <Badge variant="green">فعال</Badge>
                                    ) : (
                                        <Badge variant="gray">غیرفعال</Badge>
                                    )}
                                </div>

                                {agencyData.rating > 0 && (
                                    <div className="flex items-center gap-2 mb-2">
                                        <Star className="w-4 h-4 text-yellow-1 fill-current" />
                                        <span className="font-medium">{agencyData.rating}/5</span>
                                        <span className="text-sm text-gray-2">
                                            ({agencyData.total_reviews} نظر)
                                        </span>
                                    </div>
                                )}

                                {agencyData.city_name && (
                                    <div className="flex items-center gap-2 text-sm text-gray-2">
                                        <MapPin className="w-4 h-4" />
                                        <span>{agencyData.city_name}</span>
                                    </div>
                                )}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/admins/agencies/${agencyId}/edit`)}
                            >
                                <Edit className="w-4 h-4 ml-2" />
                                ویرایش
                            </Button>
                        </div>

                        {agencyData.description && (
                            <p className="text-font-s mt-4 line-clamp-3">
                                {agencyData.description}
                            </p>
                        )}
                    </div>
                </div>
            </Card>

            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-blue-2" />
                    اطلاعات تماس
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {agencyData.email && (
                        <div className="flex items-center gap-3 p-3 bg-gray-0">
                            <Mail className="w-5 h-5 text-gray-2" />
                            <div>
                                <p className="text-xs text-gray-2">ایمیل</p>
                                <p className="font-medium">{agencyData.email}</p>
                            </div>
                        </div>
                    )}
                    {agencyData.phone && (
                        <div className="flex items-center gap-3 p-3 bg-gray-0">
                            <Phone className="w-5 h-5 text-gray-2" />
                            <div>
                                <p className="text-xs text-gray-2">تلفن</p>
                                <p className="font-medium">{agencyData.phone}</p>
                            </div>
                        </div>
                    )}
                    {agencyData.website && (
                        <div className="flex items-center gap-3 p-3 bg-gray-0">
                            <Building2 className="w-5 h-5 text-gray-2" />
                            <div>
                                <p className="text-xs text-gray-2">وب‌سایت</p>
                                <a
                                    href={agencyData.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium text-blue-2 hover:underline"
                                >
                                    {agencyData.website}
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-2" />
                    اطلاعات کسب‌وکار
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {agencyData.license_number && (
                        <div className="flex items-center gap-3 p-3 bg-gray-0">
                            <Building2 className="w-5 h-5 text-gray-2" />
                            <div>
                                <p className="text-xs text-gray-2">شماره پروانه</p>
                                <p className="font-medium">{agencyData.license_number}</p>
                            </div>
                        </div>
                    )}
                    {agencyData.license_expire_date && (
                        <div className="flex items-center gap-3 p-3 bg-gray-0">
                            <Calendar className="w-5 h-5 text-gray-2" />
                            <div>
                                <p className="text-xs text-gray-2">انقضای پروانه</p>
                                <p className="font-medium">{formatDate(agencyData.license_expire_date)}</p>
                            </div>
                        </div>
                    )}
                    {agencyData.address && (
                        <div className="flex items-start gap-3 p-3 bg-gray-0 rounded-lg md:col-span-2">
                            <MapPin className="w-5 h-5 text-gray-2 mt-1" />
                            <div>
                                <p className="text-xs text-gray-2">آدرس</p>
                                <p className="font-medium">{agencyData.address}</p>
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">اطلاعات سیستم</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-gray-2">شناسه آژانس:</span>
                        <span className="font-medium mr-2">{agencyData.id}</span>
                    </div>
                    <div>
                        <span className="text-gray-2">تاریخ ایجاد:</span>
                        <span className="font-medium mr-2">{formatDate(agencyData.created_at)}</span>
                    </div>
                    {agencyData.updated_at && (
                        <div>
                            <span className="text-gray-2">آخرین به‌روزرسانی:</span>
                            <span className="font-medium mr-2">{formatDate(agencyData.updated_at)}</span>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
