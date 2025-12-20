import { useState } from 'react';
import type { Media } from "@/types/shared/media";
import { cn } from '@/core/utils/cn';
import { Play } from 'lucide-react';
import { MediaThumbnail } from './MediaThumbnail';

interface MediaPreviewProps {
  media: Media;
  className?: string;
  showPlayIcon?: boolean;
  onClick?: () => void;
}

export function MediaPreview({
  media,
  className,
  showPlayIcon = true,
  onClick,
}: MediaPreviewProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getMediaBgColor = () => {
    const mediaType = media.media_type || 'file';
    switch (mediaType) {
      case 'video':
        return 'bg-red/10';
      case 'audio':
        return 'bg-blue/10';
      case 'document':
      case 'pdf':
        return 'bg-orange/10';
      default:
        return 'bg-gray/10';
    }
  };

  const getPlayIconColor = () => {
    const mediaType = media.media_type || 'file';
    switch (mediaType) {
      case 'video':
        return 'text-red-1';
      case 'audio':
        return 'text-blue-1';
      case 'document':
      case 'pdf':
        return 'text-orange-1';
      default:
        return 'text-gray-1';
    }
  };

  return (
    <div
      className={cn(
        "relative group cursor-pointer overflow-hidden rounded-lg border transition-all duration-300 hover:shadow-lg hover:scale-105",
        getMediaBgColor(),
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <MediaThumbnail
        media={media}
        alt={media.alt_text || media.title || 'Media preview'}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-105"
        sizes="(max-width: 768px) 33vw, (max-width: 1024px) 20vw, 16vw"
        showIcon={true}
      />

      {((media.media_type || '') === 'video' || (media.media_type || '') === 'audio') && showPlayIcon && (
        <div className={cn(
          "absolute inset-0 flex items-center justify-center bg-static-b/20 transition-opacity duration-300",
          isHovered ? "opacity-100" : "opacity-0"
        )}>
          <div className={cn(
            "flex items-center justify-center w-12 h-12 rounded-full bg-static-w/90 backdrop-blur-sm shadow-lg transition-all duration-300",
            isHovered ? "scale-110" : "scale-100"
          )}>
            <Play className={cn("h-6 w-6 ml-1", getPlayIconColor())} />
          </div>
        </div>
      )}


      <div className={cn(
        "absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300",
        isHovered ? "opacity-100" : "opacity-0"
      )}>
        <div className="absolute bottom-2 left-2 right-2">
          <p className="text-static-w text-sm font-medium truncate">
            {media.title || media.file_name || 'بدون نام'}
          </p>
          {media.alt_text && (
            <p className="text-static-w/80 text-xs truncate">
              {media.alt_text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
