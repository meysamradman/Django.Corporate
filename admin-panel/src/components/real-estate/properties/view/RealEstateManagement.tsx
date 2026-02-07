import { useNavigate } from "react-router-dom";
import { cn } from "@/core/utils/cn";
import { Phone, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/elements/Card";
import { Badge } from "@/components/elements/Badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/elements/Avatar";
import { Button } from "@/components/elements/Button";
import { mediaService } from "@/components/media/services";
import { Item, ItemContent, ItemMedia, ItemActions } from "@/components/elements/Item";
import type { Property } from "@/types/real_estate/realEstate";
import { ValueFallback } from "@/components/shared/ValueFallback";

interface RealEstateManagementProps {
    property: Property;
}

export function RealEstateManagement({ property }: RealEstateManagementProps) {
    const navigate = useNavigate();

    const hasAgency = !!property.agency;
    const hasAgentOrCreator = !!(property.agent || property.created_by_name);

    return (
        <Card className="overflow-hidden border-br shadow-3xs bg-card ring-1 ring-br/20">
            <CardContent className="p-0">
                <div className={cn(
                    "flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse divide-br/10",
                    !hasAgency && "justify-center bg-linear-to-b from-bg/20 to-transparent"
                )}>
                    {property.agency && (
                        <div className={cn(
                            "flex-1 p-3",
                            !hasAgentOrCreator && "lg:px-20 py-8"
                        )}>
                            <Item className="hover:bg-bg/5 transition-colors rounded-2xl p-3 gap-5 border-none">
                                <ItemMedia className="size-16 rounded-2xl bg-wt border border-br p-3 flex items-center justify-center shadow-3xs shrink-0 group-hover:border-blue-1/40 transition-all ring-4 ring-bg/50">
                                    <Avatar className="size-full rounded-none">
                                        <AvatarImage
                                            src={
                                                (property.agency.logo && mediaService.getMediaUrlFromObject(property.agency.logo as any)) ||
                                                (property.agency.logo_url ? mediaService.getMediaUrlFromObject({ file_url: property.agency.logo_url } as any) : undefined)
                                            }
                                            className="object-contain"
                                        />
                                        <AvatarFallback className="bg-blue-1/10 text-blue-1 font-bold text-lg">
                                            {property.agency.name?.[0] || 'A'}
                                        </AvatarFallback>
                                    </Avatar>
                                </ItemMedia>
                                <ItemContent className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2.5 mb-1.5">
                                        <Badge variant="blue" className="text-[10px] font-black px-2 h-5 bg-blue-1/10 text-blue-1 border-none tracking-widest uppercase">آژانس</Badge>
                                        <span className="text-lg font-black text-font-p truncate tracking-tight">{property.agency.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-80">
                                        <Phone className="size-4 text-blue-1/60" />
                                        <span className="text-sm font-black text-font-s dir-ltr tracking-tight">{property.agency.phone}</span>
                                    </div>
                                </ItemContent>
                                <ItemActions>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => navigate(`/admins/agencies/${property.agency?.id}/view`)}
                                        className="size-10 rounded-2xl text-blue-1/40 hover:text-blue-1 hover:bg-blue-1/10 border border-br/60 bg-wt transition-all shadow-3xs"
                                    >
                                        <ArrowUpRight className="size-5" />
                                    </Button>
                                </ItemActions>
                            </Item>
                        </div>
                    )}

                    {(property.agent || property.created_by_name) && (
                        <div className={cn(
                            "flex-1 p-3",
                            !hasAgency && "lg:px-20 py-8"
                        )}>
                            <Item className="hover:bg-bg/5 transition-colors rounded-2xl p-3 gap-5 border-none">
                                <ItemMedia className="relative shrink-0">
                                    <Avatar className={cn(
                                        "border border-br/30 shadow-3xl transition-transform duration-500",
                                        !hasAgency ? "size-20" : "size-16"
                                    )}>
                                        <AvatarImage
                                            src={
                                                (property.agent?.profile_image && mediaService.getMediaUrlFromObject(property.agent.profile_image as any)) ||
                                                (property.agent?.profile_picture_url ? mediaService.getMediaUrlFromObject({ file_url: property.agent.profile_picture_url } as any) : undefined)
                                            }
                                            className="object-cover"
                                        />
                                        <AvatarFallback className="bg-indigo-1/10 text-indigo-1 font-black text-xl">
                                            {property.agent?.user ? (property.agent.first_name?.[0] || property.agent.full_name?.[0] || 'م') : (property.created_by_name?.[0] || 'م')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className={cn(
                                        "absolute -bottom-0.5 -right-0.5 border-2 border-wt rounded-full animate-pulse shadow-md",
                                        !hasAgency ? "size-5" : "size-4",
                                        hasAgency ? 'bg-emerald-1' : 'bg-blue-1'
                                    )} />
                                </ItemMedia>
                                <ItemContent className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2.5 mb-1.5">
                                        <Badge
                                            variant={hasAgency ? "indigo" : "blue"}
                                            className="text-[10px] font-black px-2 h-5 border-none tracking-widest uppercase"
                                        >
                                            {hasAgency ? 'مشاور' : 'ادمین'}
                                        </Badge>
                                        <span className={cn(
                                            "font-black text-font-p truncate tracking-tight",
                                            !hasAgency ? "text-xl" : "text-lg"
                                        )}>
                                            {property.agent?.user ? (property.agent.full_name || `${property.agent.first_name} ${property.agent.last_name}`) : property.created_by_name}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-80">
                                        <Phone className="size-4 text-indigo-1/60" />
                                        <span className={cn(
                                            "font-black text-font-s dir-ltr tracking-tight",
                                            !hasAgency ? "text-base" : "text-sm"
                                        )}>
                                            {property.agent?.phone || (property as any).created_by_phone || <ValueFallback value={null} fallback="بدون تماس" />}
                                        </span>
                                    </div>
                                </ItemContent>

                                <ItemActions>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (property.agent?.user) {
                                                navigate(`/agents/${property.agent.user}/view`);
                                            } else if (property.created_by) {
                                                navigate(`/admins/${property.created_by}/view`);
                                            }
                                        }}
                                        className="size-10 rounded-2xl text-indigo-1/40 hover:text-indigo-1 hover:bg-indigo-1/10 border border-br/60 bg-wt transition-all shadow-3xs"
                                    >
                                        <ArrowUpRight className="size-5" />
                                    </Button>
                                </ItemActions>
                            </Item>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
