
import { Building2, Compass, MapPin, Key, Home, Snowflake, Flame, Bath, ChefHat, Landmark, Sofa } from "lucide-react";
import type { Property } from "@/types/real_estate/realEstate";
import { useState, useEffect } from "react";
import { realEstateApi } from "@/api/real-estate";
import { Item, ItemContent, ItemMedia } from "@/components/elements/Item";

interface RealEstateStandardAttributesProps {
    property: Property;
}

export function RealEstateStandardAttributes({ property }: RealEstateStandardAttributesProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [fieldOptions, setFieldOptions] = useState<any>(null);
    const extraAttributes = property.extra_attributes || {};

    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                setIsLoading(true);
                const options = await realEstateApi.getFieldOptions();
                setFieldOptions(options.extra_attributes_options || {});
            } catch (error) {
                console.error("Error fetching field options:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchMetadata();
    }, []);

    const attributeConfigs: Record<string, any> = {
        cooling_system: { label: "سرمایش", icon: Snowflake, color: "text-cyan-1" },
        heating_system: { label: "گرمایش", icon: Flame, color: "text-red-1" },
        warm_water_provider: { label: "تامین‌کننده آب گرم", icon: Bath, color: "text-blue-1" },
        floor_type: { label: "جنس کف", icon: Home, color: "text-emerald-1" },
        toilet_type: { label: "سرویس بهداشتی", icon: Bath, color: "text-indigo-1" },
        kitchen_type: { label: "نوع آشپزخانه", icon: ChefHat, color: "text-orange-1" },
        building_facade: { label: "نمای ساختمان", icon: Landmark, color: "text-font-s" },
        building_direction: { label: "جهت ساختمان", icon: Compass, color: "text-orange-1" },
        occupancy_status: { label: "وضعیت سکونت", icon: Home, color: "text-purple-1" },
        cabinet_material: { label: "جنس کابینت", icon: Sofa, color: "text-pink-1" },
        building_usage: { label: "نوع کاربری", icon: Building2, color: "text-blue-1" },
        direction: { label: "جهت ملک", icon: Compass, color: "text-orange-1" },
        location_type: { label: "موقعیت جغرافیایی", icon: MapPin, color: "text-emerald-1" },
        property_status: { label: "نوع معامله", icon: Key, color: "text-purple-1" },
        unit_number: { label: "شماره واحد", icon: Home, color: "text-pink-1" },
        property_condition: { label: "وضعیت ملک", icon: Building2, color: "text-indigo-1" },
        property_direction: { label: "جهت ملک", icon: Compass, color: "text-orange-1" },
        city_position: { label: "موقعیت در شهر", icon: MapPin, color: "text-emerald-1" },
        unit_type: { label: "نوع واحد", icon: Home, color: "text-pink-1" },
        construction_status: { label: "وضعیت ساخت", icon: Building2, color: "text-blue-1" },
        space_type: { label: "نوع کاربری", icon: Home, color: "text-purple-1" },
    };

    const predefinedKeys = Object.keys(attributeConfigs);
    const predefinedAttributes = predefinedKeys.filter(key => extraAttributes[key] !== undefined && extraAttributes[key] !== null);

    const getDisplayValue = (key: string, value: any) => {
        if (Array.isArray(value)) {
            const labels = value.map((item) => {
                if (fieldOptions && fieldOptions[key]) {
                    const option = fieldOptions[key].find((opt: any) => opt[0] === item);
                    return option ? option[1] : String(item);
                }
                return String(item);
            });
            return labels.join("، ");
        }

        if (value === true) return "دارد";
        if (value === false) return "ندارد";

        if (fieldOptions && fieldOptions[key]) {
            const option = fieldOptions[key].find((opt: any) => opt[0] === value);
            if (option) return option[1];
        }

        return String(value);
    };

    if (predefinedAttributes.length === 0 && !isLoading) return null;

    return (
        <div className="flex flex-col gap-6">
            <h3 className="text-sm font-bold text-indigo-1 flex items-center gap-2 mb-2">
                <Building2 className="size-4" />
                مشخصات تکمیلی (استاندارد)
            </h3>
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 bg-bg/50 animate-pulse rounded-xl border border-br" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {predefinedAttributes.map(key => {
                        const config = attributeConfigs[key];
                        const Icon = config.icon;
                        return (
                            <Item
                                key={key}
                                variant="outline"
                                className="flex-col items-start p-4 bg-card hover:border-blue-1/30 transition-all duration-300 gap-3"
                            >
                                <div className="flex items-center gap-3 w-full">
                                    <ItemMedia className={`bg-bg p-2 h-auto w-auto rounded-lg ${config.color} group-hover:scale-110 transition-transform`}>
                                        <Icon className="size-4" />
                                    </ItemMedia>
                                    <span className="text-xs font-medium text-font-s">{config.label}</span>
                                </div>
                                <ItemContent className="w-full">
                                    <div className="text-base font-bold text-font-p z-10 w-full text-left rtl:text-right">
                                        {getDisplayValue(key, extraAttributes[key])}
                                    </div>
                                </ItemContent>
                            </Item>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
