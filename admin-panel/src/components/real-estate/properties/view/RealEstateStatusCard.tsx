
import type { Property } from "@/types/real_estate/realEstate";
import { Badge } from "@/components/elements/Badge";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Activity, Eye, Globe, Smartphone, Heart, PhoneCall } from "lucide-react";

interface PropertyStatusCardProps {
    property: Property;
}

export function RealEstateStatusCard({ property }: PropertyStatusCardProps) {
    const statusMap: Record<string, { label: string; variant: any }> = {
        active: { label: "فعال", variant: "green" },
        pending: { label: "در حال معامله", variant: "yellow" },
        sold: { label: "فروخته شده", variant: "red" },
        rented: { label: "اجاره داده شده", variant: "blue" },
        archived: { label: "بایگانی شده", variant: "gray" },
    };

    const config = statusMap[property.status] || { label: property.status, variant: "gray" };

    return (
        <CardWithIcon
            icon={Activity}
            title="آمار و وضعیت"
            iconBgColor="bg-teal-0/50"
            iconColor="text-teal-1"
            cardBorderColor="border-b-teal-1"
            className="shadow-sm"
            contentClassName=""
            showHeaderBorder={false}
            titleExtra={<Badge variant={config.variant}>{config.label}</Badge>}
        >
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="p-4 rounded-xl bg-bg border border-br/50 flex flex-col items-center gap-2 group hover:border-blue-1/30 transition-all">
                    <Eye className="w-4 h-4 text-blue-1 opacity-70 group-hover:opacity-100 transition-opacity" />
                    <span className="text-lg font-black text-font-p">{property.views_count?.toLocaleString('fa-IR') || "۰"}</span>
                    <span className="text-[10px] font-bold text-font-s tracking-wider text-center">بازدید کل</span>
                </div>

                <div className="p-4 rounded-xl bg-bg border border-br/50 flex flex-col items-center gap-2 group hover:border-blue-1/30 transition-all">
                    <Globe className="w-4 h-4 text-emerald-1 opacity-70 group-hover:opacity-100 transition-opacity" />
                    <span className="text-lg font-black text-font-p">{property.web_views_count?.toLocaleString('fa-IR') || "۰"}</span>
                    <span className="text-[10px] font-bold text-font-s tracking-wider text-center">بازدید وب</span>
                </div>

                <div className="p-4 rounded-xl bg-bg border border-br/50 flex flex-col items-center gap-2 group hover:border-blue-1/30 transition-all">
                    <Smartphone className="w-4 h-4 text-purple-1 opacity-70 group-hover:opacity-100 transition-opacity" />
                    <span className="text-lg font-black text-font-p">{property.app_views_count?.toLocaleString('fa-IR') || "۰"}</span>
                    <span className="text-[10px] font-bold text-font-s tracking-wider text-center">بازدید اپ</span>
                </div>

                <div className="p-4 rounded-xl bg-bg border border-br/50 flex flex-col items-center gap-2 group hover:border-red-1/30 transition-all">
                    <Heart className="w-4 h-4 text-red-1 opacity-70 group-hover:opacity-100 transition-opacity" />
                    <span className="text-lg font-black text-font-p">{property.favorites_count?.toLocaleString('fa-IR') || "۰"}</span>
                    <span className="text-[10px] font-bold text-font-s tracking-wider text-center">علاقه‌مندی</span>
                </div>

                <div className="p-4 rounded-xl bg-bg border border-br/50 flex flex-col items-center gap-2 group hover:border-orange-1/30 transition-all">
                    <PhoneCall className="w-4 h-4 text-orange-1 opacity-70 group-hover:opacity-100 transition-opacity" />
                    <span className="text-lg font-black text-font-p">{property.inquiries_count?.toLocaleString('fa-IR') || "۰"}</span>
                    <span className="text-[10px] font-bold text-font-s tracking-wider text-center">درخواست/تماس</span>
                </div>
            </div>
        </CardWithIcon>
    );
}
