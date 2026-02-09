
import { Badge } from "@/components/elements/Badge";
import { Calendar } from "lucide-react";
import { formatDate } from "@/core/utils/commonFormat";
import type { Property } from "@/types/real_estate/realEstate";

interface RealEstateTitleProps {
    property: Property;
}

export function RealEstateTitle({ property }: RealEstateTitleProps) {
    const statusConfig: Record<string, any> = {
        active: { label: "فعال", variant: "emerald", dot: "bg-emerald-1" },
        pending: { label: "در حال معامله", variant: "amber", dot: "bg-amber-1" },
        sold: { label: "فروخته شده", variant: "red", dot: "bg-red-1" },
        rented: { label: "اجاره داده شده", variant: "blue", dot: "bg-blue-1" },
        archived: { label: "بایگانی شده", variant: "gray", dot: "bg-font-s" },
    };

    return (
        <div className="flex flex-col gap-1.5 min-w-0">
            <div className="flex items-center gap-4 flex-wrap">
                <h1 className="text-xl font-black text-font-p tracking-tight shrink-0 leading-tight">
                    {property.title}
                </h1>
                <div className="flex items-center gap-2">
                    <Badge variant={statusConfig[property.status]?.variant || "default"} className="rounded-full px-3 py-1 text-[10px] font-black h-6.5 gap-2 border-0">
                        <div className={`w-1.5 h-1.5 rounded-full ${statusConfig[property.status]?.dot || 'bg-current'} animate-pulse`} />
                        {statusConfig[property.status]?.label || property.status}
                    </Badge>

                    {property.is_active && (
                        <Badge variant="emerald" className="rounded-full px-3 py-1 text-[10px] font-black h-6.5 gap-2 border-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-1 animate-pulse" />
                            تایید شده
                        </Badge>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-4 text-[11px] font-bold text-font-s opacity-70">
                <span className="font-mono text-font-p bg-bg px-2 py-0.5 rounded-md border border-br/60 shadow-xs">#{property.id}</span>
                <div className="w-1 h-1 rounded-full bg-br" />
                <span className="tracking-wide">{property.property_type?.title || 'Residential'}</span>
                <div className="w-1.5 h-1.5 rounded-full bg-br/50" />
                <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 opacity-60" />
                    <span>{formatDate(property.created_at)}</span>
                </div>
            </div>
        </div>
    );
}
