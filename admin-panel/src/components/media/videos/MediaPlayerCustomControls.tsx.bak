import { Maximize, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/core/utils/cn';

interface MediaPlayerCustomControlsProps {
    visible: boolean;
    isPlaying: boolean;
    isMuted: boolean;
    currentTime: number;
    duration: number;
    onSeek: (time: number) => void;
    onTogglePlayPause: () => void;
    onToggleMute: () => void;
    onToggleFullscreen: () => void;
    formatTime: (time: number) => string;
}

export function MediaPlayerCustomControls({
    visible,
    isPlaying,
    isMuted,
    currentTime,
    duration,
    onSeek,
    onTogglePlayPause,
    onToggleMute,
    onToggleFullscreen,
    formatTime,
}: MediaPlayerCustomControlsProps) {
    return (
        <div className={cn(
            'absolute inset-0 z-30 transition-all duration-700 pointer-events-none',
            visible ? 'opacity-100' : 'opacity-0'
        )}>
            <div className="absolute top-0 left-0 right-0 h-40 bg-linear-to-b from-black/80 via-black/20 to-transparent pointer-events-none" />

            <div className="absolute bottom-0 left-0 right-0 h-48 bg-linear-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />

            {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="size-24 rounded-full bg-wt/10 backdrop-blur-xl border border-wt/10 flex items-center justify-center text-wt scale-110 animate-in zoom-in-50 duration-500 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                        <Play className="size-10 fill-current ml-2" />
                    </div>
                </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 p-8 pt-0 space-y-5 pointer-events-auto">
                <div className="group/progress relative h-1.5 w-full bg-wt/20 rounded-full cursor-pointer transition-all hover:h-2.5">
                    <div
                        className="absolute left-0 top-0 bottom-0 bg-wt transition-all duration-100 ease-out z-10"
                        style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                    />
                    <div
                        className="absolute top-1/2 -translate-y-1/2 size-4 bg-wt border-4 border-black/20 rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity z-20 shadow-xl"
                        style={{ left: `calc(${(currentTime / (duration || 1)) * 100}% - 8px)` }}
                    />
                    <input
                        type="range"
                        min="0"
                        max={duration || 0}
                        value={currentTime}
                        onChange={(e) => onSeek(parseFloat(e.target.value))}
                        className="absolute inset-0 w-full opacity-0 cursor-pointer z-30"
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <button
                            onClick={onTogglePlayPause}
                            className="text-wt hover:scale-125 transition-all active:scale-90 cursor-pointer"
                        >
                            {isPlaying ? <Pause className="size-8 fill-current" /> : <Play className="size-8 fill-current" />}
                        </button>

                        <div className="flex items-center gap-4">
                            <button
                                onClick={onToggleMute}
                                className="text-wt hover:scale-110 transition-transform cursor-pointer"
                            >
                                {isMuted ? <VolumeX className="size-6" /> : <Volume2 className="size-6" />}
                            </button>
                            <span className="text-wt text-[13px] font-mono tracking-widest tabular-nums opacity-90 drop-shadow-md">
                                {formatTime(currentTime)} <span className="opacity-40 font-thin mx-1">/</span> {formatTime(duration)}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-5">
                        <button
                            onClick={onToggleFullscreen}
                            className="text-wt hover:scale-110 transition-transform cursor-pointer"
                            title="Fullscreen"
                        >
                            <Maximize className="size-6" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}