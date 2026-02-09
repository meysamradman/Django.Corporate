import { CardWithIcon } from '@/components/elements/CardWithIcon';
import { Button } from '@/components/elements/Button';
import type { Media } from '@/types/shared/media';
import { Image as ImageIcon, Save } from 'lucide-react';
import { MediaImage } from '@/components/media/base/MediaImage';

interface GeneratedImageDisplayProps {
    generatedMedia: Media | null;
    generatedImageUrl: string | null;
    prompt: string;
    saveToDb: boolean;
    onSaveToDb: () => void;
    onSelect: () => void;
    onReset: () => void;
}

export function GeneratedImageDisplay({
    generatedMedia,
    generatedImageUrl,
    prompt,
    saveToDb,
    onSaveToDb,
    onSelect,
    onReset,
}: GeneratedImageDisplayProps) {
    if (!generatedMedia && !generatedImageUrl) {
        return null;
    }

    return (
        <CardWithIcon
            icon={ImageIcon}
            title={
                <>
                    تصویر تولید شده
                    {!saveToDb && generatedImageUrl && (
                        <span className="text-xs text-orange-1 bg-orange px-2 py-1 rounded">
                            (ذخیره نشده)
                        </span>
                    )}
                </>
            }
            iconBgColor="bg-pink"
            iconColor="stroke-pink-2"
            cardBorderColor="border-b-pink-1"
            className="hover:shadow-lg transition-all duration-300"
            headerClassName="pb-3 border-b"
        >
            <div className="space-y-4">
                <div className="relative w-full h-96 rounded-lg overflow-auto border bg-bg/20">
                    <div className="w-full min-h-full flex items-center justify-center">
                        {generatedMedia ? (
                            <MediaImage
                                media={generatedMedia}
                                alt={generatedMedia.alt_text || generatedMedia.title || 'تصویر تولید شده'}
                                className="w-full h-auto max-h-full object-cover"
                            />
                        ) : generatedImageUrl ? (
                            <img
                                src={generatedImageUrl}
                                alt={prompt || 'تصویر تولید شده'}
                                className="w-full h-auto max-h-full object-cover"
                            />
                        ) : null}
                    </div>
                </div>
                <div className="flex gap-2">
                    {generatedMedia ? (
                        <>
                            <Button
                                onClick={onSelect}
                                className="flex-1"
                                variant="default"
                            >
                                انتخاب این تصویر
                            </Button>
                            <Button
                                onClick={onReset}
                                variant="outline"
                            >
                                تولید جدید
                            </Button>
                        </>
                    ) : generatedImageUrl ? (
                        <>
                            <Button
                                onClick={onSaveToDb}
                                className="flex-1"
                                variant="default"
                            >
                                <Save className="h-4 w-4" />
                                ذخیره در دیتابیس
                            </Button>
                            <Button
                                onClick={onSelect}
                                className="flex-1"
                                variant="outline"
                                disabled
                            >
                                انتخاب (ابتدا ذخیره کنید)
                            </Button>
                            <Button
                                onClick={onReset}
                                variant="outline"
                            >
                                تولید جدید
                            </Button>
                        </>
                    ) : null}
                </div>
            </div>
        </CardWithIcon>
    );
}

