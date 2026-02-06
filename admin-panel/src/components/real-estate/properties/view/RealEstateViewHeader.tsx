import { useNavigate } from "react-router-dom";
import { Edit2, Printer, FileText, Calendar } from "lucide-react";
import { Card } from "@/components/elements/Card";
import { Button } from "@/components/elements/Button";
import { Badge } from "@/components/elements/Badge";
import { formatDate } from "@/core/utils/commonFormat";
import type { Property } from "@/types/real_estate/realEstate";

interface RealEstateViewHeaderProps {
    property: Property;
    propertyId: string;
    onPrint: () => void;
    onPdf: () => void;
    isExportingPdf: boolean;
}

export function RealEstateViewHeader({
    property,
    propertyId,
    onPrint,
    onPdf,
    isExportingPdf,
}: RealEstateViewHeaderProps) {
    const navigate = useNavigate();

    const statusConfig: Record<string, any> = {
        active: { label: "فعال", variant: "emerald", dot: "bg-emerald-1" },
        pending: { label: "در حال معامله", variant: "amber", dot: "bg-amber-1" },
        sold: { label: "فروخته شده", variant: "red", dot: "bg-red-1" },
        rented: { label: "اجاره داده شده", variant: "blue", dot: "bg-blue-1" },
        archived: { label: "بایگانی شده", variant: "gray", dot: "bg-font-s" },
    };

    return (
        <Card className="flex-row items-center justify-between gap-0 p-4 lg:px-10 py-5 relative overflow-hidden border-br/60 ring-1 ring-static-b/5 shadow-xs shrink-0">
            <div className="absolute top-0 right-0 w-full h-[2.5px] bg-linear-to-r from-blue-1/40 via-purple-1/40 to-pink-1/40" />

            <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-5">
                    <h1 className="text-2xl font-black text-font-p tracking-tighter shrink-0 leading-none">{property.title}</h1>
                    <div className="flex items-center gap-2">
                        <Badge variant={statusConfig[property.status]?.variant || "default"} className="rounded-full px-2.5 py-0.5 text-[9px] font-black tracking-widest gap-1.5 h-5.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${statusConfig[property.status]?.dot || 'bg-current'} animate-pulse`} />
                            {statusConfig[property.status]?.label || property.status}
                        </Badge>

                        {property.is_active && (
                            <Badge variant="emerald" className="rounded-full px-2.5 py-0.5 text-[9px] font-black tracking-widest gap-1.5 h-5.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-1 animate-pulse" />
                                فعال
                            </Badge>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3.5 text-[10.5px] font-bold text-font-s opacity-60">
                    <span className="font-mono text-font-p bg-bg/80 px-2 py-0.5 rounded-md border border-br/60">#{property.id}</span>
                    <div className="w-1 h-1 rounded-full bg-br" />
                    <span className="tracking-widest uppercase">{property.property_type?.title || 'Residential'}</span>
                    <div className="w-1 h-1 rounded-full bg-br" />
                    <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 opacity-70" />
                        <span>{formatDate(property.created_at)}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 bg-bg/50 p-1.5 rounded-2xl border border-br/50 h-12 shadow-inner">
                <Button
                    variant="default"
                    size="sm"
                    className="h-8 gap-1.5 text-[10px] font-black bg-blue-1 hover:bg-blue-2 text-wt shadow-sm px-4 rounded-lg"
                    onClick={() => navigate(`/real-estate/properties/${propertyId}/edit`)}
                >
                    <Edit2 className="w-3 h-3" />
                    ویرایش
                </Button>
                <div className="w-px h-4 bg-br/60 mx-1" />
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-[10px] font-black border-br hover:bg-bg bg-wt/80 px-3 rounded-lg"
                    onClick={onPrint}
                >
                    <Printer className="w-3 h-3 opacity-60" />
                    چاپ
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-[10px] font-black border-br hover:bg-bg bg-wt/80 px-3 rounded-lg"
                    onClick={onPdf}
                    isLoading={isExportingPdf}
                >
                    <FileText className="w-3 h-3 opacity-60" />
                    PDF
                </Button>
            </div>
        </Card>
    );
}
