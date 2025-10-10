"use client";

import React, { useState } from 'react';
import { Button } from "@/components/elements/Button";
import { Input } from "@/components/elements/Input";
import { Label } from "@/components/elements/Label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/elements/Dialog";
import { Media } from '@/types/shared/media';
import { MediaLibraryModal } from '@/components/media/modals/MediaLibraryModal';
import { mediaService } from '@/components/media/services';
import { Image as ImageIcon, Upload as UploadIcon, X } from 'lucide-react';
import { toast } from 'sonner';

interface CoverImageManagerProps {
  currentCoverImage?: Media | number | null;
  onCoverImageChange: (coverImage: Media | number | null) => void;
  mediaType: string;
}

export function CoverImageManager({ 
  currentCoverImage, 
  onCoverImageChange,
  mediaType
}: CoverImageManagerProps) {
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [newCoverImage, setNewCoverImage] = useState<Media | null>(null);

  // Get the URL for the current cover image using the shared service
  const getCoverImageUrl = () => {
    if (!currentCoverImage) return null;
    
    // If it's a Media object, use the service to get the URL
    if (typeof currentCoverImage === 'object' && currentCoverImage !== null && 'id' in currentCoverImage) {
      return mediaService.getMediaUrlFromObject(currentCoverImage);
    }
    
    // If it's a string URL, return it directly
    if (typeof currentCoverImage === 'string') {
      return currentCoverImage;
    }
    
    // If it's a number (ID), we can't get the URL without fetching the media object
    // In a real implementation, we would fetch the media object by ID
    return null;
  };

  const handleSelectFromLibrary = (selectedMedia: Media | Media[]) => {
    const media = Array.isArray(selectedMedia) ? selectedMedia[0] : selectedMedia;
    
    // Check if selected media is an image
    if (media.media_type !== 'image') {
      toast.error('فایل انتخاب شده باید یک تصویر باشد');
      return;
    }
    
    setNewCoverImage(media);
    onCoverImageChange(media);
    setIsLibraryOpen(false);
  };

  const handleRemoveCoverImage = () => {
    setNewCoverImage(null);
    setPreviewUrl(null);
    onCoverImageChange(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      toast.error('فایل انتخاب شده باید یک تصویر باشد');
      return;
    }
    
    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم تصویر نباید بیشتر از 5 مگابایت باشد');
      return;
    }
    
    // Create preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    
    // For now, we'll just show the preview
    // In a full implementation, we would upload the file
    toast.info('برای آپلود تصویر جدید، لطفاً از کتابخانه مدیا استفاده کنید');
  };

  const coverImageUrl = previewUrl || getCoverImageUrl();

  return (
    <div className="space-y-4">
      <div>
        <Label>کاور رسانه</Label>
        <p className="text-sm text-muted-foreground mb-2">
          برای رسانه‌های {mediaType === 'video' ? 'ویدیو' : mediaType === 'audio' ? 'صوتی' : 'سند'} یک تصویر کاور انتخاب کنید
        </p>
      </div>
      
      {coverImageUrl ? (
        <div className="relative">
          <img 
            src={coverImageUrl} 
            alt="پیش‌نمایش کاور" 
            className="w-full h-40 rounded-lg object-cover border"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2 h-8 w-8 p-0"
            onClick={handleRemoveCoverImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-center w-full h-40 rounded-lg border-2 border-dashed border-muted-foreground/25">
          <ImageIcon className="h-12 w-12 text-muted-foreground" />
        </div>
      )}
      
      <div className="flex gap-2">
        <Dialog open={isLibraryOpen} onOpenChange={setIsLibraryOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex-1">
              <ImageIcon className="h-4 w-4 ml-2" />
              انتخاب از کتابخانه
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl h-[80vh] p-0">
            <DialogHeader className="sr-only">
              <DialogTitle>کتابخانه رسانه</DialogTitle>
            </DialogHeader>
            <MediaLibraryModal
              isOpen={true}
              onClose={() => setIsLibraryOpen(false)}
              onSelect={handleSelectFromLibrary}
              selectMultiple={false}
              initialFileType="image"
              showTabs={true}
              activeTab="select"
              onTabChange={() => {}}
            />
          </DialogContent>
        </Dialog>
        
        <Label htmlFor="cover-image-upload" className="flex-1">
          <Button variant="outline" className="w-full">
            <UploadIcon className="h-4 w-4 ml-2" />
            آپلود جدید
          </Button>
          <Input
            id="cover-image-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </Label>
      </div>
      
      <p className="text-xs text-muted-foreground">
        تصاویر باید JPG, PNG, WebP باشند و حجم آن‌ها نباید بیشتر از 5 مگابایت باشد.
      </p>
    </div>
  );
}