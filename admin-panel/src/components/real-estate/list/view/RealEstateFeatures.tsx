
import { Building2, Check, LayoutGrid, ShieldCheck, Waves, Zap } from "lucide-react";
import type { Property } from "@/types/real_estate/realEstate";
import type { PropertyFeature } from "@/types/real_estate/feature/realEstateFeature";
import { mediaService } from "@/components/media/services";

interface PropertyFeaturesProps {
    property: Property;
    mode?: 'amenities' | 'features';
}

export function RealEstateFeatures({ property, mode }: PropertyFeaturesProps) {
    if (!property.features || property.features.length === 0) {
        return null;
    }

    // Heuristic for separating Features vs Amenities
    // Features are usually "Structural/Visual" things, Amenities are "Facilities/Equipment"
    // For now, we'll use the 'group' field if available, or just filter based on name/group hints
    
    const amenityGroups = ['امکانات', 'امکانات رفاهی', 'Amenities', 'Facilities', 'Equipment', 'Interior', 'Exterior'];
    const securityGroups = ['امنیت', 'Security', 'حفاظت'];
    
    const allFeatures = property.features;
    
    const filteredFeatures = mode === 'features' 
        ? allFeatures.filter(f => f.group === 'ویژگی‌ها' || f.group === 'Features' || !f.group)
        : allFeatures.filter(f => f.group && f.group !== 'ویژگی‌ها' && f.group !== 'Features');

    if (filteredFeatures.length === 0) return null;

    const grouped = filteredFeatures.reduce((acc, feature) => {
        const group = feature.group || (mode === 'features' ? 'ویژگی‌های اصلی' : 'امکانات عمومی');
        if (!acc[group]) acc[group] = [];
        acc[group].push(feature);
        return acc;
    }, {} as Record<string, PropertyFeature[]>);

    const getGroupIcon = (groupName: string) => {
        const name = groupName.toLowerCase();
        if (name.includes('امنیت') || name.includes('security')) return ShieldCheck;
        if (name.includes('امکانات') || name.includes('amenit')) return Zap;
        if (name.includes('آب') || name.includes('استخر') || name.includes('pool')) return Waves;
        return LayoutGrid;
    };

    return (
        <div className="space-y-8">
            {Object.entries(grouped).map(([group, features]) => {
                const Icon = getGroupIcon(group);
                return (
                    <div key={group} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="flex items-center gap-3 mb-5 group/title">
                            <div className="p-2 rounded-lg bg-blue-0/50 text-blue-1 group-hover/title:scale-110 transition-transform">
                                <Icon className="w-5 h-5" />
                            </div>
                            <h3 className="text-base font-bold text-font-p">{group}</h3>
                            <div className="flex-1 h-px bg-linear-to-r from-br via-br/30 to-transparent" />
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {features.map((feature) => {
                                const imageUrl = feature.image?.file_url || feature.image_url;
                                const fullImageUrl = imageUrl
                                    ? mediaService.getMediaUrlFromObject({ file_url: imageUrl } as any)
                                    : null;

                                return (
                                    <div
                                        key={feature.id}
                                        className="flex items-center gap-3 p-3 rounded-xl border border-br bg-card hover:border-blue-1/30 hover:shadow-sm transition-all group"
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
                                                <div className="w-6 h-6 rounded-full bg-emerald-0/30 flex items-center justify-center text-emerald-1">
                                                    <Check className="w-3.5 h-3.5 stroke-3" />
                                                </div>
                                            )}
                                        </div>

                                        <span className="text-sm font-medium text-font-p group-hover:text-blue-1 transition-colors">
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
