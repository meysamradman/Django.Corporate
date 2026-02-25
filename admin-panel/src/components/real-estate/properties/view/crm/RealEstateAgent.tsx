import { useNavigate } from "react-router-dom";
import { Phone, ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/elements/Badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/elements/Avatar";
import { Button } from "@/components/elements/Button";
import { Item, ItemContent, ItemMedia, ItemActions } from "@/components/elements/Item";
import { ValueFallback } from "@/components/shared/ValueFallback";
import { mediaService } from "@/components/media/services";
import { cn } from "@/core/utils/cn";
import type { Property } from "@/types/real_estate/realEstate";

interface RealEstateAgentProps {
    agent: Property["agent"];
    createdByName?: string;
    createdBy?: number;
    createdByPhone?: string;
    hasAgency: boolean;
    compact?: boolean;
}

export function RealEstateAgent({ agent, createdByName, createdBy, createdByPhone, hasAgency, compact = false }: RealEstateAgentProps) {
    const navigate = useNavigate();

    if (!agent && !createdByName) return null;

    return (
        <div className={cn("flex-1 p-3", !compact && !hasAgency && "lg:px-20 py-8")}>
            <Item
                className={cn(
                    "hover:bg-bg/5 transition-colors rounded-2xl p-3 gap-5 border-none",
                    compact && "bg-bg/35 ring-1 ring-indigo-1/8"
                )}
            >
                <ItemMedia className="relative shrink-0">
                    <Avatar
                        className={cn(
                            "border border-br/30 shadow-3xl transition-transform duration-500",
                            !compact && !hasAgency ? "size-20" : "size-16"
                        )}
                    >
                        <AvatarImage
                            src={
                                (agent?.profile_image && mediaService.getMediaUrlFromObject(agent.profile_image as any)) ||
                                (agent?.profile_picture_url
                                    ? mediaService.getMediaUrlFromObject({ file_url: agent.profile_picture_url } as any)
                                    : undefined)
                            }
                            className="object-cover"
                        />
                        <AvatarFallback className="bg-indigo-1/10 text-indigo-1 font-black text-xl">
                            {agent?.user
                                ? (agent.first_name?.[0] || agent.full_name?.[0] || "م")
                                : (createdByName?.[0] || "م")}
                        </AvatarFallback>
                    </Avatar>
                    <div
                        className={cn(
                            "absolute -bottom-0.5 -right-0.5 border-2 border-wt rounded-full animate-pulse shadow-md",
                            !compact && !hasAgency ? "size-5" : "size-4",
                            hasAgency ? "bg-emerald-1" : "bg-blue-1"
                        )}
                    />
                </ItemMedia>
                <ItemContent className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5 mb-1.5">
                        <Badge
                            variant={hasAgency ? "indigo" : "blue"}
                            className="text-[10px] font-black px-2 h-5 border-none tracking-widest uppercase"
                        >
                            {hasAgency ? "مشاور" : "ادمین"}
                        </Badge>
                        <span
                            className={cn(
                                "font-black text-font-p truncate tracking-tight",
                                !compact && !hasAgency ? "text-xl" : "text-lg"
                            )}
                        >
                            {agent?.user ? (agent.full_name || `${agent.first_name} ${agent.last_name}`) : createdByName}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 opacity-80">
                        <Phone className="size-4 text-indigo-1/60" />
                        <span
                            className={cn(
                                "font-black text-font-s dir-ltr tracking-tight",
                                !compact && !hasAgency ? "text-base" : "text-sm"
                            )}
                        >
                            {agent?.phone || createdByPhone || <ValueFallback value={null} fallback="بدون تماس" />}
                        </span>
                    </div>
                </ItemContent>

                <ItemActions>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (agent?.user) {
                                navigate(`/agents/${agent.user}/view`);
                            } else if (createdBy) {
                                navigate(`/admins/${createdBy}/view`);
                            }
                        }}
                        className={cn(
                            "size-10 rounded-2xl text-indigo-1/40 hover:text-indigo-1 hover:bg-indigo-1/10 border border-br/60 bg-wt transition-all shadow-3xs",
                            compact && "bg-indigo-1/5 border-indigo-1/20"
                        )}
                    >
                        <ArrowUpRight className="size-5" />
                    </Button>
                </ItemActions>
            </Item>
        </div>
    );
}
