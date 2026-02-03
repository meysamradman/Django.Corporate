import { CheckCircle2 } from "lucide-react";
import type { Property } from "@/types/real_estate/realEstate";
import type { PropertyFeature } from "@/types/real_estate/feature/realEstateFeature";
import { mediaService } from "@/components/media/services";

interface PropertyFeaturesProps {
    property: Property;
}

export function RealEstateFeatures({ property }: PropertyFeaturesProps) {
    if (!property.features || property.features.length === 0) {
        return null;
    }

    const filteredFeatures = property.features;

    const grouped = filteredFeatures.reduce((acc, feature) => {
        const group = feature.group || 'ویژگی‌های اصلی';
        if (!acc[group]) acc[group] = [];
        acc[group].push(feature);
        return acc;
    }, {} as Record<string, PropertyFeature[]>);


    return (
        <div className="space-y-12">
            {Object.entries(grouped).map(([group, features]) => {
                const isGeneralGroup = group === 'ویژگی‌های اصلی' || group === 'امکانات عمومی' || group === 'ویژگی‌ها' || group === 'Features';

                return (
                    <div key={group} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {!isGeneralGroup && (
                            <div className="flex items-center gap-3 mb-6 group/title">
                                <h3 className="text-xs font-black text-font-s uppercase tracking-widest opacity-70">{group}</h3>
                                <div className="flex-1 h-px bg-linear-to-r from-br via-br/30 to-transparent" />
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-y-6 gap-x-8">
                            {features.map((feature) => {
                                const imageUrl = feature.image?.file_url || feature.image_url;
                                const fullImageUrl = imageUrl
                                    ? mediaService.getMediaUrlFromObject({ file_url: imageUrl } as any)
                                    : null;

                                return (
                                    <div
                                        key={feature.id}
                                        className="flex items-center gap-3 group transition-all"
                                    >
                                        <div className="shrink-0">
                                            {fullImageUrl ? (
                                                <div className="w-8 h-8 rounded-lg bg-bg py-1">
                                                    <img
                                                        src={fullImageUrl}
                                                        alt={feature.title}
                                                        className="w-full h-full object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center text-font-s opacity-40 group-hover:opacity-100 group-hover:text-blue-1 transition-all">
                                                    <CheckCircle2 className="w-5 h-5 stroke-[1.5]" />
                                                </div>
                                            )}
                                        </div>

                                        <span className="text-sm font-bold text-font-p group-hover:text-blue-1 transition-colors">
                                            {feature.title}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
