import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/elements/Dialog";
import { Button } from "@/components/elements/Button";
import { Download, FileText, Play, FileAudio, ImageOff } from 'lucide-react';
import type { Media } from '@/types/shared/media';
import { MediaPlayer } from '@/components/media/videos/MediaPlayer';
import { MediaThumbnail } from '@/components/media/base/MediaThumbnail';
import { MediaImage } from "@/components/media/base/MediaImage";
import { mediaService } from '@/components/media/services';
import { mediaApi } from '@/api/media/media';
import { showSuccess, showError } from '@/core/toast';
import { CoverImageManager } from '@/components/media/modals/CoverImageManager';
import { usePermission } from '@/core/permissions';
import { MediaDetailsHeader } from '@/components/media/modals/details/MediaDetailsHeader';
import { MediaDetailsInfoPanel } from '@/components/media/modals/details/MediaDetailsInfoPanel';
import { MediaDetailsActionBar } from '@/components/media/modals/details/MediaDetailsActionBar';

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

    console.log('[MediaDetailsModal][Save] Starting save operation', {
      mediaId: media.id,
      mediaType: media.media_type,
      editedMedia,
      timestamp: new Date().toISOString()
    });

    setIsSaving(true);

    try {
      const updateData: any = {
        title: editedMedia.title || '',
        alt_text: editedMedia.alt_text || '',
      };

      console.log('[MediaDetailsModal][Save] Prepared update data', {
        updateData,
        mediaId: media.id,
        mediaType: media.media_type
      });

      let updatedMediaData = { ...editedMedia };

      if (newCoverImage !== media.cover_image) {
        console.log('[MediaDetailsModal][Save] Cover image changed', {
          oldCover: media.cover_image,
          newCover: newCoverImage,
          newCoverType: typeof newCoverImage
        });

        if (newCoverImage === null) {
          console.log('[MediaDetailsModal][Save] Removing cover image');
          const response = await mediaApi.updateCoverImage(media.id, null);
          console.log('[MediaDetailsModal][Save] Cover removal response', response);
          if (response.metaData.status === 'success' && response.data) {
            updatedMediaData = { ...updatedMediaData, ...response.data };
          }
        } else if (typeof newCoverImage === 'object' && 'id' in newCoverImage) {
          console.log('[MediaDetailsModal][Save] Setting cover image from object', newCoverImage.id);
          const response = await mediaApi.updateCoverImage(media.id, newCoverImage.id);
          console.log('[MediaDetailsModal][Save] Cover update response', response);
          if (response.metaData.status === 'success' && response.data) {
            updatedMediaData = { ...updatedMediaData, ...response.data };
          }
        } else if (typeof newCoverImage === 'number') {
          console.log('[MediaDetailsModal][Save] Setting cover image from ID', newCoverImage);
          const response = await mediaApi.updateCoverImage(media.id, newCoverImage);
          console.log('[MediaDetailsModal][Save] Cover update response', response);
          if (response.metaData.status === 'success' && response.data) {
            updatedMediaData = { ...updatedMediaData, ...response.data };
          }
        }
      }

      console.log('[MediaDetailsModal][Save] Calling updateMedia API', {
        mediaId: media.id,
        updateData
      });

      const response = await mediaApi.updateMedia(media.id, updateData);

      console.log('[MediaDetailsModal][Save] Update response received', {
        status: response.metaData.status,
        message: response.metaData.message,
        hasData: !!response.data,
        data: response.data
      });

      if (response.metaData.status === 'success' && response.data) {
        console.log('[MediaDetailsModal][Save] Update successful, finalizing');
        showSuccess('تغییرات با موفقیت ذخیره شد');
        setIsEditing(false);
        setNewCoverImage(null);

        const finalUpdatedMedia = { ...updatedMediaData, ...response.data };
        console.log('[MediaDetailsModal][Save] Final updated media', finalUpdatedMedia);
        setEditedMedia(finalUpdatedMedia);

        if (onMediaUpdated) {
          console.log('[MediaDetailsModal][Save] Calling onMediaUpdated callback');
          onMediaUpdated(finalUpdatedMedia);
        }
      } else {
        console.error('[MediaDetailsModal][Save] Update failed', {
          status: response.metaData.status,
          message: response.metaData.message
        });
        showError(response.metaData.message || 'خطا در ذخیره تغییرات');
      }
    } catch (error) {
      console.error('[MediaDetailsModal][Save] Exception occurred', {
        error,
        errorType: error?.constructor?.name,
        mediaId: media.id,
        timestamp: new Date().toISOString()
      });
      showError('خطا در ذخیره تغییرات');
    } finally {
      setIsSaving(false);
      console.log('[MediaDetailsModal][Save] Save operation completed');
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

        <MediaDetailsHeader
          title={isEditing ? 'ویرایش رسانه' : (media.title || 'جزئیات رسانه')}
          icon={getFileTypeIcon()}
          onClose={onClose}
        />

        <div className="flex flex-col lg:flex-row">
          <div className="w-full lg:w-1/2 p-4 lg:p-6 border-b lg:border-b-0 lg:border-l">
            <div className="space-y-4">
              <div className="relative w-full aspect-square lg:aspect-video min-h-100 lg:min-h-125 bg-bg rounded-lg overflow-hidden border">
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
            <MediaDetailsInfoPanel
              media={media}
              isEditing={isEditing}
              editedMedia={editedMedia}
              onTitleChange={(title) => editedMedia && setEditedMedia({ ...editedMedia, title })}
              onAltTextChange={(altText) => editedMedia && setEditedMedia({ ...editedMedia, alt_text: altText })}
              coverSection={renderCoverImageSection()}
            />
          </div>
        </div>

        <MediaDetailsActionBar
          isEditing={isEditing}
          isSaving={isSaving}
          canUpdateMedia={canUpdateMedia}
          showEditButton={showEditButton}
          updatePermission={getUpdatePermission()}
          onClose={onClose}
          onCancelEdit={handleCancelEdit}
          onSaveEdit={handleSaveEdit}
          onStartEdit={handleStartEdit}
        />
      </DialogContent>
    </Dialog>
  );
}
