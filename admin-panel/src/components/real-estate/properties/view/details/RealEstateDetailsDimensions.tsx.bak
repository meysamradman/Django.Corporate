import { Maximize2, Layers, Calendar, Activity, Hash, Home } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Property } from "@/types/real_estate/realEstate";
import { realEstateApi } from "@/api/real-estate";
import { Item, ItemContent, ItemMedia } from "@/components/elements/Item";
import { ValueFallback } from "@/components/shared/ValueFallback";
import { formatArea } from "@/core/utils/realEstateFormat";

interface RealEstateDetailsDimensionsProps {
    property: Property;
}

export function RealEstateDetailsDimensions({ property }: RealEstateDetailsDimensionsProps) {
    const { data: fieldOptions } = useQuery({
        queryKey: ["property-field-options"],
        queryFn: () => realEstateApi.getFieldOptions(),
        staleTime: 1000 * 60 * 30,
    });

    const getLocalizedValue = (field: string, value: any) => {
        if (!fieldOptions || value === null || value === undefined) return value;
        const options = (fieldOptions as any)[field] as [any, string][];
        if (!options) return value;
        const option = options.find(opt => opt[0] === value);
        return option ? option[1] : value;
    };

    return (
        <div className="flex flex-col">
            <Item size="sm" className="rounded-none border-x-0 border-t-0 border-b border-br/40 last:border-0 hover:bg-bg/40 transition-colors">
                <ItemMedia className="text-orange-1/60">
                    <Activity className="size-4" />
                </ItemMedia>
                <ItemContent className="flex-row items-center gap-2">
                    <span className="text-[10px] font-bold text-font-s">وضعیت:</span>
                    <span className="text-xs font-black">
                        {getLocalizedValue('status', property.status) ? (
                            getLocalizedValue('status', property.status)
                        ) : (
                            <ValueFallback value={property.status === 'for_rent' ? 'اجاره' : property.status === 'for_sale' ? 'فروش' : property.status} />
                        )}
                    </span>
                </ItemContent>
            </Item>

            <Item size="sm" className="rounded-none border-x-0 border-t-0 border-b border-br/40 last:border-0 hover:bg-bg/40 transition-colors">
                <ItemMedia className="text-blue-1/60">
                    <Hash className="size-4" />
                </ItemMedia>
                <ItemContent className="flex-row items-center gap-2">
                    <span className="text-[10px] font-bold text-font-s">شناسه ملک:</span>
                    <span className="text-xs font-black">
                        {property.id ? `HZ-${property.id}` : <ValueFallback value={null} />}
                    </span>
                </ItemContent>
            </Item>

            <Item size="sm" className="rounded-none border-x-0 border-t-0 border-b border-br/40 last:border-0 hover:bg-bg/40 transition-colors">
                <ItemMedia className="text-blue-1/60">
                    <Home className="size-4" />
                </ItemMedia>
                <ItemContent className="flex-row items-center gap-2">
                    <span className="text-[10px] font-bold text-font-s">نوع ملک:</span>
                    <span className="text-xs font-black">
                        <ValueFallback value={property.property_type?.title} />
                    </span>
                </ItemContent>
            </Item>

            <Item size="sm" className="rounded-none border-x-0 border-t-0 border-b border-br/40 last:border-0 hover:bg-bg/40 transition-colors">
                <ItemMedia className="text-blue-1/60">
                    <Maximize2 className="size-4" />
                </ItemMedia>
                <ItemContent className="flex-row items-center gap-2">
                    <span className="text-[10px] font-bold text-font-s">زیربنا:</span>
                    <span className="text-xs font-black">
                        {property.built_area ? formatArea(property.built_area) : <ValueFallback value={null} />}
                    </span>
                </ItemContent>
            </Item>

            <Item size="sm" className="rounded-none border-x-0 border-t-0 border-b border-br/40 last:border-0 hover:bg-bg/40 transition-colors">
                <ItemMedia className="text-emerald-1/60">
                    <Layers className="size-4" />
                </ItemMedia>
                <ItemContent className="flex-row items-center gap-2">
                    <span className="text-[10px] font-bold text-font-s">مساحت زمین:</span>
                    <span className="text-xs font-black">
                        {property.land_area ? formatArea(property.land_area) : <ValueFallback value={null} />}
                    </span>
                </ItemContent>
            </Item>

            <Item size="sm" className="rounded-none border-x-0 border-t-0 hover:bg-bg/40 transition-colors">
                <ItemMedia className="text-orange-1/60">
                    <Calendar className="size-4" />
                </ItemMedia>
                <ItemContent className="flex-row items-center gap-2">
                    <span className="text-[10px] font-bold text-font-s">سال ساخت:</span>
                    <span className="text-xs font-black">
                        {property.year_built ? property.year_built.toLocaleString('fa-IR', { useGrouping: false }) : <ValueFallback value={null} />}
                    </span>
                </ItemContent>
            </Item>
        </div>
    );
}
