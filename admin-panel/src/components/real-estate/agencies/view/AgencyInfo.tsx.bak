import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Building2, MapPin, Mail, Phone, Globe, Calendar, CheckCircle, XCircle, Award } from "lucide-react";
import type { RealEstateAgency } from "@/types/real_estate/agency/realEstateAgency";

const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
        return new Date(dateString).toLocaleDateString('fa-IR');
    } catch {
        return dateString;
    }
};

interface BaseInfoTabProps {
    agencyData: RealEstateAgency;
}

export default function AgencyInfo({ agencyData }: BaseInfoTabProps) {
    return (
        <div className="space-y-6">
            <CardWithIcon
                icon={Building2}
                title="اطلاعات احراز هویت"
                iconBgColor="bg-primary/10"
                iconColor="stroke-primary"
                cardBorderColor="border-b-primary"
                className="hover:shadow-lg transition-all duration-300"
            >
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">نام آژانس</label>
                        <p className="mt-1 text-base font-semibold">{agencyData.name || '-'}</p>
                    </div>

                    {agencyData.slug && (
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Slug (URL)</label>
                            <p className="mt-1 text-base font-mono text-blue-1">{agencyData.slug}</p>
                        </div>
                    )}

                    {agencyData.license_number && (
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">شماره پروانه</label>
                            <p className="mt-1 text-base font-semibold">{agencyData.license_number}</p>
                        </div>
                    )}

                    {agencyData.phone && (
                        <div className="flex items-center gap-2">
                            <Phone className="w-5 h-5 text-orange-1" />
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">شماره موبایل</label>
                                <p className="mt-1 text-base font-semibold" dir="ltr">{agencyData.phone}</p>
                            </div>
                        </div>
                    )}

                    {agencyData.email && (
                        <div className="flex items-center gap-2">
                            <Mail className="w-5 h-5 text-blue-1" />
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">ایمیل</label>
                                <p className="mt-1 text-base font-semibold">{agencyData.email}</p>
                            </div>
                        </div>
                    )}

                    {agencyData.website && (
                        <div className="flex items-center gap-2">
                            <Globe className="w-5 h-5 text-green-1" />
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">وب‌سایت</label>
                                <a href={agencyData.website} target="_blank" rel="noopener noreferrer" className="mt-1 text-base font-semibold text-blue-1 hover:underline">
                                    {agencyData.website}
                                </a>
                            </div>
                        </div>
                    )}

                    {agencyData.license_expire_date && (
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-purple-1" />
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">تاریخ انقضای پروانه</label>
                                <p className="mt-1 text-base font-semibold">{formatDate(agencyData.license_expire_date)}</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className={`rounded-xl border p-4 ${agencyData.is_active ? 'border-green-1/40 bg-green-0/30' : 'border-red-1/40 bg-red-0/30'}`}>
                        <div className="flex items-center gap-3">
                            {agencyData.is_active ? (
                                <CheckCircle className="w-6 h-6 text-green-1" />
                            ) : (
                                <XCircle className="w-6 h-6 text-red-1" />
                            )}
                            <div>
                                <p className="font-semibold">وضعیت فعال</p>
                                <p className="text-sm text-muted-foreground">
                                    {agencyData.is_active ? 'آژانس فعال است' : 'آژانس غیرفعال است'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {agencyData.is_verified && (
                        <div className="rounded-xl border border-blue-1/40 bg-blue-0/30 p-4">
                            <div className="flex items-center gap-3">
                                <Award className="w-6 h-6 text-blue-1" />
                                <div>
                                    <p className="font-semibold">تأیید شده</p>
                                    <p className="text-sm text-muted-foreground">آژانس توسط سیستم تأیید شده است</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </CardWithIcon>

            <CardWithIcon
                icon={MapPin}
                title="موقعیت مکانی"
                iconBgColor="bg-purple/10"
                iconColor="stroke-purple"
                cardBorderColor="border-b-purple"
                className="hover:shadow-lg transition-all duration-300"
            >
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {agencyData.province_name && (
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">استان</label>
                            <p className="mt-1 text-base font-semibold">{agencyData.province_name}</p>
                        </div>
                    )}

                    {agencyData.city_name && (
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">شهر</label>
                            <p className="mt-1 text-base font-semibold">{agencyData.city_name}</p>
                        </div>
                    )}

                    {agencyData.address && (
                        <div className="md:col-span-2">
                            <label className="text-sm font-medium text-muted-foreground">آدرس کامل</label>
                            <p className="mt-1 text-base">{agencyData.address}</p>
                        </div>
                    )}
                </div>
            </CardWithIcon>
        </div>
    );
}
