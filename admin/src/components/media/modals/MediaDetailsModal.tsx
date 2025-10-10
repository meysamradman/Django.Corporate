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
        console.log('Updating cover image:', newCoverImage);
        console.log('Previous cover image:', media.cover_image);
        // Use the dedicated updateCoverImage function
        if (newCoverImage === null) {
          // Remove cover image
          console.log('Removing cover image');
          const response = await mediaApi.updateCoverImage(media.id, null);
          if (response.metaData.status === 'success' && response.data) {
            updatedMediaData = { ...updatedMediaData, ...response.data };
          }
        } else if (typeof newCoverImage === 'object' && 'id' in newCoverImage) {
          // Set cover image to an existing media
          console.log('Setting cover image to media ID:', newCoverImage.id);
          const response = await mediaApi.updateCoverImage(media.id, newCoverImage.id);
          if (response.metaData.status === 'success' && response.data) {
            updatedMediaData = { ...updatedMediaData, ...response.data };
          }
        } else if (typeof newCoverImage === 'number') {
          // Set cover image by ID
          console.log('Setting cover image by ID:', newCoverImage);
          const response = await mediaApi.updateCoverImage(media.id, newCoverImage);
          if (response.metaData.status === 'success' && response.data) {
            updatedMediaData = { ...updatedMediaData, ...response.data };
          }
        }
      }

      // Update other fields
      console.log('Updating media with data:', updateData);
      const response = await mediaApi.updateMedia(media.id, updateData);
      console.log('Update media response:', response);
      
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
      console.error('Error updating media:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCoverImageChange = (coverImage: Media | number | null) => {
    console.log('Cover image changed to:', coverImage);
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

  const debugMediaItem = (item: Media | null) => {
    if (!item) return;
    console.log('Media details item:', item);
    console.log('Media type:', item.media_type);
    console.log('File URL:', item.file_url);
    console.log('Cover image:', item.cover_image);
    console.log('Cover image URL:', item.cover_image_url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0" aria-describedby="media-details-description">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            {getFileTypeIcon()}
            <span className="truncate max-w-xs">
              {isEditing ? 'ویرایش رسانه' : (media.title || 'جزئیات رسانه')}
            </span>
          </DialogTitle>
          <DialogDescription id="media-details-description" className="sr-only">
            جزئیات رسانه شامل اطلاعات فایل، نوع رسانه، اندازه و کاور رسانه می‌باشد.
          </DialogDescription>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute top-4 left-4 h-8 w-8 p-0"
            aria-label="بستن"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="flex flex-col md:flex-row p-4 gap-6">
          {/* Media Preview */}
          <div className="md:w-1/2 flex items-center justify-center bg-muted rounded-lg overflow-hidden h-64 md:h-80">
            {renderMediaContent()}
          </div>

          {/* Media Details */}
          <div className="md:w-1/2 space-y-4">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="media-title">عنوان</Label>
                  <Input
                    id="media-title"
                    value={editedMedia?.title || ''}
                    onChange={(e) => editedMedia && setEditedMedia({ ...editedMedia, title: e.target.value })}
                    placeholder="عنوان رسانه"
                  />
                </div>
                
                <div>
                  <Label htmlFor="media-alt-text">متن جایگزین</Label>
                  <Textarea
                    id="media-alt-text"
                    value={editedMedia?.alt_text || ''}
                    onChange={(e) => editedMedia && setEditedMedia({ ...editedMedia, alt_text: e.target.value })}
                    placeholder="متن جایگزین برای دسترس‌پذیری"
                  />
                </div>
                
                {media.media_type !== 'image' && renderCoverImageSection()}
              </div>
            ) : (
              <div>
                <h3 className="font-semibold text-lg mb-2">اطلاعات رسانه</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">نوع فایل:</span>
                    <span className="font-medium">{media.media_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">نام فایل:</span>
                    <span className="font-medium truncate max-w-[150px]">{media.original_file_name || media.file_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">اندازه:</span>
                    <span className="font-medium">{media.file_size ? mediaService.formatBytes(media.file_size) : 'نامشخص'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">تاریخ ایجاد:</span>
                    <span className="font-medium">{new Date(media.created_at).toLocaleDateString('fa-IR')}</span>
                  </div>
                  {media.alt_text && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">متن جایگزین:</span>
                      <span className="font-medium">{media.alt_text}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {media.media_type !== 'image' && !isEditing && (
              renderCoverImageSection()
            )}

            <div className="flex gap-2 pt-4">
              {isEditing ? (
                <>
                  <Button 
                    onClick={handleCancelEdit} 
                    variant="outline"
                    disabled={isSaving}
                    className="flex-1"
                  >
                    انصراف
                  </Button>
                  <Button 
                    onClick={handleSaveEdit} 
                    disabled={isSaving}
                    className="flex-1"
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
                  <Button 
                    onClick={handleDownload} 
                    disabled={isDownloading}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 ml-2" />
                    {isDownloading ? 'در حال دانلود...' : 'دانلود'}
                  </Button>
                  
                  {showEditButton && (
                    <Button 
                      variant="outline" 
                      onClick={handleStartEdit}
                      className="flex-1"
                    >
                      <Edit3 className="h-4 w-4 ml-2" />
                      ویرایش
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
