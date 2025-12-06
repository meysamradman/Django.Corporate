/**
 * 🎯 MEDIA CONFIGURATION - تنظیمات مرکزی مدیا
 * 
 * ⚠️ IMPORTANT: این تنظیمات باید با بک‌اند Django هماهنگ باشند!
 * 
 * Backend ENV Variables:
 * - MEDIA_IMAGE_SIZE_LIMIT=5242880 (5MB)
 * - MEDIA_VIDEO_SIZE_LIMIT=157286400 (150MB)
 * - MEDIA_AUDIO_SIZE_LIMIT=20971520 (20MB)
 * - MEDIA_PDF_SIZE_LIMIT=10485760 (10MB)
 * - MEDIA_IMAGE_EXTENSIONS=jpg,jpeg,webp,png,svg,gif
 * - MEDIA_VIDEO_EXTENSIONS=mp4,webm,mov
 * - MEDIA_AUDIO_EXTENSIONS=mp3,ogg,aac,m4a
 * - MEDIA_PDF_EXTENSIONS=pdf
 * 
 * 📝 چرا در فرانت؟
 * 1. ✅ سرعت بالا - بدون نیاز به API call
 * 2. ✅ کاهش فشار روی سرور
 * 3. ✅ Validation سمت کلاینت قبل از آپلود
 * 4. ✅ تمام پاپ‌آپ‌های مدیا از یک منبع استفاده می‌کنن
 * 
 * 🔄 نحوه به‌روزرسانی:
 * اگر تنظیمات بک‌اند تغییر کرد، این فایل هم باید به‌روز بشه
 */

export type MediaType = 'image' | 'video' | 'audio' | 'document';

/**
 * 📏 محدودیت حجم فایل‌ها (به بایت)
 * این مقادیر باید دقیقاً با Django ENV هماهنگ باشند
 */
export const MEDIA_SIZE_LIMITS = {
  image: 5 * 1024 * 1024,      // 5MB
  video: 150 * 1024 * 1024,    // 150MB
  audio: 20 * 1024 * 1024,     // 20MB
  document: 10 * 1024 * 1024,  // 10MB
} as const;

/**
 * 📄 پسوندهای مجاز برای هر نوع فایل
 * این مقادیر باید دقیقاً با Django ENV هماهنگ باشند
 */
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
