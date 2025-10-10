"use client";

import { Media } from '@/types/shared/media';
import { MediaType } from './config';
import { env } from '@/core/config/environment';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fileInfo: {
    name: string;
    size: number;
    type: string;
    extension: string;
    category: MediaType;
  };
}

export const getFileCategory = (input: File | Media): MediaType => {
    let ext: string = '';
    let mimeType: string = '';
    
    if (input instanceof File) {
        ext = input.name.split('.').pop()?.toLowerCase() || '';
        mimeType = input.type;
    } else {
        ext = input.file_name.split('.').pop()?.toLowerCase() || '';
        mimeType = input.mime_type;

        if (input.media_type) {
            const mediaTypeMap: Record<string, MediaType> = {
                'image': 'image',
                'video': 'video', 
                'audio': 'audio',
                'document': 'document',
                'pdf': 'document'
            };
            const mappedType = mediaTypeMap[input.media_type.toLowerCase()];
            if (mappedType) return mappedType;
        }
    }

    if (env.MEDIA_IMAGE_EXTENSIONS.includes(ext)) return 'image';
    if (env.MEDIA_VIDEO_EXTENSIONS.includes(ext)) return 'video';
    if (env.MEDIA_AUDIO_EXTENSIONS.includes(ext)) return 'audio';
    if (env.MEDIA_PDF_EXTENSIONS.includes(ext)) return 'document';

    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType === 'application/pdf') return 'document';
    
    return 'document';
};

export const getImageAcceptTypes = (): string => {
    return env.MEDIA_IMAGE_EXTENSIONS.map(ext => `.${ext}`).join(',');
};

export const getVideoAcceptTypes = (): string => {
    return env.MEDIA_VIDEO_EXTENSIONS.map(ext => `.${ext}`).join(',');
};

export const getAudioAcceptTypes = (): string => {
    return env.MEDIA_AUDIO_EXTENSIONS.map(ext => `.${ext}`).join(',');
};

export const getDocumentAcceptTypes = (): string => {
    return env.MEDIA_PDF_EXTENSIONS.map(ext => `.${ext}`).join(',');
};

export const validateFileSize = (file: File, type: MediaType): boolean => {
    let maxSize: number;
    switch (type) {
        case 'image':
            maxSize = env.MEDIA_IMAGE_SIZE_LIMIT;
            break;
        case 'video':
            maxSize = env.MEDIA_VIDEO_SIZE_LIMIT;
            break;
        case 'audio':
            maxSize = env.MEDIA_AUDIO_SIZE_LIMIT;
            break;
        case 'document':
            maxSize = env.MEDIA_PDF_SIZE_LIMIT;
            break;
        default:
            return false;
    }
    
    return file.size <= maxSize;
};

export const validateFileType = (file: File, type: MediaType): boolean => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    
    let allowedExtensions: string[];
    switch (type) {
        case 'image':
            allowedExtensions = env.MEDIA_IMAGE_EXTENSIONS;
            break;
        case 'video':
            allowedExtensions = env.MEDIA_VIDEO_EXTENSIONS;
            break;
        case 'audio':
            allowedExtensions = env.MEDIA_AUDIO_EXTENSIONS;
            break;
        case 'document':
            allowedExtensions = env.MEDIA_PDF_EXTENSIONS;
            break;
        default:
            return false;
    }
    
    return allowedExtensions.includes(ext);
};

const getMaxSizeForCategory = (category: MediaType): number => {
    switch (category) {
        case 'image': return env.MEDIA_IMAGE_SIZE_LIMIT;
        case 'video': return env.MEDIA_VIDEO_SIZE_LIMIT;
        case 'audio': return env.MEDIA_AUDIO_SIZE_LIMIT;
        case 'document': return env.MEDIA_PDF_SIZE_LIMIT;
        default: return env.MEDIA_PDF_SIZE_LIMIT;
    }
};

export const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const validateFileAdvanced = (file: File): ValidationResult => {
    const result: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        fileInfo: {
            name: file.name,
            size: file.size,
            type: file.type,
            extension: file.name.split('.').pop()?.toLowerCase() || '',
            category: 'document' as MediaType
        }
    };

    result.fileInfo.category = getFileCategory(file);

    if (!file.name || file.name.trim() === '') {
        result.isValid = false;
        result.errors.push('نام فایل نمی‌تواند خالی باشد');
    }

    const dangerousChars = /[<>:"/\\|?*\x00-\x1f]/;
    if (dangerousChars.test(file.name)) {
        result.isValid = false;
        result.errors.push('نام فایل شامل کاراکترهای غیرمجاز است');
    }

    if (file.name.length > 255) {
        result.isValid = false;
        result.errors.push('نام فایل بسیار طولانی است (حداکثر 255 کاراکتر)');
    }

    if (!result.fileInfo.extension) {
        result.isValid = false;
        result.errors.push('فایل باید دارای پسوند باشد');
    } else if (!validateFileType(file, result.fileInfo.category)) {
        result.isValid = false;
        result.errors.push(`پسوند "${result.fileInfo.extension}" برای نوع "${result.fileInfo.category}" مجاز نیست`);
    }

    if (file.size === 0) {
        result.isValid = false;
        result.errors.push('فایل خالی است');
    } else if (!validateFileSize(file, result.fileInfo.category)) {
        const maxSize = getMaxSizeForCategory(result.fileInfo.category);
        result.isValid = false;
        result.errors.push(`حجم فایل (${formatBytes(file.size)}) از حد مجاز (${formatBytes(maxSize)}) بیشتر است`);
    }

    const maxSize = getMaxSizeForCategory(result.fileInfo.category);
    if (file.size < maxSize * 0.01) {
        result.warnings.push(`حجم فایل بسیار کم است: ${formatBytes(file.size)}`);
    }
    
    if (file.name.includes(' ')) {
        result.warnings.push('نام فایل شامل فاصله است - بهتر است از _ یا - استفاده کنید');
    }
    
    return result;
};

export const validateMimeType = (file: File): boolean => {
    const allowedMimeTypes = {
        'image': ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
        'video': ['video/mp4', 'video/webm', 'video/quicktime'],
        'audio': ['audio/mpeg', 'audio/ogg'],
        'document': ['application/pdf']
    };
    
    const category = getFileCategory(file);
    const categoryMimes = allowedMimeTypes[category];
    
    if (!categoryMimes) return false;
    
    return categoryMimes.includes(file.type);
};

export const validateFileComplete = async (file: File): Promise<ValidationResult> => {
    const basicValidation = validateFileAdvanced(file);
    
    if (!basicValidation.isValid) {
        return basicValidation;
    }

    if (!validateMimeType(file)) {
        basicValidation.isValid = false;
        basicValidation.errors.push(`نوع MIME فایل (${file.type}) مجاز نیست`);
    }
    
    // TODO: Add magic bytes validation for enhanced security
    
    return basicValidation;
};
