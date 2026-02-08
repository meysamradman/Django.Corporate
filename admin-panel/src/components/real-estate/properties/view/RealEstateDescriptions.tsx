
import type { Property } from "@/types/real_estate/realEstate";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { ReadMore } from "@/components/elements/ReadMore";
import { EmptyState } from "@/components/shared/EmptyState";
import { ValueFallback } from "@/components/shared/ValueFallback";
import { FileText } from "lucide-react";

interface PropertyDescriptionsProps {
    property: Property;
}

export function RealEstateDescriptions({ property }: PropertyDescriptionsProps) {
    return (
        <CardWithIcon
            icon={FileText}
            title="توضیحات و جزئیات تکمیلی"
            iconBgColor="bg-orange-0/50"
            iconColor="text-orange-1"
            cardBorderColor="border-b-orange-1"
            className="shadow-sm"
            contentClassName=""
        >
            <div className="flex flex-col gap-6">
                <div>
                    <label className="text-[10px] font-bold text-font-s tracking-wider mb-2 block">
                        توضیحات کوتاه
                    </label>
                    <div className="text-sm text-font-p border-r-2 border-blue-1/30 pr-4 leading-relaxed">
                        {property.short_description || <ValueFallback value={null} fallback="توضیح کوتاهی برای این ملک ثبت نشده است" />}
                    </div>
                </div>

                <div>
                    <label className="text-[10px] font-bold text-font-s tracking-wider mb-2 block">
                        توضیحات کامل
                    </label>
                    <div className="text-sm text-font-p bg-bg/50 rounded-xl overflow-hidden leading-loose">
                        {property.description ? (
                            <div className="p-5">
                                <ReadMore content={property.description} isHTML={true} maxHeight="200px" />
                            </div>
                        ) : (
                            <EmptyState
                                title="توضیحاتی ثبت نشده است"
                                description="هیچ توضیحات تکمیلی برای این ملک در سیستم موجود نیست"
                                icon={FileText}
                                size="sm"
                                fullBleed={true}
                            />
                        )}
                    </div>
                </div>
            </div>
        </CardWithIcon>
    );
}
