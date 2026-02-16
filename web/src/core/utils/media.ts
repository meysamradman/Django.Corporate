/**
 * Media URL utilities for handling images and files from backend
 */

// 1) Root for serving FILES (images/videos/...) via Next rewrites
export const MEDIA_FILE_ROOT = '/media/' as const;

// 2) Route for MEDIA API endpoints (relative to API base url)
// If your env.API_BASE_URL already contains '/api', this becomes '/api/media/'.
export const MEDIA_API_ROUTE = '/media/' as const;

// Default fallback images used across the UI (only for display, not backend paths)
export const MEDIA_DEFAULT_IMAGES = {
  profileBanner: '/images/profile-banner.png',
  realEstate: {
    property: '/images/profile-banner.png',
    state: '/images/profile-banner.png',
    type: '/images/profile-banner.png',
    floorPlan: '/images/profile-banner.png',
  },
  blog: {
    post: '/images/profile-banner.png',
  },
  user: {
    avatar: '/images/default_profile.png',
  },
} as const;

const mediaConfig = {
  root: MEDIA_FILE_ROOT,
  realEstate: {
    image: '/media/image/',
    video: '/media/video/',
    audio: '/media/audio/',
    document: '/media/document/',
  },
  blog: {
    image: '/media/image/',
    video: '/media/video/',
  },
  user: {
    avatar: '/media/image/',
  },
  email: {
    attachment: '/media/email_attachments/',
  },
} as const;

/**
 * Get full media URL from backend path
 * @param mediaPath - Path to media file (e.g., "/media/images/photo.jpg")
 * @returns Full URL to media file
 */
export const getMediaUrl = (mediaPath?: string | null): string | null => {
  if (!mediaPath) return null;

  // Already a full URL (http:// or https://)
  if (/^https?:\/\//i.test(mediaPath)) {
    return mediaPath;
  }

  const base = mediaConfig.root.endsWith('/') ? mediaConfig.root.slice(0, -1) : mediaConfig.root;

  // Ensure mediaPath starts with /
  const cleanPath = mediaPath.startsWith('/') ? mediaPath : `/${mediaPath}`;

  // If already under /media, return as is (relative)
  if (cleanPath === base || cleanPath.startsWith(`${base}/`)) {
    return cleanPath;
  }

  // Construct relative path under /media
  return `${base}${cleanPath}`;
};

/**
 * Get media URL with fallback image
 * @param mediaPath - Path to media file
 * @param fallback - Fallback image path (default: "/images/profile-banner.png")
 * @returns Full URL to media file or fallback
 */
export const getMediaUrlWithFallback = (
  mediaPath?: string | null,
  fallback: string = MEDIA_DEFAULT_IMAGES.profileBanner
): string => {
  const url = getMediaUrl(mediaPath);
  return url || fallback;
};

/**
 * Get image URL from various image object formats
 * @param image - Image object with url, file_url, or file properties
 * @param fallback - Fallback image
 * @returns Full URL to image or fallback
 */
export const getImageUrl = (
  image?: { url?: string; file_url?: string; file?: string } | string | null,
  fallback: string = MEDIA_DEFAULT_IMAGES.profileBanner
): string => {
  if (!image) return fallback;
  if (typeof image === 'string') {
    return getMediaUrlWithFallback(image, fallback);
  }
  const imagePath = image.url || image.file_url || image.file;
  return getMediaUrlWithFallback(imagePath, fallback);
};

/**
 * Real Estate specific media utilities
 */
export const realEstateMedia = {
  getPropertyMainImageOrNull: (
    mainImage?: { url?: string; file_url?: string } | null
  ): string | null => {
    if (!mainImage) return null;
    return getMediaUrl(mainImage.url || mainImage.file_url);
  },
  getPropertyMainImage: (
    mainImage?: { url?: string; file_url?: string } | null,
    fallback: string = MEDIA_DEFAULT_IMAGES.realEstate.property
  ): string => {
    if (!mainImage) return fallback;
    return getMediaUrlWithFallback(mainImage.url || mainImage.file_url, fallback);
  },
  extractPropertyMediaPath: (item: unknown): string | null => {
    if (!item || typeof item !== 'object') return null;
    const obj = item as Record<string, unknown>;

    const direct = obj.file_url || obj.url || obj.file;
    if (typeof direct === 'string' && direct.trim()) return direct;

    const mediaObj = obj.media as Record<string, unknown> | undefined;
    const mediaUrl = mediaObj?.file_url || mediaObj?.url || mediaObj?.file;
    if (typeof mediaUrl === 'string' && mediaUrl.trim()) return mediaUrl;

    const mediaDetailObj = obj.media_detail as Record<string, unknown> | undefined;
    const mediaDetailUrl = mediaDetailObj?.file_url || mediaDetailObj?.url || mediaDetailObj?.file;
    if (typeof mediaDetailUrl === 'string' && mediaDetailUrl.trim()) return mediaDetailUrl;

    const coverUrl = obj.cover_image_url;
    if (typeof coverUrl === 'string' && coverUrl.trim()) return coverUrl;

    return null;
  },
  extractPropertyMediaUrl: (item: unknown): string | null => {
    return getMediaUrl(realEstateMedia.extractPropertyMediaPath(item));
  },
  getStateImage: (
    imageUrl?: string | null,
    fallback: string = MEDIA_DEFAULT_IMAGES.realEstate.state
  ): string => {
    return getMediaUrlWithFallback(imageUrl, fallback);
  },
  getTypeImage: (
    image?: { url?: string; file_url?: string; file?: string } | string | null,
    fallback: string = MEDIA_DEFAULT_IMAGES.realEstate.type
  ): string => {
    return getImageUrl(image, fallback);
  },
  getPropertyGallery: (
    media?: unknown[] | null
  ): string[] => {
    if (!media || !Array.isArray(media)) return [];

    const urls = media
      .map((item) => realEstateMedia.extractPropertyMediaUrl(item))
      .filter((url): url is string => url !== null);

    return Array.from(new Set(urls));
  },
  getFloorPlanImage: (
    floorPlan?: { main_image?: { url?: string } | null } | null,
    fallback: string = MEDIA_DEFAULT_IMAGES.realEstate.floorPlan
  ): string => {
    if (!floorPlan?.main_image?.url) return fallback;
    return getMediaUrlWithFallback(floorPlan.main_image.url, fallback);
  },
};

export const blogMedia = {
  getPostImage: (
    image?: { url?: string; file_url?: string; file?: string } | string | null,
    fallback: string = MEDIA_DEFAULT_IMAGES.blog.post
  ): string => {
    return getImageUrl(image, fallback);
  },
};

export const userMedia = {
  getAvatar: (
    avatar?: { url?: string; file_url?: string; file?: string } | string | null,
    fallback: string = MEDIA_DEFAULT_IMAGES.user.avatar
  ): string => {
    return getImageUrl(avatar, fallback);
  },
};
