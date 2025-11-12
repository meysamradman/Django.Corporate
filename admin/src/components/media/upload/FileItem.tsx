"use client";

import React, { useRef } from 'react';
import { 
  X, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Image as ImageIcon,
  FileVideo,
  FileAudio,
  FileText,
  File,
  Plus
} from "lucide-react";
import { Button } from "@/components/elements/Button";
import { Input } from "@/components/elements/Input";
import { Label } from "@/components/elements/Label";
import { Textarea } from "@/components/elements/Textarea";
import { Switch } from "@/components/elements/Switch";
import { MediaFile } from '../hooks/useMediaUpload';
import { getFileCategory, formatBytes } from '../services';

interface FileItemProps {
  file: MediaFile;
  onRemove: (id: string) => void;
  onUpdateMetadata: (id: string, field: keyof MediaFile, value: any) => void;
  onCoverFileChange: (event: React.ChangeEvent<HTMLInputElement>, fileId: string) => void;
  onRemoveCoverFile: (id: string) => void;
  disabled?: boolean;
}

export function FileItem({ 
  file, 
  onRemove, 
  onUpdateMetadata, 
  onCoverFileChange,
  onRemoveCoverFile,
  disabled = false 
}: FileItemProps) {
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  
  const fileCategory = getFileCategory(file.file);
  const needsCover = ['video', 'audio'].includes(fileCategory);

  const getFileIcon = (file: File) => {
    const category = getFileCategory(file);
    
    switch (category) {
      case 'image': return <ImageIcon className="h-6 w-6" />;
      case 'video': return <FileVideo className="h-6 w-6" />;
      case 'audio': return <FileAudio className="h-6 w-6" />;
      case 'document': return <FileText className="h-6 w-6" />;
      default: return <File className="h-6 w-6" />;
    }
  };

  const renderFilePreview = () => {
    if (fileCategory === 'image') {
      return (
        <div className="relative w-full h-32 bg-bg rounded-md overflow-hidden">
          <img 
            src={URL.createObjectURL(file.file)} 
            alt={file.title || file.file.name}
            className="w-full h-full object-contain" 
          />
        </div>
      );
    }
    
    return (
      <div className="w-full h-32 bg-bg rounded-md flex items-center justify-center">
        {getFileIcon(file.file)}
        <span className="ml-2 text-sm">{file.file.name}</span>
      </div>
    );
  };

  const handleCoverFileSelectClick = () => {
    if (coverFileInputRef.current) {
      coverFileInputRef.current.click();
    }
  };

  return (
    <div className="border rounded-lg p-4 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        {getFileIcon(file.file)}
        <div className="flex-grow">
          <p className="text-sm font-medium truncate" title={file.file.name}>
            {file.file.name}
          </p>
          <p className="text-xs text-font-s">
            {formatBytes(file.file.size)} • {fileCategory}
          </p>
        </div>

        {file.status === 'pending' && (
          <Button 
            type="button" 
            variant="outline" 
            size="icon" 
            onClick={() => onRemove(file.id)}
            className="h-7 w-7"
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        {file.status === 'uploading' && (
          <Loader2 className="h-5 w-5 animate-spin text-font-s" />
        )}
        {file.status === 'success' && (
          <CheckCircle className="h-5 w-5 text-green-1" />
        )}
        {file.status === 'error' && (
          <AlertCircle className="h-5 w-5 text-destructive" />
        )}
      </div>

      {file.status === 'uploading' && (
        <div className="w-full bg-bg rounded-full h-1.5">
          <div 
            className="bg-primary h-1.5 rounded-full transition-all"
            style={{ width: `${file.progress}%` }}
          />
        </div>
      )}

      {file.status === 'error' && file.error && (
        <p className="text-xs text-destructive">{file.error}</p>
      )}

      {file.status !== 'success' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            {renderFilePreview()}

            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor={`title-${file.id}`}>عنوان</Label>
                <Input
                  id={`title-${file.id}`}
                  value={file.title || ''}
                  onChange={(e) => onUpdateMetadata(file.id, 'title', e.target.value)}
                  placeholder="عنوان فایل"
                  className="h-8 text-sm"
                  disabled={disabled}
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor={`altText-${file.id}`}>متن جایگزین (برای تصاویر)</Label>
                <Input
                  id={`altText-${file.id}`}
                  value={file.alt_text || ''}
                  onChange={(e) => onUpdateMetadata(file.id, 'alt_text', e.target.value)}
                  placeholder="توضیح کوتاه برای دسترسی‌پذیری"
                  className="h-8 text-sm"
                  disabled={disabled}
                />
              </div>
              

              

            </div>
          </div>

          {needsCover && (
            <div className="space-y-3">
              <input
                ref={coverFileInputRef}
                type="file"
                id={`cover-file-${file.id}`}
                className="hidden"
                accept="image/*"
                onChange={(e) => onCoverFileChange(e, file.id)}
                disabled={disabled}
              />
              
              <div>
                <Label>تصویر کاور (برای {fileCategory === 'video' ? 'ویدیو' : 'فایل صوتی'})</Label>
                
                {file.coverFile ? (
                  <div className="mt-2 relative w-full h-40 bg-bg rounded-md overflow-hidden">
                    <img 
                      src={URL.createObjectURL(file.coverFile)}
                      alt="Cover"
                      className="w-full h-full object-contain"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6"
                      onClick={() => onRemoveCoverFile(file.id)}
                      disabled={disabled}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div 
                    onClick={handleCoverFileSelectClick}
                    className="mt-2 border-2 border-dashed rounded-md h-40 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-bg/50"
                    title="انتخاب تصویر کاور"
                  >
                    <Plus className="h-6 w-6 mb-2 text-font-s" />
                    <p className="text-sm text-font-s">انتخاب تصویر کاور</p>
                    <p className="text-xs text-font-s mt-1">
                      پیشنهاد: {fileCategory === 'video' ? 'اسکرین‌شات' : 'کاور آلبوم'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
