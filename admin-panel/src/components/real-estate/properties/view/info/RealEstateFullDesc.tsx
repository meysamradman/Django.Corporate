
import { FileText } from "lucide-react";
import type { Property } from "@/types/real_estate/realEstate";
import { ReadMore } from "@/components/elements/ReadMore";
import { EmptyState } from "@/components/shared/EmptyState";

interface RealEstateDescriptionProps {
    property: Property;
}

export function RealEstateFullDesc({ property }: RealEstateDescriptionProps) {
    if (!property) return null;

    return (
        <div>
            <label className="text-[10px] font-bold text-font-s tracking-wider mb-2 block">
                توضیحات کامل
            </label>
            <div className="text-sm text-font-p bg-bg/50 rounded-xl overflow-hidden leading-loose">
                {property.description ? (
                    <div className="p-5">
                        <ReadMore content={property.description} isHTML={true} maxHeight="200px" />
                    </div>
                ) : (
                    <EmptyState
                        title="توضیحات کامل ثبت نشده است"
                        description="هیچ توضیحات تکمیلی برای این ملک در سیستم موجود نیست"
                        icon={FileText}
                        size="sm"
                        fullBleed={true}
                    />
                )}
            </div>
        </div>
    );
}
