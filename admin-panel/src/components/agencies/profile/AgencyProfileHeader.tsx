import { Card, CardContent } from "@/components/elements/Card";
import type { RealEstateAgency } from "@/types/real_estate/agency/realEstateAgency";
import type { Media } from "@/types/shared/media";
import { ImageSelector } from "@/components/media/selectors/ImageSelector";
import { CheckCircle2, XCircle, Phone, Clock, Building2, Award } from "lucide-react";
import { showSuccess, showError } from '@/core/toast';
import { useState } from "react";
import { useQueryClient } from '@tanstack/react-query';
import { realEstateApi } from "@/api/real-estate";

interface AgencyProfileHeaderProps {
    agency: RealEstateAgency;
    formData?: {
        name: string;
        phone?: string | null;
        logo?: any | null;
    };
    onLogoChange?: (media: any | null) => void;
    agencyId?: string;
}

export function AgencyProfileHeader({ agency, formData, onLogoChange, agencyId }: AgencyProfileHeaderProps) {
    const queryClient = useQueryClient();
    const [isSaving, setIsSaving] = useState(false);
    
    const currentLogo = (formData?.logo || agency?.logo || null) as Media | null;

    const handleLogoSelect = async (selectedMedia: Media | null) => {
        if (isSaving) return;
        
        setIsSaving(true);
        const logoId = selectedMedia?.id || null;

        if (!agency?.id) {
            showError("شناسه آژانس یافت نشد");
            setIsSaving(false);
            return;
        }

        try {
            const updateData: any = {
                logo: logoId,
            };

            const targetAgencyId = agencyId && !isNaN(Number(agencyId)) ? Number(agencyId) : agency.id;
            await realEstateApi.partialUpdateAgency(targetAgencyId, updateData);

            if (onLogoChange) {
                onLogoChange(selectedMedia);
            }

            const queryKeyForInvalidate = agencyId || String(agency.id);
            await queryClient.invalidateQueries({ queryKey: ['agency', queryKeyForInvalidate] });
            await queryClient.refetchQueries({ queryKey: ['agency', queryKeyForInvalidate] });
            await queryClient.invalidateQueries({ queryKey: ['agencies'] });

            if (logoId) {
                showSuccess("لوگو با موفقیت به‌روزرسانی شد");
            } else {
                showSuccess("لوگو با موفقیت حذف شد");
            }
        } catch (error) {
            showError(error, { customMessage: "خطا در ذخیره لوگو" });
        } finally {
            setIsSaving(false);
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
                        placeholderText={formData?.name?.[0] || agency.name?.[0] || "A"}
                        context="media_library"
                        alt="لوگو آژانس"
                        disabled={isSaving}
                    />
                    <div className="flex-1 pt-16 pb-2">
                        <h2>
                            {formData?.name || agency.name || "نام آژانس"}
                        </h2>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-font-s mt-3">
                            <div className="flex items-center gap-2">
                                <div className={`flex items-center justify-center w-9 h-9 rounded-full p-2 ${
                                    agency.is_active ? "bg-green" : "bg-yellow"
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
                            
                            {agency.is_verified && (
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-blue p-2">
                                        <Award className="w-5 h-5 text-blue-1" />
                                    </div>
                                    <span className="text-blue-1">تأیید شده</span>
                                </div>
                            )}
                            
                            {agency.created_at && (
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-purple p-2">
                                        <Clock className="w-5 h-5 text-purple-1" />
                                    </div>
                                    <span>
                                        ایجاد شده در{" "}
                                        {new Date(agency.created_at).toLocaleDateString("fa-IR")}
                                    </span>
                                </div>
                            )}
                            
                            {(formData?.phone || agency.phone) && (
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-orange p-2">
                                        <Phone className="w-5 h-5 text-orange-1" />
                                    </div>
                                    <span>{formData?.phone || agency.phone}</span>
                                </div>
                            )}
                            
                            {agency.license_number && (
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-blue p-2">
                                        <Building2 className="w-5 h-5 text-blue-1" />
                                    </div>
                                    <span>پروانه: {agency.license_number}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default AgencyProfileHeader;
