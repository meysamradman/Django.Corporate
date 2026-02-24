
import type { Property } from "@/types/real_estate/realEstate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { RealEstateShortDesc } from "./RealEstateShortDesc";
import { RealEstateFullDesc } from "./RealEstateFullDesc";

interface PropertyDescriptionsProps {
    property: Property;
}

export function RealEstateDescriptions({ property }: PropertyDescriptionsProps) {
    if (!property) return null;

    return (
        <Card className="gap-0 shadow-sm">
            <CardHeader className="border-b">
                <CardTitle>توضیحات و جزئیات تکمیلی</CardTitle>
            </CardHeader>
            <CardContent className="px-6 py-6">
            <div className="flex flex-col gap-8">
                <RealEstateShortDesc property={property} />
                <RealEstateFullDesc property={property} />
            </div>
            </CardContent>
        </Card>
    );
}
