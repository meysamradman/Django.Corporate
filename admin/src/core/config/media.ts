/**
 * Media Upload Configuration
 * 
 * این فایل شامل تنظیمات آپلود رسانه است که در فرانت برای validation استفاده می‌شود.
 * مقادیر اینجا hardcode شده و باید با مقادیر پیش‌فرض بک‌اند (Backend/config/django/base.py) همخوانی داشته باشد.
 * 
 * نکته مهم: این مقادیر فقط برای validation سریع در سمت کلاینت است.
 * بک‌اند همیشه validation نهایی را انجام می‌دهد و از env می‌خواند.
 */

export type MediaType = 'image' | 'video' | 'audio' | 'document';

/**
 * محدودیت حجم فایل‌ها (بر حسب بایت)
 * مطابق با مقادیر پیش‌فرض بک‌اند
 */
export const MEDIA_SIZE_LIMITS = {
  image: 5 * 1024 * 1024,        // 5MB
  video: 150 * 1024 * 1024,      // 150MB
  audio: 20 * 1024 * 1024,       // 20MB
  document: 10 * 1024 * 1024,    // 10MB
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

