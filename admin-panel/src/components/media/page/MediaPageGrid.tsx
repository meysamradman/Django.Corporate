import { ImageOff, Play, FileAudio } from 'lucide-react';
import type { Media } from '@/types/shared/media';
import { Card } from '@/components/elements/Card';
import { Checkbox } from '@/components/elements/Checkbox';
import { cn } from '@/core/utils/cn';
import { MediaImage } from '@/components/media/base/MediaImage';
import { mediaService } from '@/components/media/services';

interface MediaPageGridProps {
    mediaItems: Media[];
    selectedItems: Record<string | number, boolean>;
    onMediaClick: (media: Media) => void;
    onSelectItem: (itemId: number, checked: boolean) => void;
}

export function MediaPageGrid({ mediaItems, selectedItems, onMediaClick, onSelectItem }: MediaPageGridProps) {
    if (mediaItems.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-font-s">
                <ImageOff className="h-16 w-16 mb-4" />
                <p className="text-lg">رسانه‌ای یافت نشد</p>
                <p className="text-sm mt-1">آپلود رسانه جدید یا تغییر فیلترها</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-4 p-6">
            {mediaItems.map((item) => {
                const displayName = item.title || item.original_file_name || item.file_name || 'بدون عنوان';

                const coverImageUrl = mediaService.getMediaCoverUrl(item);
                const hasCoverImage = !!coverImageUrl && coverImageUrl.length > 0;

                return (
                    <Card
                        key={`media-item-${item.media_type}-${item.id}`}
                        className={cn(
                            'overflow-hidden group relative transition-all border-2 cursor-pointer hover:shadow-lg p-0',
                            selectedItems[item.id] ? 'border-primary shadow-md' : 'border-transparent hover:border-font-s/20'
                        )}
                        onClick={() => onMediaClick(item)}
                    >
                        <div className="w-full h-48 flex items-center justify-center bg-bg relative overflow-hidden">
                            {hasCoverImage ? (
                                <MediaImage
                                    media={item}
                                    src={coverImageUrl}
                                    alt={item.alt_text || item.title || 'تصویر رسانه'}
                                    fill
                                    showSkeleton={false}
                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 16vw, 12.5vw"
                                />
                            ) : item.media_type === 'image' && item.file_url ? (
                                <MediaImage
                                    media={item}
                                    src={item.file_url || ''}
                                    alt={item.alt_text || item.title || 'تصویر رسانه'}
                                    fill
                                    showSkeleton={false}
                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 16vw, 12.5vw"
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center w-full h-full">
                                    <ImageOff className="h-8 w-8 text-font-s mb-2" />
                                    <span className="text-xs text-font-s capitalize">
                                        {item.media_type === 'video' ? 'ویدیو' : item.media_type === 'audio' ? 'صوت' : item.media_type}
                                    </span>
                                </div>
                            )}

                            {(item.media_type === 'video' || item.media_type === 'audio') && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="bg-static-b/50 p-3">
                                        {item.media_type === 'video' ? (
                                            <Play className="h-6 w-6 text-static-w" />
                                        ) : (
                                            <FileAudio className="h-6 w-6 text-static-w" />
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                                id={`select-${item.id}`}
                                checked={!!selectedItems[item.id]}
                                onCheckedChange={(checked) => onSelectItem(item.id, !!checked)}
                                aria-label={`انتخاب ${item.title || 'رسانه'}`}
                                className="bg-card/90 border-foreground/50 data-[state=checked]:bg-primary data-[state=checked]:text-static-w"
                            />
                        </div>

                        <div className={cn(
                            'absolute bottom-0 left-0 right-0 p-3 text-xs z-0 transition-all duration-300 bg-linear-to-t from-black/90 via-black/60 to-transparent pointer-events-none',
                            selectedItems[item.id] ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        )}>
                            <p className="truncate drop-shadow-lg text-static-w" title={displayName}>{displayName}</p>
                        </div>
                    </Card>
                );
            })}
        </div>
    );
}