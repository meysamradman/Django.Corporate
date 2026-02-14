
import { Card } from "@/components/elements/Card";
import type { Property } from "@/types/real_estate/realEstate";
import { RealEstateTitle } from "./RealEstateTitle";
import { RealEstateActions } from "../actions/RealEstateActions";

interface RealEstateHeaderProps {
    property: Property;
    onPrint: () => void;
    onPdf: () => void;
    isExportingPdf: boolean;
    onFinalized?: () => void;
}

export function RealEstateHeader({
    property,
    onPrint,
    onPdf,
    isExportingPdf,
    onFinalized,
}: RealEstateHeaderProps) {
    return (
        <Card className="flex-row items-center justify-between gap-4 p-4 lg:px-6 py-4.5 relative overflow-hidden border-br shadow-xs shrink-0 bg-card">
            <div className="absolute top-0 right-0 w-full h-[3px] bg-linear-to-r from-blue-1/40 via-purple-1/40 to-pink-1/40" />
            <RealEstateTitle property={property} />
            <RealEstateActions
                property={property}
                propertyId={String(property.id)}
                onPrint={onPrint}
                onPdf={onPdf}
                isExportingPdf={isExportingPdf}
                onFinalized={onFinalized}
            />
        </Card>
    );
}
