"use client";

import React from 'react';
import Image from "next/image";
import { useState } from "react";
import { Media } from "@/types/shared/media";
import { mediaService } from "@/components/media/services";
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
  style?: React.CSSProperties;
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

  // Get the appropriate URL for thumbnail
  const getThumbnailUrl = () => {
    // For images, use the file URL
    if ((media.media_type || '') === 'image') {
      return mediaService.getMediaUrlFromObject(media);
    }
    
    // For non-images, use cover image if available
    const coverUrl = mediaService.getMediaCoverUrl(media);
    if (coverUrl) {
      return coverUrl;
    }
    
    // Fallback: no thumbnail available
    return null;
  };

  const thumbnailUrl = getThumbnailUrl();
  const hasThumbnail = thumbnailUrl && !hasError;

  // Get appropriate icon for media type
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

  // Get appropriate background color for media type
  const getMediaBgColor = () => {
    const mediaType = media.media_type || 'file';
    switch (mediaType) {
      case 'video':
        return 'bg-red-500/20';
      case 'audio':
        return 'bg-blue-500/20';
      case 'document':
      case 'pdf':
        return 'bg-orange-500/20';
      default:
        return 'bg-gray-500/20';
    }
  };

  if (!hasThumbnail) {
    // No thumbnail available - show icon with background
    return (
      <div 
        className={cn(
          "flex items-center justify-center bg-muted relative",
          getMediaBgColor(),
          className
        )}
        style={style}
      >
        {showIcon && (
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            {getMediaIcon()}
            <span className="text-xs mt-1 font-medium">
              {(media.media_type || 'file').toUpperCase()}
            </span>
          </div>
        )}
      </div>
    );
  }

  // Has thumbnail - show image with overlay icon
  const imageClasses = cn(
    "transition-opacity duration-300 object-cover",
    !loaded ? "opacity-0" : "opacity-100",
    className
  );

  const overlayClasses = cn(
    "absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity duration-300",
    showIcon ? "opacity-60" : "opacity-0"
  );

  if (fill) {
    return (
      <div className="relative w-full h-full">
        <Image
          src={thumbnailUrl}
          alt={alt || mediaService.getMediaAltText(media)}
          className={imageClasses}
          fill={true}
          sizes={sizes || "100vw"}
          onError={() => setError(true)}
          onLoad={() => setLoaded(true)}
          style={style}
        />
        {showIcon && (media.media_type || '') !== 'image' && (
          <div className={overlayClasses}>
            <div className="bg-white/90 rounded-full p-2 shadow-lg">
              {getMediaIcon()}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <Image
        src={thumbnailUrl}
        alt={alt || mediaService.getMediaAltText(media)}
        className={imageClasses}
        width={200}
        height={200}
        sizes={sizes}
        onError={() => setError(true)}
        onLoad={() => setLoaded(true)}
        style={style}
      />
      {showIcon && (media.media_type || '') !== 'image' && (
        <div className={overlayClasses}>
          <div className="bg-white/90 rounded-full p-2 shadow-lg">
            {getMediaIcon()}
          </div>
        </div>
      )}
    </div>
  );
}