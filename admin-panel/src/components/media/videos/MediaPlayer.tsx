import { useState, useRef, useEffect, type RefObject } from 'react';
import type { Media } from "@/types/shared/media";
import { mediaService } from "@/components/media/services";
import { cn } from '@/core/utils/cn';
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw } from 'lucide-react';
import { Button } from '@/components/elements/Button';
import { Spinner } from '@/components/elements/Spinner';

interface MediaPlayerProps {
  media: Media;
  className?: string;
  autoPlay?: boolean;
  controls?: boolean;
  showControls?: boolean;
  hideControlsOnIdle?: boolean;
  renderHeader?: (isVisible: boolean) => React.ReactNode;
}

export function MediaPlayer({
  media,
  className,
  autoPlay = false,
  showControls = true,
  hideControlsOnIdle = true,
  renderHeader,
}: MediaPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const hideTimeoutRef = useRef<any>(null);

  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const mediaUrl = mediaService.getMediaUrlFromObject(media);

  const togglePlayPause = () => {
    if (!mediaRef.current) return;
    if (isPlaying) {
      mediaRef.current.pause();
    } else {
      mediaRef.current.play();
    }
  };

  const toggleMute = () => {
    if (!mediaRef.current) return;
    if (isMuted) {
      mediaRef.current.volume = volume;
      setIsMuted(false);
    } else {
      mediaRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const handleSeek = (time: number) => {
    if (!mediaRef.current) return;
    mediaRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const mediaElement = mediaRef.current;
    if (!mediaElement) return;

    const handleLoadedMetadata = () => {
      setDuration(mediaElement.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(mediaElement.currentTime);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      setHasError(true);
      setIsLoading(false);
    };

    const handleLoadStart = () => {
      setIsLoading(true);
      setHasError(false);
    };

    mediaElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    mediaElement.addEventListener('timeupdate', handleTimeUpdate);
    mediaElement.addEventListener('play', handlePlay);
    mediaElement.addEventListener('pause', handlePause);
    mediaElement.addEventListener('ended', handleEnded);
    mediaElement.addEventListener('error', handleError);
    mediaElement.addEventListener('loadstart', handleLoadStart);

    return () => {
      mediaElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      mediaElement.removeEventListener('timeupdate', handleTimeUpdate);
      mediaElement.removeEventListener('play', handlePlay);
      mediaElement.removeEventListener('pause', handlePause);
      mediaElement.removeEventListener('ended', handleEnded);
      mediaElement.removeEventListener('error', handleError);
      mediaElement.removeEventListener('loadstart', handleLoadStart);
    };
  }, [mediaUrl]);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const showControlsTemporarily = () => {
    if (!hideControlsOnIdle) return;
    setIsControlsVisible(true);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => setIsControlsVisible(false), 3000);
  };

  const renderMedia = () => {
    if (media.media_type === 'video') {
      return (
        <video
          ref={mediaRef as RefObject<HTMLVideoElement>}
          src={mediaUrl}
          className="w-full h-full object-contain"
          controls={false}
          autoPlay={autoPlay}
          muted={isMuted}
          poster={media.cover_image ? mediaService.getMediaCoverUrl(media) : undefined}
          onMouseMove={showControlsTemporarily}
          onClick={togglePlayPause}
        />
      );
    } else if (media.media_type === 'audio') {
      return (
        <audio
          ref={mediaRef as RefObject<HTMLAudioElement>}
          src={mediaUrl}
          className="w-full"
          controls={true}
          autoPlay={autoPlay}
          muted={isMuted}
        />
      );
    }
    return null;
  };

  const renderCustomControls = () => {
    if (!showControls || media.media_type === 'audio') return null;

    return (
      <div className={cn(
        "absolute inset-0 z-30 transition-all duration-700 pointer-events-none",
        isControlsVisible ? "opacity-100" : "opacity-0"
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
              onChange={(e) => handleSeek(parseFloat(e.target.value))}
              className="absolute inset-0 w-full opacity-0 cursor-pointer z-30"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <button
                onClick={togglePlayPause}
                className="text-wt hover:scale-125 transition-all active:scale-90 cursor-pointer"
              >
                {isPlaying ? <Pause className="size-8 fill-current" /> : <Play className="size-8 fill-current" />}
              </button>

              <div className="flex items-center gap-4">
                <button
                  onClick={toggleMute}
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
                onClick={toggleFullscreen}
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
  };

  if (hasError) {
    return (
      <div className={cn("flex items-center justify-center bg-bg rounded-lg p-8", className)}>
        <div className="text-center text-font-s">
          <p>خطا در بارگذاری رسانه</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setHasError(false);
              setIsLoading(true);
              if (mediaRef.current) mediaRef.current.load();
            }}
            className="mt-4"
          >
            <RotateCcw className="h-4 w-4 ml-2" />
            تلاش مجدد
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden group/player bg-black flex items-center justify-center", className)}
      onMouseMove={showControlsTemporarily}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-40">
          <div className="flex flex-col items-center gap-4">
            <Spinner className="size-16 text-wt stroke-[1.5]" />
            <span className="text-sm text-wt font-bold tracking-tight opacity-90 drop-shadow-md">لطفاً کمی صبر کنید...</span>
          </div>
        </div>
      )}

      {renderMedia()}
      {renderCustomControls()}
      {renderHeader && renderHeader(isControlsVisible)}
    </div>
  );
}
