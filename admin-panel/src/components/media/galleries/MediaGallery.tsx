import { useState } from "react";
import { Button } from "@/components/elements/Button";
import type { Media } from "@/types/shared/media";
import { MediaLibraryModal } from "@/components/media/modals/MediaLibraryModal";
import { MediaDetailsModal } from "@/components/media/modals/MediaDetailsModal";
import { MediaGallerySingleAsset } from "@/components/media/galleries/MediaGallerySingleAsset";
import { MediaGalleryCollectionList } from "@/components/media/galleries/MediaGalleryCollectionList";
import { MediaGalleryEmptyState } from "@/components/media/galleries/MediaGalleryEmptyState";
import {
  FileText as PDFIcon,
  Plus,
  Music,
  Image as ImageIcon,
  Video as VideoIcon
} from "lucide-react";
import { type MediaContextType, MODULE_MEDIA_CONFIGS } from "../constants";
import { showError } from "@/core/toast";
import { msg } from '@/core/messages';

interface MediaGalleryProps {
  mediaItems: Media[];
  onMediaSelect: (selectedMedia: Media[]) => void;
  mediaType: "image" | "video" | "audio" | "document";
  title: string;
  maxSelection?: number;
  totalItemsCount?: number;
  isGallery?: boolean;
  disabled?: boolean;
  context: MediaContextType;
  contextId?: number | string;
}

