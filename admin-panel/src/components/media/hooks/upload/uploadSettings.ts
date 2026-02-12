import { formatBytes } from '@/components/media/services';
import { MEDIA_CONFIG } from '@/core/config/environment';
import type { UploadSettings } from './types';

export function createUploadSettings(): UploadSettings {
  return {
    sizeLimit: {
      image: MEDIA_CONFIG.IMAGE_SIZE_LIMIT,
      video: MEDIA_CONFIG.VIDEO_SIZE_LIMIT,
      audio: MEDIA_CONFIG.AUDIO_SIZE_LIMIT,
      document: MEDIA_CONFIG.PDF_SIZE_LIMIT,
    },
    allowedTypes: {
      image: MEDIA_CONFIG.IMAGE_EXTENSIONS as unknown as string[],
      video: MEDIA_CONFIG.VIDEO_EXTENSIONS as unknown as string[],
      audio: MEDIA_CONFIG.AUDIO_EXTENSIONS as unknown as string[],
      document: MEDIA_CONFIG.PDF_EXTENSIONS as unknown as string[],
    },
    sizeLimitFormatted: {
      image: formatBytes(MEDIA_CONFIG.IMAGE_SIZE_LIMIT),
      video: formatBytes(MEDIA_CONFIG.VIDEO_SIZE_LIMIT),
      audio: formatBytes(MEDIA_CONFIG.AUDIO_SIZE_LIMIT),
      document: formatBytes(MEDIA_CONFIG.PDF_SIZE_LIMIT),
    }
  };
}