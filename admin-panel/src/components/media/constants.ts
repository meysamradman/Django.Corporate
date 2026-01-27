import { MEDIA_CONFIG } from "@/core/config/environment";

/**
 * All supported media contexts in the application.
 * Add new modules here to enable media support for them.
 */
export const MEDIA_MODULES = {
    MEDIA_LIBRARY: 'media_library',
    PORTFOLIO: 'portfolio',
    BLOG: 'blog',
    REAL_ESTATE: 'real_estate',
} as const;

export type MediaContextType = typeof MEDIA_MODULES[keyof typeof MEDIA_MODULES];

/**
 * Configuration for each media module.
 */
export const MODULE_MEDIA_CONFIGS: Record<MediaContextType, {
    pathSegment: string;
    maxUploadLimit: number;
}> = {
    [MEDIA_MODULES.MEDIA_LIBRARY]: {
        pathSegment: 'media',
        maxUploadLimit: 999, // No strict limit for library itself
    },
    [MEDIA_MODULES.PORTFOLIO]: {
        pathSegment: 'portfolios',
        maxUploadLimit: MEDIA_CONFIG.PORTFOLIO_UPLOAD_MAX,
    },
    [MEDIA_MODULES.BLOG]: {
        pathSegment: 'blogs',
        maxUploadLimit: MEDIA_CONFIG.BLOG_UPLOAD_MAX,
    },
    [MEDIA_MODULES.REAL_ESTATE]: {
        pathSegment: 'real-estate',
        maxUploadLimit: MEDIA_CONFIG.REAL_ESTATE_UPLOAD_MAX,
    },
};

/**
 * Map of backend media types to frontend categories.
 */
export const MEDIA_TYPE_MAP = {
    image: ['image'],
    video: ['video'],
    audio: ['audio'],
    pdf: ['document', 'pdf'],
} as const;
