"use client";

import React, { useState } from 'react';
import { Button } from "@/components/elements/Button";
import { Input } from "@/components/elements/Input";
import { Label } from "@/components/elements/Label";
import { Media } from '@/types/shared/media';
import { MediaLibraryModal } from '@/components/media/modals/MediaLibraryModal';
import { MediaImage } from "@/components/media/base/MediaImage";
import { mediaService } from '@/components/media/services';
import { Image as ImageIcon, X } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<"select" | "upload">("select");
  const [newCoverImage, setNewCoverImage] = useState<Media | null>(null);

  const getCoverImageUrl = () => {
    if (!currentCoverImage) return null;
    
    if (typeof currentCoverImage === 'object' && currentCoverImage !== null && 'id' in currentCoverImage) {
      return mediaService.getMediaUrlFromObject(currentCoverImage);
    }
    
    if (typeof currentCoverImage === 'string') {
      return currentCoverImage;
    }
    
    return null;
  };

  const handleSelectFromLibrary = (selectedMedia: Media | Media[]) => {
    const media = Array.isArray(selectedMedia) ? selectedMedia[0] : selectedMedia;
    
    if (media.media_type !== 'image') {
      toast.error('فایل انتخاب شده باید یک تصویر باشد');
      return;
    }
    
    setNewCoverImage(media);
    onCoverImageChange(media);
    setIsLibraryOpen(false);
  };

  const handleUploadComplete = () => {
    setIsLibraryOpen(true);
    setActiveTab("select");
  };

  const handleRemoveCoverImage = () => {
    setNewCoverImage(null);
    onCoverImageChange(null);
  };

  const coverImageUrl = getCoverImageUrl();

  return (
    <div className="space-y-4">
      <div>
        <Label>کاور رسانه</Label>
        <p className="text-sm text-font-s mb-2">
          برای رسانه‌های {mediaType === 'video' ? 'ویدیو' : mediaType === 'audio' ? 'صوتی' : 'سند'} یک تصویر کاور انتخاب کنید
        </p>
      </div>
      
      {coverImageUrl ? (
        <div className="relative h-40 rounded-lg overflow-hidden border">
          <MediaImage
            src={coverImageUrl}
            alt="پیش‌نمایش کاور"
            fill
            className="object-cover"
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
        <div className="flex items-center justify-center w-full h-40 rounded-lg border-2 border-dashed border-font-s/25">
          <ImageIcon className="h-12 w-12 text-font-s" />
        </div>
      )}
      
      <div>
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => setIsLibraryOpen(true)}
        >
          <ImageIcon className="h-4 w-4" />
          انتخاب از کتابخانه
        </Button>
        
        <MediaLibraryModal
          isOpen={isLibraryOpen}
          onClose={() => setIsLibraryOpen(false)}
          onSelect={handleSelectFromLibrary}
          selectMultiple={false}
          initialFileType="image"
          showTabs={true}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onUploadComplete={handleUploadComplete}
          context="media_library"
        />
      </div>
      
      <p className="text-xs text-font-s">
        تصاویر باید JPG, PNG, WebP باشند و حجم آن‌ها نباید بیشتر از 5 مگابایت باشد.
      </p>
    </div>
  );
}