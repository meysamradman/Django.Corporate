import { Card, CardContent } from "@/components/elements/Card";
import type { Property } from "@/types/real_estate/realEstate";
import {
    Home,
    BedDouble,
    Bath,
    Maximize,
    DollarSign,
    Calendar,
    Hash,
    Layers,
    Info
} from "lucide-react";
import { formatDate, formatNumber } from "@/core/utils/commonFormat";
import { formatArea, formatPriceToPersian } from "@/core/utils/realEstateFormat";

interface PropertyBasicInfoProps {
    property: Property;
}

export function RealEstateInfo({ property }: PropertyBasicInfoProps) {

    const InfoItem = ({ icon: Icon, label, value, dir = "rtl" }: any) => (
        <div className="flex items-center justify-between py-2 border-b border-br/40 last:border-0 hover:bg-bg-2/30 px-2 rounded-lg transition-colors">
            <div className="flex items-center gap-2.5 text-font-s">
                <Icon className="w-4 h-4 text-font-s/70" />
                <span className="text-xs font-medium">{label}</span>
            </div>
            <span className={`text-sm font-semibold text-font-p ${dir === "ltr" ? "font-mono" : ""}`} dir={dir}>
                {value}
            </span>
        </div>
    );

    return (
        <Card className="overflow-hidden border-br shadow-sm bg-card">
            <div className="p-3 border-b border-br bg-bg-2/30 flex items-center gap-2">
                <Info className="w-4 h-4 text-blue" />
                <h3 className="font-semibold text-sm text-font-p">اطلاعات اصلی ملک</h3>
            </div>
            <CardContent className="p-3">
                <div className="space-y-0.5">
                    <InfoItem
                        icon={Hash}
                        label="کد ملک"
                        value={formatNumber(Number(property.id))}
                        dir="ltr"
                    />
                    <InfoItem
                        icon={Layers}
                        label="نامک (Slug)"
                        value={property.slug}
                        dir="ltr"
                    />
                    <InfoItem
                        icon={Home}
                        label="نوع ملک"
                        value={property.property_type?.title || "-"}
                    />
                    <InfoItem
                        icon={Maximize}
                        label="متراژ"
                        value={formatArea(Number(property.built_area || property.land_area || 0))}
                        dir="ltr"
                    />
                    <InfoItem
                        icon={BedDouble}
                        label="تعداد خواب"
                        value={`${formatNumber(property.bedrooms || 0)} خواب`}
                    />
                    <InfoItem
                        icon={Bath}
                        label="سرویس بهداشتی"
                        value={`${formatNumber(property.bathrooms || 0)} عدد`}
                    />
                    <InfoItem
                        icon={DollarSign}
                        label="قیمت"
                        value={
                            property.price ? formatPriceToPersian(property.price) :
                                property.monthly_rent ? `اجاره: ${formatPriceToPersian(property.monthly_rent)}` : 'توافقی'
                        }
                    />
                    <InfoItem
                        icon={Calendar}
                        label="تاریخ ثبت"
                        value={formatDate(property.created_at)}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
