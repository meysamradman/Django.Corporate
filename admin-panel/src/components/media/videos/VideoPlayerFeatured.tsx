
import { useState } from "react";
import { Play, Video as VideoIcon, Download, X } from "lucide-react";
import { Button } from "@/components/elements/Button";
import { Badge } from "@/components/elements/Badge";
import { MediaPlayer } from "./MediaPlayer";
import { cn } from "@/core/utils/cn";

interface VideoPlayerFeaturedProps {
    src: string;
    poster?: string;
    title?: string;
    size?: string;
    className?: string;
}

export function VideoPlayerFeatured({
    src,
    poster,
    title = "ویدئو",
    size,
    className,
}: VideoPlayerFeaturedProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const extension = src.split('.').pop()?.toUpperCase() || 'VIDEO';

    function renderModal() {
        return (
            <div
                className="fixed inset-0 z-100 flex items-center justify-center bg-black/95 backdrop-blur-sm animate-in fade-in duration-700"
                onClick={() => setIsPlaying(false)}
            >
                <div
                    className="w-full h-full flex flex-col items-center justify-center relative animate-in zoom-in-95 duration-700 p-4 md:p-8"
                    onClick={(e) => e.stopPropagation()}
                >
                    <MediaPlayer
                        media={{
                            file_url: src,
                            media_type: 'video',
                            title: title,
                            cover_image: poster
                        } as any}
                        className="w-full h-full"
                        autoPlay={true}
                        showControls={true}
                        renderHeader={(isVisible) => (
                            <div className={cn(
                                "absolute top-0 left-0 right-0 p-8 md:p-12 flex items-start justify-between z-50 transition-all duration-700 transform",
                                isVisible ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0 pointer-events-none"
                            )}>
                                <div className="space-y-1.5 max-w-[60%]">
                                    <h2 className="text-wt text-2xl md:text-3xl font-black tracking-tight drop-shadow-[0_2px_15px_rgba(0,0,0,1)]">{title}</h2>
                                    <div className="flex items-center gap-3 opacity-40 font-mono text-[10px] tracking-[0.2em] text-wt uppercase text-right" dir="rtl">
                                        <span>{extension}</span>
                                        <span className="size-1 rounded-full bg-wt" />
                                        <span>{size || 'HIGH DEFINITION'}</span>
                                    </div>
                                </div>

                                <button
                                    className="size-12 md:size-14 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 text-white flex items-center justify-center hover:bg-white hover:text-black transition-all duration-500 cursor-pointer shadow-2xl active:scale-90 group"
                                    onClick={() => setIsPlaying(false)}
                                >
                                    <X className="size-6 md:size-7 group-hover:rotate-90 transition-transform duration-500" />
                                </button>
                            </div>
                        )}
                    />
                </div>
            </div>
        );
    }

    return (
        <>
            <div className={cn("flex flex-col sm:flex-row h-full bg-wt/50 hover:bg-wt transition-smooth group/v-item w-full", className)}>
                {/* Featured Thumbnail - Full Height Landscape Side */}
                <div className="relative w-full sm:w-1/2 h-full min-h-[200px] bg-bg overflow-hidden grayscale-[0.2] hover:grayscale-0 transition-all duration-700 order-2 sm:order-1 rounded-b-2xl sm:rounded-b-none sm:rounded-r-2xl sm:rounded-l-none">
                    {poster ? (
                        <img src={poster} alt={title} className="w-full h-full object-cover opacity-90 group-hover/v-item:opacity-100 transition-all duration-700 group-hover/v-item:scale-105" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center opacity-20">
                            <VideoIcon className="size-12" />
                        </div>
                    )}

                    <div className="absolute inset-0 bg-static-b/20 group-hover/v-item:bg-static-b/5 transition-colors" />

                    <button
                        onClick={() => setIsPlaying(true)}
                        className="absolute inset-0 flex items-center justify-center cursor-pointer group/play"
                    >
                        <div className="size-16 rounded-full bg-wt/20 backdrop-blur-md flex items-center justify-center text-wt border border-wt/30 scale-90 group-hover/play:scale-110 transition-all duration-500 shadow-2xl">
                            <Play className="size-7 fill-current ml-1" />
                        </div>
                    </button>
                </div>

                {/* Featured Content Area - Full Height */}
                <div className="w-full sm:w-1/2 flex flex-col justify-between p-6 sm:p-8 order-1 sm:order-2 h-full">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Badge variant="blue" className="bg-blue-1 text-wt border-none h-7 px-3 text-[11px] font-black uppercase tracking-wider rounded-lg shadow-sm">
                                {extension}
                            </Badge>
                            {size && <span className="text-xs font-bold text-font-s opacity-60">{size}</span>}
                        </div>
                        <h3 className="text-2xl font-black text-font-p leading-tight">{title}</h3>
                    </div>

                    <div className="flex items-center gap-3 mt-auto pt-6">
                        <Button
                            variant="default"
                            size="lg"
                            className="h-12 flex-1 px-6 gap-2 rounded-xl text-sm font-black shadow-blue-1/10 shadow-lg hover:shadow-blue-1/20 transition-all active:scale-95"
                            onClick={() => setIsPlaying(true)}
                        >
                            <Play className="size-4 fill-current" />
                            پخش آنلاین
                        </Button>

                        <Button variant="outline" size="icon" className="size-12 text-font-s hover:bg-bg rounded-xl border-br/60 shadow-xs" asChild title="دانلود فایل">
                            <a href={src} target="_blank" rel="noreferrer">
                                <Download className="size-5" />
                            </a>
                        </Button>
                    </div>
                </div>
            </div>
            {isPlaying && renderModal()}
        </>
    );
}
