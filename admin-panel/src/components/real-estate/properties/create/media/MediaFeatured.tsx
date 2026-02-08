import { useState, lazy, Suspense } from "react";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Button } from "@/components/elements/Button";
import { mediaService } from "@/components/media/services";
import { Image as ImageIcon, X } from "lucide-react";
import type { Media } from "@/types/shared/media";
import type { PropertyMedia } from "@/types/real_estate/realEstateMedia";
import { MEDIA_MODULES } from "@/components/media/constants";

const MediaLibraryModal = lazy(() => import("@/components/media/modals/MediaLibraryModal").then(mod => ({ default: mod.MediaLibraryModal })));

interface MediaFeaturedProps {
    propertyMedia: PropertyMedia;
    setPropertyMedia: (media: PropertyMedia) => void;
    featuredImage?: Media | null;
    onFeaturedImageChange?: (media: Media | null) => void;
    editMode: boolean;
    propertyId?: number | string;
}

export function MediaFeatured({
    propertyMedia,
    setPropertyMedia,
    featuredImage,
    onFeaturedImageChange,
    editMode,
    propertyId
}: MediaFeaturedProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const currentFeaturedImage = featuredImage || propertyMedia?.featuredImage;

    const handleSelect = (media: Media | Media[] | null) => {
        const selected = Array.isArray(media) ? media[0] || null : media;
        onFeaturedImageChange?.(selected);
        setPropertyMedia?.({
            ...propertyMedia,
            featuredImage: selected
        });
        setIsModalOpen(false);
    };

    const handleRemove = () => {
        onFeaturedImageChange?.(null);
        setPropertyMedia?.({
            ...propertyMedia,
            featuredImage: null
        });
    };

    return (
        <>
            <CardWithIcon
                icon={ImageIcon}
                title="تصویر اصلی ملک"
                iconBgColor="bg-indigo-0"
                iconColor="stroke-indigo-1"
                cardBorderColor="border-b-indigo-1"
                className="lg:sticky lg:top-20"
            >
                {currentFeaturedImage ? (
                    <div className="relative group aspect-4/3 rounded-2xl overflow-hidden border border-br shadow-sm bg-muted/5">
                        <img
                            src={mediaService.getMediaUrlFromObject(currentFeaturedImage)}
                            alt={currentFeaturedImage.alt_text || "تصویر شاخص"}
                            className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsModalOpen(true)}
                                className="bg-wt/10 border-wt/20 text-static-w hover:bg-wt/25 backdrop-blur-md h-9 px-4 text-[11px] font-bold"
                                disabled={!editMode}
                            >
                                تغییر تصویر
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleRemove}
                                className="h-9 w-9 p-0"
                                disabled={!editMode}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="absolute top-3 right-3 px-3 py-1.5 bg-indigo text-static-w text-[9px] font-black rounded-full uppercase">
                            شاخص
                        </div>
                    </div>
                ) : (
                    <div
                        onClick={() => editMode && setIsModalOpen(true)}
                        className={`relative flex flex-col items-center justify-center w-full aspect-4/3 border-2 border-dashed border-br rounded-2xl cursor-pointer hover:border-indigo-1/40 hover:bg-indigo-0/5 transition-all duration-300 group ${!editMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <div className="w-16 h-16 rounded-full bg-indigo-0 flex items-center justify-center mb-4">
                            <ImageIcon className="w-8 h-8 text-indigo-1" />
                        </div>
                        <p className="font-bold text-font-p">انتخاب تصویر اصلی</p>
                    </div>
                )}
            </CardWithIcon>

            <Suspense fallback={null}>
                <MediaLibraryModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSelect={handleSelect}
                    selectMultiple={false}
                    initialFileType="image"
                    context={MEDIA_MODULES.REAL_ESTATE}
                    contextId={propertyId}
                />
            </Suspense>
        </>
    );
}
