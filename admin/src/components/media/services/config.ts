"use client";

import { mediaConfig, MediaType } from '../mediaConfig';

export type { MediaType };

/**
 * 🎯 تنظیمات آپلود مدیا - مستقیماً از config مرکزی
 * 
 * مزایا:
 * ✅ سرعت بالا - بدون API call
 * ✅ کاهش فشار روی سرور
 * ✅ یک منبع واحد برای تمام پاپ‌آپ‌های مدیا
 */
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
 * 📦 دریافت تنظیمات آپلود - مستقیماً از config
 * بدون نیاز به API call - سرعت بالا
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
 * ⚙️ تنظیمات آپلود (Deprecated - استفاده از getUploadSettings)
 * 
 * @deprecated این hook دیگه API call نمی‌کنه، مستقیماً از config می‌خونه
 * برای سادگی بهتره مستقیماً از getUploadSettings() استفاده کنید
 */
export const useUploadSettings = () => {
    const settings = getUploadSettings();
    
    return {
        data: settings,
        isLoading: false,
        isError: false,
        error: null,
    };
};

/**
 * 🚀 تنظیمات آپلود - سریع و بهینه
 */
export const getUploadConfig = () => ({
    chunkSize: mediaConfig.uploadConfig.chunkSize,
    timeout: mediaConfig.uploadConfig.timeout,
    maxParallelUploads: mediaConfig.uploadConfig.maxParallelUploads,
    showProgress: mediaConfig.uploadConfig.showProgress,
});
