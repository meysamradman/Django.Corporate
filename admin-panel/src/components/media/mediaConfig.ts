export type MediaType = 'image' | 'video' | 'audio' | 'document';

export const MEDIA_SIZE_LIMITS = {
  image: 5 * 1024 * 1024,      // 5MB
  video: 150 * 1024 * 1024,    // 150MB
  audio: 20 * 1024 * 1024,     // 20MB
  document: 10 * 1024 * 1024,  // 10MB
} as const;

export const MEDIA_ALLOWED_EXTENSIONS = {
  image: ['jpg', 'jpeg', 'webp', 'png', 'svg', 'gif'],
  video: ['mp4', 'webm', 'mov'],
  audio: ['mp3', 'ogg', 'aac', 'm4a'],
  document: ['pdf'],
} as const;

export const UPLOAD_CONFIG = {
  chunkSize: 1024 * 1024,
  timeout: 300000,
  maxParallelUploads: 3,
  showProgress: true,
} as const;

export const getMediaSizeLimit = (type: MediaType): number => {
  return MEDIA_SIZE_LIMITS[type];
};

export const getMediaExtensions = (type: MediaType): readonly string[] => {
  return MEDIA_ALLOWED_EXTENSIONS[type];
};

export const isExtensionAllowed = (extension: string, type: MediaType): boolean => {
  const ext = extension.toLowerCase().replace('.', '');
  const allowed = MEDIA_ALLOWED_EXTENSIONS[type];
  return allowed.some(allowedExt => allowedExt === ext);
};

export const getAcceptTypes = (type: MediaType): string => {
  return MEDIA_ALLOWED_EXTENSIONS[type].map(ext => `.${ext}`).join(',');
};

export const mediaConfig = {
  sizeLimits: MEDIA_SIZE_LIMITS,
  allowedExtensions: MEDIA_ALLOWED_EXTENSIONS,
  uploadConfig: UPLOAD_CONFIG,
  getMediaSizeLimit,
  getMediaExtensions,
  isExtensionAllowed,
  getAcceptTypes,
} as const;
