import { useState, useEffect, useCallback } from "react";
import { Image as ImageIcon, X, ChevronLeft, ChevronRight, Play, Maximize2 } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { mediaService } from "@/components/media/services";
import type { Blog } from "@/types/blog/blog";
import { cn } from "@/core/utils/cn";
import { Card, CardContent } from "@/components/elements/Card";

interface BlogImageGalleryProps {
  blog: Blog;
  className?: string;
}

export function BlogImageGallery({ blog, className }: BlogImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Main carousel با RTL direction
  const [mainRef, mainApi] = useEmblaCarousel({
    loop: true,
    direction: 'rtl', // برای RTL
    align: 'center',
  });

  // Thumbnail carousel با RTL direction
  const [thumbRef, thumbApi] = useEmblaCarousel({
    containScroll: 'keepSnaps',
    dragFree: true,
    direction: 'rtl', // برای RTL
  });

  // Lightbox carousel با RTL direction
  const [lightboxRef, lightboxApi] = useEmblaCarousel({
    loop: true,
    direction: 'rtl', // برای RTL
  });

  // استخراج عکس شاخص و گالری
  const allMedia = blog.blog_media || [];

  // فیلتر فقط عکس شاخص و گالری (تصاویر و ویدئوها)
  const galleryItems = allMedia
    .filter((item: any) => {
      const media = item.media_detail || item.media || item;
      // فقط image و video برای گالری
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
        alt: media?.title || blog.title || 'رسانه وبلاگ',
        isMainImage: item.is_main || item.is_main_image || false,
      };
    })
    .filter((item: any) => item.url !== '');

  // اضافه کردن عکس شاخص به ابتدای گالری اگر وجود دارد
  const mediaItems: any[] = [];

  // عکس شاخص (main_image)
  if (blog.main_image?.file_url) {
    const mainImageUrl = mediaService.getMediaUrlFromObject(blog.main_image as any);
    if (mainImageUrl) {
      mediaItems.push({
        id: `main-${blog.main_image.id || 0}`,
        type: 'image',
        url: mainImageUrl,
        coverUrl: mainImageUrl,
        title: blog.main_image.title || 'عکس شاخص',
        alt: blog.main_image.alt_text || blog.title || 'عکس شاخص وبلاگ',
        isMainImage: true,
      });
    }
  }

  // گالری (بقیه عکس‌ها و ویدئوها)
  galleryItems.forEach(item => {
    // اگر این آیتم همان عکس شاخص نیست، اضافه کن
    if (!item.isMainImage) {
      mediaItems.push(item);
    }
  });

  // Sync selected index
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

  // Sync thumbnails with main carousel
  useEffect(() => {
    if (!thumbApi) return;
    thumbApi.scrollTo(selectedIndex);
  }, [selectedIndex, thumbApi]);

  // Sync lightbox with main carousel
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

  // اگر رسانه‌ای وجود نداشت
  if (mediaItems.length === 0) {
    return (
      <div className={cn("relative w-full h-[500px] rounded-xl border border-br bg-bg flex items-center justify-center", className)}>
        <div className="text-center space-y-4">
          <ImageIcon className="w-16 h-16 mx-auto text-font-s" />
          <p className="text-font-s">تصویر یا ویدئویی برای این وبلاگ آپلود نشده است</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Main Gallery */}
      <Card className={className}>
        <CardContent className="space-y-4">
          {/* Main Carousel */}
          <div className="relative w-full h-[500px] overflow-hidden bg-bg group">
            <div ref={mainRef} className="overflow-hidden h-full">
              <div className="flex h-full" dir="rtl">
                {mediaItems.map((item, index) => (
                  <div key={item.id} className="flex-[0_0_100%] min-w-0 h-full">
                    <div
                      className="relative w-full h-full bg-bg cursor-pointer"
                      onClick={() => {
                        if (mainApi?.clickAllowed()) {
                          setIsLightboxOpen(true);
                        }
                      }}
                      title="کلیک برای نمایش تمام صفحه"
                    >
                      {item.type === 'video' ? (
                        <>
                          <video
                            src={item.url}
                            className="w-full h-full object-cover"
                            controls
                            poster={item.coverUrl}
                            preload="metadata"
                          />
                          {/* آیکون Play برای ویدئو */}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="size-16 rounded-full bg-static-b/60 backdrop-blur-sm flex items-center justify-center">
                              <Play className="w-8 h-8 text-static-w fill-static-w" />
                            </div>
                          </div>
                        </>
                      ) : (
                        <img
                          src={item.url}
                          alt={item.alt}
                          className="w-full h-full object-cover"
                          loading={index === 0 ? "eager" : "lazy"}
                        />
                      )}
                      {/* Badge برای عکس شاخص */}
                      {item.isMainImage && (
                        <div className="absolute top-3 left-3 px-3 py-1.5 rounded-md bg-primary text-static-w text-xs font-bold shadow-lg z-10">
                          عکس شاخص
                        </div>
                      )}

                      {/* Expand Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsLightboxOpen(true);
                        }}
                        className="absolute top-3 right-3 size-10 rounded-lg bg-static-b/60 backdrop-blur-sm text-static-w flex items-center justify-center hover:bg-static-b/80 transition-all z-20 cursor-pointer border-none"
                        title="نمایش تمام صفحه"
                      >
                        <Maximize2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Counter */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-static-b/60 backdrop-blur-sm text-static-w text-sm font-medium z-10">
              {selectedIndex + 1} / {mediaItems.length}
            </div>

            {/* Navigation Buttons */}
            {mediaItems.length > 1 && (
              <>
                <button
                  onClick={scrollNext}
                  className="absolute left-4 top-1/2 -translate-y-1/2 size-10 rounded-full bg-static-b/80 backdrop-blur-sm text-static-w hover:bg-static-b border-none shadow-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 cursor-pointer z-20"
                  aria-label="تصویر بعدی"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={scrollPrev}
                  className="absolute right-4 top-1/2 -translate-y-1/2 size-10 rounded-full bg-static-b/80 backdrop-blur-sm text-static-w hover:bg-static-b border-none shadow-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 cursor-pointer z-20"
                  aria-label="تصویر قبلی"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnail Gallery */}
          {mediaItems.length > 1 && (
            <div className="relative pt-2">
              <div ref={thumbRef} className="overflow-hidden">
                <div className="flex gap-3" dir="rtl">
                  {mediaItems.map((item, index) => (
                    <button
                      key={item.id}
                      onClick={() => onThumbClick(index)}
                      className={cn(
                        "relative flex-[0_0_auto] w-28 h-20 md:w-36 md:h-24 rounded-lg overflow-hidden border-2 transition-all cursor-pointer",
                        selectedIndex === index
                          ? "border-primary shadow-lg scale-105 ring-2 ring-primary/30"
                          : "border-br hover:border-primary/50 hover:shadow-md"
                      )}
                    >
                      <img
                        src={item.type === 'video' ? item.coverUrl : item.url}
                        alt={item.alt}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {/* Badge عکس شاخص */}
                      {item.isMainImage && (
                        <div className="absolute top-1 right-1 px-2 py-1 rounded bg-primary text-static-w text-[11px] font-bold shadow-md z-10">
                          شاخص
                        </div>
                      )}
                      {/* آیکون Play برای thumbnail ویدئو */}
                      {item.type === 'video' && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="size-6 rounded-full bg-static-b/80 flex items-center justify-center">
                            <Play className="w-3 h-3 text-static-w fill-static-w" />
                          </div>
                        </div>
                      )}
                      {selectedIndex === index && (
                        <div className="absolute inset-0 bg-primary/20" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-static-b/95 backdrop-blur-md flex items-center justify-center">
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 left-4 z-50 p-2 rounded-lg bg-static-w/20 hover:bg-static-w/30 text-static-w transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-static-w/20 backdrop-blur-sm text-static-w font-medium z-50">
            {selectedIndex + 1} / {mediaItems.length}
          </div>

          <div ref={lightboxRef} className="overflow-hidden w-full h-full">
            <div className="flex h-full" dir="rtl">
              {mediaItems.map((item, index) => (
                <div key={item.id} className="flex-[0_0_100%] min-w-0 h-full flex items-center justify-center p-8">
                  {item.type === 'video' ? (
                    <video
                      src={item.url}
                      className="max-w-full max-h-full"
                      controls
                      poster={item.coverUrl}
                      preload="metadata"
                      autoPlay={index === selectedIndex}
                    />
                  ) : (
                    <img
                      src={item.url}
                      alt={item.alt}
                      className="max-w-full max-h-full object-contain"
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
                className="absolute right-4 top-1/2 -translate-y-1/2 size-12 rounded-full bg-static-w/20 hover:bg-static-w/30 text-static-w flex items-center justify-center transition-colors cursor-pointer"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
              <button
                onClick={() => lightboxApi?.scrollNext()}
                className="absolute left-4 top-1/2 -translate-y-1/2 size-12 rounded-full bg-static-w/20 hover:bg-static-w/30 text-static-w flex items-center justify-center transition-colors cursor-pointer"
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

