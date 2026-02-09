
import { DollarSign } from "lucide-react";
import { Item, ItemContent, ItemMedia } from "@/components/elements/Item";
import { ValueFallback } from "@/components/shared/ValueFallback";
import type { Property } from "@/types/real_estate/realEstate";
import { formatPriceToPersian } from "@/core/utils/realEstateFormat";

interface PropertyTransactionProps {
    property: Property;
}

export function PropertyTransaction({ property }: PropertyTransactionProps) {
    return (
        <Item size="sm" className="rounded-none border-x-0 border-t-0 border-b border-br/40 last:border-0 hover:bg-bg/40 transition-colors">
            <ItemMedia className="text-emerald-1/60">
                <DollarSign className="size-4" />
            </ItemMedia>
            <ItemContent className="flex-row items-center gap-2">
                <span className="text-[10px] font-bold text-font-s">قیمت کل / اجاره:</span>
                <span className="text-xs font-black text-emerald-1">
                    {property.price || property.monthly_rent
                        ? formatPriceToPersian(property.price || property.monthly_rent, property.currency || 'تومان')
                        : <ValueFallback value={null} />}
                </span>
            </ItemContent>
        </Item>
    );
}
