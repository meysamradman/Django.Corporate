"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/elements/Card';
import { Button } from '@/components/elements/Button';
import { Media } from '@/types/shared/media';
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
        <Card className="hover:shadow-lg transition-all duration-300 border-b-4 border-b-indigo-500">
            <CardHeader className="pb-3 border-b">
                <CardTitle className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-100 rounded-xl shadow-sm">
                        <ImageIcon className="w-5 h-5 stroke-indigo-600" />
                    </div>
                    تصویر تولید شده
                    {!saveToDb && generatedImageUrl && (
                        <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                            (ذخیره نشده)
                        </span>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="relative w-full h-96 rounded-lg overflow-auto border bg-muted/20">
                    <div className="w-full min-h-full flex items-center justify-center">
                        {generatedMedia ? (
                            <MediaImage
                                media={generatedMedia}
                                alt={generatedMedia.alt_text || generatedMedia.title || 'تصویر تولید شده'}
                                className="w-full h-auto max-h-full object-cover"
                                unoptimized
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
                                <Save className="h-4 w-4 mr-2" />
                                ذخیره در دیتابیس
                            </Button>
                            <Button
                                onClick={onSelect}
                                className="flex-1"
                                variant="secondary"
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
            </CardContent>
        </Card>
    );
}

