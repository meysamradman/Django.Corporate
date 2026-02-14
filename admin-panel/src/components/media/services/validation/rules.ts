import { getUploadSettings } from '@/components/media/services/config';
import type { MediaType } from './types';

const uploadSettings = getUploadSettings();

export const ALLOWED_EXTENSIONS: Record<MediaType, readonly string[]> = {
  image: uploadSettings.MEDIA_ALLOWED_IMAGE_EXTENSIONS as readonly string[],
  video: uploadSettings.MEDIA_ALLOWED_VIDEO_EXTENSIONS as readonly string[],
  audio: uploadSettings.MEDIA_ALLOWED_AUDIO_EXTENSIONS as readonly string[],
  document: uploadSettings.MEDIA_ALLOWED_PDF_EXTENSIONS as readonly string[],
};

export const MAX_SIZE_BY_CATEGORY: Record<MediaType, number> = {
  image: uploadSettings.MEDIA_IMAGE_SIZE_LIMIT,
  video: uploadSettings.MEDIA_VIDEO_SIZE_LIMIT,
  audio: uploadSettings.MEDIA_AUDIO_SIZE_LIMIT,
  document: uploadSettings.MEDIA_DOCUMENT_SIZE_LIMIT,
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