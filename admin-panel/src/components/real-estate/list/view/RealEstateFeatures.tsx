import { LayoutGrid, Check } from "lucide-react";
import type { Property } from "@/types/real_estate/realEstate";
import { CardWithIcon } from "@/components/elements/CardWithIcon";

interface PropertyFeaturesProps {
    property: Property;
}

export function RealEstateFeatures({ property }: PropertyFeaturesProps) {
    if (!property.features || property.features.length === 0) {
        return null;
    }

    return (
        <CardWithIcon
            icon={LayoutGrid}
            title="ویژگی‌ها و امکانات"
            iconBgColor="bg-blue-1/10"
            iconColor="text-blue-1"
            cardBorderColor="border-b-blue-1"
        >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-x-12 gap-y-4 py-2">
                {property.features.map((feature) => (
                    <div
                        key={feature.id}
                        className="flex items-start gap-3 group transition-smooth"
                    >
                        <div className="shrink-0 mt-0.5">
                            <div className="flex items-center justify-center size-5 rounded-full bg-emerald-0 text-emerald-1 group-hover:scale-110 transition-transform">
                                <Check className="size-3 stroke-3" />
                            </div>
                        </div>

                        <span className="text-[13.5px] font-bold text-font-p group-hover:text-blue-1 transition-colors leading-relaxed">
                            {feature.title}
                        </span>
                    </div>
                ))}
            </div>
        </CardWithIcon>
    );
}
