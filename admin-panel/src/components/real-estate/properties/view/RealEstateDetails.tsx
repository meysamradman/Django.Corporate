
import { useQuery } from "@tanstack/react-query";
import type { Property } from "@/types/real_estate/realEstate";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Item, ItemContent, ItemMedia } from "@/components/elements/Item";
import { ValueFallback } from "@/components/shared/ValueFallback";
import { formatArea, formatPriceToPersian } from "@/core/utils/realEstateFormat";
import { msg } from "@/core/messages";
import { realEstateApi } from "@/api/real-estate";
import {
    Info,
    Activity,
    Eye,
    Hash,
    Home,
    Maximize2,
    DollarSign,
    CreditCard,
    Building2,
    Soup,
    Users,
    Package,
    Layers,
    Calendar,
    Briefcase,
    ShieldCheck
} from "lucide-react";

interface PropertyDetailsCardProps {
    property: Property;
}

export function RealEstateDetailsCard({ property }: PropertyDetailsCardProps) {
    const { data: fieldOptions } = useQuery({
        queryKey: ["property-field-options"],
        queryFn: () => realEstateApi.getFieldOptions(),
        staleTime: 1000 * 60 * 30, // 30 minutes
    });

    const getLocalizedValue = (field: string, value: any) => {
        if (!fieldOptions || value === null || value === undefined) return value;
        const options = (fieldOptions as any)[field] as [any, string][];
        if (!options) return value;
        const option = options.find(opt => opt[0] === value);
        return option ? option[1] : value;
    };

    return (
        <CardWithIcon
            icon={Info}
            title="جزئیات و مشخصات ملک"
            iconBgColor="bg-blue-0/50"
            iconColor="text-blue-1"
            cardBorderColor="border-b-blue-1"
            className="shadow-sm"
            contentClassName=""
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-0 text-font-p">
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
                                    (msg.realEstate().facilities.bedrooms as any)[property.bedrooms] || property.bedrooms.toLocaleString('fa-IR')
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
                                    (msg.realEstate().facilities.bathrooms as any)[property.bathrooms] || (property.bathrooms === 0 ? 'ندارد' : property.bathrooms.toLocaleString('fa-IR'))
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
                                    (msg.realEstate().facilities.kitchens as any)[property.kitchens] || property.kitchens.toLocaleString('fa-IR')
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
                                    (msg.realEstate().facilities.living_rooms as any)[property.living_rooms] || property.living_rooms.toLocaleString('fa-IR')
                                ) : <ValueFallback value={null} />}
                            </span>
                        </ItemContent>
                    </Item>
                </div>

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
            </div>
        </CardWithIcon>
    );
}
