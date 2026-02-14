import type { Media } from '@/types/shared/media';
import { env } from '@/core/config/environment';

const buildNamedMediaUrl = (name: string, folder: string): string => {
    if (!name) return '';
    if (name.startsWith('/')) return name;
    return `${env.MEDIA_BASE_URL}/${folder}/${name}`;
};

export const GetImageUrl = (imageName: string): string => {
    return buildNamedMediaUrl(imageName, 'images');
};

export const GetVideoUrl = (videoName: string): string => {
    return buildNamedMediaUrl(videoName, 'videos');
};

export const GetVideoCoverUrl = (coverName: string): string => {
    return buildNamedMediaUrl(coverName, 'covers/video_covers');
};

export const GetAudioUrl = (audioName: string): string => {
    return buildNamedMediaUrl(audioName, 'audios');
};

export const GetAudioCoverUrl = (coverName: string): string => {
    return buildNamedMediaUrl(coverName, 'covers/audio_covers');
};

export const GetPdfUrl = (pdfName: string): string => {
    return buildNamedMediaUrl(pdfName, 'pdfs');
};

export const GetPdfCoverUrl = (coverName: string): string => {
    return buildNamedMediaUrl(coverName, 'covers/pdf_covers');
};

export const GetCategoryImageUrl = (imageName: string): string => {
    return GetImageUrl(imageName);
};

export const GetMediaUrl = (mediaType: string, fileName: string): string => {
    if (!fileName) return '';
    
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
    
    if (media.media_type && (media.file_name || media.title)) {
        const fileName = media.file_name || media.title || "";
        const mediaUrl = GetMediaUrl(media.media_type, fileName);
        return buildMediaUrl(mediaUrl);
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