
import { FileText } from "lucide-react";
import type { Property } from "@/types/real_estate/realEstate";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { RealEstateShortDesc } from "./RealEstateShortDesc";
import { RealEstateFullDesc } from "./RealEstateFullDesc";

interface PropertyDescriptionsProps {
    property: Property;
}

export function RealEstateDescriptions({ property }: PropertyDescriptionsProps) {
    if (!property) return null;

    return (
        <CardWithIcon
            icon={FileText}
            title="توضیحات و جزئیات تکمیلی"
            iconBgColor="bg-orange-0/50"
            iconColor="text-orange-1"
            cardBorderColor="border-b-orange-1"
            className="shadow-sm"
            contentClassName="px-6 py-6"
        >
            <div className="flex flex-col gap-8">
                <RealEstateShortDesc property={property} />
                <RealEstateFullDesc property={property} />
            </div>
        </CardWithIcon>
    );
}
