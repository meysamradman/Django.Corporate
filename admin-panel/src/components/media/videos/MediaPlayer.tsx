import { useState, useRef, useEffect } from 'react';
import type { Media } from "@/types/shared/media";
import { mediaService } from "@/components/media/services";
import { cn } from '@/core/utils/cn';
import { MediaPlayerCustomControls } from '@/components/media/videos/MediaPlayerCustomControls';
import { MediaPlayerErrorState } from '@/components/media/videos/MediaPlayerErrorState';
import { MediaPlayerLoadingOverlay } from '@/components/media/videos/MediaPlayerLoadingOverlay';
import { MediaPlayerMediaElement } from '@/components/media/videos/MediaPlayerMediaElement';

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

  if (hasError) {
    return (
      <div className={cn("flex items-center justify-center bg-bg rounded-lg p-8", className)}>
        <MediaPlayerErrorState
          onRetry={() => {
            setHasError(false);
            setIsLoading(true);
            if (mediaRef.current) mediaRef.current.load();
          }}
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden group/player bg-black flex items-center justify-center", className)}
      onMouseMove={showControlsTemporarily}
    >
      {isLoading && <MediaPlayerLoadingOverlay />}

      <MediaPlayerMediaElement
        media={media}
        mediaRef={mediaRef}
        mediaUrl={mediaUrl}
        autoPlay={autoPlay}
        isMuted={isMuted}
        onShowControlsTemporarily={showControlsTemporarily}
        onTogglePlayPause={togglePlayPause}
      />
      {showControls && media.media_type !== 'audio' && (
        <MediaPlayerCustomControls
          visible={isControlsVisible}
          isPlaying={isPlaying}
          isMuted={isMuted}
          currentTime={currentTime}
          duration={duration}
          onSeek={handleSeek}
          onTogglePlayPause={togglePlayPause}
          onToggleMute={toggleMute}
          onToggleFullscreen={toggleFullscreen}
          formatTime={formatTime}
        />
      )}
      {renderHeader && renderHeader(isControlsVisible)}
    </div>
  );
}
