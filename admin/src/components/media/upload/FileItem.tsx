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
import { TruncatedText } from "@/components/elements/TruncatedText";
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
      case 'image': return <ImageIcon className="h-5 w-5" />;
      case 'video': return <FileVideo className="h-5 w-5" />;
      case 'audio': return <FileAudio className="h-5 w-5" />;
      case 'document': return <FileText className="h-5 w-5" />;
      default: return <File className="h-5 w-5" />;
    }
  };

  const getCategoryLabel = (category: string): string => {
    switch (category) {
      case 'image': return 'تصویر';
      case 'video': return 'ویدیو';
      case 'audio': return 'صوتی';
      case 'document': return 'سند';
      default: return category;
    }
  };

  const renderFilePreview = () => {
    if (fileCategory === 'image') {
      return (
        <img 
          src={URL.createObjectURL(file.file)} 
          alt={file.title || file.file.name}
          className="w-full h-full object-contain" 
        />
      );
    }
    
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-lg bg-bg flex items-center justify-center mb-3 text-font-p">
          {getFileIcon(file.file)}
        </div>
        <TruncatedText 
          text={file.file.name}
          maxLength={35}
          className="text-sm text-font-s text-center"
          showTooltip={true}
        />
      </div>
    );
  };

  const handleCoverFileSelectClick = () => {
    if (coverFileInputRef.current) {
      coverFileInputRef.current.click();
    }
  };

  return (
    <div className="border rounded-xl p-5 bg-card hover:shadow-lg transition-all duration-200 flex flex-col gap-5">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-primary border border-primary/20">
            {getFileIcon(file.file)}
          </div>
        </div>
        <div className="flex-grow min-w-0">
          <div className="mb-2">
            <TruncatedText 
              text={file.file.name}
              maxLength={45}
              className="text-sm font-semibold text-font-p"
              showTooltip={true}
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-font-s">
            <span className="px-2.5 py-1 bg-bg rounded-md font-medium">{formatBytes(file.file.size)}</span>
            <span className="px-2.5 py-1 bg-bg rounded-md font-medium">{getCategoryLabel(fileCategory)}</span>
          </div>
        </div>

        <div className="flex-shrink-0">
          {file.status === 'pending' && (
            <Button 
              type="button" 
              variant="outline" 
              size="icon" 
              onClick={() => onRemove(file.id)}
              className="h-8 w-8 hover:bg-destructive/10 hover:border-destructive hover:text-destructive transition-colors"
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          {file.status === 'uploading' && (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          )}
          {file.status === 'success' && (
            <CheckCircle className="h-5 w-5 text-green-1" />
          )}
          {file.status === 'error' && (
            <AlertCircle className="h-5 w-5 text-destructive" />
          )}
        </div>
      </div>

      {file.status === 'uploading' && (
        <div className="w-full bg-bg rounded-full h-2 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full transition-all duration-300"
            style={{ width: `${file.progress}%` }}
          />
        </div>
      )}

      {file.status === 'error' && file.error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-xs text-destructive flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{file.error}</span>
          </p>
        </div>
      )}

      {file.status !== 'success' && (
        <div className="space-y-5">
          {!needsCover ? (
            <>
              <div className="relative w-full h-64 bg-bg/30 rounded-lg overflow-hidden border shadow-sm">
                {renderFilePreview()}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={`title-${file.id}`} className="text-sm font-medium text-font-p">
                    عنوان
                  </Label>
                  <Input
                    id={`title-${file.id}`}
                    value={file.title || ''}
                    onChange={(e) => onUpdateMetadata(file.id, 'title', e.target.value)}
                    placeholder="عنوان فایل"
                    className="h-9 text-sm"
                    disabled={disabled}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`altText-${file.id}`} className="text-sm font-medium text-font-p">
                    متن جایگزین (برای تصاویر)
                  </Label>
                  <Input
                    id={`altText-${file.id}`}
                    value={file.alt_text || ''}
                    onChange={(e) => onUpdateMetadata(file.id, 'alt_text', e.target.value)}
                    placeholder="توضیح کوتاه برای دسترسی‌پذیری"
                    className="h-9 text-sm"
                    disabled={disabled}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative w-full h-48 bg-bg/30 rounded-lg overflow-hidden border shadow-sm">
                  {renderFilePreview()}
                </div>

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
                  
                  {file.coverFile ? (
                    <div className="relative w-full h-48 bg-bg/30 rounded-lg overflow-hidden border shadow-sm group">
                      <img 
                        src={URL.createObjectURL(file.coverFile)}
                        alt="کاور"
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        onClick={() => onRemoveCoverFile(file.id)}
                        disabled={disabled}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div 
                      onClick={handleCoverFileSelectClick}
                      className="border-2 border-dashed rounded-lg h-48 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-gradient-to-br hover:from-primary/5 hover:to-transparent transition-all duration-200 group"
                    >
                      <div className="w-16 h-16 rounded-full bg-bg flex items-center justify-center mb-3 group-hover:bg-primary/10 group-hover:scale-110 transition-all duration-200">
                        <Plus className="h-8 w-8 text-font-s group-hover:text-primary transition-colors" />
                      </div>
                      <p className="text-sm font-medium text-font-p">
                        تصویر کاور ({fileCategory === 'video' ? 'ویدیو' : 'فایل صوتی'})
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={`title-${file.id}`} className="text-sm font-medium text-font-p">
                    عنوان
                  </Label>
                  <Input
                    id={`title-${file.id}`}
                    value={file.title || ''}
                    onChange={(e) => onUpdateMetadata(file.id, 'title', e.target.value)}
                    placeholder="عنوان فایل"
                    className="h-9 text-sm"
                    disabled={disabled}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`altText-${file.id}`} className="text-sm font-medium text-font-p">
                    متن جایگزین (برای تصاویر)
                  </Label>
                  <Input
                    id={`altText-${file.id}`}
                    value={file.alt_text || ''}
                    onChange={(e) => onUpdateMetadata(file.id, 'alt_text', e.target.value)}
                    placeholder="توضیح کوتاه برای دسترسی‌پذیری"
                    className="h-9 text-sm"
                    disabled={disabled}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
