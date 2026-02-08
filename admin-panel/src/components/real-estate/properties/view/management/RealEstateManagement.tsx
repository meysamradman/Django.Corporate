import { Card } from "@/components/elements/Card";
import type { Property } from "@/types/real_estate/realEstate";
import { RealEstateAgencyInfo } from "./RealEstateAgencyInfo";
import { RealEstateAgentInfo } from "./RealEstateAgentInfo";

interface RealEstateManagementProps {
    property: Property;
}

export function RealEstateManagement({ property }: RealEstateManagementProps) {
    return (
        <Card className="overflow-hidden border-br shadow-3xs bg-card ring-1 ring-br/20">
            <div className="p-0">
                <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse divide-br/10">
                    <RealEstateAgencyInfo
                        agency={property.agency}
                        hasAgentOrCreator={!!(property.agent || property.created_by_name)}
                    />
                    <RealEstateAgentInfo
                        agent={property.agent}
                        createdByName={property.created_by_name || undefined}
                        createdBy={property.created_by}
                        createdByPhone={(property as any).created_by_phone}
                        hasAgency={!!property.agency}
                    />
                </div>
            </div>
        </Card>
    );
}
