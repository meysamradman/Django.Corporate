import { useState } from "react";
import { Button } from "@/components/elements/Button";
import type { Media } from "@/types/shared/media";
import { MediaLibraryModal } from "@/components/media/modals/MediaLibraryModal";
import { MediaThumbnail } from "@/components/media/base/MediaThumbnail";
import { mediaService } from "@/components/media/services";
import {
  Plus,
  X,
  Play,
  Music,
  Image as ImageIcon,
  Video as VideoIcon,
  FileText as PDFIcon
} from "lucide-react";

interface MediaGalleryProps {
  mediaItems: Media[];
  onMediaSelect: (selectedMedia: Media[]) => void;
  mediaType: "image" | "video" | "audio" | "pdf";
  title: string;
  maxSelection?: number;
  isGallery?: boolean;
  disabled?: boolean;
  context: "portfolio" | "blog" | "media_library";
  contextId?: number | string;
}

export function MediaGallery({
  mediaItems,
  onMediaSelect,
  mediaType,
  title,
  maxSelection,
  isGallery = false,
  disabled = false,
  context,
  contextId,
}: MediaGalleryProps) {
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [activeTab, setActiveTab] = useState<"select" | "upload">("select");

  const handleMediaSelect = (selectedMedia: Media | Media[]) => {
    const newMedia = Array.isArray(selectedMedia) ? selectedMedia : [selectedMedia];

    const filteredMedia = newMedia.filter(media => {
      if (mediaType === "pdf") {
        return media.media_type === "document" || media.media_type === "pdf";
      }
      return media.media_type === mediaType;
    });

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

  if (!isGallery && mediaType !== "image" && mediaItems.length > 0) {
    const mainMedia = mediaItems[0];
    const coverMedia = typeof mainMedia.cover_image === 'object' ? mainMedia.cover_image : null;
    const mediaUrl = mediaService.getMediaUrlFromObject(mainMedia);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-font-m font-bold flex items-center gap-2 text-font-p">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${mediaType === 'video' ? 'bg-purple-0' : mediaType === 'audio' ? 'bg-pink-0' : 'bg-orange-0'
              }`}>
              {getIconForMediaType()}
            </div>
            {title}
          </h3>
          {!disabled && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRemoveMedia(0)}
              className="text-red-1 border-red-1/20 hover:bg-red-0 hover:border-red-1/40 h-8 px-3 gap-2"
            >
              <X className="w-3.5 h-3.5" />
              حذف فایل
            </Button>
          )}
        </div>

        <div className="relative group overflow-hidden border border-br rounded-2xl bg-wt shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex flex-col md:flex-row min-h-[160px]">
            {/* Media Icon/Type Indicator Section */}
            <div className={`w-full md:w-32 flex flex-col items-center justify-center gap-2 p-6 border-b md:border-b-0 md:border-l border-br ${mediaType === 'video' ? 'bg-purple-0/30' : mediaType === 'audio' ? 'bg-pink-0/30' : 'bg-orange-0/30'
              }`}>
              <div className={`w-12 h-12 rounded-2xl shadow-sm flex items-center justify-center ${mediaType === 'video' ? 'bg-purple-1 text-static-w' : mediaType === 'audio' ? 'bg-pink-1 text-static-w' : 'bg-orange-2 text-static-w'
                }`}>
                {mediaType === 'video' && <Play className="w-6 h-6 fill-static-w" />}
                {mediaType === 'audio' && <Music className="w-6 h-6" />}
                {mediaType === 'pdf' && <PDFIcon className="w-6 h-6" />}
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-font-s opacity-60">
                {mediaType === 'video' ? 'Video asset' : mediaType === 'audio' ? 'Audio asset' : 'Document'}
              </span>
            </div>

            {/* Info Section */}
            <div className="flex-1 p-5 flex flex-col justify-center min-w-0">
              <h4 className="text-font-m font-bold text-font-p truncate mb-1">
                {mainMedia.title || mainMedia.original_file_name}
              </h4>
              <div className="flex items-center gap-3 text-font-s/60 text-[11px] font-medium mb-4">
                <span>{(mainMedia.file_size || 0) / 1024 / 1024 > 0 ? `${((mainMedia.file_size || 0) / 1024 / 1024).toFixed(2)} MB` : 'Size Unknown'}</span>
                <span className="w-1 h-1 rounded-full bg-br" />
                <span>{mainMedia.mime_type?.split('/').pop()?.toUpperCase() || 'FILE'}</span>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(mediaUrl, '_blank')}
                  className="h-8 px-3 text-[11px] border-br hover:bg-muted/5 mt-auto"
                >
                  مشاهده فایل
                </Button>
              </div>
            </div>

            {/* Cover Image Section */}
            <div className="w-full md:w-[240px] p-4 bg-muted/5 border-t md:border-t-0 md:border-r border-br flex flex-col items-center justify-center">
              <label className="text-[10px] font-bold text-font-s/50 uppercase mb-3 self-start mr-1">
                {mediaType === 'video' ? 'تصویر پیش‌نمایش (Poster)' : 'تصویر کاور'}
              </label>

              <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-br bg-wt group/cover shadow-inner">
                {coverMedia ? (
                  <>
                    <img
                      src={mediaService.getMediaUrlFromObject(coverMedia)}
                      alt="Cover"
                      className="w-full h-full object-cover"
                    />
                    {!disabled && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/cover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setActiveTab("select");
                            setShowMediaLibrary(true);
                          }}
                          className="bg-wt/10 border-wt/20 text-static-w hover:bg-wt/20 backdrop-blur-md h-8 text-[11px]"
                        >
                          تغییر کاور
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            const updatedMedia = [...mediaItems];
                            updatedMedia[0] = { ...updatedMedia[0], cover_image: null };
                            onMediaSelect(updatedMedia);
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div
                    onClick={() => {
                      if (!disabled) {
                        setActiveTab("select");
                        setShowMediaLibrary(true);
                      }
                    }}
                    className={`w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-muted/5 transition-colors ${!disabled ? '' : 'pointer-events-none'}`}
                  >
                    <ImageIcon className="w-6 h-6 text-font-s/30 mb-2" />
                    <span className="text-[10px] font-bold text-font-s/40">انتخاب کاور</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <MediaLibraryModal
          isOpen={showMediaLibrary}
          onClose={() => setShowMediaLibrary(false)}
          onSelect={(selectedMedia) => {
            const selected = Array.isArray(selectedMedia) ? selectedMedia[0] : selectedMedia;
            if (selected) {
              const updatedMedia = [...mediaItems];
              updatedMedia[0] = {
                ...updatedMedia[0],
                cover_image: selected
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
          context={context}
          contextId={contextId}
        />
      </div>
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
              setShowMediaLibrary(true);
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
        <div className={
          mediaType === "image"
            ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
            : mediaType === "video"
              ? "grid grid-cols-1 sm:grid-cols-2 gap-4"
              : "space-y-2"
        }>
          {mediaItems.map((media, index) => (
            mediaType === "audio" ? (
              <div key={`audio-item-${media.id}`} className="group flex items-center gap-3 p-2.5 border border-br rounded-xl bg-wt hover:border-indigo-1/30 transition-all duration-200">
                <div className="flex-shrink-0 w-9 h-9 bg-indigo-0 rounded-lg flex items-center justify-center">
                  <Music className="w-4 h-4 text-indigo-1" />
                </div>
                <div className="flex-grow min-w-0">
                  <p className="text-font-s font-semibold truncate text-font-p">{media.title || media.original_file_name}</p>
                  <p className="text-[10px] text-font-s/60 font-medium">
                    {media.file_size ? `${(media.file_size / 1024 / 1024).toFixed(2)} MB` : 'Size Unknown'}
                  </p>
                </div>
                {!disabled && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-1 border-none hover:bg-red-0 hover:text-red-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemoveMedia(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ) : mediaType === "pdf" ? (
              <div key={`pdf-item-${media.id}`} className="group flex items-center gap-3 p-2.5 border border-br rounded-xl bg-wt hover:border-orange-1/30 transition-all duration-200">
                <div className="flex-shrink-0 w-9 h-9 bg-orange-0 rounded-lg flex items-center justify-center">
                  <PDFIcon className="w-4 h-4 text-orange-2" />
                </div>
                <div className="flex-grow min-w-0">
                  <p className="text-font-s font-semibold truncate text-font-p">{media.title || media.original_file_name}</p>
                  <p className="text-[10px] text-font-s/60 font-medium">
                    {media.file_size ? `${(media.file_size / 1024 / 1024).toFixed(2)} MB` : 'Size Unknown'}
                  </p>
                </div>
                {!disabled && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-1 border-none hover:bg-red-0 hover:text-red-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemoveMedia(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ) : (
              <div key={`media-item-${media.id}`} className="relative group aspect-square rounded-xl overflow-hidden border border-br bg-muted/5">
                <MediaThumbnail
                  media={media}
                  alt={`${title} ${index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />

                {mediaType === "video" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                    <div className="w-10 h-10 rounded-full bg-wt/20 backdrop-blur-md flex items-center justify-center border border-wt/30">
                      <Play className="w-5 h-5 text-static-w fill-static-w ml-0.5" />
                    </div>
                  </div>
                )}

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  {!disabled && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-full shadow-lg"
                      onClick={() => handleRemoveMedia(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            )
          ))}
        </div>
      ) : (
        <div className="border-2 border-dashed border-br rounded-2xl p-10 flex flex-col items-center justify-center bg-muted/5 group hover:bg-muted/10 transition-colors duration-300">
          <div className="w-16 h-16 rounded-full bg-wt shadow-sm border border-br flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
            {mediaType === "image" && <ImageIcon className="h-7 w-7 text-blue-1" />}
            {mediaType === "video" && <VideoIcon className="h-7 w-7 text-purple-1" />}
            {mediaType === "audio" && <Music className="h-7 w-7 text-pink-1" />}
            {mediaType === "pdf" && <PDFIcon className="h-7 w-7 text-orange-2" />}
          </div>

          <p className="text-font-s font-bold text-font-p">
            هنوز موردی انتخاب نشده است
          </p>
          <p className="text-[11px] text-font-s/60 mt-1 max-w-[200px] text-center leading-relaxed">
            از دکمه‌های بالا جهت افزودن فایل جدید یا انتخاب از کتابخانه استفاده کنید
          </p>
        </div>
      )}

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
        context={context}
        contextId={contextId}
      />
    </div>
  );
}

