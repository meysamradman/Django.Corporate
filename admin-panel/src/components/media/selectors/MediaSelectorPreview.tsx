import { Button } from '@/components/elements/Button';
import { MediaThumbnail } from '@/components/media/base/MediaThumbnail';
import type { Media } from '@/types/shared/media';
import { ImagePlus, X } from 'lucide-react';

interface MediaSelectorPreviewProps {
    selectedMedia: Media | null;
    size: 'sm' | 'md' | 'lg';
    onOpenSelector: () => void;
    onRemove: () => void;
}

const sizeClasses = {
    sm: 'w-20 h-20',
    md: 'w-32 h-32',
    lg: 'w-40 h-40'
};

const buttonSize = {
    sm: 'sm',
    md: 'sm',
    lg: 'default'
} as const;

const iconSize = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
};

const thumbnailSize = (size: 'sm' | 'md' | 'lg') => (
    size === 'sm' ? '80px' : size === 'md' ? '128px' : '160px'
);

export function MediaSelectorPreview({
    selectedMedia,
    size,
    onOpenSelector,
    onRemove,
}: MediaSelectorPreviewProps) {
    return (
        <div className="flex items-center gap-4">
            <div className={`relative ${sizeClasses[size]} border rounded-lg overflow-hidden`}>
                {selectedMedia ? (
                    <MediaThumbnail
                        media={selectedMedia}
                        alt="تصویر پروفایل"
                        className="object-cover"
                        fill
                        sizes={thumbnailSize(size)}
                        showIcon={true}
                    />
                ) : (
                    <div className="w-full h-full bg-bg flex items-center justify-center rounded-lg">
                        <span className={`font-medium ${size === 'sm' ? 'text-sm' : size === 'md' ? 'text-lg' : 'text-xl'}`}>
                            IMG
                        </span>
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <Button
                    type="button"
                    variant="outline"
                    size={buttonSize[size]}
                    onClick={onOpenSelector}
                    className="flex gap-2"
                >
                    <ImagePlus className={iconSize[size]} />
                    مدیریت تصویر
                </Button>

                {selectedMedia && (
                    <Button
                        type="button"
                        variant="outline"
                        size={buttonSize[size]}
                        onClick={onRemove}
                        className="text-destructive hover:text-destructive"
                    >
                        <X className={iconSize[size]} />
                        حذف تصویر
                    </Button>
                )}
            </div>
        </div>
    );
}
