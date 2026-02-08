import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { MediaGallery } from "@/components/media/galleries/MediaGallery";
import { Video, Music, FileText } from "lucide-react";
import type { PropertyMedia } from "@/types/real_estate/realEstateMedia";
import { MEDIA_MODULES } from "@/components/media/constants";
import { getModuleMediaCount } from "@/components/media/utils/genericMediaUtils";

interface MediaOtherProps {
    propertyMedia: PropertyMedia;
    setPropertyMedia: (media: PropertyMedia) => void;
    editMode: boolean;
    onVideoGalleryChange?: (media: any[]) => void;
    onAudioGalleryChange?: (media: any[]) => void;
    onPdfDocumentsChange?: (media: any[]) => void;
    propertyId?: number | string;
}

export function MediaOther({
    propertyMedia,
    setPropertyMedia,
    editMode,
    onVideoGalleryChange,
    onAudioGalleryChange,
    onPdfDocumentsChange,
    propertyId
}: MediaOtherProps) {
    const totalMediaCount = getModuleMediaCount(propertyMedia);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
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
            </div>

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
        </div>
    );
}
