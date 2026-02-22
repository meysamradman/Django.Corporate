import { useState, useCallback } from 'react';
import { showError, showSuccess } from "@/core/toast";
import { msg } from '@/core/messages';
import { api } from '@/core/config/api';
import { useMediaContext } from '../MediaContext';
import { createUploadSettings } from './upload/uploadSettings';
import { validateAndPrepareFiles } from './upload/fileValidation';
import type { MediaFile } from './upload/types';
export type { MediaFile, UploadSettings } from './upload/types';

export const useMediaUpload = (overrideContext?: 'media_library' | 'portfolio' | 'blog' | 'real_estate', overrideContextId?: number | string) => {
  const { context, contextId } = useMediaContext(overrideContext, overrideContextId);

  const [files, setFiles] = useState<MediaFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const uploadSettings = createUploadSettings();

  const processFiles = useCallback((filesToProcess: File[]) => {
    setValidationErrors([]);

    const { errors, newFiles } = validateAndPrepareFiles(filesToProcess, uploadSettings);

    if (errors.length > 0) {
      setValidationErrors(errors);
    }

    setFiles(prev => [...prev, ...newFiles]);
  }, [uploadSettings]);

  const updateFileMetadata = useCallback((id: string, field: keyof MediaFile, value: string | boolean | File | null) => {
    setFiles(prev => prev.map(file =>
      file.id === id ? { ...file, [field]: value } as MediaFile : file
    ));
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id));
  }, []);

  const removeCoverFile = useCallback((id: string) => {
    setFiles(prev => prev.map(file =>
      file.id === id ? { ...file, coverFile: null } as MediaFile : file
    ));
  }, []);

  const uploadFiles = useCallback(async (): Promise<{ successCount: number; totalCount: number }> => {
    if (files.length === 0) {
      showError(msg.action('selectFilesFirst'));
      return { successCount: 0, totalCount: 0 };
    }

    setIsUploading(true);
    let successCount = 0;

    for (const file of files) {
      if (file.status === 'success') {
        successCount++;
        continue;
      }

      setFiles(prev => prev.map(f =>
        f.id === file.id ? { ...f, status: 'uploading', progress: 0 } as MediaFile : f
      ));

      try {
        const formData = new FormData();
        formData.append('file', file.file);
        if (file.alt_text) formData.append('alt_text', file.alt_text);
        if (file.title) formData.append('title', file.title);
        if (file.coverFile) formData.append('cover_image', file.coverFile);

        if (context && context !== 'media_library') {
          formData.append('context_type', context);
          const contextAction = contextId ? 'update' : 'create';
          formData.append('context_action', contextAction);
        }

        await api.upload('/admin/media/', formData);

        setFiles(prev => prev.map(f =>
          f.id === file.id ? { ...f, status: 'success', progress: 100 } as MediaFile : f
        ));

        successCount++;
      } catch (error: any) {
        setFiles(prev => prev.map(f =>
          f.id === file.id ? {
            ...f,
            status: 'error',
            error: error instanceof Error ? error.message : 'Upload failed'
          } as MediaFile : f
        ));
      }
    }

    setIsUploading(true); // Keep UI in upload state briefly
    setIsUploading(false);

    if (successCount > 0) {
      showSuccess(msg.action('filesUploadedCount', { count: successCount }));
    }

    return { successCount, totalCount: files.length };
  }, [files, context, contextId]);

  const clearFiles = useCallback(() => {
    setFiles([]);
    setValidationErrors([]);
  }, []);

  return {
    files,
    isUploading,
    uploadSettings,
    validationErrors,
    processFiles,
    updateFileMetadata,
    removeFile,
    removeCoverFile,
    uploadFiles,
    clearFiles
  };
};
