
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { MediaGallery } from "@/components/media/galleries/MediaGallery";
import { Image as ImageIcon } from "lucide-react";
import type { PropertyMedia } from "@/types/real_estate/realEstateMedia";
import { MEDIA_MODULES } from "@/components/media/constants";
import { getModuleMediaCount } from "@/components/media/utils/genericMediaUtils";

interface RealEstateGalleryProps {
    propertyMedia: PropertyMedia;
    onGalleryChange?: (media: any[]) => void;
    setPropertyMedia?: (media: PropertyMedia) => void;
    editMode: boolean;
    propertyId?: number | string;
}

export function RealEstateGallery({
    propertyMedia,
    onGalleryChange,
    setPropertyMedia,
    editMode,
    propertyId
}: RealEstateGalleryProps) {
    const totalMediaCount = getModuleMediaCount(propertyMedia);

    return (
        <CardWithIcon
            icon={ImageIcon}
            title="آرشیو تصاویر و گالری"
            iconBgColor="bg-blue"
            iconColor="stroke-blue-2"
            cardBorderColor="border-b-blue-1"
        >
            <MediaGallery
                mediaItems={(propertyMedia?.imageGallery || []).filter(m => m.media_type === 'image' || !m.media_type)}
                onMediaSelect={(media) => onGalleryChange ? onGalleryChange(media) : setPropertyMedia?.({ ...propertyMedia, imageGallery: media })}
                mediaType="image"
                title=""
                isGallery={true}
                disabled={!editMode}
                context={MEDIA_MODULES.REAL_ESTATE}
                contextId={propertyId}
                totalItemsCount={totalMediaCount}
            />
        </CardWithIcon>
    );
}
