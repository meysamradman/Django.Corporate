import { formatBytes, getFileCategory } from '@/components/media/services';
import type { MediaFile, UploadCategory, UploadSettings } from './types';

interface ValidationResult {
  errors: string[];
  newFiles: MediaFile[];
}

export function validateAndPrepareFiles(filesToProcess: File[], uploadSettings: UploadSettings): ValidationResult {
  const errors: string[] = [];

  const validFiles = filesToProcess.filter(file => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const category = getFileCategory(file) as UploadCategory;

    const allowedExts = uploadSettings.allowedTypes[category] || [];
    if (!ext || !allowedExts.includes(ext)) {
      errors.push(`فایل "${file.name}": پسوند "${ext}" برای نوع "${category}" مجاز نیست. پسوندهای مجاز: ${allowedExts.join(', ')}`);
      return false;
    }

    const maxSize = uploadSettings.sizeLimit[category];
    if (!maxSize) {
      errors.push(`فایل "${file.name}": تنظیمات حجم فایل برای نوع "${category}" یافت نشد`);
      return false;
    }

    if (file.size > maxSize) {
      const maxSizeFormatted = uploadSettings.sizeLimitFormatted[category] || formatBytes(maxSize);
      const fileSizeFormatted = formatBytes(file.size);
      errors.push(`فایل "${file.name}": حجم فایل (${fileSizeFormatted}) از حد مجاز (${maxSizeFormatted}) بیشتر است`);
      return false;
    }

    if (!file.name || file.name.trim() === '') return false;
    const dangerousChars = /[<>:"/\\|?*\x00-\x1f]/;
    if (dangerousChars.test(file.name)) return false;
    if (file.name.length > 255) return false;
    if (file.size === 0) return false;

    return true;
  });

  const newFiles: MediaFile[] = validFiles.map(file => ({
    file,
    id: crypto.randomUUID(),
    progress: 0,
    status: 'pending',
    title: file.name.split('.')[0],
    alt_text: '',
    description: '',
    is_public: true,
    coverFile: null
  }));

  return { errors, newFiles };
}