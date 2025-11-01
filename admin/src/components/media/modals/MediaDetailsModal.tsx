"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/elements/Dialog";
import { Button } from "@/components/elements/Button";
import { Input } from "@/components/elements/Input";
import { Label } from "@/components/elements/Label";
import { Textarea } from "@/components/elements/Textarea";
import { X, Download, Edit3, FileText, Play, FileAudio, Save, ImageOff } from 'lucide-react';
import { Media } from '@/types/shared/media';
import { MediaPlayer } from '@/components/media/base/MediaPlayer';
import { MediaThumbnail } from '@/components/media/base/MediaThumbnail';
import { mediaService } from '@/components/media/services';
import { mediaApi } from '@/api/media/route';
import { toast } from 'sonner';
import { CoverImageManager } from '@/components/media/modals/CoverImageManager';
import { TruncatedText } from '@/components/elements/TruncatedText';

interface MediaDetailsModalProps {
  media: Media | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (media: Media) => void;
  showEditButton?: boolean;
  onMediaUpdated?: (updatedMedia: Media) => void;
}

export function MediaDetailsModal({
  media,
  isOpen,
  onClose,
  onEdit,
  showEditButton = true,
  onMediaUpdated,
}: MediaDetailsModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedMedia, setEditedMedia] = useState<Media | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newCoverImage, setNewCoverImage] = useState<Media | number | null>(null);

  // Reset editing state when media changes
  React.useEffect(() => {
    if (media) {
      setEditedMedia({ ...media });
      setIsEditing(false);
      setNewCoverImage(media.cover_image || null);
    }
  }, [media]);

  if (!media) return null;

  const handleDownload = () => {
    setIsDownloading(true);
    // Create a temporary link to trigger download
    const link = document.createElement('a');
    link.href = mediaService.getMediaUrlFromObject(media);
    link.download = media.original_file_name || media.file_name || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsDownloading(false);
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(media);
    }
  };

  const handleStartEdit = () => {
    setEditedMedia({ ...media });
    setIsEditing(true);
    setNewCoverImage(media.cover_image || null);
  };

  const handleCancelEdit = () => {
    setEditedMedia({ ...media });
    setIsEditing(false);
    setNewCoverImage(media.cover_image || null);
  };

  const handleSaveEdit = async () => {
    if (!editedMedia) return;

    setIsSaving(true);
    
    try {
      // Prepare update data
      const updateData: any = {
        title: editedMedia.title || '',
        alt_text: editedMedia.alt_text || '',
      };

      let updatedMediaData = { ...editedMedia };

      // Handle cover image changes
      if (newCoverImage !== media.cover_image) {
        // Use the dedicated updateCoverImage function
        if (newCoverImage === null) {
          // Remove cover image
          const response = await mediaApi.updateCoverImage(media.id, null);
          if (response.metaData.status === 'success' && response.data) {
            updatedMediaData = { ...updatedMediaData, ...response.data };
          }
        } else if (typeof newCoverImage === 'object' && 'id' in newCoverImage) {
          // Set cover image to an existing media
          const response = await mediaApi.updateCoverImage(media.id, newCoverImage.id);
          if (response.metaData.status === 'success' && response.data) {
            updatedMediaData = { ...updatedMediaData, ...response.data };
          }
        } else if (typeof newCoverImage === 'number') {
          // Set cover image by ID
          const response = await mediaApi.updateCoverImage(media.id, newCoverImage);
          if (response.metaData.status === 'success' && response.data) {
            updatedMediaData = { ...updatedMediaData, ...response.data };
          }
        }
      }

      // Update other fields
      const response = await mediaApi.updateMedia(media.id, updateData);
      
      if (response.metaData.status === 'success' && response.data) {
        toast.success('تغییرات با موفقیت ذخیره شد');
        setIsEditing(false);
        setNewCoverImage(null); // Reset newCoverImage after saving
        
        // Use the updated media data from the API responses
        const finalUpdatedMedia = { ...updatedMediaData, ...response.data };
        setEditedMedia(finalUpdatedMedia);
        
        // Notify parent component of update
        if (onMediaUpdated) {
          onMediaUpdated(finalUpdatedMedia);
        }
      } else {
        toast.error(response.metaData.message || 'خطا در ذخیره تغییرات');
      }
    } catch (error) {
      toast.error('خطا در ذخیره تغییرات');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCoverImageChange = (coverImage: Media | number | null) => {
    setNewCoverImage(coverImage);
  };

  const renderMediaContent = () => {
    // For videos and audio, use MediaPlayer
    if (media.media_type === 'video' || media.media_type === 'audio') {
      return (
        <MediaPlayer
          media={media}
          className="w-full h-full"
          controls={true}
          showControls={true}
        />
      );
    }
    
    // For images and other media types, use MediaThumbnail
    return (
      <MediaThumbnail
        media={media}
        alt={media.alt_text || media.title || 'تصویر رسانه'}
        fill
        className="object-contain"
        sizes="300px"
        showIcon={true}
      />
    );
  };

  const renderCoverImageSection = () => {
    const coverImage = isEditing ? newCoverImage : media.cover_image;
    
    // Function to extract URL from cover image using the shared service
    const getCoverImageUrl = (): string | null => {
      // For editing mode, use the new cover image
      if (isEditing) {
        if (!newCoverImage) return null;
        
        // If it's a Media object
        if (typeof newCoverImage === 'object' && newCoverImage !== null && 'id' in newCoverImage) {
          return mediaService.getMediaUrlFromObject(newCoverImage);
        }
        
        // If it's an ID, we need to find the media object
        // This should ideally be handled by fetching the media object
        return null;
      }
      
      // For view mode, use the media's cover image
      return mediaService.getMediaCoverUrl(media);
    };

    const coverImageUrl = getCoverImageUrl();
    const hasCoverImage = !!coverImageUrl && coverImageUrl.length > 0;
    
    return (
      <div>
        <h3 className="font-semibold text-lg mb-2">کاور رسانه</h3>
        
        {isEditing ? (
          <CoverImageManager
            currentCoverImage={newCoverImage}
            onCoverImageChange={handleCoverImageChange}
            mediaType={media.media_type}
          />
        ) : hasCoverImage ? (
          <div className="w-full h-32 rounded-lg overflow-hidden">
            <img 
              src={coverImageUrl} 
              alt={media.alt_text || media.title || 'کاور رسانه'} 
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-32 rounded-lg bg-muted">
            <ImageOff className="h-8 w-8 text-muted-foreground mb-2" />
            <span className="text-muted-foreground">
              {media.media_type === 'video' ? 'بدون کاور ویدیو' : 
               media.media_type === 'audio' ? 'بدون کاور صوتی' : 'بدون کاور'}
            </span>
          </div>
        )}
      </div>
    );
  };

  const getFileTypeIcon = () => {
    switch (media.media_type) {
      case 'video':
        return <Play className="h-4 w-4" />;
      case 'audio':
        return <FileAudio className="h-4 w-4" />;
      case 'pdf':
      case 'document':
        return <FileText className="h-4 w-4" />;
      default:
        return null;
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[90vw] sm:w-[80vw] md:w-[70vw] lg:w-[1000px] max-h-[90vh] overflow-y-auto p-0" showCloseButton={false} aria-describedby="media-details-description">
        <DialogTitle className="sr-only">جزئیات رسانه</DialogTitle>
        <DialogDescription id="media-details-description" className="sr-only">
          جزئیات رسانه شامل اطلاعات فایل، نوع رسانه، اندازه و کاور رسانه می‌باشد.
        </DialogDescription>
        
        {/* Header */}
        <div className="bg-muted/50 border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              {getFileTypeIcon()}
              {isEditing ? 'ویرایش رسانه' : (media.title || 'جزئیات رسانه')}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 cursor-pointer hover:bg-muted-foreground/10"
              aria-label="بستن"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row">
          {/* Right Pane - Media Preview */}
          <div className="w-full lg:w-1/2 p-4 lg:p-6 border-b lg:border-b-0 lg:border-l border-border">
            <div className="space-y-4">
              {/* Media Preview */}
              <div className="relative w-64 h-64 mx-auto lg:w-full lg:h-80 bg-muted rounded-lg overflow-hidden border border-border">
                {renderMediaContent()}
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2 justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="h-8 w-8 p-0 cursor-pointer hover:bg-muted-foreground/10"
                  title="دانلود"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Left Pane - Media Details */}
          <div className="w-full lg:w-1/2 p-4 lg:p-6 space-y-6">
            {isEditing ? (
              <>
                {/* Editable Fields Section */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="media-title" className="text-sm font-medium">نام فایل</Label>
                    <Input
                      id="media-title"
                      value={editedMedia?.title || ''}
                      onChange={(e) => editedMedia && setEditedMedia({ ...editedMedia, title: e.target.value })}
                      placeholder="نام فایل"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="media-alt-text" className="text-sm font-medium">متن جایگزین</Label>
                    <Input
                      id="media-alt-text"
                      value={editedMedia?.alt_text || ''}
                      onChange={(e) => editedMedia && setEditedMedia({ ...editedMedia, alt_text: e.target.value })}
                      placeholder="متن جایگزین"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      این متن در صورت عدم نمایش تصویر نمایش داده می‌شود.
                    </p>
                  </div>
                  
                  {media.media_type !== 'image' && renderCoverImageSection()}
                </div>
              </>
            ) : (
              <>
                {/* Metadata Section */}
                <div className="bg-muted/30 rounded-lg border border-border p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="sm:col-span-2 flex gap-2">
                      <span className="font-medium text-muted-foreground">نام فایل:</span>
                      <TruncatedText 
                        text={media.title || media.original_file_name || media.file_name} 
                        maxLength={50}
                        className="flex-1"
                      />
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">نوع فایل:</span>
                      <p className="mt-1">{media.media_type}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">حجم:</span>
                      <p className="mt-1">{media.file_size ? mediaService.formatBytes(media.file_size) : 'نامشخص'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">تاریخ:</span>
                      <p className="mt-1">{new Date(media.created_at).toLocaleDateString('fa-IR')}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">شناسه:</span>
                      <p className="mt-1">{media.id}</p>
                    </div>
                    {media.mime_type && (
                      <div>
                        <span className="font-medium text-muted-foreground">فرمت:</span>
                        <p className="mt-1">{media.mime_type.split('/')[1]?.toUpperCase()}</p>
                      </div>
                    )}
                  </div>
                </div>

                {media.alt_text && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">متن جایگزین:</span>
                    <p className="mt-1 text-sm">{media.alt_text}</p>
                  </div>
                )}
                
                {media.media_type !== 'image' && renderCoverImageSection()}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-muted/50 border-t border-border px-6 py-4">
          <div className="flex gap-3 justify-between">
            {isEditing ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                >
                  انصراف
                </Button>
                <Button 
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                      در حال ذخیره...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 ml-2" />
                      ذخیره
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={onClose}>
                    بستن
                  </Button>
                </div>
                {showEditButton && (
                  <Button onClick={handleStartEdit}>
                    <Edit3 className="h-4 w-4 ml-2" />
                    ویرایش
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
