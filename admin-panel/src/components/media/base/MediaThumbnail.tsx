import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { Media } from "@/types/shared/media";
import { mediaService } from "@/components/media/services";
import { env } from '@/core/config/environment';
import { cn } from '@/core/utils/cn';
import { 
  Play, 
  FileVideo, 
  FileAudio, 
  FileText, 
  File,
  ImageOff 
} from 'lucide-react';

interface MediaThumbnailProps {
  media: Media;
  alt?: string;
  className?: string;
  fill?: boolean;
  sizes?: string;
  showIcon?: boolean;
  style?: CSSProperties;
}

export function MediaThumbnail({
  media,
  alt,
  className,
  fill = false,
  sizes,
  showIcon = true,
  style,
}: MediaThumbnailProps) {
  const [hasError, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const getThumbnailUrl = () => {
    if ((media.media_type || '') === 'image') {
      return mediaService.getMediaUrlFromObject(media);
    }
    
    const coverUrl = mediaService.getMediaCoverUrl(media);
    if (coverUrl) {
      return coverUrl;
    }
    
    return null;
  };

  const thumbnailUrl = getThumbnailUrl();
  const hasThumbnail = thumbnailUrl && !hasError;

  const getMediaIcon = () => {
    const mediaType = media.media_type || 'file';
    switch (mediaType) {
      case 'video':
        return <Play className="h-8 w-8" />;
      case 'audio':
        return <FileAudio className="h-8 w-8" />;
      case 'document':
      case 'pdf':
        return <FileText className="h-8 w-8" />;
      default:
        return <File className="h-8 w-8" />;
    }
  };

  const getMediaBgColor = () => {
    const mediaType = media.media_type || 'file';
    switch (mediaType) {
      case 'video':
        return 'bg-red/20';
      case 'audio':
        return 'bg-blue/20';
      case 'document':
      case 'pdf':
        return 'bg-orange/20';
      default:
        return 'bg-gray/20';
    }
  };

  if (!hasThumbnail) {
    return (
      <div 
        className={cn(
          "flex items-center justify-center bg-bg relative",
          getMediaBgColor(),
          className
        )}
        style={style}
      >
        {showIcon && (
          <div className="flex flex-col items-center justify-center text-font-s">
            {getMediaIcon()}
            <span className="text-xs mt-1 font-medium">
              {(media.media_type || 'file').toUpperCase()}
            </span>
          </div>
        )}
      </div>
    );
  }

  const imageClasses = cn(
    "transition-opacity duration-300 object-cover",
    !loaded ? "opacity-0" : "opacity-100",
    className
  );

  const overlayClasses = cn(
    "absolute inset-0 flex items-center justify-center bg-static-b/20 opacity-0 hover:opacity-100 transition-opacity duration-300",
    showIcon ? "opacity-60" : "opacity-0"
  );

  if (fill) {
    return (
      <div className="relative w-full h-full">
        <img
          src={thumbnailUrl}
          alt={alt || mediaService.getMediaAltText(media)}
          className={cn(imageClasses, "absolute inset-0 w-full h-full")}
          onError={() => setError(true)}
          onLoad={() => setLoaded(true)}
          style={style}
        />
        {showIcon && (media.media_type || '') !== 'image' && (
          <div className={overlayClasses}>
            <div className="bg-static-w/90 rounded-full p-2 shadow-lg">
              {getMediaIcon()}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <img
        src={thumbnailUrl}
        alt={alt || mediaService.getMediaAltText(media)}
        className={imageClasses}
        width={200}
        height={200}
        onError={() => setError(true)}
        onLoad={() => setLoaded(true)}
        style={style}
      />
      {showIcon && (media.media_type || '') !== 'image' && (
        <div className={overlayClasses}>
          <div className="bg-static-w/90 rounded-full p-2 shadow-lg">
            {getMediaIcon()}
          </div>
        </div>
      )}
    </div>
  );
}