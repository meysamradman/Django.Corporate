
import { Key, Layers } from "lucide-react";
import type { Property } from "@/types/real_estate/realEstate";
import { Item, ItemContent, ItemMedia } from "@/components/elements/Item";

interface RealEstateExtraFieldsProps {
    property: Property;
}

export function RealEstateExtraFields({ property }: RealEstateExtraFieldsProps) {
    const extraAttributes = property.extra_attributes || {};

    const attributeConfigs: Record<string, any> = {
        cooling_system: true,
        heating_system: true,
        warm_water_provider: true,
        floor_type: true,
        toilet_type: true,
        kitchen_type: true,
        building_facade: true,
        building_direction: true,
        occupancy_status: true,
        cabinet_material: true,
        building_usage: true,
        direction: true,
        location_type: true,
        property_status: true,
        unit_number: true,
        property_condition: true,
        property_direction: true,
        city_position: true,
        unit_type: true,
        construction_status: true,
        space_type: true,
    };

    const predefinedKeys = Object.keys(attributeConfigs);
    const extraKeys = Object.keys(extraAttributes);
    const customAttributes = extraKeys.filter(key => !predefinedKeys.includes(key));

    const hasCustomAttributes = customAttributes.length > 0;

    if (!hasCustomAttributes) return null;

    return (
        <div className="flex flex-col gap-6">
            <h3 className="text-sm font-bold text-purple-1 flex items-center gap-2 mb-2">
                <Layers className="size-4" />
                سایر اطلاعات و فیلدهای اضافی
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {customAttributes.map(key => (
                    <Item
                        key={key}
                        variant="outline"
                        className="justify-between p-4 bg-card hover:border-purple-1/30 transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <ItemMedia className="size-8 rounded-full bg-purple-0 text-purple-1">
                                <Key className="size-4" />
                            </ItemMedia>
                            <span className="text-sm font-semibold text-font-p">{key}</span>
                        </div>
                        <ItemContent className="flex-none">
                            <div className="bg-bg px-3 py-1 rounded-lg text-xs font-bold text-font-s">
                                {String(extraAttributes[key])}
                            </div>
                        </ItemContent>
                    </Item>
                ))}
            </div>
        </div>
    );
}
