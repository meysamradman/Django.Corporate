"use client";

import { useQuery } from '@tanstack/react-query';
import { mediaApi, MediaUploadSettings } from '@/api/media/route';
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
 * ✅ دریافت تنظیمات آپلود از API بک‌اند
 * این تنظیمات از .env در بک‌اند خوانده می‌شود (بدون cache در فرانت)
 * در صورت خطا، از مقادیر پیش‌فرض استفاده می‌شود
 */
export const getUploadSettings = (): UploadSettings => {
    // ✅ Fallback به مقادیر پیش‌فرض در صورت عدم دسترسی به API
    // این فقط برای fallback است - در حالت عادی از API استفاده می‌شود
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
 * ✅ Hook برای دریافت تنظیمات آپلود از API با React Query
 * این hook تنظیمات را از بک‌اند می‌گیرد (بدون cache - همیشه fresh data)
 */
export const useUploadSettings = (clearCache: boolean = false) => {
    return useQuery<MediaUploadSettings>({
        queryKey: ['media-upload-settings', clearCache ? 'fresh' : 'cached'],
        queryFn: async () => {
            try {
                return await mediaApi.getUploadSettings(clearCache);
            } catch (error) {
                // ✅ Fallback به مقادیر پیش‌فرض در صورت خطا
                console.warn('Failed to fetch upload settings from API, using defaults:', error);
                return {
                    MEDIA_IMAGE_SIZE_LIMIT: mediaConfig.sizeLimits.image,
                    MEDIA_VIDEO_SIZE_LIMIT: mediaConfig.sizeLimits.video,
                    MEDIA_AUDIO_SIZE_LIMIT: mediaConfig.sizeLimits.audio,
                    MEDIA_DOCUMENT_SIZE_LIMIT: mediaConfig.sizeLimits.document,
                    MEDIA_ALLOWED_IMAGE_EXTENSIONS: [...mediaConfig.allowedExtensions.image],
                    MEDIA_ALLOWED_VIDEO_EXTENSIONS: [...mediaConfig.allowedExtensions.video],
                    MEDIA_ALLOWED_AUDIO_EXTENSIONS: [...mediaConfig.allowedExtensions.audio],
                    MEDIA_ALLOWED_PDF_EXTENSIONS: [...mediaConfig.allowedExtensions.document],
                };
            }
        },
        staleTime: 0, // ✅ NO CACHE: Admin panel is CSR only - caching handled by backend Redis
        gcTime: 0, // No cache retention
        retry: 2, // Retry 2 times on failure
        retryDelay: 1000, // 1 second delay between retries
        refetchOnWindowFocus: true, // ✅ وقتی کاربر به صفحه برمی‌گردد، refresh کن
        refetchOnMount: true, // ✅ وقتی component mount می‌شود، refresh کن
    });
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
    // Cache clearing is handled by React Query automatically
};
