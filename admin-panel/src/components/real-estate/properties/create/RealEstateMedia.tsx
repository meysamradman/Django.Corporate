
import { RealEstateGallery } from "./media/RealEstateGallery";
import { RealEstateFeaturedImage } from "./media/RealEstateFeaturedImage";
import { RealEstateVideos } from "./media/RealEstateVideos";
import { RealEstateAudios } from "./media/RealEstateAudios";
import { RealEstateDocuments } from "./media/RealEstateDocuments";
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
                    <RealEstateGallery
                        propertyMedia={propertyMedia}
                        onGalleryChange={onGalleryChange}
                        setPropertyMedia={setPropertyMedia}
                        editMode={editMode}
                        propertyId={propertyId}
                    />

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            <RealEstateVideos
                                propertyMedia={propertyMedia}
                                setPropertyMedia={setPropertyMedia}
                                editMode={editMode}
                                onVideoGalleryChange={onVideoGalleryChange}
                                propertyId={propertyId}
                            />

                            <RealEstateAudios
                                propertyMedia={propertyMedia}
                                setPropertyMedia={setPropertyMedia}
                                editMode={editMode}
                                onAudioGalleryChange={onAudioGalleryChange}
                                propertyId={propertyId}
                            />
                        </div>

                        <RealEstateDocuments
                            propertyMedia={propertyMedia}
                            setPropertyMedia={setPropertyMedia}
                            editMode={editMode}
                            onPdfDocumentsChange={onPdfDocumentsChange}
                            propertyId={propertyId}
                        />
                    </div>
                </div>

                <div className="w-full lg:w-[380px] lg:shrink-0">
                    <RealEstateFeaturedImage
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

export { RealEstateMedia };

