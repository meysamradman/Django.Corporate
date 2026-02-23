import { useState, useCallback, type ChangeEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/elements/Dialog";
import { Progress } from "@/components/elements/Progress";
import { Loader2, AlertCircle } from "lucide-react";
import { showError, showWarning } from "@/core/toast";
import { getAction } from '@/core/messages/ui';
import { getValidation } from '@/core/messages/validation';
import { mediaService } from "@/components/media/services";
import { FileDropzone } from '@/components/media/upload/MediaUploadZone';
import { FileList } from '@/components/media/upload/FileList';
import { useMediaUpload } from '@/components/media/hooks/useMediaUpload';
import type { Media } from '@/types/shared/media';
import { useUserPermissions } from '@/core/permissions/hooks/useUserPermissions';
import { useMediaContext } from '../MediaContext';
import { MediaUploadModalHeader } from '@/components/media/modals/upload/MediaUploadModalHeader';
import { MediaUploadNoAccess } from '@/components/media/modals/upload/MediaUploadNoAccess';
import { MediaUploadActionBar } from '@/components/media/modals/upload/MediaUploadActionBar';

interface MediaUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: () => void;
  onMediaSelect?: (_media: Media | Media[]) => void;
  context?: 'media_library' | 'portfolio' | 'blog' | 'real_estate';
  contextId?: number | string;
}

export function MediaUploadModal({
  isOpen,
  onClose,
  onUploadComplete,
  onMediaSelect: _onMediaSelect,
  context: overrideContext,
  contextId: overrideContextId
}: MediaUploadModalProps) {
  const { context, contextId } = useMediaContext(overrideContext, overrideContextId);

  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const { hasModuleAction } = useUserPermissions();
  const canUploadMedia = hasModuleAction('media', 'create');

  const {
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
  } = useMediaUpload(context, contextId);

  const isLoadingSettings = false;

  const handleCoverFileChange = useCallback((event: ChangeEvent<HTMLInputElement>, mediaFileId: string) => {
    const selectedCoverFile = event.target.files?.[0];
    if (!selectedCoverFile) return;

    const fileCategory = mediaService.getFileCategory(selectedCoverFile);
    if (fileCategory !== 'image') {
      showError(getAction('coverMustBeImage'));
      return;
    }

    if (!uploadSettings?.sizeLimit?.image || selectedCoverFile.size > uploadSettings.sizeLimit.image) {
      const maxSize = uploadSettings?.sizeLimitFormatted?.image || 'نامشخص';
      showError(getValidation('fileSizeLimit', { max: maxSize }));
      return;
    }

    updateFileMetadata(mediaFileId, 'coverFile', selectedCoverFile);
  }, [uploadSettings, updateFileMetadata]);

  const handleUpload = async () => {
    if (!canUploadMedia) {
      showError(getAction('uploadPermissionDenied'));
      return;
    }
    setUploadProgress(0);

    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10;
      });
    }, 200);

    const result = await uploadFiles();

    clearInterval(progressInterval);
    setUploadProgress(100);

    if (result.successCount === result.totalCount && result.successCount > 0) {
      clearFiles();
      setTimeout(() => {
        onUploadComplete();
        onClose();
        setUploadProgress(0);
      }, 1500);
    } else if (result.successCount > 0) {
      clearFiles();
      setTimeout(() => {
        onUploadComplete();
        setUploadProgress(0);
      }, 1500);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      onClose();
      setTimeout(() => {
        clearFiles();
        setUploadProgress(0);
      }, 300);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-0" showCloseButton={false}>
        <DialogTitle className="sr-only">آپلود رسانه</DialogTitle>
        <MediaUploadModalHeader />

        <div className="space-y-6 py-6">
          {canUploadMedia ? (
            <>
              <div className="px-6 space-y-3">
                {isLoadingSettings ? (
                  <div className="border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p className="text-sm text-font-s">در حال بارگذاری تنظیمات...</p>
                  </div>
                ) : (
                  <>
                    <FileDropzone
                      onFilesAdded={(files) => {
                        if (!canUploadMedia) {
                          showError(getAction('uploadPermissionDenied'));
                          return;
                        }
                        if (isLoadingSettings) {
                          showWarning(getAction('waitForSettingsLoad'));
                          return;
                        }
                        processFiles(files);
                      }}
                      allowedTypes={uploadSettings?.allowedTypes || { image: [], video: [], audio: [], document: [] }}
                      disabled={!canUploadMedia || isUploading || isLoadingSettings}
                    />

                    {validationErrors && validationErrors.length > 0 && (
                      <div className="bg-red-0 border border-red-1/30 p-4 space-y-2">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-5 h-5 text-red-1 shrink-0 mt-0.5" />
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium text-red-1">خطا در آپلود فایل:</p>
                            <ul className="list-disc list-inside space-y-1 text-sm text-red-1/80">
                              {validationErrors.map((error, index) => (
                                <li key={index}>{error}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {isUploading && (
                <div className="px-6 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-font-p font-medium">در حال آپلود...</span>
                    <span className="text-font-s font-semibold">{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2.5" />
                </div>
              )}

              {files.length > 0 && (
                <div className="px-6">
                  <FileList
                    files={files}
                    activeTab="upload"
                    onTabChange={() => { }}
                    onRemoveFile={removeFile}
                    onUpdateMetadata={updateFileMetadata}
                    onCoverFileChange={handleCoverFileChange}
                    onRemoveCoverFile={removeCoverFile}
                    disabled={isUploading}
                  />
                </div>
              )}
            </>
          ) : (
            <MediaUploadNoAccess />
          )}
        </div>

        {canUploadMedia && files.length > 0 && (
          <MediaUploadActionBar
            isUploading={isUploading}
            fileCount={files.length}
            onCancel={handleClose}
            onUpload={handleUpload}
          />
        )}
      </DialogContent>
    </Dialog>
  );
} 