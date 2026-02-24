import type { Property } from "@/types/real_estate/realEstate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { RealEstateStandardAttributes } from "./RealEstateStandardAttributes";
import { RealEstateExtraFields } from "./RealEstateExtraFields";

interface RealEstateAttributesProps {
    property: Property;
}

export function RealEstateAttributes({ property }: RealEstateAttributesProps) {
    const hasAttributes = !!(property.extra_attributes && Object.keys(property.extra_attributes).length > 0);

    if (!hasAttributes) return null;

    return (
        <Card className="gap-0 shadow-sm">
            <CardHeader className="border-b">
                <CardTitle>مشخصات و ویژگی‌های تکمیلی</CardTitle>
            </CardHeader>
            <CardContent className="px-6 py-6">
            <div className="flex flex-col gap-10">
                <RealEstateStandardAttributes property={property} />
                <RealEstateExtraFields property={property} />
            </div>
            </CardContent>
        </Card>
    );
}
