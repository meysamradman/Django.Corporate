"use client";

import { Media } from '@/types/shared/media';
import { env } from '@/core/config/environment';


export const GetImageUrl = (imageName: string): string => {
    if (!imageName) return '';
    // For relative paths, don't add the base URL
    if (imageName.startsWith('/')) {
        return imageName;
    }
    return `${env.MEDIA_BASE_URL}/images/${imageName}`;
};

export const GetVideoUrl = (videoName: string): string => {
    if (!videoName) return '';
    // For relative paths, don't add the base URL
    if (videoName.startsWith('/')) {
        return videoName;
    }
    return `${env.MEDIA_BASE_URL}/videos/${videoName}`;
};

export const GetVideoCoverUrl = (coverName: string): string => {
    if (!coverName) return '';
    // For relative paths, don't add the base URL
    if (coverName.startsWith('/')) {
        return coverName;
    }
    return `${env.MEDIA_BASE_URL}/covers/video_covers/${coverName}`;
};

export const GetAudioUrl = (audioName: string): string => {
    if (!audioName) return '';
    // For relative paths, don't add the base URL
    if (audioName.startsWith('/')) {
        return audioName;
    }
    return `${env.MEDIA_BASE_URL}/audios/${audioName}`;
};

export const GetAudioCoverUrl = (coverName: string): string => {
    if (!coverName) return '';
    // For relative paths, don't add the base URL
    if (coverName.startsWith('/')) {
        return coverName;
    }
    return `${env.MEDIA_BASE_URL}/covers/audio_covers/${coverName}`;
};

export const GetPdfUrl = (pdfName: string): string => {
    if (!pdfName) return '';
    // For relative paths, don't add the base URL
    if (pdfName.startsWith('/')) {
        return pdfName;
    }
    return `${env.MEDIA_BASE_URL}/pdfs/${pdfName}`;
};

export const GetPdfCoverUrl = (coverName: string): string => {
    if (!coverName) return '';
    // For relative paths, don't add the base URL
    if (coverName.startsWith('/')) {
        return coverName;
    }
    return `${env.MEDIA_BASE_URL}/covers/pdf_covers/${coverName}`;
};

export const GetCategoryImageUrl = (imageName: string): string => {
    return GetImageUrl(imageName);
};

export const GetMediaUrl = (mediaType: string, fileName: string): string => {
    if (!fileName) return '';
    
    // For relative paths, return as is
    if (fileName.startsWith('/')) {
        return fileName;
    }
    
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

const buildMediaUrl = (path: string | null | undefined): string => {
  if (!path) return '';
  
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${env.MEDIA_BASE_URL}${cleanPath}`;
};

export const GetFullMediaUrl = (relativeUrl: string | null | undefined): string => {
  return buildMediaUrl(relativeUrl);
};

export const GetMediaUrlFromObject = (media: Media | null): string => {
    if (!media) return '';
    
    if (media.file_url) {
        return buildMediaUrl(media.file_url);
    }
    
    if (media.media_type === 'image' && (media.title || media.file_name)) {
        const fileName = media.file_name || media.title;
        return buildMediaUrl(GetImageUrl(fileName));
    }
    
    return '';
};

export const GetMediaCoverUrl = (media: Media | null): string => {
    if (!media) return '';
    
    if (media.cover_image_url) {
        return buildMediaUrl(media.cover_image_url);
    }
    
    if (media?.cover_image && typeof media.cover_image === 'object' && 'file_url' in media.cover_image) {
        const coverUrl = (media.cover_image as Media).file_url;
        if (coverUrl) {
            return buildMediaUrl(coverUrl);
        }
    }
    
    if (typeof media?.cover_image === 'string') {
        return buildMediaUrl(media.cover_image);
    }
    
    if (media.media_type === 'video' || media.media_type === 'audio' || media.media_type === 'pdf' || media.media_type === 'document') {
        return '';
    }
    
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

// ✅ Aliases برای سازگاری با کدهای قدیمی - همه به توابع اصلی اشاره می‌کنند
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