import { Card, CardContent } from "@/components/elements/Card";
import type { Property } from "@/types/real_estate/realEstate";
import { MediaImage } from "@/components/media/base/MediaImage";
import { mediaService } from "@/components/media/services";
import { TruncatedText } from "@/components/elements/TruncatedText";
import {
    Phone,
    Mail,
    Smartphone,
    Globe,
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

export function RealtorCard({ property }: RealtorCardProps) {
    // Determine if we show Agent or Admin (fallback)
    const agent = property.agent;
    const isAgent = !!agent;

    // Data Mapping
    const name = isAgent ? (agent.full_name || `${agent.first_name} ${agent.last_name}`) : "مدیر سایت";
    const role = isAgent ? (agent.specialization || "مشاور املاک") : "مدیریت کل";
    const phone = isAgent ? agent.phone : "021-12345678";
    const mobile = isAgent ? null : "09123456789";
    const email = isAgent ? agent.email : "info@example.com";
    const website = isAgent ? (agent.canonical_url || "") : "www.example.com";
    const agencyName = isAgent && agent.agency ? agent.agency.name : "آژانس مرکزی";
    const license = isAgent ? agent.license_number : null;
    const isVerified = isAgent ? agent.is_verified : true; // Admins are verified

    // Profile Image
    const profileUrl = isAgent && agent.profile_picture_url
        ? mediaService.getMediaUrlFromObject({ file_url: agent.profile_picture_url } as any)
        : null;

    return (
        <div className="w-full space-y-6 sticky top-20 transition-all duration-300 ease-in-out self-start">
            <Card className="overflow-hidden">
                <CardContent className="pt-0 pb-0">
                    <div className="pb-2">
                        {/* Image Container - aspect-video as requested */}
                        <div className="relative w-full aspect-video rounded-xl overflow-hidden border shadow-md bg-bg-2">
                            {profileUrl ? (
                                <MediaImage
                                    media={{ file_url: profileUrl } as any}
                                    alt={name}
                                    className="object-cover"
                                    fill
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-1 to-blue-2 text-static-w">
                                    {isAgent ? <User className="w-20 h-20 mb-2" /> : <ShieldCheck className="w-20 h-20 mb-2" />}
                                    <span className="text-xl font-bold">{name?.[0]?.toUpperCase() || "A"}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pb-6 pt-2 border-b -mx-6 px-6">
                        {/* Name & Agency Section */}
                        <div className="text-center space-y-2 mb-4">
                            <div className="flex items-center justify-center gap-2">
                                <h3 className="text-xl font-bold text-font-p">{name}</h3>
                                {isVerified && (
                                    <CheckCircle2 className="w-5 h-5 text-blue-500 fill-blue-500/10" aria-label="تایید شده" />
                                )}
                            </div>

                            <div className="flex flex-col items-center gap-1">
                                <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                                    {role}
                                </div>
                                <div className="inline-flex items-center gap-1 text-sm text-font-s mt-1">
                                    <Building2 className="w-3 h-3" />
                                    <span>{agencyName}</span>
                                </div>
                            </div>
                        </div>

                        {/* Social Icons Row */}
                        <div className="flex justify-center gap-3">
                            <a href="#" className="p-2 rounded-lg bg-bg-2 hover:bg-primary/10 hover:text-primary transition-colors border border-br">
                                <Facebook className="w-4 h-4" />
                            </a>
                            <a href="#" className="p-2 rounded-lg bg-bg-2 hover:bg-primary/10 hover:text-primary transition-colors border border-br">
                                <Twitter className="w-4 h-4" />
                            </a>
                            <a href="#" className="p-2 rounded-lg bg-bg-2 hover:bg-primary/10 hover:text-primary transition-colors border border-br">
                                <Linkedin className="w-4 h-4" />
                            </a>
                            <a href="#" className="p-2 rounded-lg bg-bg-2 hover:bg-primary/10 hover:text-primary transition-colors border border-br">
                                <Instagram className="w-4 h-4" />
                            </a>
                        </div>
                    </div>

                    <div className="pt-4 pb-4">
                        <div className="space-y-5">
                            <div>
                                <h4 className="mb-4 text-font-p">اطلاعات تماس</h4>
                                <div className="space-y-0 [&>div:not(:last-child)]:border-b">
                                    {/* Phone */}
                                    {phone && (
                                        <div className="flex items-center justify-between gap-3 pb-3">
                                            <div className="flex items-center gap-2">
                                                <Phone className="w-4 h-4 text-font-s flex-shrink-0" />
                                                <label>تلفن:</label>
                                            </div>
                                            <div className="flex-1 ms-2 text-left min-w-0 overflow-hidden">
                                                <span className="text-font-p font-medium" dir="ltr">{phone}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Mobile */}
                                    {mobile && (
                                        <div className="flex items-center justify-between gap-3 py-3">
                                            <div className="flex items-center gap-2">
                                                <Smartphone className="w-4 h-4 text-font-s flex-shrink-0" />
                                                <label>موبایل:</label>
                                            </div>
                                            <div className="flex-1 ms-2 text-left min-w-0 overflow-hidden">
                                                <span className="text-font-p font-medium" dir="ltr">{mobile}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Email */}
                                    {email && (
                                        <div className="flex items-center justify-between gap-3 py-3">
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-4 h-4 text-font-s flex-shrink-0" />
                                                <label>ایمیل:</label>
                                            </div>
                                            <div className="flex-1 ms-2 text-left min-w-0 overflow-hidden">
                                                <TruncatedText text={email} maxLength={25} className="text-font-p" />
                                            </div>
                                        </div>
                                    )}

                                    {/* Website */}
                                    {website && (
                                        <div className="flex items-center justify-between gap-3 py-3">
                                            <div className="flex items-center gap-2">
                                                <Globe className="w-4 h-4 text-font-s flex-shrink-0" />
                                                <label>وب‌سایت:</label>
                                            </div>
                                            <div className="flex-1 ms-2 text-left min-w-0 overflow-hidden">
                                                <TruncatedText text={website} maxLength={25} className="text-font-p hover:text-primary cursor-pointer" />
                                            </div>
                                        </div>
                                    )}

                                    {/* License Number */}
                                    {license && (
                                        <div className="flex items-center justify-between gap-3 pt-3">
                                            <div className="flex items-center gap-2">
                                                <Award className="w-4 h-4 text-font-s flex-shrink-0" />
                                                <label>شماره پروانه:</label>
                                            </div>
                                            <div className="flex-1 ms-2 text-left min-w-0 overflow-hidden">
                                                <span className="text-font-p font-mono text-sm">{license}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
