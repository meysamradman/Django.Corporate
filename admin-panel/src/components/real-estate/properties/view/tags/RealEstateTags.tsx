
import { Hash } from "lucide-react";
import type { Property } from "@/types/real_estate/realEstate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/elements/Badge";

interface RealEstateTagsProps {
    property: Property;
}

export function RealEstateTags({ property }: RealEstateTagsProps) {
    const tags = property.tags || [];

    return (
        <Card className="gap-0">
            <CardHeader className="border-b">
                <CardTitle>برچسب‌ها</CardTitle>
            </CardHeader>
            <CardContent className={tags.length === 0 ? "p-0" : "flex flex-wrap gap-2 p-5"}>
            {tags.length > 0 ? (
                tags.map((tag: any, index: number) => (
                    <Badge key={index} variant="outline" className="border-blue-1/20 text-blue-1 hover:bg-blue-0">
                        #{tag.title || tag.name || tag}
                    </Badge>
                ))
            ) : (
                <EmptyState
                    title="برچسبی یافت نشد"
                    description="هیچ برچسبی برای این ملک ثبت نشده است"
                    icon={Hash}
                    size="sm"
                    fullBleed={true}
                />
            )}
            </CardContent>
        </Card>
    );
}
