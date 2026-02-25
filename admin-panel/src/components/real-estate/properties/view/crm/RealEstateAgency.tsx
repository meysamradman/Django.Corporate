
import { useNavigate } from "react-router-dom";
import { cn } from "@/core/utils/cn";
import { Phone, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/elements/Badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/elements/Avatar";
import { Button } from "@/components/elements/Button";
import { mediaService } from "@/components/media/services";
import { Item, ItemContent, ItemMedia, ItemActions } from "@/components/elements/Item";
import type { Property } from "@/types/real_estate/realEstate";

interface RealEstateAgencyProps {
    agency: Property["agency"];
    hasAgentOrCreator: boolean;
    compact?: boolean;
}

export function RealEstateAgency({ agency, hasAgentOrCreator, compact = false }: RealEstateAgencyProps) {
    const navigate = useNavigate();

    if (!agency) return null;

    return (
        <div className={cn(
            "flex-1 p-3",
            !compact && !hasAgentOrCreator && "lg:px-20 py-8"
        )}>
            <Item className="hover:bg-bg/5 transition-colors rounded-2xl p-3 gap-5 border-none">
                <ItemMedia className="relative shrink-0">
                    <Avatar className={cn(
                        "border border-br/30 shadow-3xl transition-transform duration-500",
                        !compact && !hasAgentOrCreator ? "size-20" : "size-16"
                    )}>
                        <AvatarImage
                            src={
                                (agency.logo && mediaService.getMediaUrlFromObject(agency.logo as any)) ||
                                (agency.logo_url ? mediaService.getMediaUrlFromObject({ file_url: agency.logo_url } as any) : undefined)
                            }
                            className="object-cover"
                        />
                        <AvatarFallback className="bg-blue-1/10 text-blue-1 font-black text-xl">
                            {agency.name?.[0] || 'A'}
                        </AvatarFallback>
                    </Avatar>
                </ItemMedia>
                <ItemContent className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5 mb-1.5">
                        <Badge variant="blue" className="text-[10px] font-black px-2 h-5 bg-blue-1/10 text-blue-1 border-none tracking-widest uppercase">آژانس</Badge>
                        <span className="text-lg font-black text-font-p truncate tracking-tight">{agency.name}</span>
                    </div>
                    <div className="flex items-center gap-2 opacity-80">
                        <Phone className="size-4 text-blue-1/60" />
                        <span className="text-sm font-black text-font-s dir-ltr tracking-tight">{agency.phone}</span>
                    </div>
                </ItemContent>
                <ItemActions>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigate(`/admins/agencies/${agency?.id}/edit`)}
                        className="size-10 rounded-2xl text-blue-1/40 hover:text-blue-1 hover:bg-blue-1/10 border border-br/60 bg-wt transition-all shadow-3xs"
                    >
                        <ArrowUpRight className="size-5" />
                    </Button>
                </ItemActions>
            </Item>
        </div>
    );
}
