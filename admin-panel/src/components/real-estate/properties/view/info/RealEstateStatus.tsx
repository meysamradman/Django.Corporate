
import { Activity } from "lucide-react";
import { Item, ItemContent, ItemMedia } from "@/components/elements/Item";
import { ValueFallback } from "@/components/shared/ValueFallback";
import type { Property } from "@/types/real_estate/realEstate";
import { useQuery } from "@tanstack/react-query";
import { realEstateApi } from "@/api/real-estate";

interface RealEstateStatusProps {
    property: Property;
}

export function RealEstateStatus({ property }: RealEstateStatusProps) {
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
    );
}
