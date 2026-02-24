
import { Tag } from "lucide-react";
import type { Property } from "@/types/real_estate/realEstate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/elements/Badge";

interface RealEstateLabelsProps {
    property: Property;
}

export function RealEstateLabels({ property }: RealEstateLabelsProps) {
    const labels = property.labels || [];

    return (
        <Card className="gap-0">
            <CardHeader className="border-b">
                <CardTitle>نشانه‌ها</CardTitle>
            </CardHeader>
            <CardContent className={labels.length === 0 ? "p-0" : "flex flex-wrap gap-2 p-5"}>
            {labels.length > 0 ? (
                labels.map((label: any, index: number) => (
                    <Badge key={index} variant="pink" className="bg-pink-0 text-pink-2 hover:bg-pink-1/20 border-pink-1/20">
                        {label.title || label.name || label}
                    </Badge>
                ))
            ) : (
                <EmptyState
                    title="نشانه‌ای یافت نشد"
                    description="هیچ نشانه‌ای برای این ملک ثبت نشده است"
                    icon={Tag}
                    size="sm"
                    fullBleed={true}
                />
            )}
            </CardContent>
        </Card>
    );
}
