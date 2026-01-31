import { useState, useEffect, useCallback } from "react";
import {
  Image as ImageIcon,
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Maximize2
} from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { mediaService } from "@/components/media/services";
import type { Property } from "@/types/real_estate/realEstate";
import { cn } from "@/core/utils/cn";
import { Card, CardContent } from "@/components/elements/Card";

interface PropertyImageGalleryProps {
  property: Property;
  className?: string;
}

export function RealEstateCarousel({ property, className }: PropertyImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const [mainRef, mainApi] = useEmblaCarousel({
    loop: true,
    direction: 'rtl',
  });

  const [thumbRef, thumbApi] = useEmblaCarousel({
    containScroll: 'keepSnaps',
    dragFree: true,
    direction: 'rtl',
  });

  const [lightboxRef, lightboxApi] = useEmblaCarousel({
    loop: true,
    direction: 'rtl',
  });

  const allMedia = property.media || property.property_media || [];

  const galleryItems = allMedia
    .filter((item: any) => {
      const media = item.media_detail || item.media || item;
      return media?.media_type === 'image' || media?.media_type === 'video';
    })
    .map((item: any) => {
      const media = item.media_detail || item.media || item;
      const mediaUrl = media?.file_url || media?.url || null;
      const fullUrl = mediaUrl ? mediaService.getMediaUrlFromObject({ file_url: mediaUrl } as any) : null;
      const coverUrl = media?.cover_image?.file_url ? mediaService.getMediaUrlFromObject({ file_url: media.cover_image.file_url } as any) : null;

      return {
        id: item.id,
        media,
        type: media?.media_type || 'image',
        url: fullUrl || '',
        coverUrl: coverUrl || fullUrl || '',
        title: media?.title || `${media?.media_type === 'video' ? 'ویدئو' : 'تصویر'} ${item.id}`,
        alt: media?.title || property.title || 'رسانه ملک',
        isMainImage: item.is_main_image || false,
      };
    })
    .filter((item: any) => item.url !== '');

  const mediaItems: any[] = [];

  if (property.main_image?.file_url || property.main_image?.url) {
    const mainImageUrl = mediaService.getMediaUrlFromObject(property.main_image as any);
    if (mainImageUrl) {
      mediaItems.push({
        id: `main-${property.main_image.id || 0}`,
        type: 'image',
        url: mainImageUrl,
        coverUrl: mainImageUrl,
        title: property.main_image.title || 'عکس شاخص',
        alt: property.main_image.alt_text || property.title || 'عکس شاخص ملک',
        isMainImage: true,
      });
    }
  }

  galleryItems.forEach(item => {
    if (!item.isMainImage) {
      mediaItems.push(item);
    }
  });

  const onSelect = useCallback(() => {
    if (!mainApi) return;
    setSelectedIndex(mainApi.selectedScrollSnap());
  }, [mainApi]);

  useEffect(() => {
    if (!mainApi) return;
    onSelect();
    mainApi.on('select', onSelect);
    mainApi.on('reInit', onSelect);
    return () => {
      mainApi.off('select', onSelect);
    };
  }, [mainApi, onSelect]);

  useEffect(() => {
    if (!thumbApi) return;
    thumbApi.scrollTo(selectedIndex);
  }, [selectedIndex, thumbApi]);

  useEffect(() => {
    if (!lightboxApi || !isLightboxOpen) return;
    lightboxApi.scrollTo(selectedIndex);
  }, [selectedIndex, lightboxApi, isLightboxOpen]);

  const scrollPrev = useCallback(() => {
    mainApi?.scrollPrev();
  }, [mainApi]);

  const scrollNext = useCallback(() => {
    mainApi?.scrollNext();
  }, [mainApi]);

  const onThumbClick = useCallback(
    (index: number) => {
      if (!mainApi) return;
      mainApi.scrollTo(index);
    },
    [mainApi]
  );

  if (mediaItems.length === 0) {
    return (
      <div className={cn("relative w-full h-[500px] rounded-xl border border-br bg-bg flex items-center justify-center", className)}>
        <div className="text-center space-y-4">
          <ImageIcon className="w-16 h-16 mx-auto text-font-s" />
          <p className="text-font-s">تصویر یا ویدئویی برای این ملک آپلود نشده است</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={cn("overflow-hidden rounded-xl bg-card", className)}>
        {/* Main Slider Area - Full Width/Immersive - Removed internal borders/padding */}
        <div className="relative w-full h-[450px] md:h-[550px] group bg-bg-2">

          <div ref={mainRef} className="overflow-hidden h-full">
            <div className="flex h-full" dir="rtl">
              {mediaItems.map((item, index) => (
                <div key={item.id} className="flex-[0_0_100%] min-w-0 h-full">
                  <div
                    className="relative w-full h-full cursor-pointer"
                    onClick={() => setIsLightboxOpen(true)}
                  >
                    {item.type === 'video' ? (
                      <div className="relative w-full h-full bg-black">
                        <video
                          src={item.url}
                          className="w-full h-full object-contain"
                          poster={item.coverUrl}
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                          <div className="size-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                            <Play className="w-8 h-8 text-white fill-white ml-1" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={item.url}
                        alt={item.alt}
                        className="w-full h-full object-cover"
                        loading={index === 0 ? "eager" : "lazy"}
                      />
                    )}

                    <div className="absolute inset-0 bg-linear-to-b from-black/0 via-black/0 to-black/30 pointer-events-none" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Overlays */}
          <div className="absolute top-4 right-4 flex gap-2 z-10">
            {mediaItems[selectedIndex]?.isMainImage && (
              <span className="px-3 py-1.5 rounded-lg bg-primary/90 text-white text-xs font-bold shadow-sm backdrop-blur-sm">
                عکس شاخص
              </span>
            )}
            {mediaItems[selectedIndex]?.type === 'video' && (
              <span className="px-3 py-1.5 rounded-lg bg-red-500/90 text-white text-xs font-bold shadow-sm backdrop-blur-sm flex items-center gap-1">
                <Play className="w-3 h-3 fill-current" />
                ویدیو
              </span>
            )}
          </div>

          <div className="absolute top-4 left-4 z-10">
            <button
              onClick={() => setIsLightboxOpen(true)}
              className="p-2.5 rounded-lg bg-black/40 text-white hover:bg-black/60 backdrop-blur-md transition-all cursor-pointer"
              title="نمایش تمام صفحه"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
          </div>

          <div className="absolute bottom-4 right-4 z-10 px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur-md text-white text-sm font-medium border border-white/10">
            {selectedIndex + 1} از {mediaItems.length}
          </div>

          {/* Navigation Arrows */}
          {mediaItems.length > 1 && (
            <>
              <button
                onClick={scrollNext}
                className="absolute left-4 top-1/2 -translate-y-1/2 size-12 rounded-full bg-black/20 hover:bg-black/50 backdrop-blur-md text-white border border-white/10 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 cursor-pointer z-20"
              >
                <ChevronLeft className="w-7 h-7" />
              </button>
              <button
                onClick={scrollPrev}
                className="absolute right-4 top-1/2 -translate-y-1/2 size-12 rounded-full bg-black/20 hover:bg-black/50 backdrop-blur-md text-white border border-white/10 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 cursor-pointer z-20"
              >
                <ChevronRight className="w-7 h-7" />
              </button>
            </>
          )}
        </div>

        {/* Thumbnails - Clean Strip - Removed top border */}
        {mediaItems.length > 1 && (
          <div className="py-3 px-3 bg-card custom-scrollbar overflow-x-auto">
            <div ref={thumbRef} className="overflow-hidden">
              <div className="flex gap-2.5" dir="rtl">
                {mediaItems.map((item, index) => (
                  <button
                    key={item.id}
                    onClick={() => onThumbClick(index)}
                    className={cn(
                      "relative flex-[0_0_auto] w-24 h-16 rounded-lg overflow-hidden transition-all cursor-pointer",
                      selectedIndex === index
                        ? "ring-2 ring-primary ring-offset-2 ring-offset-card"
                        : "opacity-70 hover:opacity-100"
                    )}
                  >
                    <img
                      src={item.type === 'video' ? item.coverUrl : item.url}
                      alt={item.alt}
                      className="w-full h-full object-cover"
                    />
                    {item.type === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Play className="w-4 h-4 text-white fill-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center">
          <div className="absolute top-0 w-full p-4 flex justify-between items-center z-50 bg-linear-to-b from-black/50 to-transparent">
            <span className="text-white font-medium">{selectedIndex + 1} / {mediaItems.length}</span>
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div ref={lightboxRef} className="overflow-hidden w-full h-full">
            <div className="flex h-full" dir="rtl">
              {mediaItems.map((item, index) => (
                <div key={item.id} className="flex-[0_0_100%] min-w-0 h-full flex items-center justify-center p-4">
                  {item.type === 'video' ? (
                    <video
                      src={item.url}
                      className="max-w-full max-h-[90vh] rounded-lg shadow-2xl"
                      controls
                      poster={item.coverUrl}
                      preload="metadata"
                      autoPlay={index === selectedIndex}
                    />
                  ) : (
                    <img
                      src={item.url}
                      alt={item.alt}
                      className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                      loading={index === selectedIndex ? "eager" : "lazy"}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {mediaItems.length > 1 && (
            <>
              <button
                onClick={() => lightboxApi?.scrollPrev()}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer backdrop-blur-sm"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
              <button
                onClick={() => lightboxApi?.scrollNext()}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer backdrop-blur-sm"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
