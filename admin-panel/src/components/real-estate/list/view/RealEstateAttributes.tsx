
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Settings, Home, Building2, Compass, MapPin, Key, Info, Layers } from "lucide-react";
import type { Property } from "@/types/real_estate/realEstate";
import type { PropertyFeature } from "@/types/real_estate/feature/realEstateFeature";
import { useState, useEffect } from "react";
import { realEstateApi } from "@/api/real-estate/properties";

interface ExtraAttributesInfoTabProps {
  property: Property;
}

export function RealEstateAttributes({ property }: ExtraAttributesInfoTabProps) {
  const extraAttributes = (property as any)?.extra_attributes || {};
  const attributeKeys = Object.keys(extraAttributes);
  const [valueLabels, setValueLabels] = useState<Record<string, Record<string, string>>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Features Logic
  const features = property.features || [];

  const groupedFeatures = features.reduce((acc, feature: PropertyFeature) => {
    const group = feature.group || "سایر امکانات";
    if (!acc[group]) acc[group] = [];
    acc[group].push(feature);
    return acc;
  }, {} as Record<string, PropertyFeature[]>);

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
  const hasFeatures = features.length > 0;
  const hasAttributes = attributeKeys.length > 0;

  if (!hasFeatures && !hasAttributes && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center bg-bg-2/30 rounded-xl border border-dashed border-br">
        <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mb-4">
          <Info className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-font-m font-medium text-font-p">هیچ ویژگی یا امکاناتی برای این ملک ثبت نشده است</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">

      {/* 1. Property Features (Amenities) */}
      {hasFeatures && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
          {Object.entries(groupedFeatures).map(([group, groupFeatures]) => (
            <div key={group} className="space-y-4">
              <h3 className="text-base font-bold text-font-p border-b border-br pb-2 mb-2 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-blue-500 rounded-sm" />
                {group}
              </h3>
              <ul className="space-y-3">
                {(groupFeatures as PropertyFeature[]).map(feature => (
                  <li key={feature.id} className="flex items-start gap-2.5 text-sm text-font-s font-medium group">
                    <div className="mt-0.5 p-0.5 rounded-full bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <span className="group-hover:text-font-p transition-colors">{feature.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Divider if both exist */}
      {hasFeatures && hasAttributes && <div className="border-t border-dashed border-br" />}

      {/* 2. Extra Attributes (Specs) */}
      {hasAttributes && (
        <div className="space-y-6">
          {predefinedAttributes.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {predefinedAttributes.map(key => {
                const config = attributeConfigs[key];
                const Icon = config.icon;
                return (
                  <div
                    key={key}
                    className="group relative overflow-hidden flex flex-col p-4 border border-br rounded-xl bg-wt hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg bg-muted/20 ${config.color} group-hover:scale-110 transition-transform`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-font-s font-medium text-muted-foreground">{config.label}</span>
                    </div>
                    <div className="text-font-m font-bold text-font-p mr-10 z-10">
                      {getDisplayValue(key, extraAttributes[key])}
                    </div>
                    <div className="absolute top-0 right-0 w-16 h-16 -mr-8 -mt-8 bg-muted/5 rounded-full z-0" />
                  </div>
                );
              })}
            </div>
          )}

          {customAttributes.length > 0 && (
            <div>
              {!predefinedAttributes.length && (
                <h3 className="text-base font-bold text-font-p mb-5 flex items-center gap-2 mt-4">
                  <div className="w-1.5 h-4 bg-purple-500 rounded-sm" />
                  سایر خصوصیات
                </h3>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customAttributes.map(key => (
                  <div key={key} className="flex items-center justify-between p-4 border border-br rounded-xl bg-wt hover:border-purple-1/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-0 flex items-center justify-center">
                        <Key className="w-4 h-4 text-purple-1" />
                      </div>
                      <span className="text-font-m font-semibold text-font-p">{key}</span>
                    </div>
                    <div className="bg-muted/30 px-3 py-1 rounded-lg text-font-s font-bold">
                      {String(extraAttributes[key])}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
