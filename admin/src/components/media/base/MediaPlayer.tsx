"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Media } from "@/types/shared/media";
import { mediaService } from "@/components/media/services";
import { env } from '@/core/config/environment';
import { cn } from '@/core/utils/cn';
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw } from 'lucide-react';
import { Button } from '@/components/elements/Button';

interface MediaPlayerProps {
  media: Media;
  className?: string;
  autoPlay?: boolean;
  controls?: boolean;
  showControls?: boolean;
}

export function MediaPlayer({
  media,
  className,
  autoPlay = false,
  controls = true,
  showControls = true,
}: MediaPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get media URL
  const mediaUrl = mediaService.getMediaUrlFromObject(media);
  
  // Ensure we have a full URL for media playback
  const fullMediaUrl = mediaUrl.startsWith('/') ? `${env.MEDIA_BASE_URL}${mediaUrl}` : mediaUrl;

  // Handle play/pause
  const togglePlayPause = () => {
    if (!mediaRef.current) return;
    
    if (isPlaying) {
      mediaRef.current.pause();
    } else {
      mediaRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Handle volume change
  const handleVolumeChange = (newVolume: number) => {
    if (!mediaRef.current) return;
    
    setVolume(newVolume);
    mediaRef.current.volume = newVolume;
    setIsMuted(newVolume === 0);
  };

  // Handle mute toggle
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

  // Handle fullscreen toggle
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

  // Handle seek
  const handleSeek = (time: number) => {
    if (!mediaRef.current) return;
    
    mediaRef.current.currentTime = time;
    setCurrentTime(time);
  };

  // Format time
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle media events
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

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

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

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Render different media types
  const renderMedia = () => {
    if (media.media_type === 'video') {
      return (
        <video
          ref={mediaRef as React.RefObject<HTMLVideoElement>}
          src={fullMediaUrl}
          className="w-full h-full object-contain"
          controls={controls}
          autoPlay={autoPlay}
          muted={isMuted}
          poster={media.cover_image ? mediaService.getMediaCoverUrl(media) : undefined}
        />
      );
    } else if (media.media_type === 'audio') {
      return (
        <audio
          ref={mediaRef as React.RefObject<HTMLAudioElement>}
          src={fullMediaUrl}
          controls={controls}
          autoPlay={autoPlay}
          muted={isMuted}
        />
      );
    }
    
    return null;
  };

  // Custom controls for better UX
  const renderCustomControls = () => {
    if (!showControls || controls) return null;

    return (
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        {/* Progress Bar */}
        <div className="mb-3">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={(e) => handleSeek(parseFloat(e.target.value))}
            className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #fff 0%, #fff ${(currentTime / duration) * 100}%, rgba(255,255,255,0.3) ${(currentTime / duration) * 100}%, rgba(255,255,255,0.3) 100%)`
            }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePlayPause}
              className="text-white hover:bg-white/20"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            
            <span className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMute}
              className="text-white hover:bg-white/20"
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>

            {media.media_type === 'video' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                className="text-white hover:bg-white/20"
              >
                <Maximize className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (hasError) {
    return (
      <div className={cn("flex items-center justify-center bg-muted rounded-lg", className)}>
        <div className="text-center text-muted-foreground">
          <p>خطا در بارگذاری رسانه</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setHasError(false);
              setIsLoading(true);
              if (mediaRef.current) {
                mediaRef.current.load();
              }
            }}
            className="mt-2"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            تلاش مجدد
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative bg-black rounded-lg overflow-hidden", className)}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-white">در حال بارگذاری...</div>
        </div>
      )}
      
      {renderMedia()}
      {renderCustomControls()}
    </div>
  );
}
