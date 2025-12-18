import type { Media } from '@/types/shared/media';
import { env } from '@/core/config/environment';

export const GetImageUrl = (imageName: string): string => {
  if (!imageName) return '';
  if (imageName.startsWith('/')) {
    return imageName;
  }
  return `${env.MEDIA_BASE_URL}/images/${imageName}`;
};

export const GetVideoUrl = (videoName: string): string => {
  if (!videoName) return '';
  if (videoName.startsWith('/')) {
    return videoName;
  }
  return `${env.MEDIA_BASE_URL}/videos/${videoName}`;
};

const buildMediaUrl = (path: string | null | undefined): string => {
  if (!path) return '';
  
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${env.MEDIA_BASE_URL}${cleanPath}`;
};

export const GetMediaUrlFromObject = (media: Media | null): string => {
  if (!media) return '';
  
  if (media.file_url) {
    return buildMediaUrl(media.file_url);
  }
  
  if (media.media_type === 'image' && (media.title || media.file_name)) {
    const fileName = media.file_name || media.title;
    return buildMediaUrl(GetImageUrl(fileName));
  }
  
  return '';
};

export const GetMediaCoverUrl = (media: Media | null): string => {
  if (!media) return '';
  
  if (media.cover_image_url) {
    return buildMediaUrl(media.cover_image_url);
  }
  
  if (media?.cover_image && typeof media.cover_image === 'object' && 'file_url' in media.cover_image) {
    const coverUrl = (media.cover_image as Media).file_url;
    if (coverUrl) {
      return buildMediaUrl(coverUrl);
    }
  }
  
  if (typeof media?.cover_image === 'string') {
    return buildMediaUrl(media.cover_image);
  }
  
  if (media.media_type === 'video' || media.media_type === 'audio' || media.media_type === 'pdf' || media.media_type === 'document') {
    return '';
  }
  
  if (media.media_type === 'image') {
    return GetMediaUrlFromObject(media);
  }
  
  return '';
};

export const GetMediaAltText = (media: Media): string => {
  if (!media) return 'Image';
  return media.alt_text || media.title || 'Image';
};

