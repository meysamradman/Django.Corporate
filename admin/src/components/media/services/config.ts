"use client";

import { mediaConfig, MediaType } from '@/core/config/media';

export type { MediaType };

export interface UploadSettings {
    MEDIA_IMAGE_SIZE_LIMIT: number;
    MEDIA_ALLOWED_IMAGE_EXTENSIONS: string[];
    MEDIA_ALLOWED_VIDEO_EXTENSIONS: string[];
    MEDIA_ALLOWED_AUDIO_EXTENSIONS: string[];
    MEDIA_ALLOWED_PDF_EXTENSIONS: string[];
    MEDIA_VIDEO_SIZE_LIMIT: number;
    MEDIA_AUDIO_SIZE_LIMIT: number;
    MEDIA_DOCUMENT_SIZE_LIMIT: number;
}

/**
 * دریافت تنظیمات آپلود از core/config/media
 * این تابع برای سازگاری با کدهای موجود است
 */
export const getUploadSettings = (): UploadSettings => {
    return {
        MEDIA_IMAGE_SIZE_LIMIT: mediaConfig.sizeLimits.image,
        MEDIA_ALLOWED_IMAGE_EXTENSIONS: [...mediaConfig.allowedExtensions.image],
        MEDIA_VIDEO_SIZE_LIMIT: mediaConfig.sizeLimits.video,
        MEDIA_ALLOWED_VIDEO_EXTENSIONS: [...mediaConfig.allowedExtensions.video],
        MEDIA_AUDIO_SIZE_LIMIT: mediaConfig.sizeLimits.audio,
        MEDIA_ALLOWED_AUDIO_EXTENSIONS: [...mediaConfig.allowedExtensions.audio],
        MEDIA_DOCUMENT_SIZE_LIMIT: mediaConfig.sizeLimits.document,
        MEDIA_ALLOWED_PDF_EXTENSIONS: [...mediaConfig.allowedExtensions.document],
    };
};

/**
 * دریافت تنظیمات آپلود (chunk size, timeout, etc.)
 */
export const getUploadConfig = () => ({
    chunkSize: mediaConfig.uploadConfig.chunkSize,
    timeout: mediaConfig.uploadConfig.timeout,
    maxParallelUploads: mediaConfig.uploadConfig.maxParallelUploads,
    showProgress: mediaConfig.uploadConfig.showProgress,
});

export const clearCache = (): void => {
};
