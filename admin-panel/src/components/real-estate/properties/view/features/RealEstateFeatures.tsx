
import { LayoutGrid, Check } from "lucide-react";
import type { Property } from "@/types/real_estate/realEstate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { EmptyState } from "@/components/shared/EmptyState";
import { Item, ItemContent, ItemMedia } from "@/components/elements/Item";

interface RealEstateFeaturesProps {
    property: Property;
}

export function RealEstateFeatures({ property }: RealEstateFeaturesProps) {
    const hasFeatures = property.features && property.features.length > 0;

    return (
        <Card className="gap-0">
            <CardHeader className="border-b">
                <CardTitle>ویژگی‌ها و امکانات</CardTitle>
            </CardHeader>
            <CardContent className={!hasFeatures ? "p-0" : ""}>
            {hasFeatures ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-x-12 gap-y-4 py-2 px-5">
                    {property.features.map((feature) => (
                        <Item
                            key={feature.id}
                            className="p-0 border-0 hover:bg-transparent"
                        >
                            <ItemMedia className="size-5 rounded-full bg-emerald-0 text-emerald-1 group-hover:scale-110 transition-transform mt-0.5">
                                <Check className="size-3 stroke-3" />
                            </ItemMedia>
                            <ItemContent className="flex-none">
                                <span className="text-[13.5px] font-bold text-font-p group-hover:text-blue-1 transition-colors leading-relaxed">
                                    {feature.title}
                                </span>
                            </ItemContent>
                        </Item>
                    ))}
                </div>
            ) : (
                <EmptyState
                    title="ویژگی‌ای یافت نشد"
                    description="هیچ ویژگی برای این ملک ثبت نشده است"
                    icon={LayoutGrid}
                    size="sm"
                    fullBleed={true}
                />
            )}
            </CardContent>
        </Card>
    );
}
