import { useState, useCallback, type ChangeEvent } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogTitle, 
  DialogClose
} from "@/components/elements/Dialog";
import { Button } from "@/components/elements/Button";
import { Progress } from "@/components/elements/Progress";
import { Loader2, X, Upload, AlertCircle } from "lucide-react";
import { showError, showWarning } from "@/core/toast";
import { mediaService } from "@/components/media/services";
import { FileDropzone } from '@/components/media/upload/MediaUploadZone';
import { FileList } from '@/components/media/upload/FileList';
import { useMediaUpload } from '@/components/media/hooks/useMediaUpload';
import type { Media } from '@/types/shared/media';
import { useUserPermissions } from '@/components/admins/permissions/hooks/useUserPermissions';
import { useMediaContext } from '../MediaContext';

interface MediaUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: () => void;
  onMediaSelect?: (_media: Media | Media[]) => void;
  context?: 'media_library' | 'portfolio' | 'blog';
  contextId?: number | string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars

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
      showError("کاور باید یک تصویر باشد");
      return;
    }

    if (!uploadSettings?.sizeLimit?.image || selectedCoverFile.size > uploadSettings.sizeLimit.image) {
      const maxSize = uploadSettings?.sizeLimitFormatted?.image || 'نامشخص';
      showError(`حجم فایل کاور بیش از حد مجاز است (${maxSize})`);
      return;
    }
    
    updateFileMetadata(mediaFileId, 'coverFile', selectedCoverFile);
  }, [uploadSettings, updateFileMetadata]);

  const handleUpload = async () => {
    if (!canUploadMedia) {
      showError("اجازه آپلود رسانه را ندارید");
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
        
        <div className="bg-gradient-to-r from-bg/80 to-bg/50 border-b px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Upload className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-font-p">آپلود رسانه</h3>
            </div>
            <div className="flex items-center">
              <DialogClose asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 cursor-pointer hover:bg-font-s/10 transition-colors"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>
            </div>
          </div>
        </div>
        
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
                          showError("اجازه آپلود رسانه را ندارید");
                          return;
                        }
                        if (isLoadingSettings) {
                          showWarning('لطفا صبر کنید تا تنظیمات بارگذاری شود');
                          return;
                        }
                        processFiles(files);
                      }}
                      allowedTypes={uploadSettings?.allowedTypes || { image: [], video: [], audio: [], document: [] }}
                      disabled={!canUploadMedia || isUploading || isLoadingSettings}
                    />
                    
                    {validationErrors && validationErrors.length > 0 && (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 space-y-2">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium text-red-800 dark:text-red-200">خطا در آپلود فایل:</p>
                            <ul className="list-disc list-inside space-y-1 text-sm text-red-700 dark:text-red-300">
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
                    onTabChange={() => {}}
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
            <div className="px-6 py-12 text-center space-y-3">
              <p className="text-font-p font-medium text-lg">دسترسی آپلود برای شما فعال نیست</p>
              <p className="text-font-s text-sm">
                برای بارگذاری رسانه باید مجوز مدیریت رسانه‌ها را داشته باشید. برای دریافت دسترسی با مدیر سیستم تماس بگیرید.
              </p>
            </div>
          )}
        </div>
        
        {canUploadMedia && files.length > 0 && (
          <div className="bg-gradient-to-r from-bg/80 to-bg/50 border-t px-6 py-4">
            <div className="flex gap-3 justify-between">
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleClose} 
                  disabled={isUploading}
                  className="hover:bg-font-s/10"
                >
                  انصراف
                </Button>
              </div>
              <Button 
                onClick={handleUpload} 
                disabled={isUploading || files.length === 0}
                className="bg-primary hover:bg-primary/90 text-static-w gap-2 font-medium"
              >
                {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
                {!isUploading && <Upload className="h-4 w-4" />}
                {isUploading ? "در حال آپلود..." : `آپلود ${files.length} فایل`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 