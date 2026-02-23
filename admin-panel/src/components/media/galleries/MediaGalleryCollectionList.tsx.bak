import { Button } from '@/components/elements/Button';
import { MediaThumbnail } from '@/components/media/base/MediaThumbnail';
import { cn } from '@/core/utils/cn';
import type { Media } from '@/types/shared/media';
import {
    FileText as PDFIcon,
    Plus,
    X,
    Music,
    Video as VideoIcon,
} from 'lucide-react';

interface MediaGalleryCollectionListProps {
    mediaItems: Media[];
    mediaType: 'image' | 'video' | 'audio' | 'document';
    title: string;
    disabled: boolean;
    onOpenDetails: (media: Media) => void;
    onRemoveMedia: (index: number) => void;
}

export function MediaGalleryCollectionList({
    mediaItems,
    mediaType,
    title,
    disabled,
    onOpenDetails,
    onRemoveMedia,
}: MediaGalleryCollectionListProps) {
    return (
        <div className={
            mediaType === 'image'
                ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3'
                : 'flex flex-col gap-3'
        }>
            {mediaItems.map((media, index) => {
                if (mediaType === 'image') {
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
                                    onClick={() => onOpenDetails(media)}
                                >
                                    ویرایش جزئیات
                                </Button>
                                {!disabled && (
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        className="h-8 w-8 p-0 rounded-full shadow-lg"
                                        onClick={() => onRemoveMedia(index)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    );
                }

                return (
                    <div key={`${mediaType}-item-${index}-${media.id}`} className="group relative flex items-center gap-3 p-3 border border-br rounded-xl bg-wt hover:border-primary/30 transition-all duration-200">
                        <div className={cn(
                            'shrink-0 size-11 rounded-xl flex items-center justify-center transition-colors',
                            mediaType === 'audio' ? 'bg-pink-0 text-pink-1' :
                                mediaType === 'video' ? 'bg-purple-0 text-purple-1' :
                                    'bg-orange-0 text-orange-2'
                        )}>
                            {mediaType === 'audio' && <Music className="size-5" />}
                            {mediaType === 'video' && <VideoIcon className="size-5" />}
                            {mediaType === 'document' && <PDFIcon className="size-5" />}
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
                                onClick={() => onOpenDetails(media)}
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
                                    onClick={() => onRemoveMedia(index)}
                                    title="حذف فایل"
                                >
                                    <X className="size-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}