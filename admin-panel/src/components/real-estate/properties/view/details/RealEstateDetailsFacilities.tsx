import { Building2, Soup, Users, DollarSign, CreditCard } from "lucide-react";
import type { Property } from "@/types/real_estate/realEstate";
import { Item, ItemContent, ItemMedia } from "@/components/elements/Item";
import { ValueFallback } from "@/components/shared/ValueFallback";
import { formatPriceToPersian } from "@/core/utils/realEstateFormat";
import { msg } from "@/core/messages";

interface RealEstateDetailsFacilitiesProps {
    property: Property;
}

export function RealEstateDetailsFacilities({ property }: RealEstateDetailsFacilitiesProps) {

    const getLocalizedFacility = (field: string, value: any) => {
        if (value === null || value === undefined) return null;
        const msgField = (msg.realEstate().facilities as any)[field];
        if (msgField && msgField[value]) return msgField[value];
        return value.toLocaleString('fa-IR');
    };

    return (
        <div className="flex flex-col">
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

            <Item size="sm" className="rounded-none border-x-0 border-t-0 border-b border-br/40 last:border-0 hover:bg-bg/40 transition-colors">
                <ItemMedia className="text-blue-1/60">
                    <CreditCard className="size-4" />
                </ItemMedia>
                <ItemContent className="flex-row items-center gap-2">
                    <span className="text-[10px] font-bold text-font-s">رهن / ودیعه:</span>
                    <span className="text-xs font-black text-blue-1">
                        {property.mortgage_amount || property.security_deposit
                            ? formatPriceToPersian(property.mortgage_amount || property.security_deposit, property.currency || 'تومان')
                            : <ValueFallback value={null} />}
                    </span>
                </ItemContent>
            </Item>

            <Item size="sm" className="rounded-none border-x-0 border-t-0 border-b border-br/40 last:border-0 hover:bg-bg/40 transition-colors">
                <ItemMedia className="text-purple-1/60">
                    <Building2 className="size-4" />
                </ItemMedia>
                <ItemContent className="flex-row items-center gap-2">
                    <span className="text-[10px] font-bold text-font-s">تعداد اتاق خواب:</span>
                    <span className="text-xs font-black">
                        {property.bedrooms !== null && property.bedrooms !== undefined ? (
                            getLocalizedFacility('bedrooms', property.bedrooms)
                        ) : <ValueFallback value={null} />}
                    </span>
                </ItemContent>
            </Item>

            <Item size="sm" className="rounded-none border-x-0 border-t-0 border-b border-br/40 last:border-0 hover:bg-bg/40 transition-colors">
                <ItemMedia className="text-cyan-1/60">
                    <Building2 className="size-4" />
                </ItemMedia>
                <ItemContent className="flex-row items-center gap-2">
                    <span className="text-[10px] font-bold text-font-s">سرویس بهداشتی:</span>
                    <span className="text-xs font-black">
                        {property.bathrooms !== null && property.bathrooms !== undefined ? (
                            getLocalizedFacility('bathrooms', property.bathrooms) || (property.bathrooms === 0 ? 'ندارد' : property.bathrooms.toLocaleString('fa-IR'))
                        ) : <ValueFallback value={null} />}
                    </span>
                </ItemContent>
            </Item>

            <Item size="sm" className="rounded-none border-x-0 border-t-0 border-b border-br/40 last:border-0 hover:bg-bg/40 transition-colors">
                <ItemMedia className="text-orange-1/60">
                    <Soup className="size-4" />
                </ItemMedia>
                <ItemContent className="flex-row items-center gap-2">
                    <span className="text-[10px] font-bold text-font-s">آشپزخانه:</span>
                    <span className="text-xs font-black">
                        {property.kitchens !== null && property.kitchens !== undefined ? (
                            getLocalizedFacility('kitchens', property.kitchens)
                        ) : <ValueFallback value={null} />}
                    </span>
                </ItemContent>
            </Item>

            <Item size="sm" className="rounded-none border-x-0 border-t-0 hover:bg-bg/40 transition-colors">
                <ItemMedia className="text-indigo-1/60">
                    <Users className="size-4" />
                </ItemMedia>
                <ItemContent className="flex-row items-center gap-2">
                    <span className="text-[10px] font-bold text-font-s">پذیرایی:</span>
                    <span className="text-xs font-black">
                        {property.living_rooms !== null && property.living_rooms !== undefined ? (
                            getLocalizedFacility('living_rooms', property.living_rooms)
                        ) : <ValueFallback value={null} />}
                    </span>
                </ItemContent>
            </Item>
        </div>
    );
}
