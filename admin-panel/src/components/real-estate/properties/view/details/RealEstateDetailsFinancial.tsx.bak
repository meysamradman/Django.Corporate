import { Home, Package, Layers, Briefcase, ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { realEstateApi } from "@/api/real-estate";
import { msg } from "@/core/messages";
import type { Property } from "@/types/real_estate/realEstate";
import { Item, ItemContent, ItemMedia } from "@/components/elements/Item";
import { ValueFallback } from "@/components/shared/ValueFallback";

interface RealEstateDetailsFinancialProps {
    property: Property;
}

export function RealEstateDetailsFinancial({ property }: RealEstateDetailsFinancialProps) {
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
                <ItemMedia className="text-gray-1/60">
                    <Home className="size-4" />
                </ItemMedia>
                <ItemContent className="flex-row items-center gap-2">
                    <span className="text-[10px] font-bold text-font-s">پارکینگ:</span>
                    <span className="text-xs font-black">
                        {property.parking_spaces !== null && property.parking_spaces !== undefined ? (
                            (msg.realEstate().facilities.parking_spaces as any)[property.parking_spaces] || (property.parking_spaces === 0 ? 'ندارد' : property.parking_spaces.toLocaleString('fa-IR'))
                        ) : <ValueFallback value={null} />}
                    </span>
                </ItemContent>
            </Item>

            <Item size="sm" className="rounded-none border-x-0 border-t-0 border-b border-br/40 last:border-0 hover:bg-bg/40 transition-colors">
                <ItemMedia className="text-blue-1/60">
                    <Package className="size-4" />
                </ItemMedia>
                <ItemContent className="flex-row items-center gap-2">
                    <span className="text-[10px] font-bold text-font-s">انباری:</span>
                    <span className="text-xs font-black">
                        {property.storage_rooms !== null && property.storage_rooms !== undefined ? (
                            (msg.realEstate().facilities.storage_rooms as any)[property.storage_rooms] || property.storage_rooms.toLocaleString('fa-IR')
                        ) : <ValueFallback value={null} />}
                    </span>
                </ItemContent>
            </Item>

            <Item size="sm" className="rounded-none border-x-0 border-t-0 border-b border-br/40 last:border-0 hover:bg-bg/40 transition-colors">
                <ItemMedia className="text-indigo-1/60">
                    <Layers className="size-4" />
                </ItemMedia>
                <ItemContent className="flex-row items-center gap-2">
                    <span className="text-[10px] font-bold text-font-s">تعداد کل طبقات:</span>
                    <span className="text-xs font-black">{property.floors_in_building ? property.floors_in_building.toLocaleString('fa-IR') : <ValueFallback value={null} />}</span>
                </ItemContent>
            </Item>

            <Item size="sm" className="rounded-none border-x-0 border-t-0 border-b border-br/40 last:border-0 hover:bg-bg/40 transition-colors">
                <ItemMedia className="text-indigo-1/60">
                    <Layers className="size-4" />
                </ItemMedia>
                <ItemContent className="flex-row items-center gap-2">
                    <span className="text-[10px] font-bold text-font-s">طبقه ملک:</span>
                    <span className="text-xs font-black">
                        {property.floor_number !== null && property.floor_number !== undefined ? (
                            (msg.realEstate().facilities.floor_number as any)[property.floor_number] || property.floor_number.toLocaleString('fa-IR')
                        ) : <ValueFallback value={null} />}
                    </span>
                </ItemContent>
            </Item>

            <Item size="sm" className="rounded-none border-x-0 border-t-0 border-b border-br/40 last:border-0 hover:bg-bg/40 transition-colors">
                <ItemMedia className="text-amber-1/60">
                    <Briefcase className="size-4" />
                </ItemMedia>
                <ItemContent className="flex-row items-center gap-2">
                    <span className="text-[10px] font-bold text-font-s">نوع سند:</span>
                    <span className="text-xs font-black">{property.document_type ? (getLocalizedValue('document_type', property.document_type) || property.document_type) : <ValueFallback value={null} />}</span>
                </ItemContent>
            </Item>

            <Item size="sm" className="rounded-none border-x-0 border-t-0 hover:bg-bg/40 transition-colors">
                <ItemMedia className="text-emerald-1/60">
                    <ShieldCheck className="size-4" />
                </ItemMedia>
                <ItemContent className="flex-row items-center gap-2">
                    <span className="text-[10px] font-bold text-font-s">وضعیت سند:</span>
                    <span className="text-xs font-black">
                        {property.has_document === true ? 'دارد' : property.has_document === false ? 'ندارد' : <ValueFallback value={null} />}
                    </span>
                </ItemContent>
            </Item>
        </div>
    );
}
