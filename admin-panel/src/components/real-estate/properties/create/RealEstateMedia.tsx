import { MediaImages } from "./media/MediaImages";
import { MediaFeatured } from "./media/MediaFeatured";
import { MediaOther } from "./media/MediaOther";
import type { Media } from "@/types/shared/media";
import type { PropertyMedia } from "@/types/real_estate/realEstateMedia";

interface MediaTabProps {
    propertyMedia: PropertyMedia;
    setPropertyMedia: (media: PropertyMedia) => void;
    editMode: boolean;
    featuredImage?: Media | null;
    onFeaturedImageChange?: (media: Media | null) => void;
    onGalleryChange?: (media: Media[]) => void;
    onVideoGalleryChange?: (media: Media[]) => void;
    onAudioGalleryChange?: (media: Media[]) => void;
    onPdfDocumentsChange?: (media: Media[]) => void;
    propertyId?: number | string;
}

export default function RealEstateMedia(props: MediaTabProps) {
    const {
        propertyMedia,
        setPropertyMedia,
        editMode,
        featuredImage,
        onFeaturedImageChange,
        onGalleryChange,
        onVideoGalleryChange,
        onAudioGalleryChange,
        onPdfDocumentsChange,
        propertyId
    } = props;

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 min-w-0 space-y-6">
                    <MediaImages
                        propertyMedia={propertyMedia}
                        onGalleryChange={onGalleryChange}
                        setPropertyMedia={setPropertyMedia}
                        editMode={editMode}
                        propertyId={propertyId}
                    />

                    <MediaOther
                        propertyMedia={propertyMedia}
                        setPropertyMedia={setPropertyMedia}
                        editMode={editMode}
                        onVideoGalleryChange={onVideoGalleryChange}
                        onAudioGalleryChange={onAudioGalleryChange}
                        onPdfDocumentsChange={onPdfDocumentsChange}
                        propertyId={propertyId}
                    />
                </div>

                <div className="w-full lg:w-[380px] lg:shrink-0">
                    <MediaFeatured
                        propertyMedia={propertyMedia}
                        setPropertyMedia={setPropertyMedia}
                        featuredImage={featuredImage}
                        onFeaturedImageChange={onFeaturedImageChange}
                        editMode={editMode}
                        propertyId={propertyId}
                    />
                </div>
            </div>
        </div>
    );
}

