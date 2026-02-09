import { Info } from "lucide-react";
import type { Property } from "@/types/real_estate/realEstate";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { RealEstateDetailsDimensions } from "./RealEstateDetailsDimensions";
import { RealEstateDetailsFacilities } from "./RealEstateDetailsFacilities";
import { RealEstateDetailsFinancial } from "./RealEstateDetailsFinancial";

interface PropertyDetailsCardProps {
    property: Property;
}

export function RealEstateDetails({ property }: PropertyDetailsCardProps) {
    return (
        <CardWithIcon
            icon={Info}
            title="جزئیات و مشخصات ملک"
            iconBgColor="bg-blue-0/50"
            iconColor="text-blue-1"
            cardBorderColor="border-b-blue-1"
            className="shadow-sm"
            contentClassName=""
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-0 text-font-p">
                <RealEstateDetailsDimensions property={property} />
                <RealEstateDetailsFacilities property={property} />
                <RealEstateDetailsFinancial property={property} />
            </div>
        </CardWithIcon>
    );
}
