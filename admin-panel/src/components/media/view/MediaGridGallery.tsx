import { useState, useEffect, useCallback } from "react";
import {
    ImageIcon,
    X,
    ChevronLeft,
    ChevronRight,
    Maximize2,
    LayoutGrid,
    Play
} from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { cn } from "@/core/utils/cn";

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
            <div className={cn("relative w-full h-[500px] rounded-2xl border border-br bg-bg flex items-center justify-center", className)}>
                <div className="text-center space-y-4">
                    <ImageIcon className="w-16 h-16 mx-auto text-font-s opacity-20" />
                    <p className="text-font-s font-bold opacity-60">رسانه‌ای یافت نشد</p>
                </div>
            </div>
        );
    }

    // Define grid items (up to 5)
    const gridItems = items.slice(0, 5);
    const itemCount = gridItems.length;
    const remainingCount = items.length - 5;

    // Adaptive Grid Class Logic
    const mainItemClass = itemCount === 1 ? "col-span-4" : "col-span-4 lg:col-span-2";

    let rightSideClass = "hidden lg:grid col-span-2 gap-3 h-full";
    if (itemCount === 2) rightSideClass += " grid-cols-1 grid-rows-1";
    else if (itemCount === 3) rightSideClass += " grid-cols-1 grid-rows-2";
    else rightSideClass += " grid-cols-2 grid-rows-2";

    return (
        <>
            <div className={cn("relative w-full h-[400px] md:h-[500px] lg:h-[600px] grid grid-cols-4 gap-3 overflow-hidden rounded-2xl group/gallery", className)}>

                {/* Main large item (left side) */}
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

                {/* Right side grid (visible only on lg and up) */}
                {itemCount > 1 && (
                    <div className={rightSideClass}>
                        {gridItems.slice(1, 5).map((item, index) => {
                            const actualIndex = index + 1;
                            const isLastVisible = actualIndex === 4 && remainingCount > 0;

                            // For 4 total items (3 on side), make first one (top-left) span 2 cols to fill top row
                            // Wait, if grid-cols-2, and 3 items:
                            // We want Item 1 to span 2 cols? Or Item 3 to span 2 cols?
                            // Standard: Top Left, Top Right, Bottom Left, Bottom Right.
                            // 3 items: Item 1, Item 2, Item 3.
                            // If Item 1 spans 2: Top row full. Item 2, 3 on bottom row.
                            // This works well.
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

                {/* Show All Photos button */}
                <button
                    onClick={() => openLightbox(0)}
                    className="absolute bottom-6 left-6 hidden lg:flex items-center gap-2.5 px-5 py-2.5 bg-wt/95 backdrop-blur-md text-font-p border border-br/60 rounded-xl shadow-xl hover:bg-wt hover:scale-105 transition-all duration-300 z-10 font-bold text-sm cursor-pointer active:scale-95"
                >
                    <LayoutGrid className="w-4 h-4 text-blue-1" />
                    مشاهده تمام {items.length} رسانه
                </button>

                {/* Action icons */}
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

            {/* Lightbox */}
            {isLightboxOpen && (
                <div className="fixed inset-0 z-100 bg-static-b flex flex-col animate-in fade-in duration-300" dir="rtl">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 bg-linear-to-b from-static-b/80 to-transparent z-10">
                        <div className="flex items-center gap-4 text-wt">
                            <div className="px-3 py-1 rounded-full bg-wt/10 backdrop-blur-md border border-wt/10 text-xs font-black">
                                {selectedIndex + 1} / {items.length}
                            </div>
                            {title && <h3 className="text-sm font-bold opacity-80 hidden md:block text-wt">{title}</h3>}
                        </div>

                        <button
                            onClick={() => setIsLightboxOpen(false)}
                            className="p-3 rounded-full bg-wt/10 hover:bg-wt/20 text-wt transition-all cursor-pointer border border-wt/10 hover:rotate-90 duration-300"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                        <div ref={lightboxRef} className="w-full h-full overflow-hidden">
                            <div className="flex h-full" dir="rtl">
                                {items.map((item, index) => (
                                    <div key={item.id} className="flex-[0_0_100%] min-w-0 h-full flex flex-col items-center justify-center p-4 md:p-12">
                                        <div className="relative max-w-full max-h-full group/image flex items-center justify-center">
                                            {item.type === 'video' ? (
                                                <video
                                                    src={item.url}
                                                    className="max-w-full max-h-[80vh] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)]"
                                                    controls
                                                    poster={item.coverUrl}
                                                    preload="metadata"
                                                    autoPlay={index === selectedIndex}
                                                />
                                            ) : (
                                                <img
                                                    src={item.url}
                                                    alt={item.alt}
                                                    className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] transition-transform duration-500"
                                                    loading={index === selectedIndex ? "eager" : "lazy"}
                                                />
                                            )}
                                            {item.isMainMedia && (
                                                <div className="absolute top-4 right-4 px-3 py-1.5 bg-blue-1 text-wt text-[10px] font-black rounded-lg shadow-lg">
                                                    {item.type === 'video' ? 'ویدیو شاخص' : 'عکس شاخص'}
                                                </div>
                                            )}
                                        </div>
                                        {item.title && (
                                            <p className="text-wt/60 text-xs font-medium mt-6 bg-wt/5 px-4 py-2 rounded-full border border-wt/5">
                                                {item.title}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Navigation Buttons */}
                        {items.length > 1 && (
                            <>
                                <button
                                    onClick={() => lightboxApi?.scrollPrev()}
                                    className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 p-4 rounded-2xl bg-wt/5 hover:bg-wt/15 text-wt transition-all cursor-pointer backdrop-blur-md border border-wt/10 group/nav"
                                >
                                    <ChevronRight className="w-8 h-8 group-hover/nav:scale-110 duration-300" />
                                </button>
                                <button
                                    onClick={() => lightboxApi?.scrollNext()}
                                    className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 p-4 rounded-2xl bg-wt/5 hover:bg-wt/15 text-wt transition-all cursor-pointer backdrop-blur-md border border-wt/10 group/nav"
                                >
                                    <ChevronLeft className="w-8 h-8 group-hover/nav:scale-110 duration-300" />
                                </button>
                            </>
                        )}
                    </div>

                    {/* Thumbnail Strip */}
                    {items.length > 1 && (
                        <div className="py-2 px-6 bg-static-b border-t border-wt/5">
                            <div className="max-w-4xl mx-auto flex gap-4 overflow-x-auto py-5 custom-scrollbar snap-x justify-center">
                                {items.map((item, index) => (
                                    <button
                                        key={item.id}
                                        onClick={() => lightboxApi?.scrollTo(index)}
                                        className={cn(
                                            "relative shrink-0 w-20 h-14 md:w-24 md:h-16 rounded-xl overflow-hidden transition-all duration-300 border-2 snap-center cursor-pointer",
                                            selectedIndex === index
                                                ? "border-blue-1 scale-110 shadow-lg shadow-blue-1/20"
                                                : "border-transparent opacity-40 hover:opacity-100"
                                        )}
                                    >
                                        <img
                                            src={item.type === 'video' ? (item.coverUrl || item.url) : item.url}
                                            className="w-full h-full object-cover"
                                            alt=""
                                        />
                                        {item.type === 'video' && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="size-6 rounded-full bg-static-b/60 backdrop-blur-sm flex items-center justify-center">
                                                    <Play className="w-3 h-3 text-wt fill-wt" />
                                                </div>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}

