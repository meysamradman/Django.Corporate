import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Building2, Check } from "lucide-react";
import type { Property } from "@/types/real_estate/realEstate";
import { mediaService } from "@/components/media/services";

interface PropertyFeaturesProps {
    property: Property;
}

export function RealEstateFeatures({ property }: PropertyFeaturesProps) {
    if (!property.features || property.features.length === 0) {
        return null;
    }

    return (
        <CardWithIcon
            icon={Building2}
            title="ویژگی‌ها و امکانات"
            iconBgColor="bg-teal"
            iconColor="stroke-teal-2"
            borderColor="border-b-teal-1"
            contentClassName="space-y-0"
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-8">
                {property.features.map((feature) => {
                    const imageUrl = feature.image?.file_url || feature.image_url;

                    const fullImageUrl = imageUrl
                        ? mediaService.getMediaUrlFromObject({ file_url: imageUrl } as any)
                        : null;

                    return (
                        <div
                            key={feature.id}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-bg-2/50 transition-colors group"
                        >
                            <div className="shrink-0">
                                {fullImageUrl ? (
                                    <div className="relative w-6 h-6">
                                        <img
                                            src={fullImageUrl}
                                            alt={feature.title}
                                            className="w-full h-full object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-5 h-5 rounded-full border-2 border-gray-1 flex items-center justify-center bg-white">
                                        <Check className="w-3 h-3 text-green-2 stroke-3" />
                                    </div>
                                )}
                            </div>

                            <span className="text-font-p font-medium">
                                {feature.title}
                            </span>
                        </div>
                    );
                })}
            </div>
        </CardWithIcon>
    );
}
