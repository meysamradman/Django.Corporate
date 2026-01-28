import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/elements/Dialog";
import { Button } from "@/components/elements/Button";
import { Input } from "@/components/elements/Input";
import { Label } from "@/components/elements/Label";
import { X, Download, Edit3, FileText, Play, FileAudio, Save, ImageOff } from 'lucide-react';
import type { Media } from '@/types/shared/media';
import { MediaPlayer } from '@/components/media/base/MediaPlayer';
import { MediaThumbnail } from '@/components/media/base/MediaThumbnail';
import { MediaImage } from "@/components/media/base/MediaImage";
import { mediaService } from '@/components/media/services';
import { mediaApi } from '@/api/media/media';
import { showSuccess, showError } from '@/core/toast';
import { CoverImageManager } from '@/components/media/modals/CoverImageManager';
import { TruncatedText } from '@/components/elements/TruncatedText';
import { ProtectedButton, usePermission } from '@/core/permissions';

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
  onEdit: _onEdit,
  showEditButton = true,
  onMediaUpdated,
}: MediaDetailsModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedMedia, setEditedMedia] = useState<Media | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newCoverImage, setNewCoverImage] = useState<Media | number | null>(null);
  const { hasPermission } = usePermission();
  
  const getUpdatePermission = useCallback(() => {
    if (!media) return 'media.update';
    if (media.media_type === 'image') return 'media.image.update';
    if (media.media_type === 'video') return 'media.video.update';
    if (media.media_type === 'audio') return 'media.audio.update';
    if (media.media_type === 'pdf' || media.media_type === 'document') return 'media.document.update';
    return 'media.update';
  }, [media]);
  
  const canUpdateMedia = useMemo(() => {
    if (!media) return false;
    return hasPermission(getUpdatePermission());
  }, [media, hasPermission, getUpdatePermission]);

  useEffect(() => {
    if (media) {
      setEditedMedia({ ...media });
      setIsEditing(false);
      setNewCoverImage(media.cover_image || null);
    }
  }, [media]);

  if (!media) return null;

  const handleDownload = () => {
    setIsDownloading(true);
    const link = document.createElement('a');
    link.href = mediaService.getMediaUrlFromObject(media);
    link.download = media.original_file_name || media.file_name || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsDownloading(false);
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
      const updateData: any = {
        title: editedMedia.title || '',
        alt_text: editedMedia.alt_text || '',
      };

      let updatedMediaData = { ...editedMedia };

      if (newCoverImage !== media.cover_image) {
        if (newCoverImage === null) {
          const response = await mediaApi.updateCoverImage(media.id, null);
          if (response.metaData.status === 'success' && response.data) {
            updatedMediaData = { ...updatedMediaData, ...response.data };
          }
        } else if (typeof newCoverImage === 'object' && 'id' in newCoverImage) {
          const response = await mediaApi.updateCoverImage(media.id, newCoverImage.id);
          if (response.metaData.status === 'success' && response.data) {
            updatedMediaData = { ...updatedMediaData, ...response.data };
          }
        } else if (typeof newCoverImage === 'number') {
          const response = await mediaApi.updateCoverImage(media.id, newCoverImage);
          if (response.metaData.status === 'success' && response.data) {
            updatedMediaData = { ...updatedMediaData, ...response.data };
          }
        }
      }

      const response = await mediaApi.updateMedia(media.id, updateData);
      
      if (response.metaData.status === 'success' && response.data) {
        showSuccess('تغییرات با موفقیت ذخیره شد');
        setIsEditing(false);
        setNewCoverImage(null);
        
        const finalUpdatedMedia = { ...updatedMediaData, ...response.data };
        setEditedMedia(finalUpdatedMedia);
        
        if (onMediaUpdated) {
          onMediaUpdated(finalUpdatedMedia);
        }
      } else {
        showError(response.metaData.message || 'خطا در ذخیره تغییرات');
      }
    } catch (error) {
      showError('خطا در ذخیره تغییرات');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCoverImageChange = (coverImage: Media | number | null) => {
    setNewCoverImage(coverImage);
  };

  const renderMediaContent = () => {
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
    const getCoverImageUrl = (): string | null => {
      if (isEditing) {
        if (!newCoverImage) return null;
        
        if (typeof newCoverImage === 'object' && newCoverImage !== null && 'id' in newCoverImage) {
          return mediaService.getMediaUrlFromObject(newCoverImage);
        }
        
        return null;
      }
      
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
            mediaType={media.media_type || ""}
          />
        ) : hasCoverImage ? (
          <div className="w-full h-32 rounded-lg overflow-hidden relative">
            <MediaImage
              src={coverImageUrl}
              alt={media.alt_text || media.title || 'کاور رسانه'}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-32 rounded-lg bg-bg">
            <ImageOff className="h-8 w-8 text-font-s mb-2" />
            <span className="text-font-s">
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
      <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-5xl xl:max-w-6xl max-h-[90vh] overflow-y-auto p-0" showCloseButton={false} aria-describedby="media-details-description">
        <DialogTitle className="sr-only">جزئیات رسانه</DialogTitle>
        <DialogDescription id="media-details-description" className="sr-only">
          جزئیات رسانه شامل اطلاعات فایل، نوع رسانه، اندازه و کاور رسانه می‌باشد.
        </DialogDescription>
        
        <div className="bg-bg/50 border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              {getFileTypeIcon()}
              {isEditing ? 'ویرایش رسانه' : (media.title || 'جزئیات رسانه')}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 cursor-pointer hover:bg-font-s/10"
              aria-label="بستن"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row">
          <div className="w-full lg:w-1/2 p-4 lg:p-6 border-b lg:border-b-0 lg:border-l">
            <div className="space-y-4">
              <div className="relative w-full aspect-square lg:aspect-video min-h-[400px] lg:min-h-[500px] bg-bg rounded-lg overflow-hidden border">
                {renderMediaContent()}
              </div>
              
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="h-8 w-8 p-0 cursor-pointer hover:bg-font-s/10"
                  title="دانلود"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-1/2 p-4 lg:p-6 space-y-6">
            {isEditing ? (
              <>
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
                    <p className="text-xs text-font-s mt-1">
                      این متن در صورت عدم نمایش تصویر نمایش داده می‌شود.
                    </p>
                  </div>
                  
                  {media.media_type !== 'image' && renderCoverImageSection()}
                </div>
              </>
            ) : (
              <>
                <div className="bg-bg/30 rounded-lg border p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="sm:col-span-2 flex gap-2">
                      <span className="font-medium text-font-s shrink-0">نام فایل:</span>
                      <TruncatedText 
                        text={media.title || media.original_file_name || media.file_name || ''} 
                        maxLength={80}
                        className="flex-1"
                        showTooltip={true}
                      />
                    </div>
                    <div>
                      <span className="font-medium text-font-s">نوع فایل:</span>
                      <p className="mt-1">{media.media_type}</p>
                    </div>
                    <div>
                      <span className="font-medium text-font-s">حجم:</span>
                      <p className="mt-1">{media.file_size ? mediaService.formatBytes(media.file_size) : 'نامشخص'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-font-s">تاریخ:</span>
                      <p className="mt-1">{new Date(media.created_at).toLocaleDateString('fa-IR')}</p>
                    </div>
                    <div>
                      <span className="font-medium text-font-s">شناسه:</span>
                      <p className="mt-1">{media.id}</p>
                    </div>
                    {media.mime_type && (
                      <div>
                        <span className="font-medium text-font-s">فرمت:</span>
                        <p className="mt-1">{media.mime_type.split('/')[1]?.toUpperCase()}</p>
                      </div>
                    )}
                  </div>
                </div>

                {media.alt_text && (
                  <div>
                    <span className="text-sm font-medium text-font-s">متن جایگزین:</span>
                    <p className="mt-1 text-sm">{media.alt_text}</p>
                  </div>
                )}
                
                {media.media_type !== 'image' && renderCoverImageSection()}
              </>
            )}
          </div>
        </div>

        <div className="bg-bg/50 border-t px-6 py-4">
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
                <ProtectedButton
                  permission={getUpdatePermission()}
                  onClick={handleSaveEdit}
                  disabled={isSaving || !canUpdateMedia}
                  showDenyToast={true}
                  denyMessage="شما دسترسی ذخیره تغییرات این رسانه را ندارید"
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
                </ProtectedButton>
              </>
            ) : (
              <>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={onClose}>
                    بستن
                  </Button>
                </div>
                {showEditButton && (
                  <ProtectedButton
                    permission={getUpdatePermission()}
                    onClick={handleStartEdit}
                    showDenyToast={true}
                    denyMessage="شما دسترسی ویرایش این رسانه را ندارید"
                  >
                    <Edit3 className="h-4 w-4 ml-2" />
                    ویرایش
                  </ProtectedButton>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
