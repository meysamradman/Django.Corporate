import { MEDIA_CONFIG } from '@/core/config/environment';
import type { MediaType } from './types';

export const ALLOWED_EXTENSIONS: Record<MediaType, readonly string[]> = {
  image: MEDIA_CONFIG.IMAGE_EXTENSIONS as readonly string[],
  video: MEDIA_CONFIG.VIDEO_EXTENSIONS as readonly string[],
  audio: MEDIA_CONFIG.AUDIO_EXTENSIONS as readonly string[],
  document: MEDIA_CONFIG.PDF_EXTENSIONS as readonly string[],
};

export const MAX_SIZE_BY_CATEGORY: Record<MediaType, number> = {
  image: MEDIA_CONFIG.IMAGE_SIZE_LIMIT,
  video: MEDIA_CONFIG.VIDEO_SIZE_LIMIT,
  audio: MEDIA_CONFIG.AUDIO_SIZE_LIMIT,
  document: MEDIA_CONFIG.PDF_SIZE_LIMIT,
};

export const ALLOWED_MIME_TYPES: Record<MediaType, readonly string[]> = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
  audio: ['audio/mpeg', 'audio/ogg'],
  document: ['application/pdf'],
};

export const isAllowedExtension = (extension: string, type: MediaType): boolean => {
  return ALLOWED_EXTENSIONS[type].includes(extension);
};

export const getAcceptTypes = (type: MediaType): string => {
  return ALLOWED_EXTENSIONS[type].map(ext => `.${ext}`).join(',');
};

export const getMaxSizeForCategory = (category: MediaType): number => {
  return MAX_SIZE_BY_CATEGORY[category];
};