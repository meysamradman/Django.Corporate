import type { RefObject } from 'react';
import type { Media } from '@/types/shared/media';
import { mediaService } from '@/components/media/services';

interface MediaPlayerMediaElementProps {
  media: Media;
  mediaRef: RefObject<HTMLVideoElement | HTMLAudioElement | null>;
  mediaUrl: string;
  autoPlay: boolean;
  isMuted: boolean;
  onShowControlsTemporarily: () => void;
  onTogglePlayPause: () => void;
}

export function MediaPlayerMediaElement({
  media,
  mediaRef,
  mediaUrl,
  autoPlay,
  isMuted,
  onShowControlsTemporarily,
  onTogglePlayPause,
}: MediaPlayerMediaElementProps) {
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
        onMouseMove={onShowControlsTemporarily}
        onClick={onTogglePlayPause}
      />
    );
  }

  if (media.media_type === 'audio') {
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
}
