import { TabsContent } from "@/components/elements/Tabs";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Settings, Home, Building2, Compass, MapPin, Key, Info, Layers } from "lucide-react";
import type { Property } from "@/types/real_estate/realEstate";
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

  if (attributeKeys.length === 0 && !isLoading) {
    return (
      <TabsContent value="advanced">
        <CardWithIcon
          icon={Settings}
          title="فیلدهای اضافی"
          iconBgColor="bg-purple"
          iconColor="stroke-purple-2"
          borderColor="border-b-purple-1"
        >
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mb-4">
              <Info className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-font-m font-medium text-font-p">هیچ ویژگی اضافی ثبت نشده است</p>
            <p className="text-font-s text-muted-foreground mt-1">این ملک فاقد پارامترهای اختصاصی JSON می‌باشد.</p>
          </div>
        </CardWithIcon>
      </TabsContent>
    );
  }

  return (
    <TabsContent value="advanced" className="space-y-6 mt-0 outline-none">
      {predefinedAttributes.length > 0 && (
        <CardWithIcon
          icon={Building2}
          title="مشخصات و ویژگی‌های استاندارد"
          iconBgColor="bg-indigo"
          iconColor="stroke-indigo-2"
          borderColor="border-b-indigo-1"
        >
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
                  <div className="text-font-m font-bold text-font-p mr-10">
                    {getDisplayValue(key, extraAttributes[key])}
                  </div>
                  <div className="absolute top-0 right-0 w-16 h-16 -mr-8 -mt-8 bg-muted/5 rounded-full" />
                </div>
              );
            })}
          </div>
        </CardWithIcon>
      )}

      {customAttributes.length > 0 && (
        <CardWithIcon
          icon={Key}
          title="سایر اطلاعات اختصاصی"
          iconBgColor="bg-purple"
          iconColor="stroke-purple-2"
          borderColor="border-b-purple-1"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customAttributes.map(key => (
              <div
                key={key}
                className="flex items-center justify-between p-4 border border-br rounded-xl bg-wt hover:border-purple-1/30 transition-colors"
              >
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
        </CardWithIcon>
      )}

      <div className="flex items-center gap-2 p-4 bg-blue-0/10 border border-blue-1/20 rounded-xl">
        <Settings className="w-5 h-5 text-blue-1" />
        <span className="font-medium text-blue-2">
          تمام {attributeKeys.length} خصوصیت فوق در فیلد JSON ذخیره شده و در وب‌سایت قابل فیلتر شدن هستند.
        </span>
      </div>
    </TabsContent>
  );
}
