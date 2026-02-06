import { Card, CardContent } from "@/components/elements/Card";
import type { Property } from "@/types/real_estate/realEstate";
import { MediaImage } from "@/components/media/base/MediaImage";
import { mediaService } from "@/components/media/services";
import { TruncatedText } from "@/components/elements/TruncatedText";
import {
    Phone,
    Mail,
    Smartphone,
    Facebook,
    Twitter,
    Linkedin,
    Instagram,
    User,
    ShieldCheck,
    Building2,
    CheckCircle2,
    Award
} from "lucide-react";

interface RealtorCardProps {
    property: Property;
}

export function RealEstateRealtorCard({ property }: RealtorCardProps) {
    const agent = property.agent;
    const isAgent = !!agent;

    const name = isAgent ? (agent.full_name || `${agent.first_name} ${agent.last_name}`) : "مدیر سیستم";
    const role = isAgent ? (agent.specialization || "مشاور املاک") : "ادمین کل";
    const phone = isAgent ? agent.phone : property.created_by || "-"; // Fallback to created_by if available
    const mobile = isAgent ? null : "-";
    const email = isAgent ? agent.email : "-";
    const agencyName = isAgent && agent.agency ? agent.agency.name : "دپارتمان مرکزی";
    const license = isAgent ? agent.license_number : null;
    const isVerified = isAgent ? agent.is_verified : true; // Admins are verified

    const profileUrl = isAgent && agent.profile_picture_url
        ? mediaService.getMediaUrlFromObject({ file_url: agent.profile_picture_url } as any)
        : null;

    return (
        <div className="w-full space-y-6 sticky top-20 transition-all duration-300 ease-in-out self-start group">
            <Card className="overflow-hidden border-br hover:shadow-xl transition-all duration-500 relative bg-card group-hover:-translate-y-1">
                <CardContent className="p-0">
                    <div className="relative w-full aspect-4/3 overflow-hidden">
                        {profileUrl ? (
                            <MediaImage
                                media={{ file_url: profileUrl } as any}
                                alt={name}
                                className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
                                fill
                            />
                        ) : (
                            <div className={`w-full h-full flex flex-col items-center justify-center bg-linear-to-br ${isAgent ? 'from-blue-1 via-blue-2 to-indigo-2' : 'from-gray-700 via-gray-800 to-black'} text-white`}>
                                {isAgent ? <User className="w-24 h-24 mb-4 opacity-80" /> : <ShieldCheck className="w-24 h-24 mb-4 opacity-80" />}
                                <span className="text-3xl font-bold tracking-wider opacity-50">{name?.[0]?.toUpperCase() || "A"}</span>
                            </div>
                        )}

                        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-2xl font-bold text-white shadow-sm">{name}</h3>
                                {isVerified && (
                                    <CheckCircle2 className="w-5 h-5 text-blue-1 fill-white" />
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-white/90 text-sm">
                                <span className={`px-2 py-0.5 rounded backdrop-blur-md border border-white/20 ${isAgent ? 'bg-blue-1/30' : 'bg-gray-500/30'}`}>
                                    {role}
                                </span>
                                <span>•</span>
                                <span className="opacity-80">{agencyName}</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 space-y-6 bg-card">

                        <div className="flex justify-center gap-4 border-b border-br pb-6">
                            {[Facebook, Twitter, Linkedin, Instagram].map((Icon, i) => (
                                <a key={i} href="#" className="p-2.5 rounded-xl bg-bg-2 text-gray-2 hover:bg-primary hover:text-white transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-lg hover:shadow-primary/30">
                                    <Icon className="w-4 h-4" />
                                </a>
                            ))}
                        </div>

                        <div className="space-y-4">
                            {phone && phone !== "-" && (
                                <div className="flex items-center justify-between group/item p-3 rounded-xl hover:bg-bg-2 transition-colors border border-transparent hover:border-br">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-blue-1/10 text-blue-1 group-hover/item:bg-blue-1 group-hover/item:text-white transition-colors">
                                            <Phone className="w-4 h-4" />
                                        </div>
                                        <span className="text-font-s font-medium">تلفن تماس</span>
                                    </div>
                                    <span className="text-font-p font-bold font-mono text-lg" dir="ltr">{phone}</span>
                                </div>
                            )}

                            {mobile && mobile !== "-" && (
                                <div className="flex items-center justify-between group/item p-3 rounded-xl hover:bg-bg-2 transition-colors border border-transparent hover:border-br">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-blue-1/10 text-blue-1 group-hover/item:bg-blue-1 group-hover/item:text-white transition-colors">
                                            <Smartphone className="w-4 h-4" />
                                        </div>
                                        <span className="text-font-s font-medium">موبایل</span>
                                    </div>
                                    <span className="text-font-p font-bold font-mono text-lg" dir="ltr">{mobile}</span>
                                </div>
                            )}

                            {email && email !== "-" && (
                                <div className="flex items-center justify-between group/item p-3 rounded-xl hover:bg-bg-2 transition-colors border border-transparent hover:border-br">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-blue-1/10 text-blue-1 group-hover/item:bg-blue-1 group-hover/item:text-white transition-colors">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <span className="text-font-s font-medium">ایمیل</span>
                                    </div>
                                    <TruncatedText text={email} maxLength={22} className="text-font-p font-medium text-sm" />
                                </div>
                            )}

                            {license && (
                                <div className="flex items-center justify-between pt-2 px-2">
                                    <span className="text-xs text-font-s flex items-center gap-1">
                                        <Award className="w-4 h-4" />
                                        کد/پروانه:
                                    </span>
                                    <span className="text-xs font-mono text-font-p bg-bg-2 px-2 py-0.5 rounded border border-br">{license}</span>
                                </div>
                            )}
                        </div>

                        <div className="pt-2">
                            <a href="#" className="flex items-center justify-center w-full py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 text-base group/btn">
                                <span>مشاهده کارتابل</span>
                                <Building2 className="w-4 h-4 mr-2 group-hover/btn:-translate-x-1 transition-transform" />
                            </a>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
