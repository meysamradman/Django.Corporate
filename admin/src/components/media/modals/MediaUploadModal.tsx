"use client";

import React, { useState, useCallback } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription,
  DialogClose
} from "@/components/elements/Dialog";
import { Button } from "@/components/elements/Button";
import { Progress } from "@/components/elements/Progress";
import { Loader2, X, Upload } from "lucide-react";
import { toast } from "@/components/elements/Sonner";
import { mediaService } from "@/components/media/services";
import { FileDropzone } from '@/components/media/upload/MediaUploadZone';
import { FileList } from '@/components/media/upload/FileList';
import { useMediaUpload } from '@/components/media/hooks/useMediaUpload';
import { Media } from '@/types/shared/media';

interface MediaUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: () => void;
  onMediaSelect?: (media: Media | Media[]) => void;
}

export function MediaUploadModal({ 
  isOpen, 
  onClose,
  onUploadComplete,
  onMediaSelect
}: MediaUploadModalProps) {
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  
  const {
    files,
    isUploading,
    uploadSettings,
    processFiles,
    updateFileMetadata,
    removeFile,
    removeCoverFile,
    uploadFiles,
    clearFiles
  } = useMediaUpload();

  const handleCoverFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>, mediaFileId: string) => {
    const selectedCoverFile = event.target.files?.[0];
    if (!selectedCoverFile) return;
    
    const fileCategory = mediaService.getFileCategory(selectedCoverFile);
    if (fileCategory !== 'image') {
      toast.error("کاور باید یک تصویر باشد");
      return;
    }

    if (selectedCoverFile.size > uploadSettings.sizeLimit.image) {
      toast.error(`حجم فایل کاور بیش از حد مجاز است (${uploadSettings.sizeLimitFormatted.image})`);
      return;
    }
    
    updateFileMetadata(mediaFileId, 'coverFile', selectedCoverFile);
  }, [uploadSettings, updateFileMetadata]);

  const handleUpload = async () => {
    setUploadProgress(0);
    
    // Simulate progress for better UX
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
        setTimeout(() => {
          onUploadComplete();
          onClose();
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
        
        {/* Header */}
        <div className="bg-muted/50 border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h3 className="text-lg font-semibold">آپلود رسانه</h3>
            </div>
            <div className="flex items-center">
              <DialogClose asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 cursor-pointer hover:bg-muted-foreground/10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="space-y-6 py-4">
          {/* File Dropzone */}
          <div className="px-6">
            <FileDropzone 
              onFilesAdded={processFiles}
              allowedTypes={uploadSettings.allowedTypes}
              disabled={isUploading}
            />
          </div>

          {/* Progress Bar */}
          {isUploading && (
            <div className="px-6 space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>در حال آپلود...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* File List */}
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
        </div>
        
        {/* Footer */}
        {files.length > 0 && (
          <div className="bg-muted/50 border-t border-border px-6 py-4">
            <div className="flex gap-3 justify-between">
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleClose} disabled={isUploading}>
                  انصراف
                </Button>
              </div>
              <Button 
                onClick={handleUpload} 
                disabled={isUploading || files.length === 0}
                className="flex gap-2"
              >
                {isUploading && <Loader2 className="animate-spin" />}
                {isUploading ? "در حال آپلود..." : `آپلود ${files.length} فایل`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 