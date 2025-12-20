import type { Media } from "@/types/shared/media";
import { MediaGallery } from "@/components/media/galleries/MediaGallery";

interface PortfolioMediaGalleryProps {
  mediaItems: Media[];
  onMediaSelect: (selectedMedia: Media[]) => void;
  mediaType: "image" | "video" | "audio" | "pdf";
  title: string;
  maxSelection?: number;
  isGallery?: boolean;
  disabled?: boolean;
  contextId?: number | string;
}

export function PortfolioMediaGallery({
  mediaItems,
  onMediaSelect,
  mediaType,
  title,
  maxSelection,
  isGallery = false,
  disabled = false,
  contextId,
}: PortfolioMediaGalleryProps) {
  return (
    <MediaGallery
      mediaItems={mediaItems}
      onMediaSelect={onMediaSelect}
      mediaType={mediaType}
      title={title}
      maxSelection={maxSelection}
      isGallery={isGallery}
      disabled={disabled}
      context="portfolio"
      contextId={contextId}
    />
  );
}