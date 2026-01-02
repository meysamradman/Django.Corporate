import { Card, CardContent } from "@/components/elements/Card";
import type { Property } from "@/types/real_estate/realEstate";
import {
    CheckCircle2,
    XCircle,
    Star,
    Zap,
    MapPin,
    Home,
    BedDouble,
    Bath,
    Maximize,
    Globe
} from "lucide-react";
import { TruncatedText } from "@/components/elements/TruncatedText";

interface PropertyBasicInfoProps {
    property: Property;
}

export function PropertyBasicInfo({ property }: PropertyBasicInfoProps) {
    // فرمت کردن قیمت
    const formatPrice = (price: number | string) => {
        if (!price) return "توافقی";
        return new Intl.NumberFormat('fa-IR').format(Number(price));
    };

    return (
        <Card className="h-full">
            <CardContent className="pt-0 pb-0">
                {/* Status Cards */}
                <div className="pb-6 border-b">
                    <div className="grid grid-cols-4 gap-3">
                    <div className={`flex flex-col items-center justify-center py-4 px-3 rounded-lg transition-colors ${
                        property.is_public ? "bg-blue" : "bg-gray"
                    }`}>
                        <div className={`flex items-center justify-center w-9 h-9 rounded-full mb-2 ${
                            property.is_public ? "bg-blue-0" : "bg-gray-0"
                        }`}>
                            <Globe className={`w-4 h-4 ${
                                property.is_public ? "stroke-blue-2" : "stroke-gray-1"
                            }`} />
                        </div>
                        <span className={`text-sm font-medium ${
                            property.is_public ? "text-blue-2" : "text-gray-1"
                        }`}>
                            {property.is_public ? "عمومی" : "غیرعمومی"}
                        </span>
                    </div>

                    <div className={`flex flex-col items-center justify-center py-4 px-3 rounded-lg transition-colors ${
                        property.is_active ? "bg-blue" : "bg-red"
                    }`}>
                        <div className={`flex items-center justify-center w-9 h-9 rounded-full mb-2 ${
                            property.is_active ? "bg-blue-0" : "bg-red-0"
                        }`}>
                            <Zap className={`w-4 h-4 ${
                                property.is_active ? "stroke-blue-2" : "stroke-red-2"
                            }`} />
                        </div>
                        <span className={`text-sm font-medium ${
                            property.is_active ? "text-blue-2" : "text-red-2"
                        }`}>
                            {property.is_active ? "فعال" : "غیرفعال"}
                        </span>
                    </div>

                    <div className={`flex flex-col items-center justify-center py-4 px-3 rounded-lg transition-colors ${
                        property.is_featured ? "bg-orange" : "bg-gray"
                    }`}>
                        <div className={`flex items-center justify-center w-9 h-9 rounded-full mb-2 ${
                            property.is_featured ? "bg-orange-0" : "bg-gray-0"
                        }`}>
                            <Star className={`w-4 h-4 ${
                                property.is_featured ? "stroke-orange-2 fill-orange-2" : "stroke-gray-1"
                            }`} />
                        </div>
                        <span className={`text-sm font-medium ${
                            property.is_featured ? "text-orange-2" : "text-gray-1"
                        }`}>
                            {property.is_featured ? "ویژه" : "عادی"}
                        </span>
                    </div>

                    <div className={`flex flex-col items-center justify-center py-4 px-3 rounded-lg transition-colors ${
                        property.is_published ? "bg-green" : "bg-yellow"
                    }`}>
                        <div className={`flex items-center justify-center w-9 h-9 rounded-full mb-2 ${
                            property.is_published ? "bg-green-0" : "bg-yellow-0"
                        }`}>
                            {property.is_published ? (
                                <CheckCircle2 className="w-4 h-4 stroke-green-2" />
                            ) : (
                                <XCircle className="w-4 h-4 stroke-yellow-2" />
                            )}
                        </div>
                        <span className={`text-sm font-medium ${
                            property.is_published ? "text-green-2" : "text-yellow-2"
                        }`}>
                            {property.is_published ? "منتشر شده" : "پیش‌نویس"}
                        </span>
                    </div>
                    </div>
                </div>

                {/* Basic Info */}
                <div className="pt-4 pb-4">
                    <div className="bg-bg-2 rounded-xl p-5 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                            <h5 className="text-font-s text-xs">عنوان ملک</h5>
                            <h3 className="text-font-p font-bold text-lg leading-tight">
                                <TruncatedText text={property.title} maxLength={50} />
                            </h3>
                        </div>
                        <div className="flex-shrink-0">
                            <span className="text-font-s text-xs">#{property.id}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-font-s text-sm">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">
                            {property.city_name || 'شهر نامشخص'}، {property.province_name || 'استان نامشخص'}
                        </span>
                    </div>

                    <div className="pt-4 border-t border-br space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-font-s flex items-center gap-2">
                                <Home className="w-4 h-4" />
                                نوع ملک:
                            </span>
                            <span className="text-font-p font-medium">{property.property_type?.title || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-font-s flex items-center gap-2">
                                <Maximize className="w-4 h-4" />
                                متراژ:
                            </span>
                            <span className="text-font-p font-medium" dir="ltr">
                                {property.built_area || property.land_area || 0} m²
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-font-s flex items-center gap-2">
                                <BedDouble className="w-4 h-4" />
                                خواب:
                            </span>
                            <span className="text-font-p font-medium">{property.bedrooms || 0}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-font-s flex items-center gap-2">
                                <Bath className="w-4 h-4" />
                                حمام:
                            </span>
                            <span className="text-font-p font-medium">{property.bathrooms || 0}</span>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-br">
                        <div className="flex justify-between items-center">
                            <span className="text-font-s text-sm">قیمت:</span>
                            <span className="text-primary font-bold text-xl">
                                {property.price ? `${formatPrice(property.price)} تومان` :
                                    property.monthly_rent ? `اجاره: ${formatPrice(property.monthly_rent)}` : 'توافقی'}
                            </span>
                        </div>
                    </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
