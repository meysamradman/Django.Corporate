import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/elements/Dialog";
import { Button } from "@/components/elements/Button";
import { Download, FileText, Play, FileAudio, ImageOff, Music } from 'lucide-react';
import type { Media } from '@/types/shared/media';
import { MediaPlayer } from '@/components/media/videos/MediaPlayer';
import { AudioPlayer } from '@/components/media/audios/AudioPlayer';
import { MediaThumbnail } from '@/components/media/base/MediaThumbnail';
import { MediaImage } from "@/components/media/base/MediaImage";
import { mediaService } from '@/components/media/services';
import { mediaApi } from '@/api/media/media';
import { showSuccess, showError } from '@/core/toast';
import { msg } from '@/core/messages';
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
  const [resolvedCoverMedia, setResolvedCoverMedia] = useState<Media | null>(null);
  const { hasPermission } = usePermission();

  const getCoverId = useCallback((cover: Media | number | null | undefined): number | null => {
    if (!cover) return null;
    if (typeof cover === 'number') return cover;
    if (typeof cover === 'object' && 'id' in cover && typeof cover.id === 'number') return cover.id;
    return null;
  }, []);

  const getShortTitle = useCallback((value: string, maxLength = 48) => {
    if (!value) return '';
    return value.length > maxLength ? `${value.slice(0, maxLength)}…` : value;
  }, []);

  const getEffectiveCoverUrl = useCallback((): string => {
    if (isEditing) {
      if (!newCoverImage) return '';

      if (typeof newCoverImage === 'object' && newCoverImage !== null && 'id' in newCoverImage) {
        return mediaService.getMediaUrlFromObject(newCoverImage);
      }

      if (
        typeof newCoverImage === 'number' &&
        resolvedCoverMedia &&
        resolvedCoverMedia.id === newCoverImage
      ) {
        return mediaService.getMediaUrlFromObject(resolvedCoverMedia);
      }
    }

    const directCoverUrl = mediaService.getMediaCoverUrl(media);
    if (directCoverUrl) return directCoverUrl;

    if (
      media &&
      typeof media.cover_image === 'number' &&
      resolvedCoverMedia &&
      resolvedCoverMedia.id === media.cover_image
    ) {
      return mediaService.getMediaUrlFromObject(resolvedCoverMedia);
    }

    return '';
  }, [isEditing, newCoverImage, resolvedCoverMedia, media]);

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

  useEffect(() => {
    let isMounted = true;

    const resolveCoverMedia = async () => {
      if (!media || typeof media.cover_image !== 'number') {
        setResolvedCoverMedia(null);
        return;
      }

      const response = await mediaApi.getMediaDetails(media.cover_image);
      if (!isMounted) return;

      if (response.metaData.status === 'success' && response.data) {
        setResolvedCoverMedia(response.data);
      } else {
        setResolvedCoverMedia(null);
      }
    };

    void resolveCoverMedia();

    return () => {
      isMounted = false;
    };
  }, [media]);

  useEffect(() => {
    if (
      resolvedCoverMedia &&
      typeof newCoverImage === 'number' &&
      newCoverImage === resolvedCoverMedia.id
    ) {
      setNewCoverImage(resolvedCoverMedia);
    }
  }, [resolvedCoverMedia, newCoverImage]);

  if (!media) return null;

  const handleDownload = () => {
    setIsDownloading(true);
    try {
      const mediaUrl = mediaService.getMediaUrlFromObject(media);

      if (!mediaUrl) {
        showError(msg.action('downloadLinkUnavailable'));
        return;
      }

      window.open(mediaUrl, '_blank', 'noopener,noreferrer');
    } finally {
      setIsDownloading(false);
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
      const updateData: any = {
        title: editedMedia.title || '',
        alt_text: editedMedia.alt_text || '',
      };

      let updatedMediaData = { ...editedMedia };

      const previousCoverId = getCoverId(media.cover_image);
      const nextCoverId = getCoverId(newCoverImage);

      if (nextCoverId !== previousCoverId) {
        if (nextCoverId === null) {
          const response = await mediaApi.updateCoverImage(media.id, null);
          if (response.metaData.status === 'success' && response.data) {
            updatedMediaData = { ...updatedMediaData, ...response.data };
          }
        } else {
          const response = await mediaApi.updateCoverImage(media.id, nextCoverId);
          if (response.metaData.status === 'success' && response.data) {
            updatedMediaData = { ...updatedMediaData, ...response.data };
          }
        }
      }

      const response = await mediaApi.updateMedia(media.id, updateData);

      if (response.metaData.status === 'success' && response.data) {
        showSuccess(msg.action('changesSaved'));
        setIsEditing(false);
        setNewCoverImage(null);

        const finalUpdatedMedia = { ...updatedMediaData, ...response.data };
        setEditedMedia(finalUpdatedMedia);

        if (onMediaUpdated) {
          onMediaUpdated(finalUpdatedMedia);
        }
      } else {
        showError(response.metaData.message || msg.action('changesSaveError'));
      }
    } catch (error) {
      showError(msg.action('changesSaveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCoverImageChange = (coverImage: Media | number | null) => {
    setNewCoverImage(coverImage);
  };

  const renderMediaContent = () => {
    if (media.media_type === 'video') {
      return (
        <MediaPlayer
          media={media}
          className="w-full h-full"
          controls={true}
          showControls={true}
        />
      );
    }

    if (media.media_type === 'audio') {
      const audioCoverUrl = getEffectiveCoverUrl();

      return (
        <div className="w-full h-full flex flex-col p-4 bg-card">
          <div className="relative w-full flex-1 min-h-44 rounded-lg overflow-hidden border border-br bg-bg">
            {audioCoverUrl ? (
              <MediaImage
                src={audioCoverUrl}
                alt={media.alt_text || media.title || 'کاور صوت'}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-font-s gap-2">
                <Music className="h-10 w-10" />
                <span className="text-sm">کاور صوتی تنظیم نشده</span>
              </div>
            )}

            <div className="absolute inset-0 bg-linear-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
          </div>

          <div className="mt-4 w-full overflow-hidden">
            <AudioPlayer
              src={mediaService.getMediaUrlFromObject(media)}
              title={getShortTitle(media.title || media.original_file_name || media.file_name || 'فایل صوتی')}
              className="w-full"
            />
          </div>
        </div>
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
      const effectiveCoverUrl = getEffectiveCoverUrl();
      return effectiveCoverUrl || null;
    };

    const coverImageUrl = getCoverImageUrl();
    const hasCoverImage = !!coverImageUrl && coverImageUrl.length > 0;

    return (
      <div>
        <h3 className="font-semibold text-lg mb-2">کاور رسانه</h3>

        {isEditing ? (
          <CoverImageManager
            currentCoverImage={
              typeof newCoverImage === 'number' && resolvedCoverMedia?.id === newCoverImage
                ? resolvedCoverMedia
                : newCoverImage
            }
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

        {!isEditing && canUpdateMedia && media.media_type !== 'image' && (
          <div className="mt-3">
            <Button variant="outline" size="sm" onClick={handleStartEdit}>
              تغییر کاور
            </Button>
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
      <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-5xl xl:max-w-6xl max-h-[90vh] overflow-hidden p-0" showCloseButton={false} aria-describedby="media-details-description">
        <DialogTitle className="sr-only">جزئیات رسانه</DialogTitle>
        <DialogDescription id="media-details-description" className="sr-only">
          جزئیات رسانه شامل اطلاعات فایل، نوع رسانه، اندازه و کاور رسانه می‌باشد.
        </DialogDescription>

        <MediaDetailsHeader
          title={isEditing ? 'ویرایش رسانه' : (media.title || 'جزئیات رسانه')}
          icon={getFileTypeIcon()}
          onClose={onClose}
        />

        <div className="flex flex-col lg:flex-row max-h-[calc(90vh-10.5rem)] overflow-hidden">
          <div className="w-full lg:w-1/2 p-4 lg:p-6 border-b lg:border-b-0 lg:border-l min-w-0 overflow-y-auto">
            <div className="space-y-4">
              <div className="relative w-full aspect-square lg:aspect-video min-h-80 lg:min-h-100 bg-bg rounded-lg overflow-hidden border">
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

          <div className="w-full lg:w-1/2 p-4 lg:p-6 space-y-6 min-w-0 overflow-y-auto">
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
