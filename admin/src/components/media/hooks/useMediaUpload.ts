"use client";

import { useState, useCallback } from 'react';
import { getFileCategory, formatBytes, mediaService, useUploadSettings } from '@/components/media/services';
import { toast } from "@/components/elements/Sonner";
import { fetchApi } from '@/core/config/fetch';
import { useMediaContext } from '@/core/media/MediaContext';

export interface MediaFile {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  title?: string;
  alt_text?: string;
  description?: string;
  is_public?: boolean;
  coverFile?: File | null;
}

export interface UploadSettings {
  sizeLimit: {
    image: number;
    video: number;
    audio: number;
    document: number;
  };
  allowedTypes: {
    image: string[];
    video: string[];
    audio: string[];
    document: string[];
  };
  sizeLimitFormatted: {
    image: string;
    video: string;
    audio: string;
    document: string;
  };
}

/**
 * ✅ Custom hook for file upload management
 * اگر context و contextId پاس داده نشه، خودکار از route تشخیص می‌ده
 */
export const useMediaUpload = (overrideContext?: 'media_library' | 'portfolio' | 'blog', overrideContextId?: number | string) => {
  // اگر override نشده، از route تشخیص بده
  const { context, contextId } = useMediaContext(overrideContext, overrideContextId);
  
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  // ✅ دریافت تنظیمات از API با React Query
  const { data: apiSettings, isLoading: isLoadingSettings } = useUploadSettings();
  
  // ✅ استفاده از تنظیمات API یا fallback به پیش‌فرض
  const uploadSettings = (() => {
    const settings = apiSettings || mediaService.getUploadSettings();
    return {
      sizeLimit: {
        image: settings.MEDIA_IMAGE_SIZE_LIMIT,
        video: settings.MEDIA_VIDEO_SIZE_LIMIT,
        audio: settings.MEDIA_AUDIO_SIZE_LIMIT,
        document: settings.MEDIA_DOCUMENT_SIZE_LIMIT,
      },
      allowedTypes: {
        image: settings.MEDIA_ALLOWED_IMAGE_EXTENSIONS,
        video: settings.MEDIA_ALLOWED_VIDEO_EXTENSIONS,
        audio: settings.MEDIA_ALLOWED_AUDIO_EXTENSIONS,
        document: settings.MEDIA_ALLOWED_PDF_EXTENSIONS,
      },
      sizeLimitFormatted: {
        image: formatBytes(settings.MEDIA_IMAGE_SIZE_LIMIT),
        video: formatBytes(settings.MEDIA_VIDEO_SIZE_LIMIT),
        audio: formatBytes(settings.MEDIA_AUDIO_SIZE_LIMIT),
        document: formatBytes(settings.MEDIA_DOCUMENT_SIZE_LIMIT),
      }
    };
  })();

  /**
   * ✅ Process files with validation (using API settings)
   */
  const processFiles = useCallback((filesToProcess: File[]) => {
    // ✅ پاک کردن خطاهای قبلی
    setValidationErrors([]);
    
    // ✅ اگر تنظیمات هنوز load نشده، صبر کن
    if (isLoadingSettings) {
      setValidationErrors(['در حال بارگذاری تنظیمات... لطفا صبر کنید']);
      return;
    }
    
    
    const errors: string[] = [];
    const validFiles = filesToProcess.filter(file => {
      // ✅ Validation using API settings (uploadSettings)
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const category = getFileCategory(file);
      
      // ✅ بررسی اینکه تنظیمات موجود است
      if (!uploadSettings || !uploadSettings.allowedTypes || !uploadSettings.sizeLimit) {
        errors.push('خطا در دریافت تنظیمات آپلود. لطفا صفحه را رفرش کنید');
        return false;
      }
      
      // Check extension - خطا را در state ذخیره کن
      const allowedExts = uploadSettings.allowedTypes[category] || [];
      if (!ext || !allowedExts.includes(ext)) {
        errors.push(`فایل "${file.name}": پسوند "${ext}" برای نوع "${category}" مجاز نیست. پسوندهای مجاز: ${allowedExts.join(', ')}`);
        return false;
      }
      
      // Check file size - خطا را در state ذخیره کن
      const maxSize = uploadSettings.sizeLimit[category];
      if (!maxSize) {
        errors.push(`فایل "${file.name}": تنظیمات حجم فایل برای نوع "${category}" یافت نشد`);
        return false;
      }
      
      if (file.size > maxSize) {
        const maxSizeFormatted = uploadSettings.sizeLimitFormatted?.[category] || formatBytes(maxSize);
        const fileSizeFormatted = formatBytes(file.size);
        errors.push(`فایل "${file.name}": حجم فایل (${fileSizeFormatted}) از حد مجاز (${maxSizeFormatted}) بیشتر است`);
        return false;
      }
      
      // Basic validations - بدون toast (سریع‌تر)
      if (!file.name || file.name.trim() === '') {
        return false;
      }
      
      const dangerousChars = /[<>:"/\\|?*\x00-\x1f]/;
      if (dangerousChars.test(file.name)) {
        return false;
      }
      
      if (file.name.length > 255) {
        return false;
      }
      
      if (file.size === 0) {
        return false;
      }
      
      
      return true;
    });
    
    const newFiles = validFiles.map(file => ({
      file,
      id: crypto.randomUUID(),
      progress: 0,
      status: 'pending' as const,
      title: file.name.split('.')[0], // Default title from filename
      alt_text: '',
      description: '',
      is_public: true,
      coverFile: null
    }));
    
    // ✅ نمایش خطاها در popup
    if (errors.length > 0) {
      setValidationErrors(errors);
    }
    
    
    setFiles(prev => [...prev, ...newFiles]);
  }, [uploadSettings, isLoadingSettings]);

  /**
   * ✅ Update file metadata
   */
  const updateFileMetadata = useCallback((id: string, field: keyof MediaFile, value: string | boolean | File | null) => {
    setFiles(prev => prev.map(file => 
      file.id === id ? { ...file, [field]: value } : file
    ));
  }, []);

  /**
   * ✅ Remove file
   */
  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id));
  }, []);

  /**
   * ✅ Remove cover file
   */
  const removeCoverFile = useCallback((id: string) => {
    setFiles(prev => prev.map(file => 
      file.id === id ? { ...file, coverFile: null } : file
    ));
  }, []);

  /**
   * ✅ Upload files
   */
  const uploadFiles = useCallback(async (): Promise<{ successCount: number; totalCount: number }> => {
    if (files.length === 0) {
      toast.error("لطفا فایل‌ها را انتخاب کنید");
      return { successCount: 0, totalCount: 0 };
    }

    setIsUploading(true);
    let successCount = 0;

    // Process files sequentially to avoid overwhelming the server
    for (const file of files) {
      if (file.status === 'success') {
        successCount++;
        continue; // Skip already uploaded files
      }

      // Update status to uploading
      setFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, status: 'uploading', progress: 0 } : f
      ));

      try {
        // Create form data
        const formData = new FormData();
        formData.append('file', file.file);
        
        // Add metadata (only supported fields)
        if (file.alt_text) formData.append('alt_text', file.alt_text);
        if (file.title) formData.append('title', file.title);
        
        // Add cover image if exists (for video/audio/pdf)
        if (file.coverFile) {
            formData.append('cover_image', file.coverFile);
        }
        
        // Add context for context-aware permission checking
        if (context && context !== 'media_library') {
          formData.append('context_type', context);
          // Determine action: if contextId exists, it's update, otherwise create
          const contextAction = contextId ? 'update' : 'create';
          formData.append('context_action', contextAction);
        }

        // ✅ Simple upload - بدون simulation
        await fetchApi.post('/admin/media/', formData);

        // Mark as success
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'success', progress: 100 } : f
        ));
        
        successCount++;
      } catch (error) {
        // Error uploading file handled by toast
        
        // Mark as error
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { 
            ...f, 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Upload failed' 
          } : f
        ));
      }
    }

    setIsUploading(false);
    
    if (successCount > 0) {
      toast.success(`${successCount} فایل با موفقیت آپلود شد`);
    }

    return { successCount, totalCount: files.length };
  }, [files, context, contextId]);

  /**
   * ✅ Clear all files
   */
  const clearFiles = useCallback(() => {
    setFiles([]);
    setValidationErrors([]);
  }, []);

  return {
    files,
    isUploading,
    uploadSettings,
    isLoadingSettings, // ✅ برای نمایش loading state در UI
    validationErrors, // ✅ خطاهای validation برای نمایش در popup
    processFiles,
    updateFileMetadata,
    removeFile,
    removeCoverFile,
    uploadFiles,
    clearFiles
  };
};
