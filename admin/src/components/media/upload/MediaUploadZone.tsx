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
          "border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center transition-colors",
          disabled
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer",
          isDragging && !disabled
            ? "border-primary bg-primary/5" 
            : "border-border hover:border-primary/50 hover:bg-muted/50"
        )}
      >
        <Upload className={cn(
          "h-10 w-10 mb-4",
          disabled ? "text-muted-foreground/50" : "text-muted-foreground"
        )} />
        <p className={cn(
          "text-center mb-1",
          disabled ? "text-muted-foreground/50" : "text-muted-foreground"
        )}>
          {isDragging && !disabled
            ? "فایل‌ها را اینجا رها کنید..." 
            : disabled
            ? "در حال آپلود..."
            : "فایل‌ها را اینجا بکشید و رها کنید، یا کلیک کنید"}
        </p>

      </div>
    </>
  );
}
