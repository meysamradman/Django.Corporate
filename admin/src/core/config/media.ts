/**
 * Media Upload Configuration
 * 
 * ⚠️ این فایل فقط برای fallback استفاده می‌شود!
 * 
 * تنظیمات اصلی از API بک‌اند دریافت می‌شود که خودش از .env می‌خواند.
 * این مقادیر فقط در صورت عدم دسترسی به API استفاده می‌شوند.
 * 
 * برای استفاده از تنظیمات واقعی، از hook `useUploadSettings()` استفاده کنید:
 * 
 * @example
 * const { data: settings } = useUploadSettings();
 * const maxSize = settings?.MEDIA_IMAGE_SIZE_LIMIT;
 * 
 * نکته: بک‌اند همیشه validation نهایی را انجام می‌دهد و از .env می‌خواند.
 */

export type MediaType = 'image' | 'video' | 'audio' | 'document';

/**
 * محدودیت حجم فایل‌ها (بر حسب بایت)
 * ⚠️ موقتاً برای تست: همه روی 500KB
 * TODO: بعد از تست به مقادیر اصلی برگردانید
 */
export const MEDIA_SIZE_LIMITS = {
  image: 500 * 1024,        // 500KB (موقت برای تست)
  video: 500 * 1024,        // 500KB (موقت برای تست)
  audio: 500 * 1024,        // 500KB (موقت برای تست)
  document: 500 * 1024,      // 500KB (موقت برای تست)
  // مقادیر اصلی (بعد از تست برگردانید):
  // image: 5 * 1024 * 1024,        // 5MB
  // video: 150 * 1024 * 1024,      // 150MB
  // audio: 20 * 1024 * 1024,       // 20MB
  // document: 10 * 1024 * 1024,    // 10MB
} as const;

/**
 * پسوندهای مجاز برای هر نوع فایل
 * مطابق با مقادیر پیش‌فرض بک‌اند
 */
export const MEDIA_ALLOWED_EXTENSIONS = {
  image: ['jpg', 'jpeg', 'webp', 'png', 'svg', 'gif'],
  video: ['mp4', 'webm', 'mov'],
  audio: ['mp3', 'ogg'],
  document: ['pdf'],
} as const;

/**
 * تنظیمات آپلود (chunk size, timeout, etc.)
 */
export const UPLOAD_CONFIG = {
  chunkSize: 1024 * 1024,          // 1MB
  timeout: 300000,                 // 5 minutes
  maxParallelUploads: 3,           // 3 parallel uploads
  showProgress: true,
} as const;

/**
 * دریافت محدودیت حجم برای نوع خاصی از فایل
 */
export const getMediaSizeLimit = (type: MediaType): number => {
  return MEDIA_SIZE_LIMITS[type];
};

/**
 * دریافت پسوندهای مجاز برای نوع خاصی از فایل
 */
export const getMediaExtensions = (type: MediaType): readonly string[] => {
  return MEDIA_ALLOWED_EXTENSIONS[type];
};

/**
 * بررسی اینکه آیا پسوند خاصی برای نوع فایل مجاز است یا نه
 */
export const isExtensionAllowed = (extension: string, type: MediaType): boolean => {
  const ext = extension.toLowerCase().replace('.', '');
  const allowed = MEDIA_ALLOWED_EXTENSIONS[type];
  return allowed.some(allowedExt => allowedExt === ext);
};

/**
 * دریافت لیست پسوندها به صورت string برای استفاده در input accept
 */
export const getAcceptTypes = (type: MediaType): string => {
  return MEDIA_ALLOWED_EXTENSIONS[type].map(ext => `.${ext}`).join(',');
};

/**
 * همه تنظیمات media در یک object
 */
export const mediaConfig = {
  sizeLimits: MEDIA_SIZE_LIMITS,
  allowedExtensions: MEDIA_ALLOWED_EXTENSIONS,
  uploadConfig: UPLOAD_CONFIG,
  getMediaSizeLimit,
  getMediaExtensions,
  isExtensionAllowed,
  getAcceptTypes,
} as const;

