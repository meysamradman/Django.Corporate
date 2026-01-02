import { TabsContent } from "@/components/elements/Tabs";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Settings } from "lucide-react";
import { Badge } from "@/components/elements/Badge";
import type { Portfolio } from "@/types/portfolio/portfolio";

interface ExtraAttributesInfoTabProps {
  portfolio: Portfolio;
}

export function ExtraAttributesInfoTab({ portfolio }: ExtraAttributesInfoTabProps) {
  const extraAttributes = portfolio?.extra_attributes || {};
  const attributeKeys = Object.keys(extraAttributes);

  if (attributeKeys.length === 0) {
    return (
      <TabsContent value="extra">
        <CardWithIcon
          icon={Settings}
          title="فیلدهای اضافی"
          iconBgColor="bg-purple"
          iconColor="stroke-purple-2"
          borderColor="border-b-purple-1"
        >
          <div className="text-center py-8 text-font-m text-font-s">
            هیچ ویژگی اضافی برای این نمونه‌کار ثبت نشده است
          </div>
        </CardWithIcon>
      </TabsContent>
    );
  }

  return (
    <TabsContent value="extra" className="space-y-4">
      <CardWithIcon
        icon={Settings}
        title="ویژگی‌های اضافی"
        iconBgColor="bg-purple"
        iconColor="stroke-purple-2"
        borderColor="border-b-purple-1"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(extraAttributes).map(([key, value]) => (
            <div
              key={key}
              className="flex items-start gap-3 p-4 border border-br bg-card-hover"
            >
              <div className="flex-1 min-w-0">
                <div className="text-font-s text-font-s mb-1">
                  {key}
                </div>
                <div className="text-font-m font-medium text-font-p">
                  {value ? String(value) : "-"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardWithIcon>

      {/* نمایش همه ویژگی‌ها به صورت Badge */}
      <CardWithIcon
        icon={Settings}
        title="خلاصه تمام ویژگی‌ها"
        iconBgColor="bg-gray-1"
        iconColor="stroke-wt"
        borderColor="border-b-gray-1"
      >
        <div className="flex flex-wrap gap-2">
          {attributeKeys.map(key => {
            const value = extraAttributes[key];
            
            return (
              <Badge
                key={key}
                variant="outline"
                className="px-3 py-1.5 text-font-s"
              >
                <span className="font-medium">
                  {key}:
                </span>
                <span className="mr-1">
                  {value ? String(value) : "-"}
                </span>
              </Badge>
            );
          })}
        </div>
      </CardWithIcon>
    </TabsContent>
  );
}

