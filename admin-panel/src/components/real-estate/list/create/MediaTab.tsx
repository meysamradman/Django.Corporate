import { useState, lazy, Suspense } from "react";
import { TabsContent } from "@/components/elements/Tabs";
import { Button } from "@/components/elements/Button";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { MediaGallery } from "@/components/media/galleries/MediaGallery";
import type { Media } from "@/types/shared/media";
import { Image as ImageIcon, UploadCloud, X, AlertCircle, Video, Music, FileText } from "lucide-react";
import { mediaService } from "@/components/media/services";
import type { PropertyMedia } from "@/types/real_estate/propertyMedia";

const MediaLibraryModal = lazy(() => import("@/components/media/modals/MediaLibraryModal").then(mod => ({ default: mod.MediaLibraryModal })));

interface MediaTabProps {
    propertyMedia: PropertyMedia;
    setPropertyMedia: (media: PropertyMedia) => void;
    editMode: boolean;
    featuredImage?: Media | null;
    onFeaturedImageChange?: (media: Media | null) => void;
    propertyId?: number | string;
}

export default function MediaTab(props: MediaTabProps) {
    const { propertyMedia, setPropertyMedia, editMode, featuredImage, onFeaturedImageChange, propertyId } = props;
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

    return (
        <TabsContent value="media" className="mt-0 space-y-6">
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 min-w-0 space-y-6">
                    <CardWithIcon
                        icon={ImageIcon}
                        title="گالری تصاویر"
                        iconBgColor="bg-blue"
                        iconColor="stroke-blue-2"
                        borderColor="border-b-blue-1"
                    >
                        <MediaGallery
                            mediaItems={propertyMedia?.imageGallery || []}
                            onMediaSelect={(media) => setPropertyMedia?.({ ...propertyMedia, imageGallery: media })}
                            mediaType="image"
                            title=""
                            isGallery={true}
                            disabled={!editMode}
                            context="property"
                            contextId={propertyId}
                        />
                    </CardWithIcon>

                    <CardWithIcon
                        icon={Video}
                        title="ویدیو"
                        iconBgColor="bg-purple"
                        iconColor="stroke-purple-2"
                        borderColor="border-b-purple-1"
                    >
                        <MediaGallery
                            mediaItems={propertyMedia?.videoGallery || []}
                            onMediaSelect={(media) => setPropertyMedia?.({ ...propertyMedia, videoGallery: media })}
                            mediaType="video"
                            title=""
                            isGallery={false}
                            disabled={!editMode}
                            context="property"
                            contextId={propertyId}
                        />
                    </CardWithIcon>

                    <CardWithIcon
                        icon={Music}
                        title="فایل صوتی"
                        iconBgColor="bg-pink"
                        iconColor="stroke-pink-2"
                        borderColor="border-b-pink-1"
                    >
                        <MediaGallery
                            mediaItems={propertyMedia?.audioGallery || []}
                            onMediaSelect={(media) => setPropertyMedia?.({ ...propertyMedia, audioGallery: media })}
                            mediaType="audio"
                            title=""
                            isGallery={false}
                            disabled={!editMode}
                            context="property"
                            contextId={propertyId}
                        />
                    </CardWithIcon>

                    <CardWithIcon
                        icon={FileText}
                        title="مستندات (PDF)"
                        iconBgColor="bg-gray"
                        iconColor="stroke-gray-2"
                        borderColor="border-b-gray-1"
                    >
                        <MediaGallery
                            mediaItems={propertyMedia?.pdfDocuments || []}
                            onMediaSelect={(media) => setPropertyMedia?.({ ...propertyMedia, pdfDocuments: media })}
                            mediaType="pdf"
                            title=""
                            isGallery={false}
                            disabled={!editMode}
                            context="property"
                            contextId={propertyId}
                        />
                    </CardWithIcon>
                </div>

                <div className="w-full lg:w-[420px] lg:flex-shrink-0">
                    <CardWithIcon
                        icon={ImageIcon}
                        title={
                            <>
                                تصویر شاخص
                                <span className="text-red-2">*</span>
                            </>
                        }
                        iconBgColor="bg-blue"
                        iconColor="stroke-blue-2"
                        borderColor="border-b-blue-1"
                        className="lg:sticky lg:top-20"
                    >
                        {currentFeaturedImage ? (
                            <div className="relative w-full aspect-video rounded-lg overflow-hidden group border">
                                <img
                                    src={mediaService.getMediaUrlFromObject(currentFeaturedImage)}
                                    alt={currentFeaturedImage.alt_text || "تصویر شاخص"}
                                    className="object-cover w-full h-full"
                                />
                                <div className="absolute inset-0 bg-static-b/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsMediaModalOpen(true)}
                                        className="mx-1"
                                        disabled={!editMode}
                                    >
                                        تغییر تصویر
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={handleRemoveFeaturedImage}
                                        className="mx-1"
                                        disabled={!editMode}
                                    >
                                        <X className="w-4 h-4" />
                                        حذف
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div
                                onClick={() => editMode && setIsMediaModalOpen(true)}
                                className={`relative flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-lg cursor-pointer hover:border-blue-1 transition-colors ${!editMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <UploadCloud className="w-12 h-12 text-font-s" />
                                <p className="font-semibold">انتخاب تصویر شاخص</p>
                                <p className="text-font-s text-center">
                                    برای انتخاب از کتابخانه کلیک کنید
                                </p>
                            </div>
                        )}
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
                    context="property"
                    contextId={propertyId}
                />
            </Suspense>
        </TabsContent>
    );
}

