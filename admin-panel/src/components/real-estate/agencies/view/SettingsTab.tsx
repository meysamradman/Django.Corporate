import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Settings, Globe, MapPin, Star } from "lucide-react";
import type { RealEstateAgency } from "@/types/real_estate/agency/realEstateAgency";

const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
        return new Date(dateString).toLocaleDateString('fa-IR');
    } catch {
        return dateString;
    }
};

interface SettingsTabProps {
    agencyData: RealEstateAgency;
}

export default function SettingsTab({ agencyData }: SettingsTabProps) {
    return (
        <div className="space-y-6">
            <CardWithIcon
                icon={Settings}
                title="اطلاعات آماری"
                iconBgColor="bg-primary/10"
                iconColor="stroke-primary"
                borderColor="border-b-primary"
                className="hover:shadow-lg transition-all duration-300"
            >
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="flex items-center gap-3">
                        <Star className="w-6 h-6 text-yellow-1" />
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">رتبه</label>
                            <p className="mt-1 text-base font-semibold">{agencyData.rating || 0}/5</p>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-muted-foreground">تعداد نظرات</label>
                        <p className="mt-1 text-base font-semibold">{agencyData.total_reviews || 0}</p>
                    </div>

                    {(agencyData.property_count !== undefined) && (
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">تعداد ملک</label>
                            <p className="mt-1 text-base font-semibold">{agencyData.property_count}</p>
                        </div>
                    )}

                    {(agencyData.agent_count !== undefined) && (
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">تعداد مشاور</label>
                            <p className="mt-1 text-base font-semibold">{agencyData.agent_count}</p>
                        </div>
                    )}
                </div>
            </CardWithIcon>

            {(agencyData.meta_title || agencyData.meta_description || agencyData.og_title || agencyData.og_description) && (
                <CardWithIcon
                    icon={Globe}
                    title="SEO و شبکه‌های اجتماعی"
                    iconBgColor="bg-primary/10"
                    iconColor="stroke-primary"
                    borderColor="border-b-primary"
                    className="hover:shadow-lg transition-all duration-300"
                >
                    <div className="space-y-6">
                        {agencyData.meta_title && (
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">عنوان متا</label>
                                <p className="mt-1 text-base">{agencyData.meta_title}</p>
                            </div>
                        )}

                        {agencyData.meta_description && (
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">توضیحات متا</label>
                                <p className="mt-1 text-base">{agencyData.meta_description}</p>
                            </div>
                        )}

                        {agencyData.og_title && (
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">عنوان Open Graph</label>
                                <p className="mt-1 text-base">{agencyData.og_title}</p>
                            </div>
                        )}

                        {agencyData.og_description && (
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">توضیحات Open Graph</label>
                                <p className="mt-1 text-base">{agencyData.og_description}</p>
                            </div>
                        )}
                    </div>
                </CardWithIcon>
            )}

            {agencyData.description && (
                <CardWithIcon
                    icon={Settings}
                    title="توضیحات تکمیلی"
                    iconBgColor="bg-primary/10"
                    iconColor="stroke-primary"
                    borderColor="border-b-primary"
                    className="hover:shadow-lg transition-all duration-300"
                >
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">توضیحات آژانس</label>
                        <p className="mt-2 text-base whitespace-pre-line">{agencyData.description}</p>
                    </div>
                </CardWithIcon>
            )}

            <CardWithIcon
                icon={Settings}
                title="اطلاعات سیستم"
                iconBgColor="bg-gray-0"
                iconColor="stroke-gray-1"
                borderColor="border-b-gray-1"
                className="transition-all duration-300"
            >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 text-sm">
                    <div>
                        <span className="text-muted-foreground">شناسه:</span>
                        <span className="font-medium mr-2">{agencyData.id}</span>
                    </div>
                    <div>
                        <span className="text-muted-foreground">تاریخ ثبت:</span>
                        <span className="font-medium mr-2">{formatDate(agencyData.created_at)}</span>
                    </div>
                    {agencyData.updated_at && (
                        <div>
                            <span className="text-muted-foreground">آخرین به‌روزرسانی:</span>
                            <span className="font-medium mr-2">{formatDate(agencyData.updated_at)}</span>
                        </div>
                    )}
                    {agencyData.slug && (
                        <div>
                            <span className="text-muted-foreground">Slug:</span>
                            <span className="font-medium font-mono mr-2 text-blue-1">{agencyData.slug}</span>
                        </div>
                    )}
                </div>
            </CardWithIcon>
        </div>
    );
}
