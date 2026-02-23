import { Button } from '@/components/elements/Button';
import { MediaImage } from '@/components/media/base/MediaImage';
import type { Media } from '@/types/shared/media';
import { Camera, User, X } from 'lucide-react';

interface ImageSelectorPreviewProps {
    selectedMedia: Media | null;
    loading: boolean;
    disabled: boolean;
    sizeClass: string;
    iconSize: string;
    size: 'sm' | 'md' | 'lg';
    showRemoveButton: boolean;
    showChangeButton: boolean;
    placeholderText?: string;
    placeholderBgClass: string;
    name?: string;
    alt: string;
    onRemove: () => void;
    onOpenSelector: () => void;
}

const getPlaceholderContent = (
    placeholderText: string | undefined,
    name: string | undefined,
    iconSize: string
) => {
    if (placeholderText) {
        return <span className="text-2xl">{placeholderText}</span>;
    }
    if (name) {
        return <span className="text-4xl font-bold">{name[0]?.toUpperCase() || 'IMG'}</span>;
    }
    return <User className={iconSize} strokeWidth={1.5} />;
};

export function ImageSelectorPreview({
    selectedMedia,
    loading,
    disabled,
    sizeClass,
    iconSize,
    size,
    showRemoveButton,
    showChangeButton,
    placeholderText,
    placeholderBgClass,
    name,
    alt,
    onRemove,
    onOpenSelector,
}: ImageSelectorPreviewProps) {
    return (
        <div className="relative shrink-0 group">
            {loading ? (
                <div className={`${sizeClass} rounded-xl border-4 border-card bg-muted/40 animate-pulse`} />
            ) : selectedMedia ? (
                <>
                    <div className={`${sizeClass} rounded-xl overflow-hidden border-4 border-card relative`}>
                        <MediaImage
                            media={selectedMedia}
                            alt={alt}
                            className="object-cover"
                            fill
                            sizes={size === 'lg' ? '256px' : size === 'md' ? '192px' : '128px'}
                        />
                    </div>
                    {showRemoveButton && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="absolute h-8 w-8 p-0 rounded-full bg-card border-2 hover:bg-bg transition-colors shadow-lg pointer-events-auto flex items-center justify-center"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onRemove();
                            }}
                            disabled={disabled}
                            aria-label="حذف عکس"
                            style={{
                                top: '-10px',
                                left: '-10px',
                                zIndex: 9999
                            }}
                        >
                            <X className="h-4 w-4 text-destructive" />
                        </Button>
                    )}
                </>
            ) : (
                <div className={`${sizeClass} rounded-xl ${placeholderBgClass} flex items-center justify-center text-static-w border-4 border-card`}>
                    {getPlaceholderContent(placeholderText, name, iconSize)}
                </div>
            )}

            {showChangeButton && (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="absolute -bottom-1 -right-1 h-8 w-8 p-0 rounded-full bg-card border-2 hover:bg-bg transition-colors flex items-center justify-center"
                    onClick={onOpenSelector}
                    disabled={disabled}
                    aria-label="تغییر عکس"
                >
                    <Camera className="h-4 w-4" />
                </Button>
            )}
        </div>
    );
}
