"use client";

import { Media } from '@/types/shared/media';
import { env } from '@/core/config/environment';


export const GetImageUrl = (imageName: string): string => {
    if (!imageName) return '';
    return `${env.MEDIA_BASE_URL}/images/${imageName}`;
};

export const GetVideoUrl = (videoName: string): string => {
    if (!videoName) return '';
    return `${env.MEDIA_BASE_URL}/videos/${videoName}`;
};

export const GetVideoCoverUrl = (coverName: string): string => {
    if (!coverName) return '';
    return `${env.MEDIA_BASE_URL}/covers/video_covers/${coverName}`;
};

export const GetAudioUrl = (audioName: string): string => {
    if (!audioName) return '';
    return `${env.MEDIA_BASE_URL}/audios/${audioName}`;
};

export const GetAudioCoverUrl = (coverName: string): string => {
    if (!coverName) return '';
    return `${env.MEDIA_BASE_URL}/covers/audio_covers/${coverName}`;
};

export const GetPdfUrl = (pdfName: string): string => {
    if (!pdfName) return '';
    return `${env.MEDIA_BASE_URL}/pdfs/${pdfName}`;
};

export const GetPdfCoverUrl = (coverName: string): string => {
    if (!coverName) return '';
    return `${env.MEDIA_BASE_URL}/covers/pdf_covers/${coverName}`;
};

export const GetCategoryImageUrl = (imageName: string): string => {
    return GetImageUrl(imageName);
};

export const GetMediaUrl = (mediaType: string, fileName: string): string => {
    if (!fileName) return '';
    
    const mediaHandlers: Record<string, (name: string) => string> = {
        'image': GetImageUrl,
        'video': GetVideoUrl,
        'audio': GetAudioUrl,
        'document': GetPdfUrl,
        'pdf': GetPdfUrl
    };
    
    const handler = mediaHandlers[mediaType];
    return handler ? handler(fileName) : `${env.MEDIA_BASE_URL}/${fileName}`;
};

export const GetMediaUrlFromObject = (media: Media): string => {
    if (!media) return '';
    
    // If file_url exists, use it directly
    if (media.file_url) {
        return media.file_url;
    }
    
    // Try url field as fallback
    if (media.url) {
        return media.url;
    }
    
    // Fallback: try to construct URL from file_name or title
    if (media.media_type === 'image' && (media.title || media.file_name)) {
        const fileName = media.file_name || media.title;
        return GetImageUrl(fileName);
    }
    
    return '';
};

export const GetMediaCoverUrl = (media: Media): string => {
    // First check if media has a cover_image_url property (from API response)
    if (media.cover_image_url) {
        return media.cover_image_url;
    }
    
    // Then check cover_image.file_url (nested object)
    if (media?.cover_image && typeof media.cover_image === 'object' && 'file_url' in media.cover_image) {
        return (media.cover_image as Media).file_url;
    }
    
    // Then check if cover_image is a string URL
    if (typeof media?.cover_image === 'string') {
        return media.cover_image;
    }
    
    // For videos and audio, if no cover is set, return empty string
    // We should not fallback to the main file URL as it's not an image
    if (media.media_type === 'video' || media.media_type === 'audio') {
        return '';
    }
    
    // For images, fallback to the main file URL
    if (media.media_type === 'image') {
        return GetMediaUrlFromObject(media);
    }
    
    return '';
};

export const ExtractFilenameFromUrl = (url: string): string => {
    if (!url) return '';
    
    try {
        const parsed = new URL(url);
        const pathSegments = parsed.pathname.split('/');
        return pathSegments[pathSegments.length - 1] || '';
    } catch {
        const segments = url.split('/');
        const filenameWithQuery = segments[segments.length - 1] || '';
        return filenameWithQuery.split('?')[0];
    }
};

export const GetMediaAltText = (media: Media): string => {
    if (!media) return 'Image';
    return media.alt_text || media.title || 'Image';
};

export const GetUserProfileImageUrl = GetImageUrl;
export const GetPortfolioImageUrl = GetImageUrl;
export const GetPortfolioVideoUrl = GetVideoUrl;
export const GetPortfolioVideoCoverUrl = GetVideoCoverUrl;
export const GetPortfolioAudioUrl = GetAudioUrl;
export const GetPortfolioAudioCoverUrl = GetAudioCoverUrl;
export const GetPortfolioPdfUrl = GetPdfUrl;
export const GetPortfolioPdfCoverUrl = GetPdfCoverUrl;
export const GetPortfolioCategoryImageUrl = GetCategoryImageUrl;
export const GetBlogImageUrl = GetImageUrl;
export const GetBlogVideoUrl = GetVideoUrl;
export const GetBlogVideoCoverUrl = GetVideoCoverUrl;
export const GetBlogAudioUrl = GetAudioUrl;
export const GetBlogAudioCoverUrl = GetAudioCoverUrl;
export const GetBlogPdfUrl = GetPdfUrl;
export const GetBlogPdfCoverUrl = GetPdfCoverUrl;
export const GetBlogCategoryImageUrl = GetCategoryImageUrl;