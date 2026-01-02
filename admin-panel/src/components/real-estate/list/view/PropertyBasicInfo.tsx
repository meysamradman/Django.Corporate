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
    Maximize
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
            <CardContent className="p-6 space-y-4">
                {/* Status Cards */}
                <div className="grid grid-cols-2 gap-3">
                    <div className={`flex flex-col items-center justify-center py-4 px-3 rounded-xl transition-colors ${property.is_published ? "bg-green/10" : "bg-yellow/10"
                        }`}>
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full mb-2 ${property.is_published ? "bg-green/20" : "bg-yellow/20"
                            }`}>
                            {property.is_published ? (
                                <CheckCircle2 className="w-5 h-5 text-green-2" />
                            ) : (
                                <XCircle className="w-5 h-5 text-yellow-2" />
                            )}
                        </div>
                        <span className={`text-sm font-bold ${property.is_published ? "text-green-2" : "text-yellow-2"
                            }`}>
                            {property.is_published ? "فعال" : "پیش‌نویس"}
                        </span>
                    </div>

                    <div className={`flex flex-col items-center justify-center py-4 px-3 rounded-xl transition-colors ${property.is_featured ? "bg-orange/10" : "bg-bg-2"
                        }`}>
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full mb-2 ${property.is_featured ? "bg-orange/20" : "bg-gray-100 dark:bg-gray-800"
                            }`}>
                            <Star className={`w-5 h-5 ${property.is_featured ? "text-orange-2 fill-orange-2" : "text-font-s"
                                }`} />
                        </div>
                        <span className={`text-sm font-bold ${property.is_featured ? "text-orange-2" : "text-font-s"
                            }`}>
                            {property.is_featured ? "ویژه" : "عادی"}
                        </span>
                    </div>

                    <div className="col-span-2 flex flex-col items-center justify-center py-4 px-3 rounded-xl bg-blue/10">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full mb-2 bg-blue/20">
                            <Zap className="w-5 h-5 text-blue-2" />
                        </div>
                        <span className="text-sm font-bold text-blue-2">
                            {property.state?.title || (property.monthly_rent ? 'اجاره‌ای' : 'فروشی')}
                        </span>
                    </div>
                </div>

                {/* Basic Info */}
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
            </CardContent>
        </Card>
    );
}
