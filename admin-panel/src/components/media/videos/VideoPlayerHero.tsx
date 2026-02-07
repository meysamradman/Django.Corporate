
import { useState } from "react";
import { Play, Video as VideoIcon, Download, X } from "lucide-react";
import { Button } from "@/components/elements/Button";
import { Badge } from "@/components/elements/Badge";
import { MediaPlayer } from "./MediaPlayer";
import { cn } from "@/core/utils/cn";

interface VideoPlayerHeroProps {
    src: string;
    poster?: string;
    title?: string;
    size?: string;
    className?: string;
    heroAspectRatio?: string;
}

export function VideoPlayerHero({
    src,
    poster,
    title = "ویدئو",
    size,
    className,
    heroAspectRatio = "aspect-video",
}: VideoPlayerHeroProps) {
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
            <div className={cn("flex flex-col h-full bg-wt/50 hover:bg-wt border border-br/40 hover:border-blue-1/30 rounded-2xl overflow-hidden transition-smooth group/v-item w-full", className)}>
                {/* Hero Thumbnail - Flexible Height */}
                <div className={cn("relative flex-1 bg-bg overflow-hidden grayscale-[0.2] hover:grayscale-0 transition-all duration-700 min-h-[160px]", heroAspectRatio)}>
                    {poster ? (
                        <img src={poster} alt={title} className="w-full h-full object-cover opacity-90 group-hover/v-item:opacity-100 transition-all duration-700 group-hover/v-item:scale-105" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center opacity-20">
                            <VideoIcon className="size-12" />
                        </div>
                    )}

                    <div className="absolute inset-0 bg-linear-to-t from-static-b/70 via-transparent to-transparent opacity-60 group-hover/v-item:opacity-40 transition-opacity" />

                    <button
                        onClick={() => setIsPlaying(true)}
                        className="absolute inset-0 flex items-center justify-center cursor-pointer group/play"
                    >
                        <div className="size-14 rounded-full bg-wt/20 backdrop-blur-md flex items-center justify-center text-wt border border-wt/30 scale-90 group-hover/play:scale-110 transition-all duration-500 shadow-2xl">
                            <Play className="size-6 fill-current ml-1" />
                        </div>
                    </button>

                    <div className="absolute top-3 right-3">
                        <Badge variant="blue" className="bg-blue-1 text-wt border-none h-6 px-3 text-[10px] font-black shadow-lg uppercase tracking-wider rounded-lg">
                            {extension}
                        </Badge>
                    </div>
                </div>

                {/* Compact Hero Footer */}
                <div className="p-4 flex items-center justify-between gap-4 bg-linear-to-b from-transparent to-bg/30">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-black text-font-p truncate mb-0.5">{title}</h3>
                        {size && <span className="text-[10px] font-bold text-font-s opacity-60">{size}</span>}
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="default"
                            size="sm"
                            className="h-9 px-4 gap-2 rounded-lg text-[11px] font-black shadow-blue-1/20 shadow-lg"
                            onClick={() => setIsPlaying(true)}
                        >
                            <Play className="size-3 fill-current" />
                            پخش آنلاین
                        </Button>

                        <Button variant="outline" size="icon" className="size-9 text-font-s hover:bg-bg rounded-lg border-br/60" asChild>
                            <a href={src} target="_blank" rel="noreferrer">
                                <Download className="size-4" />
                            </a>
                        </Button>
                    </div>
                </div>
            </div>
            {isPlaying && renderModal()}
        </>
    );
}
