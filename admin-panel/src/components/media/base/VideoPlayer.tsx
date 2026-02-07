
import { useState } from "react";
import { Play, Video as VideoIcon, Download, X } from "lucide-react";
import { Button } from "@/components/elements/Button";
import { Item, ItemContent, ItemTitle } from "@/components/elements/Item";
import { Badge } from "@/components/elements/Badge";
import { MediaPlayer } from "@/components/media/base/MediaPlayer";
import { cn } from "@/core/utils/cn";

interface VideoPlayerProps {
    src: string;
    poster?: string;
    title?: string;
    size?: string; // display string for file size
    className?: string;
}

export function VideoPlayer({
    src,
    poster,
    title = "ویدئو",
    size,
    className,
}: VideoPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const extension = src.split('.').pop()?.toUpperCase() || 'VIDEO';

    return (
        <>
            <Item className={cn("p-0 border-br/40 overflow-hidden bg-wt/50 hover:bg-wt hover:border-blue-1/30 transition-smooth group/v-item", className)}>
                <div className="flex w-full items-stretch min-h-[100px]">
                    {/* Thumbnail / Sidebar */}
                    <div className="relative w-28 border-l border-br/30 bg-bg shrink-0">
                        {poster ? (
                            <img src={poster} alt={title} className="w-full h-full object-cover opacity-90 group-hover/v-item:opacity-100 transition-opacity" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center opacity-20">
                                <VideoIcon className="size-6" />
                            </div>
                        )}

                        <button
                            onClick={() => setIsPlaying(true)}
                            className="absolute inset-0 flex items-center justify-center bg-static-b/20 group-hover/v-item:bg-static-b/10 transition-colors cursor-pointer"
                        >
                            <div className="size-9 rounded-full bg-wt/20 backdrop-blur-md flex items-center justify-center text-wt border border-wt/30 scale-90 group-hover/v-item:scale-100 transition-all">
                                <Play className="size-3.5 fill-current ml-0.5" />
                            </div>
                        </button>
                    </div>

                    {/* Content */}
                    <ItemContent className="p-4 justify-between">
                        <div className="space-y-0.5">
                            <ItemTitle className="text-sm font-black truncate text-font-p">
                                {title}
                            </ItemTitle>
                            <div className="flex items-center gap-1.5 opacity-60">
                                <Badge variant="outline" className="h-4 text-[9px] font-black border-blue-1/20 text-blue-1 px-1.5">{extension}</Badge>
                                {size && <span className="text-[10px] font-bold text-font-s">{size}</span>}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-3 text-blue-1 bg-blue-1/5 border-blue-1/10 hover:bg-blue-1/10 rounded-lg text-[10px] font-black"
                                onClick={() => setIsPlaying(true)}
                            >
                                <Play className="size-3 ml-1.5 fill-current" />
                                پخش آنلاین
                            </Button>

                            <Button variant="outline" size="icon" className="size-7 text-font-s hover:bg-bg rounded-lg" asChild>
                                <a href={src} target="_blank" rel="noreferrer">
                                    <Download className="size-3.5" />
                                </a>
                            </Button>
                        </div>
                    </ItemContent>
                </div>
            </Item>

            {/* Modal Player - Professional Cinema Experience */}
            {isPlaying && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black animate-in fade-in duration-700"
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
                                    {/* Name Section - Pushed to the Left */}
                                    <div className="space-y-1.5 max-w-[60%]">
                                        <h2 className="text-wt text-2xl md:text-3xl font-black tracking-tight drop-shadow-[0_2px_15px_rgba(0,0,0,1)]">{title}</h2>
                                        <div className="flex items-center gap-3 opacity-40 font-mono text-[10px] tracking-[0.2em] text-wt uppercase">
                                            <span>{extension}</span>
                                            <span className="size-1 rounded-full bg-wt" />
                                            <span>{size || 'HIGH DEFINITION'}</span>
                                        </div>
                                    </div>

                                    {/* Close Section - Pushed to the Right */}
                                    <button
                                        className="size-12 md:size-14 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 text-white flex items-center justify-center hover:bg-white hover:text-black transition-all duration-500 cursor-pointer shadow-2xl active:scale-90 group"
                                        onClick={() => setIsPlaying(false)}
                                        title="Close Player"
                                    >
                                        <X className="size-6 md:size-7 group-hover:rotate-90 transition-transform duration-500" />
                                    </button>
                                </div>
                            )}
                        />
                    </div>
                </div>
            )}
        </>
    );
}
