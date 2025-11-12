"use client";

import React, { useState } from "react";
import { Button } from "@/components/elements/Button";
import { Media } from "@/types/shared/media";
import { MediaLibraryModal } from "@/components/media/modals/MediaLibraryModal";
import { MediaThumbnail } from "@/components/media/base/MediaThumbnail";
import { 
  Plus, 
  X, 
  Play, 
  Music, 
  Image as ImageIcon, 
  Video as VideoIcon,
  FileText as PDFIcon,
  Upload
} from "lucide-react";

interface PortfolioMediaGalleryProps {
  mediaItems: Media[];
  onMediaSelect: (selectedMedia: Media[]) => void;
  mediaType: "image" | "video" | "audio" | "pdf";
  title: string;
  maxSelection?: number;
  isGallery?: boolean; // New prop to distinguish between single item with cover vs gallery
  disabled?: boolean;
}

export function PortfolioMediaGallery({
  mediaItems,
  onMediaSelect,
  mediaType,
  title,
  maxSelection,
  isGallery = false, // By default, it's not a gallery (single item with cover)
  disabled = false,
}: PortfolioMediaGalleryProps) {
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [activeTab, setActiveTab] = useState<"select" | "upload">("select");

  const handleMediaSelect = (selectedMedia: Media | Media[]) => {
    const newMedia = Array.isArray(selectedMedia) ? selectedMedia : [selectedMedia];
    
    // Filter by media type to ensure only correct media types are added
    const filteredMedia = newMedia.filter(media => {
      if (mediaType === "pdf") {
        return media.media_type === "document" || media.media_type === "pdf";
      }
      return media.media_type === mediaType;
    });
    
    // Apply max selection limit if specified
    const finalMedia = maxSelection 
      ? [...mediaItems, ...filteredMedia].slice(0, maxSelection)
      : [...mediaItems, ...filteredMedia];
    
    onMediaSelect(finalMedia);
    setShowMediaLibrary(false);
  };

  const handleRemoveMedia = (index: number) => {
    const newMedia = [...mediaItems];
    newMedia.splice(index, 1);
    onMediaSelect(newMedia);
  };

  const handleUploadComplete = () => {
    // After upload, switch to select tab to show newly uploaded media
    setShowMediaLibrary(true);
    setActiveTab("select");
  };

  const getIconForMediaType = () => {
    switch (mediaType) {
      case "image": return <ImageIcon className="w-5 h-5" />;
      case "video": return <VideoIcon className="w-5 h-5" />;
      case "audio": return <Music className="w-5 h-5" />;
      case "pdf": return <PDFIcon className="w-5 h-5" />;
      default: return <ImageIcon className="w-5 h-5" />;
    }
  };

  // For single items with cover (video, audio, pdf), we show a cover image selector
  if (!isGallery && mediaType !== "image" && mediaItems.length > 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium flex items-center gap-2">
            {getIconForMediaType()}
            {title}
          </h3>
          {!disabled && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleRemoveMedia(0)}
            >
              <X />
              حذف
            </Button>
          )}
        </div>
        
        <div className="space-y-4">
          {/* Main media item */}
          <div className="flex items-center gap-3 p-3 border rounded-lg">
            <div className="flex-shrink-0 w-10 h-10 bg-blue rounded-full flex items-center justify-center">
              {mediaType === "video" && <Play className="w-5 h-5 text-blue-2" />}
              {mediaType === "audio" && <Music className="w-5 h-5 text-blue-2" />}
              {mediaType === "pdf" && <PDFIcon className="w-5 h-5 text-orange-2" />}
            </div>
            <div className="flex-grow min-w-0">
              <p className="font-medium truncate">{mediaItems[0].title || mediaItems[0].original_file_name}</p>
              <p className="text-sm text-font-s">
                {mediaItems[0].file_size ? `${(mediaItems[0].file_size / 1024 / 1024).toFixed(2)} MB` : ''}
              </p>
            </div>
          </div>
          
          {/* Cover image selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">تصویر کاور</label>
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24 border rounded-lg overflow-hidden">
                {mediaItems[0].cover_image ? (
                  <MediaThumbnail
                    media={
                      typeof mediaItems[0].cover_image === 'object' 
                        ? mediaItems[0].cover_image 
                        : mediaItems[0]
                    }
                    alt="کاور"
                    className="object-cover"
                    fill
                  />
                ) : (
                  <div className="w-full h-full bg-bg flex items-center justify-center rounded-lg">
                    <span className="font-medium text-sm">COVER</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowMediaLibrary(true)}
                  className="flex gap-2"
                >
                  <Upload className="h-4 w-4" />
                  انتخاب کاور
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Media Library Modal for cover image */}
        <MediaLibraryModal
          isOpen={showMediaLibrary}
          onClose={() => setShowMediaLibrary(false)}
          onSelect={(selectedMedia) => {
            const coverMedia = Array.isArray(selectedMedia) ? selectedMedia[0] : selectedMedia;
            if (coverMedia) {
              // Update the cover image of the main media item
              const updatedMedia = [...mediaItems];
              updatedMedia[0] = {
                ...updatedMedia[0],
                cover_image: coverMedia
              };
              onMediaSelect(updatedMedia);
            }
            setShowMediaLibrary(false);
          }}
          selectMultiple={false}
          initialFileType="image"
          showTabs={true}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onUploadComplete={handleUploadComplete}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium flex items-center gap-2">
          {getIconForMediaType()}
          {title}
        </h3>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowMediaLibrary(true)}
          disabled={disabled || (maxSelection ? mediaItems.length >= maxSelection : false)}
        >
          <Plus />
          افزودن
        </Button>
      </div>
      
      {mediaItems.length > 0 ? (
        <div className={
          mediaType === "image" 
            ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4" 
            : mediaType === "video"
              ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
              : "space-y-3"
        }>
          {mediaItems.map((media, index) => (
            mediaType === "audio" ? (
              // Audio items as list
              <div key={`audio-item-${media.media_type}-${media.id}`} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="flex-shrink-0 w-10 h-10 bg-blue rounded-full flex items-center justify-center">
                  <Music className="w-5 h-5 text-blue-2" />
                </div>
                <div className="flex-grow min-w-0">
                  <p className="font-medium truncate">{media.title || media.original_file_name}</p>
                  <p className="text-sm text-font-s">
                    {media.file_size ? `${(media.file_size / 1024 / 1024).toFixed(2)} MB` : ''}
                  </p>
                </div>
                {!disabled && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveMedia(index)}
                  >
                    <X />
                  </Button>
                )}
              </div>
            ) : mediaType === "pdf" ? (
              // PDF items as list
              <div key={`pdf-item-${media.media_type}-${media.id}`} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="flex-shrink-0 w-10 h-10 bg-orange rounded-full flex items-center justify-center">
                  <PDFIcon className="w-5 h-5 text-orange-2" />
                </div>
                <div className="flex-grow min-w-0">
                  <p className="font-medium truncate">{media.title || media.original_file_name}</p>
                  <p className="text-sm text-font-s">
                    {media.file_size ? `${(media.file_size / 1024 / 1024).toFixed(2)} MB` : ''}
                  </p>
                </div>
                {!disabled && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveMedia(index)}
                  >
                    <X />
                  </Button>
                )}
              </div>
            ) : (
              // Image/Video items as grid
              <div key={`media-item-${media.media_type}-${media.id}`} className="relative group">
                <MediaThumbnail
                  media={media}
                  alt={`${title} ${index + 1}`}
                  className={mediaType === "video" ? "aspect-video object-cover rounded-lg" : "aspect-square object-cover rounded-lg"}
                />
                {mediaType === "video" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-static-b/30 rounded-lg">
                    <Play className="w-8 h-8 text-static-w" />
                  </div>
                )}
                {!disabled && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemoveMedia(index)}
                  >
                    <X />
                  </Button>
                )}
              </div>
            )
          ))}
        </div>
      ) : (
        <div className="border-2 border-dashed rounded-lg p-8 text-center">
          {mediaType === "image" && <ImageIcon className="mx-auto h-12 w-12 text-font-s" />}
          {mediaType === "video" && <VideoIcon className="mx-auto h-12 w-12 text-font-s" />}
          {mediaType === "audio" && <Music className="mx-auto h-12 w-12 text-font-s" />}
          {mediaType === "pdf" && <PDFIcon className="mx-auto h-12 w-12 text-font-s" />}
          <p className="mt-2 text-sm text-font-s">
            هیچ {mediaType === "audio" ? "فایل صوتی" : mediaType === "video" ? "ویدئو" : mediaType === "pdf" ? "فایل PDF" : "تصویر"} انتخاب نشده است
          </p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => setShowMediaLibrary(true)}
            disabled={disabled}
          >
            انتخاب {mediaType === "audio" ? "فایل صوتی" : mediaType === "video" ? "ویدئو" : mediaType === "pdf" ? "فایل PDF" : "تصویر"}
          </Button>
        </div>
      )}

      {/* Media Library Modal */}
      <MediaLibraryModal
        isOpen={showMediaLibrary}
        onClose={() => setShowMediaLibrary(false)}
        onSelect={handleMediaSelect}
        selectMultiple={true}
        initialFileType={mediaType === "pdf" ? "pdf" : mediaType}
        showTabs={true}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onUploadComplete={handleUploadComplete}
      />
    </div>
  );
}