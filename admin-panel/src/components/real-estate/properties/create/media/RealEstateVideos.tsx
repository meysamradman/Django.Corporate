
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { MediaGallery } from "@/components/media/galleries/MediaGallery";
import { Video } from "lucide-react";
import type { PropertyMedia } from "@/types/real_estate/realEstateMedia";
import { MEDIA_MODULES } from "@/components/media/constants";
import { getModuleMediaCount } from "@/components/media/utils/genericMediaUtils";

interface RealEstateVideosProps {
    propertyMedia: PropertyMedia;
    setPropertyMedia: (media: PropertyMedia) => void;
    editMode: boolean;
    onVideoGalleryChange?: (media: any[]) => void;
    propertyId?: number | string;
}

export function RealEstateVideos({
    propertyMedia,
    setPropertyMedia,
    editMode,
    onVideoGalleryChange,
    propertyId
}: RealEstateVideosProps) {
    const totalMediaCount = getModuleMediaCount(propertyMedia);

    return (
        <CardWithIcon
            icon={Video}
            title="ویدیو و تیزر"
            iconBgColor="bg-purple-0"
            iconColor="stroke-purple-2"
            cardBorderColor="border-b-purple-1"
        >
            <MediaGallery
                mediaItems={(propertyMedia?.videoGallery || []).filter(m => m.media_type === 'video')}
                onMediaSelect={(media) => onVideoGalleryChange ? onVideoGalleryChange(media) : setPropertyMedia?.({ ...propertyMedia, videoGallery: media })}
                mediaType="video"
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
