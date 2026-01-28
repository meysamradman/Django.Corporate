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
    Globe,
    Link as LinkIcon,
    Clock,
    DollarSign,
    Image as ImageIcon,
    Video,
    Music,
    FileText,
    Activity
} from "lucide-react";
import { TruncatedText } from "@/components/elements/TruncatedText";

interface PropertyBasicInfoProps {
    property: Property;
}

export function RealEstateInfo({ property }: PropertyBasicInfoProps) {
    const formatDate = (dateString: string) => {
        if (!dateString) return "نامشخص";
        const date = new Date(dateString);
        return new Intl.DateTimeFormat("fa-IR", {
            year: "numeric",
            month: "long",
            day: "numeric",
        }).format(date);
    };

    const formatPrice = (price: number | string) => {
        if (!price) return "توافقی";
        return new Intl.NumberFormat('fa-IR').format(Number(price));
    };

    const allMedia = property.media || property.property_media || [];
    const imagesCount = allMedia.filter(
        (item: any) => (item.media_detail || item.media)?.media_type === "image"
    ).length;
    const videosCount = allMedia.filter(
        (item: any) => (item.media_detail || item.media)?.media_type === "video"
    ).length;
    const audiosCount = allMedia.filter(
        (item: any) => (item.media_detail || item.media)?.media_type === "audio"
    ).length;
    const documentsCount = allMedia.filter(
        (item: any) => (item.media_detail || item.media)?.media_type === "document" || (item.media_detail || item.media)?.media_type === "pdf"
    ).length;
    const totalMediaCount = imagesCount + videosCount + audiosCount + documentsCount;

    return (
        <Card className="overflow-hidden">
            <CardContent className="pt-0 pb-0">
                <div className="pb-6 border-b -mx-6 px-6">
                    <div className="grid grid-cols-2 gap-3">
                        <div className={`col-span-2 flex flex-col items-center justify-center py-4 px-3 rounded-lg transition-colors ${(() => {
                            const statusMap: Record<string, string> = {
                                active: "bg-green",
                                pending: "bg-yellow",
                                sold: "bg-red",
                                rented: "bg-blue",
                                archived: "bg-gray",
                            };
                            return statusMap[property.status] || "bg-gray";
                        })()}`}>
                            <div className={`flex items-center justify-center w-9 h-9 rounded-full mb-2 ${(() => {
                                const statusMap: Record<string, string> = {
                                    active: "bg-green-0",
                                    pending: "bg-yellow-0",
                                    sold: "bg-red-0",
                                    rented: "bg-blue-0",
                                    archived: "bg-gray-0",
                                };
                                return statusMap[property.status] || "bg-gray-0";
                            })()}`}>
                                <Activity className={`w-4 h-4 ${(() => {
                                    const statusMap: Record<string, string> = {
                                        active: "stroke-green-2",
                                        pending: "stroke-yellow-2",
                                        sold: "stroke-red-2",
                                        rented: "stroke-blue-2",
                                        archived: "stroke-gray-1",
                                    };
                                    return statusMap[property.status] || "stroke-gray-1";
                                })()}`} />
                            </div>
                            <span className={`text-xs font-medium ${(() => {
                                const statusMap: Record<string, string> = {
                                    active: "text-green-2",
                                    pending: "text-yellow-2",
                                    sold: "text-red-2",
                                    rented: "text-blue-2",
                                    archived: "text-gray-1",
                                };
                                return statusMap[property.status] || "text-gray-1";
                            })()}`}>
                                {(() => {
                                    const statusMap: Record<string, string> = {
                                        active: "فعال",
                                        pending: "در حال معامله",
                                        sold: "فروخته شده",
                                        rented: "اجاره داده شده",
                                        archived: "بایگانی شده",
                                    };
                                    return statusMap[property.status] || property.status;
                                })()}
                            </span>
                        </div>
                        <div className={`flex flex-col items-center justify-center py-4 px-3 rounded-lg transition-colors ${property.is_public ? "bg-blue" : "bg-gray"
                            }`}>
                            <div className={`flex items-center justify-center w-9 h-9 rounded-full mb-2 ${property.is_public ? "bg-blue-0" : "bg-gray-0"
                                }`}>
                                <Globe className={`w-4 h-4 ${property.is_public ? "stroke-blue-2" : "stroke-gray-1"
                                    }`} />
                            </div>
                            <span className={`text-sm font-medium ${property.is_public ? "text-blue-2" : "text-gray-1"
                                }`}>
                                {property.is_public ? "عمومی" : "غیرعمومی"}
                            </span>
                        </div>

                        <div className={`flex flex-col items-center justify-center py-4 px-3 rounded-lg transition-colors ${property.is_active ? "bg-blue" : "bg-red"
                            }`}>
                            <div className={`flex items-center justify-center w-9 h-9 rounded-full mb-2 ${property.is_active ? "bg-blue-0" : "bg-red-0"
                                }`}>
                                <Zap className={`w-4 h-4 ${property.is_active ? "stroke-blue-2" : "stroke-red-2"
                                    }`} />
                            </div>
                            <span className={`text-sm font-medium ${property.is_active ? "text-blue-2" : "text-red-2"
                                }`}>
                                {property.is_active ? "فعال" : "غیرفعال"}
                            </span>
                        </div>

                        <div className={`flex flex-col items-center justify-center py-4 px-3 rounded-lg transition-colors ${property.is_featured ? "bg-orange" : "bg-gray"
                            }`}>
                            <div className={`flex items-center justify-center w-9 h-9 rounded-full mb-2 ${property.is_featured ? "bg-orange-0" : "bg-gray-0"
                                }`}>
                                <Star className={`w-4 h-4 ${property.is_featured ? "stroke-orange-2 fill-orange-2" : "stroke-gray-1"
                                    }`} />
                            </div>
                            <span className={`text-sm font-medium ${property.is_featured ? "text-orange-2" : "text-gray-1"
                                }`}>
                                {property.is_featured ? "ویژه" : "عادی"}
                            </span>
                        </div>

                        <div className={`flex flex-col items-center justify-center py-4 px-3 rounded-lg transition-colors ${property.is_published ? "bg-green" : "bg-yellow"
                            }`}>
                            <div className={`flex items-center justify-center w-9 h-9 rounded-full mb-2 ${property.is_published ? "bg-green-0" : "bg-yellow-0"
                                }`}>
                                {property.is_published ? (
                                    <CheckCircle2 className="w-4 h-4 stroke-green-2" />
                                ) : (
                                    <XCircle className="w-4 h-4 stroke-yellow-2" />
                                )}
                            </div>
                            <span className={`text-sm font-medium ${property.is_published ? "text-green-2" : "text-yellow-2"
                                }`}>
                                {property.is_published ? "منتشر شده" : "پیش‌نویس"}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="pt-4">
                    <div className="space-y-4">
                        <div className="bg-bg">
                            <div className="p-5">
                                <h3 className="text-font-p font-bold text-lg leading-tight mb-2">
                                    <TruncatedText
                                        text={property.title}
                                        maxLength={50}
                                    />
                                </h3>
                                <span className="text-font-s text-xs">#{property.id}</span>
                            </div>
                        </div>

                        <div className="space-y-0 [&>div:not(:last-child)]:border-b [&>div:not(:last-child)]:border-br">
                            <div className="flex items-center justify-between gap-3 py-3">
                                <div className="flex items-center gap-2">
                                    <LinkIcon className="w-4 h-4 text-font-s shrink-0" />
                                    <label className="text-font-s text-sm">نامک:</label>
                                </div>
                                <div className="flex-1 ms-2 text-left min-w-0 overflow-hidden">
                                    <TruncatedText
                                        text={property.slug || "-"}
                                        maxLength={35}
                                        className="font-mono text-font-p text-sm"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-3 py-3">
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-font-s shrink-0" />
                                    <label className="text-font-s text-sm">موقعیت:</label>
                                </div>
                                <div className="flex-1 ms-2 text-left min-w-0 overflow-hidden">
                                    <TruncatedText
                                        text={`${property.city_name || 'شهر نامشخص'}، ${property.province_name || 'استان نامشخص'}`}
                                        maxLength={35}
                                        className="text-font-p text-sm"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-3 py-3">
                                <div className="flex items-center gap-2">
                                    <Home className="w-4 h-4 text-font-s shrink-0" />
                                    <label className="text-font-s text-sm">نوع ملک:</label>
                                </div>
                                <p className="text-font-p text-sm font-medium text-left">
                                    {property.property_type?.title || "-"}
                                </p>
                            </div>

                            <div className="flex items-center justify-between gap-3 py-3">
                                <div className="flex items-center gap-2">
                                    <Maximize className="w-4 h-4 text-font-s shrink-0" />
                                    <label className="text-font-s text-sm">متراژ:</label>
                                </div>
                                <p className="text-font-p text-sm font-medium text-left" dir="ltr">
                                    {property.built_area || property.land_area || 0} m²
                                </p>
                            </div>

                            <div className="flex items-center justify-between gap-3 py-3">
                                <div className="flex items-center gap-2">
                                    <BedDouble className="w-4 h-4 text-font-s shrink-0" />
                                    <label className="text-font-s text-sm">خواب:</label>
                                </div>
                                <p className="text-font-p text-sm font-medium text-left">
                                    {property.bedrooms || 0}
                                </p>
                            </div>

                            <div className="flex items-center justify-between gap-3 py-3">
                                <div className="flex items-center gap-2">
                                    <Bath className="w-4 h-4 text-font-s shrink-0" />
                                    <label className="text-font-s text-sm">حمام:</label>
                                </div>
                                <p className="text-font-p text-sm font-medium text-left">
                                    {property.bathrooms || 0}
                                </p>
                            </div>

                            <div className="flex items-center justify-between gap-3 py-3">
                                <div className="flex items-center gap-2">
                                    <DollarSign className="w-4 h-4 text-font-s shrink-0" />
                                    <label className="text-font-s text-sm">قیمت:</label>
                                </div>
                                <p className="text-font-p text-sm font-medium text-left">
                                    {property.price ? `${formatPrice(property.price)} تومان` :
                                        property.monthly_rent ? `اجاره: ${formatPrice(property.monthly_rent)}` : 'توافقی'}
                                </p>
                            </div>

                            {property.created_at && (
                                <div className="flex items-center justify-between gap-3 pt-3">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-font-s shrink-0" />
                                        <label className="text-font-s text-sm">تاریخ ایجاد:</label>
                                    </div>
                                    <p className="text-font-p text-sm font-medium text-left">
                                        {formatDate(property.created_at)}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="pt-4 border-t border-br">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4 text-font-s" />
                                    <h4 className="text-font-p text-sm font-semibold">مدیا</h4>
                                </div>
                                <span className="text-font-s text-xs bg-bg px-2.5 py-1 rounded-full">{totalMediaCount} مورد</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2.5">
                                <div className="flex items-center gap-2 px-3 py-2.5 bg-blue/10 rounded-lg border border-blue/20 hover:bg-blue/15 transition-colors">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue">
                                        <ImageIcon className="w-4 h-4 stroke-blue-2" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-font-p text-sm font-semibold leading-none">{imagesCount}</p>
                                        <p className="text-font-s text-xs mt-0.5">تصویر</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-2.5 bg-purple/10 rounded-lg border border-purple/20 hover:bg-purple/15 transition-colors">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple">
                                        <Video className="w-4 h-4 stroke-purple-2" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-font-p text-sm font-semibold leading-none">{videosCount}</p>
                                        <p className="text-font-s text-xs mt-0.5">ویدیو</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-2.5 bg-pink/10 rounded-lg border border-pink/20 hover:bg-pink/15 transition-colors">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-pink">
                                        <Music className="w-4 h-4 stroke-pink-2" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-font-p text-sm font-semibold leading-none">{audiosCount}</p>
                                        <p className="text-font-s text-xs mt-0.5">صدا</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-2.5 bg-gray/10 rounded-lg border border-gray/20 hover:bg-gray/15 transition-colors">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray">
                                        <FileText className="w-4 h-4 stroke-gray-2" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-font-p text-sm font-semibold leading-none">{documentsCount}</p>
                                        <p className="text-font-s text-xs mt-0.5">سند</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
