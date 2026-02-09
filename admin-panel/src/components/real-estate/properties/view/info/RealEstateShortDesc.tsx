
import type { Property } from "@/types/real_estate/realEstate";
import { ValueFallback } from "@/components/shared/ValueFallback";

interface RealEstateShortDescProps {
    property: Property;
}

export function RealEstateShortDesc({ property }: RealEstateShortDescProps) {
    if (!property) return null;

    return (
        <div>
            <label className="text-[10px] font-bold text-font-s tracking-wider mb-2 block">
                توضیحات کوتاه
            </label>
            <div className="text-sm text-font-p border-r-2 border-blue-1/30 pr-4 leading-relaxed">
                {property.short_description || <ValueFallback value={null} fallback="توضیح کوتاهی برای این ملک ثبت نشده است" />}
            </div>
        </div>
    );
}
