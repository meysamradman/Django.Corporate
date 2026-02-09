
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { MediaGallery } from "@/components/media/galleries/MediaGallery";
import { FileText } from "lucide-react";
import type { PropertyMedia } from "@/types/real_estate/realEstateMedia";
import { MEDIA_MODULES } from "@/components/media/constants";
import { getModuleMediaCount } from "@/components/media/utils/genericMediaUtils";

interface RealEstateDocumentsProps {
    propertyMedia: PropertyMedia;
    setPropertyMedia: (media: PropertyMedia) => void;
    editMode: boolean;
    onPdfDocumentsChange?: (media: any[]) => void;
    propertyId?: number | string;
}

export function RealEstateDocuments({
    propertyMedia,
    setPropertyMedia,
    editMode,
    onPdfDocumentsChange,
    propertyId
}: RealEstateDocumentsProps) {
    const totalMediaCount = getModuleMediaCount(propertyMedia);

    return (
        <CardWithIcon
            icon={FileText}
            title="مستندات و فایل‌های ضمیمه (PDF)"
            iconBgColor="bg-orange-0"
            iconColor="stroke-orange-2"
            cardBorderColor="border-b-orange-1"
        >
            <MediaGallery
                mediaItems={(propertyMedia?.pdfDocuments || []).filter(m => m.media_type === 'document' || m.media_type === 'pdf')}
                onMediaSelect={(media) => onPdfDocumentsChange ? onPdfDocumentsChange(media) : setPropertyMedia?.({ ...propertyMedia, pdfDocuments: media })}
                mediaType="document"
                title=""
                isGallery={false}
                disabled={!editMode}
                context={MEDIA_MODULES.REAL_ESTATE}
                contextId={propertyId}
                totalItemsCount={totalMediaCount}
            />
        </CardWithIcon>
    );
}
