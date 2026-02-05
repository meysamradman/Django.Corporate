
import { Building2, Compass, MapPin, Key, Info, Layers, Home } from "lucide-react";
import type { Property } from "@/types/real_estate/realEstate";
import { useState, useEffect } from "react";
import { realEstateApi } from "@/api/real-estate/properties";
import { CardWithIcon } from "@/components/elements/CardWithIcon";

interface ExtraAttributesInfoTabProps {
  property: Property;
}

export function RealEstateAttributes({ property }: ExtraAttributesInfoTabProps) {
  const extraAttributes = (property as any)?.extra_attributes || {};
  const attributeKeys = Object.keys(extraAttributes);
  const [valueLabels, setValueLabels] = useState<Record<string, Record<string, string>>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLabels = async () => {
      try {
        setIsLoading(true);
        const options = await realEstateApi.getFieldOptions();
        const extraOptions = options.extra_attributes_options || {};

        const labels: Record<string, Record<string, string>> = {};
        (Object.keys(extraOptions) as Array<keyof typeof extraOptions>).forEach(key => {
          labels[key] = {};
          const items = extraOptions[key];
          if (items) {
            items.forEach((item: [string, string]) => {
              labels[key][item[0]] = item[1];
            });
          }
        });

        setValueLabels(labels);
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    };
    fetchLabels();
  }, []);

  const getDisplayValue = (key: string, value: any): string => {
    return valueLabels[key]?.[value] || String(value);
  };

  const attributeConfigs: Record<string, { label: string; icon: any; color: string }> = {
    property_condition: { label: "وضعیت ملک", icon: Building2, color: "text-blue-1" },
    property_direction: { label: "جهت ملک", icon: Compass, color: "text-orange-1" },
    city_position: { label: "موقعیت در شهر", icon: MapPin, color: "text-red-1" },
    unit_type: { label: "نوع واحد", icon: Layers, color: "text-green-1" },
    construction_status: { label: "وضعیت ساخت", icon: Building2, color: "text-indigo-1" },
    space_type: { label: "نوع کاربری فضا", icon: Home, color: "text-purple-1" },
  };

  const predefinedAttributes = attributeKeys.filter(k => attributeConfigs[k]);
  const customAttributes = attributeKeys.filter(k => !attributeConfigs[k]);
  const hasAttributes = attributeKeys.length > 0;

  if (!hasAttributes && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center bg-bg/30 rounded-2xl border border-dashed border-br">
        <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mb-4">
          <Info className="w-8 h-8 text-font-s" />
        </div>
        <p className="text-sm font-medium text-font-s">هیچ ویژگی اضافی برای این ملک ثبت نشده است</p>
      </div>
    );
  }

  return (
    <CardWithIcon
      icon={Layers}
      title="مشخصات فنی و ثبتی"
      iconBgColor="bg-purple-1/10"
      iconColor="text-purple-1"
      cardBorderColor="border-b-purple-1"
      className=""
      contentClassName="flex flex-col gap-6"
    >
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
    </CardWithIcon>
  );
}
