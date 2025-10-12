"use client";

import { useState, useCallback } from 'react';
import { getFileCategory, validateFileAdvanced, formatBytes, mediaService } from '@/components/media/services';
import { toast } from "@/components/elements/Sonner";
import { fetchApi } from '@/core/config/fetch';

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
 */
export const useMediaUpload = () => {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  // ✅ Direct access - بدون mapping اضافی
  const uploadSettings = (() => {
    const settings = mediaService.getUploadSettings();
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
   * ✅ Process files with validation
   */
  const processFiles = useCallback((filesToProcess: File[]) => {
    const validFiles = filesToProcess.filter(file => {
      // Advanced validation
      const validation = validateFileAdvanced(file);
      
      if (!validation.isValid) {
        validation.errors.forEach(error => toast.error(error));
        return false;
      }
      
      if (validation.warnings.length > 0) {
        validation.warnings.forEach(warning => toast.warning(warning));
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
    
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

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
        formData.append('files', file.file);
        
        // Add metadata (only supported fields)
        if (file.alt_text) formData.append('alt_text', file.alt_text);
        if (file.title) formData.append('title', file.title);
        
        // Add cover image if exists (for video/audio/pdf)
        if (file.coverFile) {
            formData.append('cover_image', file.coverFile);
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
  }, [files]);

  /**
   * ✅ Clear all files
   */
  const clearFiles = useCallback(() => {
    setFiles([]);
  }, []);

  return {
    files,
    isUploading,
    uploadSettings,
    processFiles,
    updateFileMetadata,
    removeFile,
    removeCoverFile,
    uploadFiles,
    clearFiles
  };
};
