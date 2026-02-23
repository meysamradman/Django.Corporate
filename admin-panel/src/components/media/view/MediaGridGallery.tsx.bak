import { useState, useEffect, useCallback } from "react";
import {
    Maximize2,
    LayoutGrid,
    Play
} from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { cn } from "@/core/utils/cn";
import { EmptyState } from "@/components/shared/EmptyState";
import { Images } from "lucide-react";
import { MediaGridLightbox } from "@/components/media/view/MediaGridLightbox";

export interface MediaItem {
    id: string | number;
    type: 'image' | 'video';
    url: string;
    coverUrl?: string; // For videos
    title?: string;
    alt?: string;
    isMainMedia?: boolean;
}

interface MediaGridGalleryProps {
    items: MediaItem[];
    title?: string;
    className?: string;
}
export function MediaGridGallery({ items, title, className }: MediaGridGalleryProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    const [lightboxRef, lightboxApi] = useEmblaCarousel({
        loop: true,
        direction: 'rtl',
    });

    const openLightbox = (index: number) => {
        setSelectedIndex(index);
        setIsLightboxOpen(true);
    };

    const onSelect = useCallback(() => {
        if (!lightboxApi) return;
        setSelectedIndex(lightboxApi.selectedScrollSnap());
    }, [lightboxApi]);

    useEffect(() => {
        if (!lightboxApi) return;
        onSelect();
        lightboxApi.on('select', onSelect);
        lightboxApi.on('reInit', onSelect);
        return () => {
            lightboxApi.off('select', onSelect);
        };
    }, [lightboxApi, onSelect]);

    useEffect(() => {
        if (!lightboxApi || !isLightboxOpen) return;
        lightboxApi.scrollTo(selectedIndex, true);
    }, [isLightboxOpen, lightboxApi]);

    if (!items || items.length === 0) {
        return (
            <div className={cn("relative w-full h-100 md:h-125 lg:h-150 rounded-2xl overflow-hidden border border-br/60 bg-linear-to-b from-bg/20 via-bg/40 to-bg/5 flex items-center justify-center", className)}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-1/5 blur-[100px] rounded-full pointer-events-none" />

                <EmptyState
                    title="تصاویر و رسانه‌ای یافت نشد"
                    description="هنوز هیچ رسانه‌ای برای این ملک ثبت نشده است"
                    icon={Images}
                    size="lg"
                    fullHeight={true}
                    className="bg-transparent border-none shadow-none"
                />
            </div>
        );
    }

    const gridItems = items.slice(0, 5);
    const itemCount = gridItems.length;
    const remainingCount = items.length - 5;

    const mainItemClass = itemCount === 1 ? "col-span-4" : "col-span-4 lg:col-span-2";

    let rightSideClass = "hidden lg:grid col-span-2 gap-3 h-full";
    if (itemCount === 2) rightSideClass += " grid-cols-1 grid-rows-1";
    else if (itemCount === 3) rightSideClass += " grid-cols-1 grid-rows-2";
    else rightSideClass += " grid-cols-2 grid-rows-2";

    return (
        <>
            <div className={cn("relative w-full h-100 md:h-125 lg:h-150 grid grid-cols-4 gap-3 overflow-hidden rounded-2xl group/gallery", className)}>

                <div className={cn("relative overflow-hidden bg-bg cursor-pointer h-full border border-br/50", mainItemClass)} onClick={() => openLightbox(0)}>
                    {gridItems[0].type === 'video' ? (
                        <div className="w-full h-full relative">
                            <img
                                src={gridItems[0].coverUrl || gridItems[0].url}
                                alt={gridItems[0].alt}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover/gallery:scale-105"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="size-16 rounded-full bg-static-b/60 backdrop-blur-sm flex items-center justify-center">
                                    <Play className="w-8 h-8 text-wt fill-wt" />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <img
                            src={gridItems[0].url}
                            alt={gridItems[0].alt}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover/gallery:scale-105"
                        />
                    )}
                    <div className="absolute inset-0 bg-static-b/0 group-hover/gallery:bg-static-b/10 transition-colors duration-300" />

                    {gridItems[0].isMainMedia && (
                        <div className="absolute top-4 right-4 z-10">
                            <div className="px-3 py-1.5 bg-blue-1 text-wt text-[10px] font-black rounded-lg shadow-lg backdrop-blur-sm border border-wt/10 ring-1 ring-static-b/10">
                                {gridItems[0].type === 'video' ? 'ویدیو شاخص' : 'عکس شاخص'}
                            </div>
                        </div>
                    )}

                    <button
                        className="absolute bottom-4 right-4 lg:hidden z-10 px-4 py-2 bg-wt/90 backdrop-blur-md rounded-xl border border-br/50 shadow-sm flex items-center gap-2 text-xs font-black text-font-p cursor-pointer"
                        onClick={(e) => {
                            e.stopPropagation();
                            openLightbox(0);
                        }}
                    >
                        <LayoutGrid className="w-4 h-4" />
                        مشاهده همه ({items.length})
                    </button>
                </div>

                {itemCount > 1 && (
                    <div className={rightSideClass}>
                        {gridItems.slice(1, 5).map((item, index) => {
                            const actualIndex = index + 1;
                            const isLastVisible = actualIndex === 4 && remainingCount > 0;

                            const isFour = itemCount === 4;
                            const spanClass = (isFour && index === 0) ? "col-span-2" : "";

                            return (
                                <div
                                    key={item.id}
                                    className={cn("relative overflow-hidden bg-bg cursor-pointer group/item h-full border border-br/50", spanClass)}
                                    onClick={() => openLightbox(actualIndex)}
                                >
                                    {item.type === 'video' ? (
                                        <div className="w-full h-full relative">
                                            <img
                                                src={item.coverUrl || item.url}
                                                alt={item.alt}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover/item:scale-110"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="size-10 rounded-full bg-static-b/60 backdrop-blur-sm flex items-center justify-center">
                                                    <Play className="w-5 h-5 text-wt fill-wt" />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <img
                                            src={item.url}
                                            alt={item.alt}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover/item:scale-110"
                                        />
                                    )}
                                    <div className="absolute inset-0 bg-static-b/5 group-hover/item:bg-static-b/20 transition-colors duration-300" />

                                    {isLastVisible && (
                                        <div className="absolute inset-0 bg-static-b/40 backdrop-blur-[2px] flex flex-col items-center justify-center text-wt">
                                            <p className="text-xl font-black">+{remainingCount}</p>
                                            <p className="text-[10px] font-bold uppercase tracking-widest mt-1">مشاهده همه</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                <button
                    onClick={() => openLightbox(0)}
                    className="absolute bottom-6 left-6 hidden lg:flex items-center gap-2.5 px-5 py-2.5 bg-wt/95 backdrop-blur-md text-font-p border border-br/60 rounded-xl shadow-xl hover:bg-wt hover:scale-105 transition-all duration-300 z-10 font-bold text-sm cursor-pointer active:scale-95"
                >
                    <LayoutGrid className="w-4 h-4 text-blue-1" />
                    مشاهده تمام {items.length} رسانه
                </button>

                <div className="absolute top-6 left-6 flex gap-3 z-10 opacity-0 group-hover/gallery:opacity-100 transition-opacity duration-300">
                    <button
                        onClick={() => openLightbox(0)}
                        className="p-3 rounded-xl bg-static-b/30 text-wt hover:bg-static-b/50 backdrop-blur-lg border border-wt/10 transition-all cursor-pointer shadow-lg"
                        title="نمایش تمام صفحه"
                    >
                        <Maximize2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <MediaGridLightbox
                isOpen={isLightboxOpen}
                items={items}
                title={title}
                selectedIndex={selectedIndex}
                lightboxRef={lightboxRef}
                lightboxApi={lightboxApi}
                onClose={() => setIsLightboxOpen(false)}
            />
        </>
    );
}

