import { useState, lazy, Suspense } from "react";
import { Button } from "@/components/elements/Button";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { MediaGallery } from "@/components/media/galleries/MediaGallery";
import type { Media } from "@/types/shared/media";
import { Image as ImageIcon, X, Video, Music, FileText } from "lucide-react";
import { mediaService } from "@/components/media/services";
import type { PropertyMedia } from "@/types/real_estate/realEstateMedia";
import { getModuleMediaCount } from "@/components/media/utils/genericMediaUtils";
import { MEDIA_MODULES } from "@/components/media/constants";

const MediaLibraryModal = lazy(() => import("@/components/media/modals/MediaLibraryModal").then(mod => ({ default: mod.MediaLibraryModal })));

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
    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

    const currentFeaturedImage = featuredImage || propertyMedia?.featuredImage;

    const handleFeaturedImageSelect = (media: Media | Media[] | null) => {
        const selected = Array.isArray(media) ? media[0] || null : media;
        onFeaturedImageChange?.(selected);
        setPropertyMedia?.({
            ...propertyMedia,
            featuredImage: selected
        });
        setIsMediaModalOpen(false);
    };

    const handleRemoveFeaturedImage = () => {
        onFeaturedImageChange?.(null);
        setPropertyMedia?.({
            ...propertyMedia,
            featuredImage: null
        });
    };

    const totalMediaCount = getModuleMediaCount(propertyMedia);

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 min-w-0 space-y-6">
                    <CardWithIcon
                        icon={ImageIcon}
                        title="آرشیو تصاویر و گالری"
                        iconBgColor="bg-blue-0"
                        iconColor="stroke-blue-2"
                        borderColor="border-b-blue-1"
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

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        <CardWithIcon
                            icon={Video}
                            title="ویدیو و تیزر"
                            iconBgColor="bg-purple-0"
                            iconColor="stroke-purple-2"
                            borderColor="border-b-purple-1"
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
                            borderColor="border-b-pink-1"
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
                        borderColor="border-b-orange-1"
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

                <div className="w-full lg:w-[380px] lg:shrink-0">
                    <CardWithIcon
                        icon={ImageIcon}
                        title="تصویر اصلی ملک"
                        iconBgColor="bg-indigo-0"
                        iconColor="stroke-indigo-1"
                        borderColor="border-b-indigo-1"
                        className="lg:sticky lg:top-20"
                    >
                        <div className="space-y-4">
                            {currentFeaturedImage ? (
                                <div className="relative group aspect-4/3 rounded-2xl overflow-hidden border border-br shadow-sm bg-muted/5">
                                    <img
                                        src={mediaService.getMediaUrlFromObject(currentFeaturedImage)}
                                        alt={currentFeaturedImage.alt_text || "تصویر شاخص"}
                                        className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
                                    />

                                    <div className="absolute inset-x-0 bottom-0 p-4 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
                                        <div className="bg-black/40 backdrop-blur-md rounded-xl p-3 border border-wt/10">
                                            <p className="text-static-w text-[11px] font-bold truncate">
                                                {currentFeaturedImage.title || currentFeaturedImage.original_file_name}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1 opacity-70">
                                                <span className="text-static-w text-[9px] uppercase font-bold">
                                                    {currentFeaturedImage.file_size ? `${(currentFeaturedImage.file_size / 1024 / 1024).toFixed(1)} MB` : 'Size Unknown'}
                                                </span>
                                                <span className="w-0.5 h-0.5 rounded-full bg-wt" />
                                                <span className="text-static-w text-[9px] uppercase font-bold">
                                                    {currentFeaturedImage.mime_type?.split('/').pop()?.toUpperCase() || 'IMAGE'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setIsMediaModalOpen(true)}
                                            className="bg-wt/10 border-wt/20 text-static-w hover:bg-wt/25 backdrop-blur-md h-9 px-4 text-[11px] font-bold gap-2"
                                            disabled={!editMode}
                                        >
                                            تغییر تصویر
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={handleRemoveFeaturedImage}
                                            className="h-9 w-9 p-0 shadow-lg"
                                            disabled={!editMode}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    <div className="absolute top-3 right-3 px-3 py-1.5 bg-indigo shadow-xl ring-4 ring-indigo/20 text-static-w text-[9px] font-black rounded-full uppercase tracking-widest">
                                        شاخص
                                    </div>
                                </div>
                            ) : (
                                <div
                                    onClick={() => editMode && setIsMediaModalOpen(true)}
                                    className={`relative flex flex-col items-center justify-center w-full aspect-4/3 border-2 border-dashed border-br rounded-2xl cursor-pointer hover:border-indigo-1/40 hover:bg-indigo-0/5 transition-all duration-300 group ${!editMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <div className="w-16 h-16 rounded-full bg-indigo-0 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                        <ImageIcon className="w-8 h-8 text-indigo-1" />
                                    </div>
                                    <p className="font-bold text-font-p">انتخاب تصویر اصلی</p>
                                    <p className="text-font-xs text-font-s/60 mt-1">جهت انتخاب از کتابخانه کلیک کنید</p>

                                    <div className="absolute inset-4 border border-indigo-1/5 rounded-xl pointer-events-none" />
                                </div>
                            )}
                        </div>
                    </CardWithIcon>
                </div>
            </div>

            <Suspense fallback={<div className="flex items-center justify-center p-8"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>}>
                <MediaLibraryModal
                    isOpen={isMediaModalOpen}
                    onClose={() => setIsMediaModalOpen(false)}
                    onSelect={handleFeaturedImageSelect}
                    selectMultiple={false}
                    initialFileType="image"
                    context={MEDIA_MODULES.REAL_ESTATE}
                    contextId={propertyId}
                />
            </Suspense>
        </div >
    );
}

