"use client";

import { env } from '@/core/config/environment';

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

export type MediaType = 'image' | 'video' | 'audio' | 'document';

export const getUploadSettings = (): UploadSettings => {
    return {
        MEDIA_IMAGE_SIZE_LIMIT: env.MEDIA_IMAGE_SIZE_LIMIT,
        MEDIA_ALLOWED_IMAGE_EXTENSIONS: env.MEDIA_IMAGE_EXTENSIONS,
        MEDIA_ALLOWED_VIDEO_EXTENSIONS: env.MEDIA_VIDEO_EXTENSIONS,
        MEDIA_ALLOWED_AUDIO_EXTENSIONS: env.MEDIA_AUDIO_EXTENSIONS,
        MEDIA_ALLOWED_PDF_EXTENSIONS: env.MEDIA_PDF_EXTENSIONS,
        MEDIA_VIDEO_SIZE_LIMIT: env.MEDIA_VIDEO_SIZE_LIMIT,
        MEDIA_AUDIO_SIZE_LIMIT: env.MEDIA_AUDIO_SIZE_LIMIT,
        MEDIA_DOCUMENT_SIZE_LIMIT: env.MEDIA_PDF_SIZE_LIMIT,
    };
};

export const getUploadConfig = () => ({
    chunkSize: env.UPLOAD_CHUNK_SIZE,
    timeout: env.UPLOAD_TIMEOUT,
    maxParallelUploads: env.MAX_PARALLEL_UPLOADS,
    showProgress: env.SHOW_UPLOAD_PROGRESS,
});

export const clearCache = (): void => {
};
