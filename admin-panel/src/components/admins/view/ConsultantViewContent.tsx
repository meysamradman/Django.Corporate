import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '@/api/admins/admins';
import { Card } from '@/components/elements/Card';
import { Button } from '@/components/elements/Button';
import { Badge } from '@/components/elements/Badge';
import { Skeleton } from '@/components/elements/Skeleton';
import { User, Mail, Phone, MapPin, Calendar, Building2, Edit, Award, Briefcase } from 'lucide-react';
import { ApiError } from '@/types/api/apiError';

// Utility function for formatting dates
const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
        return new Date(dateString).toLocaleDateString('fa-IR');
    } catch {
        return dateString;
    }
};

interface ConsultantViewContentProps {
    consultantId: string;
}

export default function ConsultantViewContent({ consultantId }: ConsultantViewContentProps) {
    const navigate = useNavigate();
    const isMeRoute = consultantId === "me";
    const isNumericId = !Number.isNaN(Number(consultantId));

    const { data: adminData, isLoading, error } = useQuery({
        queryKey: ['admin', isMeRoute ? 'me' : consultantId],
        queryFn: () => {
            if (isMeRoute) {
                return adminApi.getCurrentAdminManagedProfile();
            }
            if (!isNumericId) {
                return Promise.reject(new Error("شناسه مشاور نامعتبر است"));
            }
            return adminApi.getAdminById(Number(consultantId));
        },
        staleTime: 0,
        retry: (failureCount, requestError) => {
            if (requestError instanceof ApiError && requestError.response.AppStatusCode === 403) {
                return false;
            }
            return failureCount < 2;
        },
    });

    if (isLoading || !adminData) {
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
                : "خطا در دریافت اطلاعات مشاور";

        return (
            <Card className="p-6 text-center">
                <p className="text-destructive">{errorMessage}</p>
            </Card>
        );
    }

    const profile = adminData.profile;
    const agentProfile = adminData.agent_profile;
    const fullName = profile?.first_name && profile?.last_name 
        ? `${profile.first_name} ${profile.last_name}` 
        : profile?.first_name || profile?.last_name || 'بدون نام';

    return (
        <div className="space-y-6">
            {/* Header Card */}
            <Card className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Profile Picture */}
                    <div className="flex-shrink-0">
                        {profile?.profile_picture?.file_url ? (
                            <img
                                src={profile.profile_picture.file_url}
                                alt={fullName}
                                className="w-32 h-32 rounded-full object-cover border-4 border-green-1"
                            />
                        ) : (
                            <div className="w-32 h-32 rounded-full bg-green-0 border-4 border-green-1 flex items-center justify-center">
                                <Building2 className="w-16 h-16 text-green-1" />
                            </div>
                        )}
                    </div>

                    {/* Basic Info */}
                    <div className="flex-1">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-font-p mb-2">
                                    {fullName}
                                </h2>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    <Badge variant="green">مشاور املاک</Badge>
                                    {agentProfile?.is_verified && (
                                        <Badge variant="blue">تایید شده</Badge>
                                    )}
                                    {adminData.is_active ? (
                                        <Badge variant="green">فعال</Badge>
                                    ) : (
                                        <Badge variant="gray">غیرفعال</Badge>
                                    )}
                                </div>
                            </div>
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => navigate(`/admins/consultants/${consultantId}/edit`)}
                            >
                                <Edit className="w-4 h-4 ml-2" />
                                ویرایش
                            </Button>
                        </div>

                        {agentProfile?.bio && (
                            <p className="text-font-s mt-4">
                                {agentProfile.bio}
                            </p>
                        )}
                    </div>
                </div>
            </Card>

            {/* Consultant Professional Info */}
            {agentProfile && (
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-green-1" />
                        اطلاعات حرفه‌ای
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {agentProfile.license_number && (
                            <div className="flex items-center gap-3 p-3 bg-gray-0">
                                <Award className="w-5 h-5 text-gray-2" />
                                <div>
                                    <p className="text-xs text-gray-2">شماره پروانه</p>
                                    <p className="font-medium">{agentProfile.license_number}</p>
                                </div>
                            </div>
                        )}
                        {agentProfile.license_expire_date && (
                            <div className="flex items-center gap-3 p-3 bg-gray-0">
                                <Calendar className="w-5 h-5 text-gray-2" />
                                <div>
                                    <p className="text-xs text-gray-2">تاریخ انقضای پروانه</p>
                                    <p className="font-medium">{formatDate(agentProfile.license_expire_date)}</p>
                                </div>
                            </div>
                        )}
                        {agentProfile.specialization && (
                            <div className="flex items-start gap-3 p-3 bg-gray-0 rounded-lg md:col-span-2">
                                <Briefcase className="w-5 h-5 text-gray-2 mt-1" />
                                <div>
                                    <p className="text-xs text-gray-2">تخصص</p>
                                    <p className="font-medium">{agentProfile.specialization}</p>
                                </div>
                            </div>
                        )}
                        {agentProfile.agency && (
                            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg md:col-span-2">
                                <Building2 className="w-5 h-5 text-gray-2" />
                                <div>
                                    <p className="text-xs text-gray-2">آژانس املاک</p>
                                    <p className="font-medium">{agentProfile.agency.name}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {/* Contact Information */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-blue-2" />
                    اطلاعات تماس
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {adminData.email && (
                        <div className="flex items-center gap-3 p-3 bg-gray-0">
                            <Mail className="w-5 h-5 text-gray-2" />
                            <div>
                                <p className="text-xs text-gray-2">ایمیل</p>
                                <p className="font-medium">{adminData.email}</p>
                            </div>
                        </div>
                    )}
                    {adminData.mobile && (
                        <div className="flex items-center gap-3 p-3 bg-gray-0">
                            <Phone className="w-5 h-5 text-gray-2" />
                            <div>
                                <p className="text-xs text-gray-2">موبایل</p>
                                <p className="font-medium">{adminData.mobile}</p>
                            </div>
                        </div>
                    )}
                    {profile?.phone && (
                        <div className="flex items-center gap-3 p-3 bg-gray-0">
                            <Phone className="w-5 h-5 text-gray-2" />
                            <div>
                                <p className="text-xs text-gray-2">تلفن ثابت</p>
                                <p className="font-medium">{profile.phone}</p>
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            {/* Personal Information */}
            {(profile?.birth_date || profile?.national_id || profile?.address) && (
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <User className="w-5 h-5 text-blue-2" />
                        اطلاعات شخصی
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {profile.birth_date && (
                            <div className="flex items-center gap-3 p-3 bg-gray-0">
                                <Calendar className="w-5 h-5 text-gray-2" />
                                <div>
                                    <p className="text-xs text-gray-2">تاریخ تولد</p>
                                    <p className="font-medium">{formatDate(profile.birth_date)}</p>
                                </div>
                            </div>
                        )}
                        {profile.national_id && (
                            <div className="flex items-center gap-3 p-3 bg-gray-0">
                                <User className="w-5 h-5 text-gray-2" />
                                <div>
                                    <p className="text-xs text-gray-2">کد ملی</p>
                                    <p className="font-medium">{profile.national_id}</p>
                                </div>
                            </div>
                        )}
                        {profile.address && (
                            <div className="flex items-start gap-3 p-3 bg-gray-0 rounded-lg md:col-span-2">
                                <MapPin className="w-5 h-5 text-gray-2 mt-1" />
                                <div>
                                    <p className="text-xs text-gray-2">آدرس</p>
                                    <p className="font-medium">{profile.address}</p>
                                    {(profile.province || profile.city) && (
                                        <p className="text-sm text-gray-2 mt-1">
                                            {profile.province?.name} {profile.city?.name && `- ${profile.city.name}`}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {/* SEO Information */}
            {agentProfile && (agentProfile.meta_title || agentProfile.meta_description) && (
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">اطلاعات سئو</h3>
                    <div className="space-y-3">
                        {agentProfile.meta_title && (
                            <div>
                                <p className="text-xs text-gray-2">عنوان متا</p>
                                <p className="font-medium">{agentProfile.meta_title}</p>
                            </div>
                        )}
                        {agentProfile.meta_description && (
                            <div>
                                <p className="text-xs text-gray-2">توضیحات متا</p>
                                <p className="font-medium">{agentProfile.meta_description}</p>
                            </div>
                        )}
                        {agentProfile.meta_keywords && (
                            <div>
                                <p className="text-xs text-gray-2">کلمات کلیدی</p>
                                <p className="font-medium">{agentProfile.meta_keywords}</p>
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {/* System Information */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">اطلاعات سیستم</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-gray-2">شناسه کاربری:</span>
                        <span className="font-medium mr-2">{adminData.id}</span>
                    </div>
                    <div>
                        <span className="text-gray-2">تاریخ ثبت‌نام:</span>
                        <span className="font-medium mr-2">{formatDate(adminData.created_at)}</span>
                    </div>
                    {adminData.updated_at && (
                        <div>
                            <span className="text-gray-2">آخرین به‌روزرسانی:</span>
                            <span className="font-medium mr-2">{formatDate(adminData.updated_at)}</span>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
