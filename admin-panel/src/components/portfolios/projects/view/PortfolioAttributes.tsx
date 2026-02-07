import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Settings } from "lucide-react";
import type { Portfolio } from "@/types/portfolio/portfolio";
import { EmptyState } from "@/components/shared/EmptyState";

interface ExtraAttributesInfoTabProps {
  portfolio: Portfolio;
}

export function PortfolioAttributes({ portfolio }: ExtraAttributesInfoTabProps) {
  const extraAttributes = portfolio?.extra_attributes || {};
  const attributeKeys = Object.keys(extraAttributes);

  return (
    <CardWithIcon
      icon={Settings}
      title="ویژگی‌های اختصاصی پروژه"
      id="section-attributes"
      iconBgColor="bg-purple-0/50"
      iconColor="text-purple-1"
      cardBorderColor="border-b-purple-1"
      className="shadow-sm"
    >
      {attributeKeys.length > 0 ? (
        <div className="flex flex-col">
          {Object.entries(extraAttributes).map(([key, value], index) => (
            <div
              key={key}
              className={`flex items-center justify-between p-5 ${index !== attributeKeys.length - 1 ? "border-b border-br/30" : ""
                } hover:bg-bg/40 transition-colors`}
            >
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-font-s opacity-40 tracking-wider uppercase">
                  {key}
                </span>
                <span className="text-font-p text-xs font-black">
                  {value ? String(value) : "-"}
                </span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-bg flex items-center justify-center border border-br/50 shadow-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-1" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="ویژگی اختصاصی یافت نشد"
          description="ویژگی اختصاصی برای این پروژه ثبت نشده است"
          icon={Settings}
          size="sm"
          fullBleed={true}
        />
      )}
    </CardWithIcon>
  );
}

