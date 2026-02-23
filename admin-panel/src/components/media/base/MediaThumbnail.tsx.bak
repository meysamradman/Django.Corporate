import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { Media } from "@/types/shared/media";
import { mediaService } from "@/components/media/services";
import { cn } from '@/core/utils/cn';
import { 
  Play, 
  FileAudio, 
  FileText, 
  File
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

const MEDIA_BG_CLASS_MAP: Record<string, string> = {
  video: 'bg-red/20',
  audio: 'bg-blue/20',
  document: 'bg-orange/20',
  pdf: 'bg-orange/20',
};

const getMediaTypeLabel = (mediaType: string | null | undefined): string =>
  (mediaType || 'file').toUpperCase();

const getMediaBgClass = (mediaType: string | null | undefined): string =>
  MEDIA_BG_CLASS_MAP[mediaType || ''] || 'bg-gray/20';

const renderMediaIcon = (mediaType: string | null | undefined) => {
  switch (mediaType || 'file') {
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

export function MediaThumbnail({
  media,
  alt,
  className,
  fill = false,
  sizes: _sizes,
  showIcon = true,
  style,
}: MediaThumbnailProps) {
  const [hasError, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const mediaType = media.media_type || '';

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

  const isImageType = mediaType === 'image';

  const renderIconOverlay = (overlayClasses: string) => (
    <div className={overlayClasses}>
      <div className="bg-static-w/90 rounded-full p-2 shadow-lg">
        {renderMediaIcon(mediaType)}
      </div>
    </div>
  );

  if (!hasThumbnail) {
    return (
      <div 
        className={cn(
          "flex items-center justify-center bg-bg relative",
          getMediaBgClass(mediaType),
          className
        )}
        style={style}
      >
        {showIcon && (
          <div className="flex flex-col items-center justify-center text-font-s">
            {renderMediaIcon(mediaType)}
            <span className="text-xs mt-1 font-medium">
              {getMediaTypeLabel(mediaType)}
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
        {showIcon && !isImageType && renderIconOverlay(overlayClasses)}
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
      {showIcon && !isImageType && renderIconOverlay(overlayClasses)}
    </div>
  );
}