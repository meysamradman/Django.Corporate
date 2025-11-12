"use client";

import React, { useState, useCallback, useRef } from 'react';
import { Upload } from "lucide-react";
import { cn } from '@/core/utils/cn';

interface FileDropzoneProps {
  onFilesAdded: (files: File[]) => void;
  allowedTypes: {
    image: string[];
    video: string[];
    audio: string[];
    document: string[];
  };
  disabled?: boolean;
}

export function FileDropzone({ onFilesAdded, allowedTypes, disabled = false }: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;
    
    onFilesAdded(Array.from(selectedFiles));

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onFilesAdded]);

  const handleDragEvents = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDragEnter = (e: React.DragEvent) => {
    handleDragEvents(e);
    if (!disabled) setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    handleDragEvents(e);
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    handleDragEvents(e);
    setIsDragging(false);
    
    if (disabled) return;
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      onFilesAdded(droppedFiles);
    }
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />

      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragEvents}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-all duration-200",
          disabled
            ? "cursor-not-allowed opacity-50 bg-bg/20"
            : "cursor-pointer bg-bg/30",
          isDragging && !disabled
            ? "border-primary bg-primary/10 scale-[1.02] shadow-lg" 
            : "hover:border-primary/50 hover:bg-bg/40 hover:shadow-md"
        )}
      >
        <div className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all duration-200",
          disabled 
            ? "bg-bg/50" 
            : isDragging 
            ? "bg-primary/20 scale-110" 
            : "bg-primary/10 group-hover:bg-primary/20"
        )}>
          <Upload className={cn(
            "h-8 w-8 transition-colors",
            disabled ? "text-font-s/50" : isDragging ? "text-primary" : "text-font-p"
          )} />
        </div>
        <p className={cn(
          "text-center font-medium mb-1 transition-colors",
          disabled ? "text-font-s/50" : isDragging ? "text-primary font-semibold" : "text-font-p"
        )}>
          {isDragging && !disabled
            ? "فایل‌ها را اینجا رها کنید..." 
            : disabled
            ? "در حال آپلود..."
            : "فایل‌ها را اینجا بکشید و رها کنید، یا کلیک کنید"}
        </p>
        {!disabled && !isDragging && (
          <p className="text-xs text-font-s mt-2">
            فرمت‌های پشتیبانی شده: تصویر، ویدیو، صوتی، سند
          </p>
        )}
      </div>
    </>
  );
}
