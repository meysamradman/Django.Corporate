import { Card, CardContent } from "@/components/elements/Card";
import { CheckCircle2, XCircle, Phone, Clock, Star, MapPin } from "lucide-react";
import { ImageSelector } from "@/components/media/selectors/ImageSelector";
import type { Media } from "@/types/shared/media";
import { useQueryClient } from '@tanstack/react-query';
import { notifyApiError, showSuccess } from '@/core/toast';
import { realEstateApi } from '@/api/real-estate';

interface AgencyProfileHeaderProps {
    agency: any;
    selectedLogo: Media | null;
    onLogoChange?: (media: Media | null) => void;
    agencyId?: string;
}

export function AgencyProfileHeader({ agency, selectedLogo, onLogoChange, agencyId }: AgencyProfileHeaderProps) {
    const queryClient = useQueryClient();

    const currentLogo: Media | null = selectedLogo || agency?.profile_picture || agency?.logo || null;

    const handleLogoSelect = async (selectedMedia: Media | null) => {
        const logoId = selectedMedia?.id || null;
        const targetAgencyId = agencyId && !isNaN(Number(agencyId)) ? Number(agencyId) : agency?.id;

        if (!targetAgencyId) {
            return;
        }

        try {
            const updatedAgency = await realEstateApi.partialUpdateAgency(targetAgencyId, {
                profile_picture: logoId,
            } as any);

            if (!updatedAgency) {
                return;
            }

            const queryKeyForInvalidate = String(targetAgencyId);

            if (onLogoChange) {
                const updatedLogo: Media | null = ((updatedAgency as any).profile_picture as Media) ?? ((updatedAgency as any).logo as Media) ?? null;
                onLogoChange(updatedLogo);
            }

            await queryClient.setQueryData(['agency', queryKeyForInvalidate], updatedAgency);
            await queryClient.invalidateQueries({ queryKey: ['agency', queryKeyForInvalidate] });
            await queryClient.refetchQueries({ queryKey: ['agency', queryKeyForInvalidate] });
            await queryClient.invalidateQueries({ queryKey: ['agencies'] });

            if (logoId) {
                showSuccess("لوگو آژانس با موفقیت به‌روزرسانی شد");
            } else {
                showSuccess("لوگو آژانس با موفقیت حذف شد");
            }
        } catch (error) {
            notifyApiError(error, {
                fallbackMessage: "خطا در ذخیره لوگو آژانس",
                preferBackendMessage: true,
                dedupeKey: 'agency-logo-update-system-error',
            });
        }
    };

    return (
        <Card className="overflow-hidden p-0">
            <div className="relative h-40 md:h-56">
                <img
                    src="/images/profile-banner.png"
                    alt="Cover image"
                    className="absolute inset-0 w-full h-full object-cover"
                />
            </div>
            <CardContent className="relative px-6 pt-0 pb-6">
                <div className="flex items-end gap-6 -mt-16">
                    <ImageSelector
                        selectedMedia={currentLogo}
                        onMediaSelect={handleLogoSelect}
                        size="md"
                        placeholderText={agency.name?.[0] || "A"}
                        context="media_library"
                        alt="لوگو آژانس"
                    />
                    <div className="flex-1 pt-16 pb-2">
                        <h2>
                            {agency.name || "نام آژانس"}
                        </h2>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-font-s mt-3">
                            <div className="flex items-center gap-2">
                                <div className={`flex items-center justify-center w-9 h-9 rounded-full p-2 ${agency.is_active ? "bg-green" : "bg-yellow"
                                    }`}>
                                    {agency.is_active ? (
                                        <CheckCircle2 className="w-5 h-5 text-green-1" />
                                    ) : (
                                        <XCircle className="w-5 h-5 text-yellow-1" />
                                    )}
                                </div>
                                <span className={agency.is_active ? "text-green-1" : "text-yellow-1"}>
                                    {agency.is_active ? "فعال" : "غیرفعال"}
                                </span>
                            </div>
                            {agency.created_at && (
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-blue p-2">
                                        <Clock className="w-5 h-5 text-blue-1" />
                                    </div>
                                    <span>
                                        ایجاد شده در{" "}
                                        {new Date(agency.created_at).toLocaleDateString("fa-IR")}
                                    </span>
                                </div>
                            )}
                            {agency.phone && (
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-purple p-2">
                                        <Phone className="w-5 h-5 text-purple-1" />
                                    </div>
                                    <span>{agency.phone}</span>
                                </div>
                            )}
                            {agency.city_name && (
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-indigo p-2">
                                        <MapPin className="w-5 h-5 text-indigo-1" />
                                    </div>
                                    <span>{agency.city_name}</span>
                                </div>
                            )}
                            {agency.is_verified && (
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center rounded-md bg-blue px-2.5 py-1 text-xs font-medium text-blue-2 ring-1 ring-inset ring-blue-1/20">
                                        ✓ تأیید شده
                                    </span>
                                </div>
                            )}
                            {(agency.rating ?? 0) > 0 && (
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-orange p-2">
                                        <Star className="w-5 h-5 text-orange-1" />
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-medium">{agency.rating}/5</span>
                                        <span className="text-muted-foreground">
                                            ({agency.total_reviews} نظر)
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

