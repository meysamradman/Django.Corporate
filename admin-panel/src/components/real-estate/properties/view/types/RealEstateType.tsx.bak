
import { Home } from "lucide-react";
import { Item, ItemContent, ItemMedia } from "@/components/elements/Item";
import { ValueFallback } from "@/components/shared/ValueFallback";
import type { Property } from "@/types/real_estate/realEstate";

interface RealEstateTypeProps {
    property: Property;
}

export function RealEstateType({ property }: RealEstateTypeProps) {
    return (
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
    );
}
