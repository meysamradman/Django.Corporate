import { useState } from 'react';
import { Button } from "@/components/elements/Button";
import { Label } from "@/components/elements/Label";
import type { Media } from '@/types/shared/media';
import { MediaLibraryModal } from '@/components/media/modals/MediaLibraryModal';
import { MediaImage } from "@/components/media/base/MediaImage";
import { mediaService } from '@/components/media/services';
import { Image as ImageIcon, X } from 'lucide-react';
import { showError } from '@/core/toast';
import { msg } from '@/core/messages';

interface CoverImageManagerProps {
  currentCoverImage?: Media | number | null;
  onCoverImageChange: (coverImage: Media | number | null) => void;
  mediaType: string;
}

export function CoverImageManager({ 
  currentCoverImage, 
  onCoverImageChange,
  mediaType: _mediaType
}: CoverImageManagerProps) {
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"select" | "upload">("select");
  const [_newCoverImage, setNewCoverImage] = useState<Media | null>(null);

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
      showError(msg.action('coverMustBeImage'));
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
      
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => setIsLibraryOpen(true)}
        >
          <ImageIcon className="h-4 w-4" />
          انتخاب کاور
        </Button>

        {coverImageUrl && (
          <Button
            variant="outline"
            className="text-red-1 border-red-1/30 hover:bg-red-0/50"
            onClick={handleRemoveCoverImage}
          >
            <X className="h-4 w-4" />
            حذف
          </Button>
        )}
        
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
    </div>
  );
}