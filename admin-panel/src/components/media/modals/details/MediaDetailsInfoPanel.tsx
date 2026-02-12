import { Input } from '@/components/elements/Input';
import { Label } from '@/components/elements/Label';
import { TruncatedText } from '@/components/elements/TruncatedText';
import { mediaService } from '@/components/media/services';
import type { Media } from '@/types/shared/media';

interface MediaDetailsInfoPanelProps {
    media: Media;
    isEditing: boolean;
    editedMedia: Media | null;
    onTitleChange: (title: string) => void;
    onAltTextChange: (altText: string) => void;
    coverSection: React.ReactNode;
}

export function MediaDetailsInfoPanel({
    media,
    isEditing,
    editedMedia,
    onTitleChange,
    onAltTextChange,
    coverSection,
}: MediaDetailsInfoPanelProps) {
    if (isEditing) {
        return (
            <div className="space-y-4">
                <div>
                    <Label htmlFor="media-title" className="text-sm font-medium">نام فایل</Label>
                    <Input
                        id="media-title"
                        value={editedMedia?.title || ''}
                        onChange={(e) => onTitleChange(e.target.value)}
                        placeholder="نام فایل"
                        className="mt-1"
                    />
                </div>

                <div>
                    <Label htmlFor="media-alt-text" className="text-sm font-medium">متن جایگزین</Label>
                    <Input
                        id="media-alt-text"
                        value={editedMedia?.alt_text || ''}
                        onChange={(e) => onAltTextChange(e.target.value)}
                        placeholder="متن جایگزین"
                        className="mt-1"
                    />
                    <p className="text-xs text-font-s mt-1">
                        این متن در صورت عدم نمایش تصویر نمایش داده می‌شود.
                    </p>
                </div>

                {media.media_type !== 'image' && coverSection}
            </div>
        );
    }

    return (
        <>
            <div className="bg-bg/30 rounded-lg border p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="sm:col-span-2 flex gap-2">
                        <span className="font-medium text-font-s shrink-0">نام فایل:</span>
                        <TruncatedText
                            text={media.title || media.original_file_name || media.file_name || ''}
                            maxLength={80}
                            className="flex-1"
                            showTooltip={true}
                        />
                    </div>
                    <div>
                        <span className="font-medium text-font-s">نوع فایل:</span>
                        <p className="mt-1">{media.media_type}</p>
                    </div>
                    <div>
                        <span className="font-medium text-font-s">حجم:</span>
                        <p className="mt-1">{media.file_size ? mediaService.formatBytes(media.file_size) : 'نامشخص'}</p>
                    </div>
                    <div>
                        <span className="font-medium text-font-s">تاریخ:</span>
                        <p className="mt-1">{new Date(media.created_at).toLocaleDateString('fa-IR')}</p>
                    </div>
                    <div>
                        <span className="font-medium text-font-s">شناسه:</span>
                        <p className="mt-1">{media.id}</p>
                    </div>
                    {media.mime_type && (
                        <div>
                            <span className="font-medium text-font-s">فرمت:</span>
                            <p className="mt-1">{media.mime_type.split('/')[1]?.toUpperCase()}</p>
                        </div>
                    )}
                </div>
            </div>

            {media.alt_text && (
                <div>
                    <span className="text-sm font-medium text-font-s">متن جایگزین:</span>
                    <p className="mt-1 text-sm">{media.alt_text}</p>
                </div>
            )}

            {media.media_type !== 'image' && coverSection}
        </>
    );
}