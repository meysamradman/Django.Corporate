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

export const useUploadSettings = (clearCache: boolean = false) => {
    return useQuery<MediaUploadSettings>({
        queryKey: ['media-upload-settings', clearCache ? 'fresh' : 'cached'],
        queryFn: async () => {
            try {
                return await mediaApi.getUploadSettings(clearCache);
            } catch (error) {
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
        staleTime: 0,
        gcTime: 0,
        retry: 2,
        retryDelay: 1000,
        refetchOnWindowFocus: true,
        refetchOnMount: true,
    });
};

export const getUploadConfig = () => ({
    chunkSize: mediaConfig.uploadConfig.chunkSize,
    timeout: mediaConfig.uploadConfig.timeout,
    maxParallelUploads: mediaConfig.uploadConfig.maxParallelUploads,
    showProgress: mediaConfig.uploadConfig.showProgress,
});

export const clearCache = (): void => {
};
