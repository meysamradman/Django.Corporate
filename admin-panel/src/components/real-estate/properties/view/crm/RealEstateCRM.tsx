import { Building2, UserRound } from "lucide-react";

import { Card } from "@/components/elements/Card";
import { cn } from "@/core/utils/cn";
import type { Property } from "@/types/real_estate/realEstate";

import { RealEstateAgency } from "./RealEstateAgency";
import { RealEstateAgent } from "./RealEstateAgent";

interface RealEstateCRMProps {
    property: Property;
    compact?: boolean;
}

export function RealEstateCRM({ property, compact = false }: RealEstateCRMProps) {
    return (
        <Card className="overflow-hidden border-br shadow-3xs bg-card ring-1 ring-br/20">
            {compact && (
                <div className="px-4 py-3 border-b border-br/20 bg-linear-to-r from-blue-1/8 via-indigo-1/6 to-transparent">
                    <div className="flex items-center gap-2.5 text-font-p">
                        <div className="flex items-center gap-1.5">
                            <Building2 className="size-4 text-blue-1" />
                            <UserRound className="size-4 text-indigo-1" />
                        </div>
                        <span className="text-xs font-black">تیم فروش و ارتباط</span>
                    </div>
                    <p className="text-[11px] text-font-s mt-1.5 opacity-75">
                        اطلاعات آژانس و مشاور این ملک
                    </p>
                </div>
            )}

            <div className="p-0">
                <div
                    className={cn(
                        compact
                            ? "flex flex-col divide-y divide-br/10"
                            : "flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse divide-br/10"
                    )}
                >
                    <RealEstateAgency
                        agency={property.agency}
                        hasAgentOrCreator={!!(property.agent || property.created_by_name)}
                        compact={compact}
                    />
                    <RealEstateAgent
                        agent={property.agent}
                        createdByName={property.created_by_name || undefined}
                        createdBy={property.created_by}
                        createdByPhone={(property as any).created_by_phone}
                        hasAgency={!!property.agency}
                        compact={compact}
                    />
                </div>
            </div>
        </Card>
    );
}
