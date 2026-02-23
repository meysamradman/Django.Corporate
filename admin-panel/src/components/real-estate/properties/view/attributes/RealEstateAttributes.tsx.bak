import { Layers } from "lucide-react";
import type { Property } from "@/types/real_estate/realEstate";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { RealEstateStandardAttributes } from "./RealEstateStandardAttributes";
import { RealEstateExtraFields } from "./RealEstateExtraFields";

interface RealEstateAttributesProps {
    property: Property;
}

export function RealEstateAttributes({ property }: RealEstateAttributesProps) {
    const hasAttributes = !!(property.extra_attributes && Object.keys(property.extra_attributes).length > 0);

    if (!hasAttributes) return null;

    return (
        <CardWithIcon
            icon={Layers}
            title="مشخصات و ویژگی‌های تکمیلی"
            iconBgColor="bg-indigo-0/50"
            iconColor="text-indigo-1"
            cardBorderColor="border-b-indigo-1"
            className="shadow-sm"
            contentClassName="px-6 py-6"
        >
            <div className="flex flex-col gap-10">
                <RealEstateStandardAttributes property={property} />
                <RealEstateExtraFields property={property} />
            </div>
        </CardWithIcon>
    );
}
