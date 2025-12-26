import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Button } from "@/components/elements/Button";
import { ImageIcon, Upload, X, Eye } from "lucide-react";
import { mediaService } from "@/components/media/services";
import type { Media } from "@/types/shared/media";
import { showError } from '@/core/toast';

interface MediaTabProps {
  selectedLogo: Media | null;
  setSelectedLogo: (media: Media | null) => void;
  selectedCoverImage: Media | null;
  setSelectedCoverImage: (media: Media | null) => void;
  editMode: boolean;
}

export default function MediaTab({
  selectedLogo,
  setSelectedLogo,
  selectedCoverImage,
  setSelectedCoverImage,
  editMode
}: MediaTabProps) {
  const handleLogoSelect = (media: Media) => {
    setSelectedLogo(media);
  };

  const handleCoverSelect = (media: Media) => {
    setSelectedCoverImage(media);
  };

  const handleRemoveLogo = () => {
    setSelectedLogo(null);
  };

  const handleRemoveCover = () => {
    setSelectedCoverImage(null);
  };

  const MediaPreview = ({
    media,
    onRemove,
    title
  }: {
    media: Media | null;
    onRemove: () => void;
    title: string;
  }) => {
    if (!media) {
      return (
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
          <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground mb-4">{title} انتخاب نشده</p>
          {editMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // TODO: Open media picker modal
                showError("انتخاب رسانه هنوز پیاده‌سازی نشده است");
              }}
            >
              <Upload className="h-4 w-4 mr-2" />
              انتخاب {title}
            </Button>
          )}
        </div>
      );
    }

    const mediaUrl = mediaService.getMediaUrlFromObject(media);

    return (
      <div className="border border-border rounded-lg p-4">
        <div className="flex items-start gap-4">
          <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
            {media.media_type === 'image' ? (
              <img
                src={mediaUrl}
                alt={media.filename}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm mb-1">{media.filename}</h4>
            <p className="text-xs text-muted-foreground mb-2">
              {media.media_type} • {(media.file_size / 1024).toFixed(1)} KB
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(mediaUrl, '_blank')}
              >
                <Eye className="h-4 w-4 mr-1" />
                مشاهده
              </Button>
              {editMode && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRemove}
                >
                  <X className="h-4 w-4 mr-1" />
                  حذف
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <CardWithIcon
        icon={ImageIcon}
        title="لوگو آژانس"
        iconBgColor="bg-primary/10"
        iconColor="stroke-primary"
        borderColor="border-b-primary"
        className="hover:shadow-lg transition-all duration-300"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            لوگوی آژانس که در لیست آژانس‌ها و جزئیات نمایش داده می‌شود.
          </p>
          <MediaPreview
            media={selectedLogo}
            onRemove={handleRemoveLogo}
            title="لوگو"
          />
        </div>
      </CardWithIcon>

      <CardWithIcon
        icon={ImageIcon}
        title="تصویر کاور"
        iconBgColor="bg-primary/10"
        iconColor="stroke-primary"
        borderColor="border-b-primary"
        className="hover:shadow-lg transition-all duration-300"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            تصویر کاور آژانس که در صفحه جزئیات نمایش داده می‌شود.
          </p>
          <MediaPreview
            media={selectedCoverImage}
            onRemove={handleRemoveCover}
            title="کاور"
          />
        </div>
      </CardWithIcon>
    </div>
  );
}
