import type { Property } from "@/types/real_estate/realEstate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { RealEstateDetailsDimensions } from "./RealEstateDetailsDimensions";
import { RealEstateDetailsFacilities } from "./RealEstateDetailsFacilities";
import { RealEstateDetailsFinancial } from "./RealEstateDetailsFinancial";

interface PropertyDetailsCardProps {
    property: Property;
}

export function RealEstateDetails({ property }: PropertyDetailsCardProps) {
    return (
        <Card className="gap-0 shadow-sm">
            <CardHeader className="border-b">
                <CardTitle>جزئیات و مشخصات ملک</CardTitle>
            </CardHeader>
            <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-0 text-font-p">
                <RealEstateDetailsDimensions property={property} />
                <RealEstateDetailsFacilities property={property} />
                <RealEstateDetailsFinancial property={property} />
            </div>
            </CardContent>
        </Card>
    );
}
