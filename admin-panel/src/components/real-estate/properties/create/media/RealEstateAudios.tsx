
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { MediaGallery } from "@/components/media/galleries/MediaGallery";
import { Music } from "lucide-react";
import type { PropertyMedia } from "@/types/real_estate/realEstateMedia";
import { MEDIA_MODULES } from "@/components/media/constants";
import { getModuleMediaCount } from "@/components/media/utils/genericMediaUtils";

interface RealEstateAudiosProps {
    propertyMedia: PropertyMedia;
    setPropertyMedia: (media: PropertyMedia) => void;
    editMode: boolean;
    onAudioGalleryChange?: (media: any[]) => void;
    propertyId?: number | string;
}

export function RealEstateAudios({
    propertyMedia,
    setPropertyMedia,
    editMode,
    onAudioGalleryChange,
    propertyId
}: RealEstateAudiosProps) {
    const totalMediaCount = getModuleMediaCount(propertyMedia);

    return (
        <CardWithIcon
            icon={Music}
            title="توضیحات صوتی"
            iconBgColor="bg-pink-0"
            iconColor="stroke-pink-2"
            cardBorderColor="border-b-pink-1"
        >
            <MediaGallery
                mediaItems={(propertyMedia?.audioGallery || []).filter(m => m.media_type === 'audio')}
                onMediaSelect={(media) => onAudioGalleryChange ? onAudioGalleryChange(media) : setPropertyMedia?.({ ...propertyMedia, audioGallery: media })}
                mediaType="audio"
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
