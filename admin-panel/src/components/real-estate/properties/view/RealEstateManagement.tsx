import { useNavigate } from "react-router-dom";
import { Phone, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/elements/Card";
import { Badge } from "@/components/elements/Badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/elements/Avatar";
import { Button } from "@/components/elements/Button";
import { mediaService } from "@/components/media/services";
import type { Property } from "@/types/real_estate/realEstate";

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
                <div className={`flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse divide-br/20 ${(!hasAgency || !hasAgentOrCreator) ? 'justify-center' : ''}`}>
                    {property.agency && (
                        <div className={`flex-1 flex items-center gap-6 p-4 transition-colors group ${!hasAgentOrCreator ? 'lg:px-16 lg:justify-center' : 'lg:px-8 hover:bg-bg/5'}`}>
                            <div className="size-14 rounded-xl bg-wt border border-br p-2.5 flex items-center justify-center shadow-3xs shrink-0 group-hover:border-blue-1/40 transition-all">
                                <Avatar className="size-full rounded-none">
                                    <AvatarImage
                                        src={
                                            (property.agency.logo && mediaService.getMediaUrlFromObject(property.agency.logo as any)) ||
                                            (property.agency.logo_url ? mediaService.getMediaUrlFromObject({ file_url: property.agency.logo_url } as any) : undefined)
                                        }
                                        className="object-contain"
                                    />
                                    <AvatarFallback className="bg-blue-1/10 text-blue-1 font-bold text-base">
                                        {property.agency.name?.[0] || 'A'}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                            <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-2">
                                    <Badge variant="blue" className="text-[10px] font-bold px-1.5 h-5 bg-blue-1/10 text-blue-1 border-none">آژانس</Badge>
                                    <span className="text-base font-bold text-font-p truncate">{property.agency.name}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <Phone className="size-3.5 text-blue-1/60" />
                                    <span className="text-sm font-bold text-font-s dir-ltr tracking-tight">{property.agency.phone}</span>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => navigate(`/admins/agencies/${property.agency?.id}/view`)}
                                className={`size-9 rounded-xl text-blue-1/40 hover:text-blue-1 hover:bg-blue-1/10 border-none bg-transparent transition-colors shadow-none ${!hasAgentOrCreator ? 'mr-4' : 'mr-auto'}`}
                            >
                                <ArrowUpRight className="size-5" />
                            </Button>
                        </div>
                    )}

                    {(property.agent || property.created_by_name) && (
                        <div className={`flex-1 flex items-center gap-6 p-4 transition-colors group ${!hasAgency ? 'lg:px-16 lg:justify-center' : 'lg:px-8 hover:bg-bg/5'}`}>
                            <div className="relative shrink-0">
                                <Avatar className="size-14 border border-br/30 shadow-3xs">
                                    <AvatarImage
                                        src={
                                            (property.agent?.profile_image && mediaService.getMediaUrlFromObject(property.agent.profile_image as any)) ||
                                            (property.agent?.profile_picture_url ? mediaService.getMediaUrlFromObject({ file_url: property.agent.profile_picture_url } as any) : undefined)
                                        }
                                        className="object-cover"
                                    />
                                    <AvatarFallback className="bg-indigo-1/10 text-indigo-1 font-bold text-base">
                                        {property.agent?.user ? (property.agent.first_name?.[0] || property.agent.full_name?.[0] || 'م') : (property.created_by_name?.[0] || 'م')}
                                    </AvatarFallback>
                                </Avatar>
                                <div className={`absolute -bottom-0.5 -right-0.5 size-4 border-2 border-wt rounded-full ${property.agent?.user ? 'bg-emerald-1' : 'bg-blue-1'}`} />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-2">
                                    <Badge variant={property.agent?.user ? "indigo" : "blue"} className="text-[10px] font-bold px-1.5 h-5 border-none">
                                        {property.agent?.user ? 'مشاور' : 'مدیر'}
                                    </Badge>
                                    <span className="text-base font-bold text-font-p truncate">
                                        {property.agent?.user ? (property.agent.full_name || `${property.agent.first_name} ${property.agent.last_name}`) : property.created_by_name}
                                    </span>
                                </div>
                                {(property.agent?.phone || (property as any).created_by_phone) ? (
                                    <div className="flex items-center gap-2 mt-1">
                                        <Phone className="size-3.5 text-indigo-1/60" />
                                        <span className="text-sm font-bold text-font-s dir-ltr tracking-tight">{property.agent?.phone || (property as any).created_by_phone}</span>
                                    </div>
                                ) : (
                                    <span className="text-[10px] text-font-s/40 font-bold tracking-tight mt-1">بدون تماس</span>
                                )}
                            </div>
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
                                className={`size-9 rounded-xl text-indigo-1/40 hover:text-indigo-1 hover:bg-indigo-1/10 border-none bg-transparent transition-colors shadow-none ${!hasAgency ? 'mr-4' : 'mr-auto'}`}
                            >
                                <ArrowUpRight className="size-5" />
                            </Button>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
