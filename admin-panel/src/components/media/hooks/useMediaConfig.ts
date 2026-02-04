import { MEDIA_CONFIG } from '@/core/config/environment';
import type { MediaUploadSettings } from '@/types/shared/media';

/**
 * Hook for media configuration.
 * Returns static data from environment.ts for maximum performance.
 */
export const useMediaConfig = () => {
    const config: MediaUploadSettings = {
        MEDIA_IMAGE_SIZE_LIMIT: MEDIA_CONFIG.IMAGE_SIZE_LIMIT,
        MEDIA_VIDEO_SIZE_LIMIT: MEDIA_CONFIG.VIDEO_SIZE_LIMIT,
        MEDIA_AUDIO_SIZE_LIMIT: MEDIA_CONFIG.AUDIO_SIZE_LIMIT,
        MEDIA_DOCUMENT_SIZE_LIMIT: MEDIA_CONFIG.PDF_SIZE_LIMIT,
        MEDIA_ALLOWED_IMAGE_EXTENSIONS: MEDIA_CONFIG.IMAGE_EXTENSIONS as unknown as string[],
        MEDIA_ALLOWED_VIDEO_EXTENSIONS: MEDIA_CONFIG.VIDEO_EXTENSIONS as unknown as string[],
        MEDIA_ALLOWED_AUDIO_EXTENSIONS: MEDIA_CONFIG.AUDIO_EXTENSIONS as unknown as string[],
        MEDIA_ALLOWED_PDF_EXTENSIONS: MEDIA_CONFIG.PDF_EXTENSIONS as unknown as string[],
        PORTFOLIO_MEDIA_UPLOAD_MAX: MEDIA_CONFIG.PORTFOLIO_UPLOAD_MAX,
        BLOG_MEDIA_UPLOAD_MAX: MEDIA_CONFIG.BLOG_UPLOAD_MAX,
        REAL_ESTATE_MEDIA_UPLOAD_MAX: MEDIA_CONFIG.REAL_ESTATE_UPLOAD_MAX,
        PORTFOLIO_EXPORT_PRINT_MAX_ITEMS: MEDIA_CONFIG.PORTFOLIO_EXPORT_PRINT_MAX_ITEMS,
        BLOG_EXPORT_PRINT_MAX_ITEMS: MEDIA_CONFIG.BLOG_EXPORT_PRINT_MAX_ITEMS,
        REAL_ESTATE_EXPORT_PRINT_MAX_ITEMS: MEDIA_CONFIG.REAL_ESTATE_EXPORT_PRINT_MAX_ITEMS,
    };

    return {
        data: config,
        isLoading: false,
        isError: false,
        error: null
    };
};
