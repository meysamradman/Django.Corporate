
import { useState } from "react";
import { Play, Video as VideoIcon, Download } from "lucide-react";
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

            {/* Modal Player */}
            {isPlaying && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-static-b/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsPlaying(false)}>
                    <div className="w-full max-w-5xl px-4 animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
                        <div className="relative aspect-video bg-static-b rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                            {/* We use the base MediaPlayer here for the actual player inside the modal */}
                            <MediaPlayer
                                media={{
                                    file_url: src,
                                    media_type: 'video',
                                    title: title,
                                    cover_image: poster
                                } as any}
                                className="w-full h-full"
                                autoPlay={true}
                                controls={true}
                            />
                        </div>
                        <div className="mt-4 flex justify-center">
                            <button className="text-white/70 hover:text-white text-sm" onClick={() => setIsPlaying(false)}>بستن</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
