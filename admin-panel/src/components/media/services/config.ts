import { MEDIA_CONFIG } from '@/core/config/environment';

/**
 * Returns the upload settings derived from environment configuration.
 * This is used for UI validation and display.
 */
export const getUploadSettings = () => {
    return {
        MEDIA_IMAGE_SIZE_LIMIT: MEDIA_CONFIG.IMAGE_SIZE_LIMIT,
        MEDIA_VIDEO_SIZE_LIMIT: MEDIA_CONFIG.VIDEO_SIZE_LIMIT,
        MEDIA_AUDIO_SIZE_LIMIT: MEDIA_CONFIG.AUDIO_SIZE_LIMIT,
        MEDIA_DOCUMENT_SIZE_LIMIT: MEDIA_CONFIG.PDF_SIZE_LIMIT,

        MEDIA_ALLOWED_IMAGE_EXTENSIONS: MEDIA_CONFIG.IMAGE_EXTENSIONS,
        MEDIA_ALLOWED_VIDEO_EXTENSIONS: MEDIA_CONFIG.VIDEO_EXTENSIONS,
        MEDIA_ALLOWED_AUDIO_EXTENSIONS: MEDIA_CONFIG.AUDIO_EXTENSIONS,
        MEDIA_ALLOWED_PDF_EXTENSIONS: MEDIA_CONFIG.PDF_EXTENSIONS,

        PORTFOLIO_MEDIA_UPLOAD_MAX: MEDIA_CONFIG.PORTFOLIO_UPLOAD_MAX,
        BLOG_MEDIA_UPLOAD_MAX: MEDIA_CONFIG.BLOG_UPLOAD_MAX,
        REAL_ESTATE_MEDIA_UPLOAD_MAX: MEDIA_CONFIG.REAL_ESTATE_UPLOAD_MAX,
    };
};

/**
 * Legacy support for getUploadConfig.
 */
export const getUploadConfig = () => {
    return getUploadSettings();
};

/**
 * Hook-like function for settings (could be expanded if needed).
 */
export const useUploadSettings = () => {
    return getUploadSettings();
};
