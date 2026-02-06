import { Building2, Compass, MapPin, Key, Layers, Home } from "lucide-react";
import type { Property } from "@/types/real_estate/realEstate";
import { useState, useEffect } from "react";
import { realEstateApi } from "@/api/real-estate/properties";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { EmptyState } from "@/components/shared/EmptyState";

interface ExtraAttributesInfoTabProps {
  property: Property;
}

export function RealEstateAttributes({ property }: ExtraAttributesInfoTabProps) {
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
    building_usage: { label: "نوع کاربری", icon: Building2, color: "text-blue-1" },
    direction: { label: "جهت ملک", icon: Compass, color: "text-orange-1" },
    location_type: { label: "موقعیت جغرافیایی", icon: MapPin, color: "text-emerald-1" },
    property_status: { label: "وضعیت ملک", icon: Key, color: "text-purple-1" },
    unit_number: { label: "شماره واحد", icon: Home, color: "text-pink-1" },
    // Standard keys from extra_attributes
    property_condition: { label: "وضعیت ملک", icon: Building2, color: "text-indigo-1" },
    property_direction: { label: "جهت ملک", icon: Compass, color: "text-orange-1" },
    city_position: { label: "موقعیت در شهر", icon: MapPin, color: "text-emerald-1" },
    unit_type: { label: "نوع واحد", icon: Home, color: "text-pink-1" },
    construction_status: { label: "وضعیت ساخت", icon: Building2, color: "text-blue-1" },
    space_type: { label: "نوع کاربری", icon: Home, color: "text-purple-1" },
  };

  const predefinedKeys = Object.keys(attributeConfigs);
  const extraKeys = Object.keys(extraAttributes);

  const predefinedAttributes = predefinedKeys.filter(key => extraAttributes[key] !== undefined && extraAttributes[key] !== null);
  const customAttributes = extraKeys.filter(key => !predefinedKeys.includes(key));

  const hasAttributes = predefinedAttributes.length > 0 || customAttributes.length > 0;

  const getDisplayValue = (key: string, value: any) => {
    if (value === true) return "دارد";
    if (value === false) return "ندارد";

    // Check for translation in fieldOptions
    if (fieldOptions && fieldOptions[key]) {
      const option = fieldOptions[key].find((opt: any) => opt[0] === value);
      if (option) return option[1];
    }

    return String(value);
  };

  return (
    <CardWithIcon
      icon={Layers}
      title="مشخصات فنی و ثبتی"
      iconBgColor="bg-purple-1/10"
      iconColor="text-purple-1"
      cardBorderColor="border-b-purple-1"
      contentClassName={(!hasAttributes && !isLoading) ? "p-0" : "flex flex-col gap-6 px-5 py-5"}
    >
      {!hasAttributes && !isLoading ? (
        <EmptyState
          title="مشخصات فنی یافت نشد"
          description="هیچ مشخصه فنی برای این ملک ثبت نشده است"
          icon={Layers}
          size="sm"
          fullBleed={true}
        />
      ) : isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-bg/50 animate-pulse rounded-xl border border-br" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {predefinedAttributes.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {predefinedAttributes.map(key => {
                const config = attributeConfigs[key];
                const Icon = config.icon;
                return (
                  <div
                    key={key}
                    className="group relative overflow-hidden flex flex-col p-4 border border-br rounded-xl bg-card hover:border-blue-1/30 transition-all duration-300"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg bg-bg ${config.color} group-hover:scale-110 transition-transform`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-medium text-font-s">{config.label}</span>
                    </div>
                    <div className="text-base font-bold text-font-p mr-10 z-10">
                      {getDisplayValue(key, extraAttributes[key])}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {customAttributes.length > 0 && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {customAttributes.map(key => (
                  <div key={key} className="flex items-center justify-between p-4 border border-br rounded-xl bg-card hover:border-purple-1/30 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-0 flex items-center justify-center">
                        <Key className="w-4 h-4 text-purple-1" />
                      </div>
                      <span className="text-sm font-semibold text-font-p">{key}</span>
                    </div>
                    <div className="bg-bg px-3 py-1 rounded-lg text-xs font-bold text-font-s">
                      {String(extraAttributes[key])}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </CardWithIcon>
  );
}
