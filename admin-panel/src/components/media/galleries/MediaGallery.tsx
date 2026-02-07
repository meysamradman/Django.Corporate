import { useState } from "react";
import { Button } from "@/components/elements/Button";
import type { Media } from "@/types/shared/media";
import { MediaLibraryModal } from "@/components/media/modals/MediaLibraryModal";
import { MediaDetailsModal } from "@/components/media/modals/MediaDetailsModal";
import { MediaThumbnail } from "@/components/media/base/MediaThumbnail";
import { mediaService } from "@/components/media/services";
import {
  FileText as PDFIcon,
  Plus,
  X,
  Play,
  Music,
  Image as ImageIcon,
  Video as VideoIcon
} from "lucide-react";
import { type MediaContextType, MODULE_MEDIA_CONFIGS } from "../constants";
import { showError } from "@/core/toast";
import { cn } from "@/core/utils/cn";

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
      showError("برخی از فایل‌های انتخابی تکراری بودند و نادیده گرفته شدند");
    }

    if (uniqueNewItems.length === 0) {
      setShowMainLibrary(false);
      return;
    }

    const moduleMax = MODULE_MEDIA_CONFIGS[context]?.maxUploadLimit || 999;
    const globalTotal = totalItemsCount !== undefined ? totalItemsCount : mediaItems.length;

    // 1. Check Module-wide limit
    if (globalTotal + uniqueNewItems.length > moduleMax) {
      showError(`حداکثر تعداد کل فایل‌های مجاز برای این بخش ${moduleMax} عدد می‌باشد`);
      const remainingGlobalSlots = moduleMax - globalTotal;
      if (remainingGlobalSlots <= 0) {
        setShowMainLibrary(false);
        return;
      }
      // Continue with only allowed number of items
      uniqueNewItems.splice(remainingGlobalSlots);
    }

    // 2. Check Gallery-level limit (if maxSelection is provided)
    if (maxSelection === 1 && uniqueNewItems.length > 0) {
      // For single selection galleries, GIFT of replacement
      onMediaSelect([uniqueNewItems[0]]);
    } else if (maxSelection && mediaItems.length + uniqueNewItems.length > maxSelection) {
      showError(`در این بخش حداکثر ${maxSelection} فایل می‌توان انتخاب کرد`);
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
      const mediaUrl = mediaService.getMediaUrlFromObject(mainMedia);

      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-font-m font-bold flex items-center gap-2 text-font-p">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${mediaType === 'video' ? 'bg-purple-0' : mediaType === 'audio' ? 'bg-pink-0' : mediaType === 'document' ? 'bg-orange-0' : 'bg-orange-0'
                }`}>
                {getIconForMediaType()}
              </div>
              {title}
            </h3>
            <div className="flex items-center gap-2">
              {!disabled && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMainLibrary(true)}
                  className="h-8 px-3 gap-2 border-br hover:bg-muted/5 transition-colors"
                  disabled={disabled}
                >
                  <Plus className="w-3.5 h-3.5" />
                  تغییر {mediaType === 'video' ? 'ویدیو' : mediaType === 'audio' ? 'صوت' : 'مستند'}
                </Button>
              )}
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
          </div>

          <div className="relative group overflow-hidden border border-br rounded-2xl bg-wt shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex flex-col md:flex-row min-h-[160px]">
              <div className={`w-full md:w-32 flex flex-col items-center justify-center gap-2 p-6 border-b md:border-b-0 md:border-l border-br ${mediaType === 'video' ? 'bg-purple-0/30' : mediaType === 'audio' ? 'bg-pink-0/30' : 'bg-orange-0/30'
                }`}>
                <div className={`w-12 h-12 rounded-2xl shadow-sm flex items-center justify-center ${mediaType === 'video' ? 'bg-purple-1 text-static-w' : mediaType === 'audio' ? 'bg-pink-1 text-static-w' : 'bg-orange-2 text-static-w'
                  }`}>
                  {mediaType === 'video' && <Play className="w-6 h-6 fill-static-w" />}
                  {mediaType === 'audio' && <Music className="w-6 h-6" />}
                  {mediaType === 'document' && <PDFIcon className="w-6 h-6" />}
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-font-s opacity-60">
                  {mediaType === 'video' ? 'Video asset' : mediaType === 'audio' ? 'Audio asset' : 'Document'}
                </span>
              </div>

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

              <div className="w-full md:w-[240px] p-4 bg-muted/5 border-t md:border-t-0 md:border-r border-br flex flex-col items-center justify-center">
                <label className="text-[10px] font-bold text-font-s/50 uppercase mb-3 self-start mr-1">
                  {mediaType === 'video' ? 'تصویر پیش‌نمایش (Poster)' : 'تصویر کاور'}
                </label>

                <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-br bg-wt group/cover shadow-inner isolate">
                  {coverMedia ? (
                    <>
                      <img
                        src={mediaService.getMediaUrlFromObject(coverMedia)}
                        alt="Cover"
                        className="w-full h-full object-cover"
                      />
                      {!disabled && (
                        <div className="absolute inset-0 z-20 bg-black/40 opacity-0 group-hover/cover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (!disabled) {
                                setShowCoverLibrary(true);
                              }
                            }}
                            className="bg-wt/10 border-wt/20 text-static-w hover:bg-wt/20 backdrop-blur-md h-8 text-[11px]"
                          >
                            تغییر کاور
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
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
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!disabled) {
                          setShowCoverLibrary(true);
                        }
                      }}
                      className={`relative z-10 w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-muted/5 transition-colors ${!disabled ? '' : 'pointer-events-none'}`}
                    >
                      <ImageIcon className="w-6 h-6 text-font-s/30 mb-2" />
                      <span className="text-[10px] font-bold text-font-s/40">انتخاب کاور</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
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
          <div className={
            mediaType === "image"
              ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
              : "flex flex-col gap-3"
          }>
            {mediaItems.map((media, index) => {
              if (mediaType === "image") {
                return (
                  <div key={`media-item-${index}-${media.id}`} className="relative group aspect-square rounded-xl overflow-hidden border border-br bg-muted/5">
                    <MediaThumbnail
                      media={media}
                      alt={`${title} ${index + 1}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2 text-[10px] bg-wt/10 border-wt/20 text-static-w backdrop-blur-md hover:bg-wt/20"
                        onClick={() => setSelectedMediaForDetails(media)}
                      >
                        ویرایش جزئیات
                      </Button>
                      {!disabled && (
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-full shadow-lg"
                          onClick={() => handleRemoveMedia(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              }


              const assetUI = (
                <div key={`${mediaType}-item-${index}-${media.id}`} className="group relative flex items-center gap-3 p-3 border border-br rounded-xl bg-wt hover:border-primary/30 transition-all duration-200">
                  <div className={cn(
                    "shrink-0 size-11 rounded-xl flex items-center justify-center transition-colors",
                    mediaType === "audio" ? "bg-pink-0 text-pink-1" :
                      mediaType === "video" ? "bg-purple-0 text-purple-1" :
                        "bg-orange-0 text-orange-2"
                  )}>
                    {mediaType === "audio" && <Music className="size-5" />}
                    {mediaType === "video" && <VideoIcon className="size-5" />}
                    {mediaType === "document" && <PDFIcon className="size-5" />}
                  </div>

                  <div className="grow min-w-0">
                    <p className="text-[13px] font-bold text-font-p truncate">{media.title || media.original_file_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-font-s/60 font-mono uppercase">{(media.mime_type || '').split('/')[1] || 'FILE'}</span>
                      <span className="text-[10px] text-font-s/40">•</span>
                      <span className="text-[10px] text-font-s/60 font-mono">
                        {media.file_size ? `${(media.file_size / 1024 / 1024).toFixed(2)} MB` : 'Size Unknown'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setSelectedMediaForDetails(media)}
                      className="size-8 rounded-lg text-font-s/60 hover:text-font-p hover:bg-gray-100 transition-colors border-none shadow-none"
                      title="ویرایش جزئیات"
                    >
                      <Plus className="size-4 rotate-45" />
                    </Button>
                    {!disabled && (
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-8 rounded-lg text-red-1/60 hover:text-red-1 hover:bg-red-0 transition-colors border-none shadow-none"
                        onClick={() => handleRemoveMedia(index)}
                        title="حذف فایل"
                      >
                        <X className="size-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );

              return assetUI;
            })}
          </div>
        ) : (
          <div className="border-2 border-dashed border-br rounded-2xl p-10 flex flex-col items-center justify-center bg-muted/5 group hover:bg-muted/10 transition-colors duration-300">
            <div className="w-16 h-16 rounded-full bg-wt shadow-sm border border-br flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              {mediaType === "image" && <ImageIcon className="h-7 w-7 text-blue-1" />}
              {mediaType === "video" && <VideoIcon className="h-7 w-7 text-purple-1" />}
              {mediaType === "audio" && <Music className="h-7 w-7 text-pink-1" />}
              {mediaType === "document" && <PDFIcon className="h-7 w-7 text-orange-2" />}
            </div>

            <p className="text-font-s font-bold text-font-p">
              هنوز موردی انتخاب نشده است
            </p>
            <p className="text-[11px] text-font-s/60 mt-1 max-w-[200px] text-center leading-relaxed">
              از دکمه‌های بالا جهت افزودن فایل جدید یا انتخاب از کتابخانه استفاده کنید
            </p>
          </div>
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
