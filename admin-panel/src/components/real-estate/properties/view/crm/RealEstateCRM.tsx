import { useNavigate } from "react-router-dom";
import { Phone, UserRound, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/elements/Card";
import { Badge } from "@/components/elements/Badge";
import { Button } from "@/components/elements/Button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/elements/Avatar";
import type { Property } from "@/types/real_estate/realEstate";
import { RealEstateAgency } from "./RealEstateAgency";
import { RealEstateAgent } from "./RealEstateAgent";
import { cn } from "@/core/utils/cn";
import { mediaService } from "@/components/media/services";

interface RealEstateCRMProps {
    property: Property;
    compact?: boolean;
    className?: string;
}

export function RealEstateCRM({ property, compact = false, className }: RealEstateCRMProps) {
    const navigate = useNavigate();
    const hasAgency = !!property.agency;
    const hasAgentOrCreator = !!(property.agent || property.created_by_name);

    if (!hasAgency && !hasAgentOrCreator) return null;

    if (compact) {
        if (!hasAgentOrCreator) return null;

        const agent = property.agent;
        const createdByPhone = (property as any).created_by_phone as string | undefined;
        const agentName = agent?.user
            ? (agent.full_name || `${agent.first_name} ${agent.last_name}`.trim())
            : (property.created_by_name || "ادمین");
        const agentPhone = agent?.phone || createdByPhone || "بدون تماس";

        return (
            <div className={cn(
                "space-y-2",
                className
            )}>
                {hasAgentOrCreator && (
                    <div className="rounded-2xl border border-indigo-1/20 bg-linear-to-br from-indigo-1/8 via-wt/90 to-blue-1/8 p-3 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <Badge variant="indigo" className="text-[10px] h-5 px-2 border-none">مشاور مسئول</Badge>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Avatar className="size-12 border border-indigo-1/20 shadow-sm">
                                    <AvatarImage
                                        src={
                                            (agent?.profile_image && mediaService.getMediaUrlFromObject(agent.profile_image as any)) ||
                                            (agent?.profile_picture_url ? mediaService.getMediaUrlFromObject({ file_url: agent.profile_picture_url } as any) : undefined)
                                        }
                                        className="object-cover"
                                    />
                                    <AvatarFallback className="bg-indigo-1/10 text-indigo-1 font-black">
                                        {agent?.user ? (agent.first_name?.[0] || agent.full_name?.[0] || "م") : (property.created_by_name?.[0] || "م")}
                                    </AvatarFallback>
                                </Avatar>
                                <span className={cn(
                                    "absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-wt",
                                    agent?.user ? "bg-emerald-1" : "bg-blue-1"
                                )} />
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="size-5 rounded-lg bg-blue-1/10 text-blue-1 flex items-center justify-center">
                                        <UserRound className="size-3.5" />
                                    </div>
                                    <Badge variant={agent?.user ? "indigo" : "blue"} className="text-[10px] h-5 px-2 border-none opacity-90">
                                        {agent?.user ? "مشاور" : "ادمین"}
                                    </Badge>
                                    <p className="text-[15px] font-black text-font-p truncate">{agentName}</p>
                                </div>
                                <div className="flex items-center gap-2 text-[14px] font-black text-font-s dir-ltr">
                                    <Phone className="size-4 text-indigo-1/70" />
                                    <span className="truncate">{agentPhone}</span>
                                </div>
                            </div>

                            <Button
                                variant="outline"
                                size="icon"
                                className="size-10 rounded-xl border-indigo-1/20 text-indigo-1/70 hover:text-indigo-1 hover:bg-indigo-1/10"
                                onClick={() => {
                                    if (agent?.user) navigate(`/agents/${agent.user}/view`);
                                    else if (property.created_by) navigate(`/admins/${property.created_by}/view`);
                                }}
                            >
                                <ArrowUpRight className="size-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <Card className={cn(
            "overflow-hidden border-br shadow-3xs bg-card ring-1 ring-br/20",
            className
        )}>
            <div className="p-0">
                <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse divide-br/10">
                    <RealEstateAgency
                        agency={property.agency}
                        hasAgentOrCreator={hasAgentOrCreator}
                    />
                    <RealEstateAgent
                        agent={property.agent}
                        createdByName={property.created_by_name || undefined}
                        createdBy={property.created_by}
                        createdByPhone={(property as any).created_by_phone}
                        hasAgency={hasAgency}
                    />
                </div>
            </div>
        </Card>
    );
}
