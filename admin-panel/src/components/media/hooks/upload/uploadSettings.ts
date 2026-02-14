import { formatBytes } from '@/components/media/services';
import { getUploadSettings } from '@/components/media/services/config';
import type { UploadSettings } from './types';

export function createUploadSettings(): UploadSettings {
  const settings = getUploadSettings();

  return {
    sizeLimit: {
      image: settings.MEDIA_IMAGE_SIZE_LIMIT,
      video: settings.MEDIA_VIDEO_SIZE_LIMIT,
      audio: settings.MEDIA_AUDIO_SIZE_LIMIT,
      document: settings.MEDIA_DOCUMENT_SIZE_LIMIT,
    },
    allowedTypes: {
      image: [...settings.MEDIA_ALLOWED_IMAGE_EXTENSIONS],
      video: [...settings.MEDIA_ALLOWED_VIDEO_EXTENSIONS],
      audio: [...settings.MEDIA_ALLOWED_AUDIO_EXTENSIONS],
      document: [...settings.MEDIA_ALLOWED_PDF_EXTENSIONS],
    },
    sizeLimitFormatted: {
      image: formatBytes(settings.MEDIA_IMAGE_SIZE_LIMIT),
      video: formatBytes(settings.MEDIA_VIDEO_SIZE_LIMIT),
      audio: formatBytes(settings.MEDIA_AUDIO_SIZE_LIMIT),
      document: formatBytes(settings.MEDIA_DOCUMENT_SIZE_LIMIT),
    }
  };
}