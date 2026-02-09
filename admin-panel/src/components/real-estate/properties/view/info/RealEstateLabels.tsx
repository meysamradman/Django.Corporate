
import { Tag } from "lucide-react";
import type { Property } from "@/types/real_estate/realEstate";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/elements/Badge";

interface RealEstateLabelsProps {
    property: Property;
}

export function RealEstateLabels({ property }: RealEstateLabelsProps) {
    // Assuming 'labels' exists in property or similar functionality
    const labels = property.labels || [];

    return (
        <CardWithIcon
            icon={Tag}
            title="برچسب‌ها"
            iconBgColor="bg-pink-1/10"
            iconColor="text-pink-1"
            cardBorderColor="border-b-pink-1"
            contentClassName={labels.length === 0 ? "p-0" : "flex flex-wrap gap-2 p-5"}
        >
            {labels.length > 0 ? (
                labels.map((label: any, index: number) => (
                    <Badge key={index} variant="secondary" className="bg-pink-0 text-pink-2 hover:bg-pink-1/20 border-pink-1/20">
                        {label.title || label.name || label}
                    </Badge>
                ))
            ) : (
                <EmptyState
                    title="برچسبی یافت نشد"
                    description="هیچ برچسبی برای این ملک ثبت نشده است"
                    icon={Tag}
                    size="sm"
                    fullBleed={true}
                />
            )}
        </CardWithIcon>
    );
}
