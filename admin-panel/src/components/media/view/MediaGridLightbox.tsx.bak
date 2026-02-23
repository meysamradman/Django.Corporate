import { ChevronLeft, ChevronRight, Play, X } from 'lucide-react';
import { cn } from '@/core/utils/cn';
import type { MediaItem } from './MediaGridGallery';

interface LightboxApiLike {
    scrollPrev?: () => void;
    scrollNext?: () => void;
    scrollTo?: (index: number) => void;
}

interface MediaGridLightboxProps {
    isOpen: boolean;
    items: MediaItem[];
    title?: string;
    selectedIndex: number;
    lightboxRef: (node: HTMLDivElement | null) => void;
    lightboxApi: LightboxApiLike | undefined;
    onClose: () => void;
}

export function MediaGridLightbox({
    isOpen,
    items,
    title,
    selectedIndex,
    lightboxRef,
    lightboxApi,
    onClose,
}: MediaGridLightboxProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-100 bg-static-b flex flex-col animate-in fade-in duration-300" dir="rtl">
            <div className="flex items-center justify-between p-6 bg-linear-to-b from-static-b/80 to-transparent z-10">
                <div className="flex items-center gap-4 text-wt">
                    <div className="px-3 py-1 rounded-full bg-wt/10 backdrop-blur-md border border-wt/10 text-xs font-black">
                        {selectedIndex + 1} / {items.length}
                    </div>
                    {title && <h3 className="text-sm font-bold opacity-80 hidden md:block text-wt">{title}</h3>}
                </div>

                <button
                    onClick={onClose}
                    className="p-3 rounded-full bg-wt/10 hover:bg-wt/20 text-wt transition-all cursor-pointer border border-wt/10 hover:rotate-90 duration-300"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

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
                                            loading={index === selectedIndex ? 'eager' : 'lazy'}
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

                {items.length > 1 && (
                    <>
                        <button
                            onClick={() => lightboxApi?.scrollPrev?.()}
                            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 p-4 rounded-2xl bg-wt/5 hover:bg-wt/15 text-wt transition-all cursor-pointer backdrop-blur-md border border-wt/10 group/nav"
                        >
                            <ChevronRight className="w-8 h-8 group-hover/nav:scale-110 duration-300" />
                        </button>
                        <button
                            onClick={() => lightboxApi?.scrollNext?.()}
                            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 p-4 rounded-2xl bg-wt/5 hover:bg-wt/15 text-wt transition-all cursor-pointer backdrop-blur-md border border-wt/10 group/nav"
                        >
                            <ChevronLeft className="w-8 h-8 group-hover/nav:scale-110 duration-300" />
                        </button>
                    </>
                )}
            </div>

            {items.length > 1 && (
                <div className="py-2 px-6 bg-static-b border-t border-wt/5">
                    <div className="max-w-4xl mx-auto flex gap-4 overflow-x-auto py-5 custom-scrollbar snap-x justify-center">
                        {items.map((item, index) => (
                            <button
                                key={item.id}
                                onClick={() => lightboxApi?.scrollTo?.(index)}
                                className={cn(
                                    'relative shrink-0 w-20 h-14 md:w-24 md:h-16 rounded-xl overflow-hidden transition-all duration-300 border-2 snap-center cursor-pointer',
                                    selectedIndex === index
                                        ? 'border-blue-1 scale-110 shadow-lg shadow-blue-1/20'
                                        : 'border-transparent opacity-40 hover:opacity-100'
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
    );
}