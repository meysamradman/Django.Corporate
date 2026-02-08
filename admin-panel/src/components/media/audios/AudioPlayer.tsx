
import { useState, useRef } from "react";
import { Play, Pause, Download, Music } from "lucide-react";
import { Button } from "@/components/elements/Button";
import { Item, ItemContent, ItemTitle } from "@/components/elements/Item";
import { cn } from "@/core/utils/cn";

interface AudioPlayerProps {
    src: string;
    title?: string;
    className?: string;
}

export function AudioPlayer({
    src,
    title = "پادکست",
    className,
}: AudioPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            const current = audioRef.current.currentTime;
            const total = audioRef.current.duration;
            setCurrentTime(current);
            setProgress((current / total) * 100);
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    };

    const handleEnded = () => {
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime(0);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (audioRef.current) {
            const seekTime = (Number(e.target.value) / 100) * duration;
            audioRef.current.currentTime = seekTime;
            setProgress(Number(e.target.value));
        }
    };

    const formatTime = (time: number) => {
        if (isNaN(time)) return "00:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <Item className={cn(
            "p-0 border-br/40 transition-all duration-300 group/a-item overflow-hidden",
            isPlaying ? 'bg-gradient-to-l from-pink-0/20 to-wt border-pink-1/30 shadow-md shadow-pink-1/5' : 'bg-wt hover:border-pink-1/30',
            className
        )}>
            <audio
                ref={audioRef}
                src={src}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleEnded}
                className="hidden"
            />

            <div className="flex flex-col w-full">
                <div className="flex items-center gap-4 p-3">
                    <div className={cn(
                        "relative size-12 rounded-2xl flex items-center justify-center transition-all duration-500 shrink-0",
                        isPlaying
                            ? 'bg-gradient-to-tr from-pink-1 to-rose-400 text-wt shadow-lg shadow-pink-1/30 rotate-3 scale-105'
                            : 'bg-pink-0/40 text-pink-1 group-hover/a-item:bg-pink-0/80 group-hover/a-item:scale-105'
                    )}>
                        {isPlaying ? (
                            <div className="flex gap-[3px] items-end h-5 pb-1.5 justify-center">
                                <span className="w-1 bg-current rounded-full animate-[music-bar_0.6s_ease-in-out_infinite]" />
                                <span className="w-1 bg-current rounded-full animate-[music-bar_0.8s_ease-in-out_infinite_0.1s] h-4" />
                                <span className="w-1 bg-current rounded-full animate-[music-bar_1s_ease-in-out_infinite_0.2s] h-3" />
                                <span className="w-1 bg-current rounded-full animate-[music-bar_0.5s_ease-in-out_infinite_0.3s]" />
                            </div>
                        ) : (
                            <Music className="size-6 transition-transform duration-300 group-hover/a-item:rotate-12" />
                        )}

                        <div className={cn(
                            "absolute -top-0.5 -right-0.5 size-2.5 rounded-full border-2 border-wt transition-colors",
                            isPlaying ? "bg-emerald-500 animate-pulse" : "bg-gray-300"
                        )} />
                    </div>

                    <ItemContent className="p-0 flex-1 min-w-0 flex flex-col justify-center gap-1.5">
                        <div className="flex items-center justify-between gap-2">
                            <ItemTitle className={cn(
                                "text-[13px] font-bold truncate transition-colors",
                                isPlaying ? "text-pink-1" : "text-font-p"
                            )}>
                                {title}
                            </ItemTitle>
                            <span className="text-[10px] font-mono font-medium text-font-s/70 shrink-0 tabular-nums tracking-wide">
                                {formatTime(currentTime)} / {formatTime(duration)}
                            </span>
                        </div>

                        <div className="relative w-full h-1.5 bg-gray-100 rounded-full cursor-pointer group/progress overflow-hidden">
                            <div className="absolute inset-0 bg-gray-100 rounded-full" />

                            <div
                                className="absolute left-0 top-0 h-full bg-gradient-to-r from-pink-1 to-rose-400 rounded-full transition-all duration-100 ease-linear"
                                style={{ width: `${progress}%` }}
                            />

                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={progress || 0}
                                onChange={handleSeek}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                        </div>
                    </ItemContent>

                    <div className="flex items-center gap-1.5 shrink-0 pl-1">
                        <Button
                            variant="outline"
                            size="icon"
                            className={cn(
                                "size-10 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 border-none shadow-none",
                                isPlaying
                                    ? "bg-pink-0 text-pink-1 hover:bg-pink-1 hover:text-wt hover:shadow-md hover:shadow-pink-1/25"
                                    : "bg-gray-50 text-font-s hover:bg-pink-0/50 hover:text-pink-1"
                            )}
                            onClick={togglePlay}
                        >
                            {isPlaying ? (
                                <Pause className="size-5 fill-current" />
                            ) : (
                                <Play className="size-5 fill-current ml-0.5" />
                            )}
                        </Button>
                        -
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-8 rounded-lg text-font-s/60 hover:text-font-p hover:bg-gray-100 transition-colors border-none shadow-none"
                            asChild
                        >
                            <a href={src} target="_blank" rel="noreferrer">
                                <Download className="size-4" />
                            </a>
                        </Button>
                    </div>
                </div>
            </div>
        </Item>
    );
}