export function MediaGallery({
  mediaItems,
  onMediaSelect,
  mediaType,
  title,
  maxSelection,
  totalItemsCount,
  isGallery = false,
  disabled = false,
  context,
  contextId,
}: MediaGalleryProps) {
  const [showMainLibrary, setShowMainLibrary] = useState(false);
  const [showCoverLibrary, setShowCoverLibrary] = useState(false);
  const [selectedMediaForDetails, setSelectedMediaForDetails] = useState<Media | null>(null);

  const handleMediaUpdated = (updatedMedia: Media) => {
    const newMediaItems = mediaItems.map(item =>
      item.id === updatedMedia.id ? updatedMedia : item
    );
    onMediaSelect(newMediaItems);
  };

  const handleMediaSelect = (selectedMedia: Media | Media[]) => {
    const newItems = Array.isArray(selectedMedia) ? selectedMedia : [selectedMedia];

    const getMediaCategory = (media: any): string => {
      const rawType = (media.media_type || media.file_type || media.type || media.kind || "").toLowerCase();
      const mime = (media.mime_type || "").toLowerCase();

      if (rawType === 'image' || mime.startsWith('image/')) return 'image';
      if (rawType === 'video' || mime.startsWith('video/')) return 'video';
      if (rawType === 'audio' || mime.startsWith('audio/')) return 'audio';
      if (rawType === 'document' || rawType === 'pdf' || mime.includes('pdf') || mime.includes('document') || mime.includes('word')) return 'document';

      if (rawType.includes('image')) return 'image';
      if (rawType.includes('video')) return 'video';
      if (rawType.includes('audio')) return 'audio';

      return 'image';
    };

    const filteredByType = newItems.filter((media) => {
      const category = getMediaCategory(media);
      return category === mediaType;
    });

    const existingIds = new Set(mediaItems.map(item => item.id));
    const seenNewIds = new Set<number | string>();

    const uniqueNewItems = filteredByType.filter(item => {
      if (!item.id || existingIds.has(item.id) || seenNewIds.has(item.id)) {
        return false;
      }
      seenNewIds.add(item.id);
      return true;
    });

    if (uniqueNewItems.length < filteredByType.length) {
      showError(msg.action('duplicateFilesIgnored'));
    }

    if (uniqueNewItems.length === 0) {
      setShowMainLibrary(false);
      return;
    }

    const moduleMax = MODULE_MEDIA_CONFIGS[context]?.maxUploadLimit || 999;
    const globalTotal = totalItemsCount !== undefined ? totalItemsCount : mediaItems.length;

    if (globalTotal + uniqueNewItems.length > moduleMax) {
      showError(msg.action('maxTotalFilesLimit', { max: moduleMax }));
      const remainingGlobalSlots = moduleMax - globalTotal;
      if (remainingGlobalSlots <= 0) {
        setShowMainLibrary(false);
        return;
      }
      uniqueNewItems.splice(remainingGlobalSlots);
    }

    if (maxSelection === 1 && uniqueNewItems.length > 0) {
      onMediaSelect([uniqueNewItems[0]]);
    } else if (maxSelection && mediaItems.length + uniqueNewItems.length > maxSelection) {
      showError(msg.action('maxSectionFilesLimit', { max: maxSelection }));
      const remainingGallerySlots = maxSelection - mediaItems.length;
      if (remainingGallerySlots <= 0) {
        setShowMainLibrary(false);
        return;
      }
      onMediaSelect([...mediaItems, ...uniqueNewItems.slice(0, remainingGallerySlots)]);
    } else {
      onMediaSelect([...mediaItems, ...uniqueNewItems]);
    }

    setShowMainLibrary(false);
  };

  const handleRemoveMedia = (index: number) => {
    const newMedia = [...mediaItems];
    newMedia.splice(index, 1);
    onMediaSelect(newMedia);
  };

  const getIconForMediaType = () => {
    switch (mediaType) {
      case "image": return <ImageIcon className="w-5 h-5" />;
      case "video": return <VideoIcon className="w-5 h-5" />;
      case "audio": return <Music className="w-5 h-5" />;
      case "document": return <PDFIcon className="w-5 h-5" />;
      default: return <ImageIcon className="w-5 h-5" />;
    }
  };

  const renderContent = () => {
    if (!isGallery && mediaType !== "image" && mediaItems.length > 0) {
      const mainMedia = mediaItems[0];
      const coverMedia = typeof mainMedia.cover_image === 'object' ? mainMedia.cover_image : null;

      return (
        <MediaGallerySingleAsset
          mediaType={mediaType}
          title={title}
          mainMedia={mainMedia}
          coverMedia={coverMedia}
          disabled={disabled}
          onOpenLibrary={() => setShowMainLibrary(true)}
          onRemoveMain={() => handleRemoveMedia(0)}
          onOpenCoverLibrary={() => setShowCoverLibrary(true)}
          onRemoveCover={() => {
            const updatedMedia = [...mediaItems];
            updatedMedia[0] = { ...updatedMedia[0], cover_image: null };
            onMediaSelect(updatedMedia);
          }}
        />
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-font-m font-bold flex items-center gap-2 text-font-p">
            <div className="w-8 h-8 rounded-lg bg-muted/10 flex items-center justify-center">
              {getIconForMediaType()}
            </div>
            {title}
          </h3>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowMainLibrary(true);
              }}
              className="h-9 px-3 gap-2 border-br hover:bg-muted/5 transition-colors"
              disabled={disabled || (maxSelection ? mediaItems.length >= maxSelection : false)}
            >
              <Plus className="w-4 h-4" />
              افزودن {mediaType === 'image' ? 'تصویر' : mediaType === 'video' ? 'ویدیو' : mediaType === 'audio' ? 'صوت' : 'مستند'}
            </Button>
          </div>
        </div>

        {mediaItems.length > 0 ? (
          <MediaGalleryCollectionList
            mediaItems={mediaItems}
            mediaType={mediaType}
            title={title}
            disabled={disabled}
            onOpenDetails={setSelectedMediaForDetails}
            onRemoveMedia={handleRemoveMedia}
          />
        ) : (
          <MediaGalleryEmptyState mediaType={mediaType} />
        )}
      </div>
    );
  };

  return (
    <>
      {renderContent()}

      <MediaLibraryModal
        isOpen={showMainLibrary}
        onClose={() => setShowMainLibrary(false)}
        onSelect={handleMediaSelect}
        selectMultiple={isGallery && maxSelection !== 1}
        initialFileType={mediaType}
        showTabs={true}
        context={context}
        contextId={contextId}
      />

      <MediaDetailsModal
        media={selectedMediaForDetails}
        isOpen={!!selectedMediaForDetails}
        onClose={() => setSelectedMediaForDetails(null)}
        onMediaUpdated={handleMediaUpdated}
      />

      <MediaLibraryModal
        isOpen={showCoverLibrary}
        onClose={() => setShowCoverLibrary(false)}
        onSelect={(selectedMedia) => {
          const selected = Array.isArray(selectedMedia) ? selectedMedia[0] : selectedMedia;
          if (selected) {
            const updatedMedia = [...mediaItems];
            if (updatedMedia.length > 0) {
              updatedMedia[0] = {
                ...updatedMedia[0],
                cover_image: selected
              };
              onMediaSelect(updatedMedia);
            }
          }
          setShowCoverLibrary(false);
        }}
        selectMultiple={false}
        initialFileType="image"
        showTabs={true}
        context={context}
        contextId={contextId}
      />
    </>
  );
}
