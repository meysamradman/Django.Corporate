import { TabsContent } from "@/components/elements/Tabs";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Settings, Home, Building2, Compass, MapPin } from "lucide-react";
import { Badge } from "@/components/elements/Badge";
import type { Property } from "@/types/real_estate/realEstate";
import { useState, useEffect } from "react";
import { realEstateApi } from "@/api/real-estate/properties";

interface ExtraAttributesInfoTabProps {
  property: Property;
}

export function ExtraAttributesInfoTab({ property }: ExtraAttributesInfoTabProps) {
  const extraAttributes = (property as any)?.extra_attributes || {};
  const attributeKeys = Object.keys(extraAttributes);
  const [valueLabels, setValueLabels] = useState<Record<string, Record<string, string>>>({});

  // دریافت labels از API برای تبدیل کد به فارسی
  useEffect(() => {
    const fetchLabels = async () => {
      try {
        const options = await realEstateApi.getFieldOptions();
        const extraOptions = options.extra_attributes_options || {};
        
        // تبدیل به فرمت Record<string, Record<string, string>>
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
        console.error('Error fetching labels:', error);
      }
    };
    fetchLabels();
  }, []);

  if (attributeKeys.length === 0) {
    return (
      <TabsContent value="advanced">
        <CardWithIcon
          icon={Settings}
          title="فیلدهای اضافی"
          iconBgColor="bg-purple"
          iconColor="stroke-purple-2"
          borderColor="border-b-purple-1"
        >
          <div className="text-center py-8 text-font-m text-gray-500">
            هیچ ویژگی اضافی برای این ملک ثبت نشده است
          </div>
        </CardWithIcon>
      </TabsContent>
    );
  }

  // نقشه برای نمایش لیبل‌های فارسی
  const attributeLabels: Record<string, { label: string; icon: any }> = {
    property_condition: { label: "وضعیت ملک", icon: Building2 },
    property_direction: { label: "جهت ملک", icon: Compass },
    city_position: { label: "موقعیت شهری", icon: MapPin },
    unit_type: { label: "نوع واحد", icon: Home },
    construction_status: { label: "وضعیت ساخت", icon: Building2 },
    space_type: { label: "نوع کاربری فضا", icon: Home },
  };

  // تابع ساده برای تبدیل کد به لیبل
  const getDisplayValue = (key: string, value: any): string => {
    return valueLabels[key]?.[value] || String(value);
  };

  // جداسازی ویژگی‌های از پیش تعریف شده و دلخواه
  const predefinedAttributes: Record<string, any> = {};
  const customAttributes: Record<string, any> = {};

  attributeKeys.forEach(key => {
    if (attributeLabels[key]) {
      predefinedAttributes[key] = extraAttributes[key];
    } else {
      customAttributes[key] = extraAttributes[key];
    }
  });

  return (
    <TabsContent value="advanced" className="space-y-4">
      {/* ویژگی‌های از پیش تعریف شده */}
      {Object.keys(predefinedAttributes).length > 0 && (
        <CardWithIcon
          icon={Settings}
          title="ویژگی‌های استاندارد"
          iconBgColor="bg-purple"
          iconColor="stroke-purple-2"
          borderColor="border-b-purple-1"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(predefinedAttributes).map(([key, value]) => {
              const config = attributeLabels[key];
              const Icon = config?.icon || Settings;
              
              return (
                <div
                  key={key}
                  className="flex items-start gap-3 p-4 rounded-lg border border-br bg-card-hover"
                >
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-lg bg-purple/10 flex items-center justify-center">
                      <Icon className="h-4 w-4 stroke-purple-2" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-font-s text-gray-600 mb-1">
                      {config?.label || key}
                    </div>
                    <div className="text-font-m font-medium text-gray-900">
                      {getDisplayValue(key, value) || "-"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardWithIcon>
      )}

      {/* ویژگی‌های دلخواه */}
      {Object.keys(customAttributes).length > 0 && (
        <CardWithIcon
          icon={Settings}
          title="ویژگی‌های دلخواه"
          iconBgColor="bg-blue"
          iconColor="stroke-blue-2"
          borderColor="border-b-blue-1"
        >
          <div className="flex flex-wrap gap-3">
            {Object.entries(customAttributes).map(([key, value]) => (
              <div
                key={key}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-br bg-card-hover"
              >
                <span className="text-font-s font-medium text-gray-700">
                  {key}:
                </span>
                <span className="text-font-m text-gray-900">
                  {value || "-"}
                </span>
              </div>
            ))}
          </div>
        </CardWithIcon>
      )}

      {/* نمایش همه ویژگی‌ها به صورت Badge */}
      <CardWithIcon
        icon={Settings}
        title="خلاصه تمام ویژگی‌ها"
        iconBgColor="bg-gray-500"
        iconColor="stroke-white"
        borderColor="border-b-gray-300"
      >
        <div className="flex flex-wrap gap-2">
          {attributeKeys.map(key => {
            const config = attributeLabels[key];
            const value = extraAttributes[key];
            
            return (
              <Badge
                key={key}
                variant="outline"
                className="px-3 py-1.5 text-font-s"
              >
                <span className="font-medium">
                  {config?.label || key}:
                </span>
                <span className="mr-1">
                  {getDisplayValue(key, value) || "-"}
                </span>
              </Badge>
            );
          })}
        </div>
      </CardWithIcon>
    </TabsContent>
  );
}
